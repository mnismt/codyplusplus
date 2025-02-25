import * as vscode from 'vscode'
import { selectProvider } from '../../../../commands/providerCommands'
import { LLMProvider } from '../../../../constants/llm'
import {
  API_ENDPOINTS,
  CONFIG_KEYS,
  CONTENT_TYPES,
  DEFAULT_MODELS,
  ERROR_MESSAGES,
  HEADERS,
  SOURCEGRAPH_SUPPORTED_LLM_PROVIDERS
} from '../../constants'
import {
  BaseLLMProvider,
  CompletionRequest,
  CompletionRequestMessage,
  CompletionResponse
} from '../../types'
import {
  GraphQLResponse,
  SourcegraphCompletionRequestMessage,
  SourcegraphModelConfig,
  ValidationResult
} from './types'

export class SourcegraphProvider implements BaseLLMProvider {
  static async fetchModels(baseUrl: string, apiKey: string): Promise<string[]> {
    try {
      const response = await fetch(`${baseUrl}${API_ENDPOINTS.SOURCEGRAPH.MODELS}`, {
        headers: {
          [HEADERS.AUTHORIZATION]: `token ${apiKey}`,
          [HEADERS.CONTENT_TYPE]: CONTENT_TYPES.JSON
        }
      })
      if (!response.ok) {
        throw new Error(`${ERROR_MESSAGES.NETWORK_ERROR} ${response.statusText}`)
      }

      const data = (await response.json()) as SourcegraphModelConfig

      return data.models
        .filter(model => {
          const provider = model.modelRef.split('::')[0]
          return (
            // Only return models from "anthropic", "google", "openai"
            SOURCEGRAPH_SUPPORTED_LLM_PROVIDERS.includes(provider) && model.status !== 'deprecated'
          )
        })
        .map(model => model.modelName)
    } catch (error) {
      console.error('Error fetching Sourcegraph models:', error)
      return []
    }
  }

  private apiKey?: string

  constructor() {
    this.apiKey = vscode.workspace.getConfiguration('codyPlusPlus').get<string>(CONFIG_KEYS.API_KEY)
  }

  get providerIdentifier(): LLMProvider {
    return LLMProvider.Sourcegraph
  }

  get isAuthenticated(): boolean {
    return !!this.apiKey
  }

  get model(): string {
    return (
      vscode.workspace.getConfiguration('codyPlusPlus').get<string>(CONFIG_KEYS.MODEL) ||
      DEFAULT_MODELS.SOURCEGRAPH
    )
  }

  private async validateToken(token?: string): Promise<ValidationResult> {
    if (!token) {
      return {
        isValid: false,
        error: ERROR_MESSAGES.NO_TOKEN
      }
    }

    try {
      const headers = {
        [HEADERS.AUTHORIZATION]: `token ${token}`,
        [HEADERS.CONTENT_TYPE]: CONTENT_TYPES.JSON
      }

      const response = await fetch(
        `${API_ENDPOINTS.SOURCEGRAPH.BASE_URL}${API_ENDPOINTS.SOURCEGRAPH.GRAPHQL}`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify({
            query: 'query { currentUser { username } }'
          })
        }
      )

      const data = (await response.json()) as GraphQLResponse

      if (!response.ok) {
        return {
          isValid: false,
          error: data.error || ERROR_MESSAGES.NETWORK_ERROR
        }
      }

      if (!data.data?.currentUser?.username) {
        return {
          isValid: false,
          error: ERROR_MESSAGES.INVALID_TOKEN
        }
      }

      return {
        isValid: true,
        username: data.data.currentUser.username
      }
    } catch (error) {
      return {
        isValid: false,
        error: error instanceof Error ? error.message : ERROR_MESSAGES.UNKNOWN_ERROR
      }
    }
  }

  private convertToSourcegraphCompletionRequest(
    messages: CompletionRequestMessage[]
  ): SourcegraphCompletionRequestMessage[] {
    return messages.map(message => {
      const speaker: SourcegraphCompletionRequestMessage['speaker'] =
        message.role === 'user' ? 'human' : message.role
      return {
        speaker,
        text: message.content
      } as SourcegraphCompletionRequestMessage
    })
  }

  async complete(request: CompletionRequest): Promise<CompletionResponse> {
    if (!this.apiKey) {
      throw new Error(ERROR_MESSAGES.NOT_AUTHENTICATED)
    }

    const config = {
      temperature: 0,
      maxTokens: 4000,
      ...request.config
    }

    try {
      const response = await fetch(
        `${API_ENDPOINTS.SOURCEGRAPH.BASE_URL}${API_ENDPOINTS.SOURCEGRAPH.COMPLETIONS}`,
        {
          method: 'POST',
          headers: {
            [HEADERS.CONTENT_TYPE]: CONTENT_TYPES.JSON,
            [HEADERS.AUTHORIZATION]: `token ${this.apiKey}`
          },
          body: JSON.stringify({
            model: this.model,
            messages: this.convertToSourcegraphCompletionRequest(request.messages),
            temperature: config.temperature,
            maxTokens: config.maxTokens
          })
        }
      )

      if (!response.ok) {
        const error = await response.text()
        throw new Error(`${ERROR_MESSAGES.NETWORK_ERROR} ${error}`)
      }

      const data = await response.json()

      if (
        typeof data === 'object' &&
        data !== null &&
        'message' in data &&
        typeof data.message === 'string'
      ) {
        return {
          text: data.message
        }
      }

      throw new Error(ERROR_MESSAGES.INVALID_RESPONSE)
    } catch (error) {
      if (error instanceof Error) {
        throw error
      }
      throw new Error(error instanceof Error ? error.message : ERROR_MESSAGES.UNKNOWN_ERROR)
    }
  }

  async requestLLMProviderToken(): Promise<string | undefined> {
    await selectProvider()
    return this.apiKey
  }
}
