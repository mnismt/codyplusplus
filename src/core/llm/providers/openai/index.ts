import * as vscode from 'vscode'
import { LLMProvider } from '../../../../constants/llm'
import {
  API_ENDPOINTS,
  CONFIG_KEYS,
  CONTENT_TYPES,
  DEFAULT_MODELS,
  ERROR_MESSAGES,
  HEADERS
} from '../../constants'
import { BaseLLMProvider, CompletionRequest, CompletionResponse } from '../../types'

interface OpenAIModelsResponse {
  data: Array<{ id: string }>
}

interface OpenAICompletionResponse {
  id: string
  object: string
  created: number
  model: string
  choices: Array<{
    message: {
      content: string
      role: string
    }
    index: number
    logprobs: null
    finish_reason: string
  }>
  usage: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

export class OpenAIProvider implements BaseLLMProvider {
  static async fetchModels(baseUrl: string, apiKey: string): Promise<string[]> {
    try {
      const response = await fetch(`${baseUrl}${API_ENDPOINTS.OPENAI.MODELS}`, {
        headers: {
          [HEADERS.CONTENT_TYPE]: CONTENT_TYPES.JSON,
          [HEADERS.AUTHORIZATION]: `Bearer ${apiKey}`
        }
      })

      if (!response.ok) {
        throw new Error(`${ERROR_MESSAGES.NETWORK_ERROR} ${response.statusText}`)
      }

      const data = (await response.json()) as OpenAIModelsResponse
      return data.data.map(model => model.id)
    } catch (error) {
      console.error('Error fetching OpenAI models:', error)
      return []
    }
  }

  private apiKey?: string
  private baseUrl: string

  constructor() {
    this.apiKey = vscode.workspace.getConfiguration('codyPlusPlus').get<string>(CONFIG_KEYS.API_KEY)
    this.baseUrl =
      vscode.workspace.getConfiguration('codyPlusPlus').get<string>(CONFIG_KEYS.OPENAI_BASE_URL) ||
      API_ENDPOINTS.OPENAI.DEFAULT_BASE_URL
  }

  get providerIdentifier(): LLMProvider {
    return LLMProvider.OpenAI
  }

  get isAuthenticated(): boolean {
    return !!this.apiKey
  }

  get model(): string {
    return (
      vscode.workspace.getConfiguration('codyPlusPlus').get<string>(CONFIG_KEYS.MODEL) ||
      DEFAULT_MODELS.OPENAI
    )
  }

  async complete(request: CompletionRequest): Promise<CompletionResponse> {
    if (!this.apiKey) {
      throw new Error(ERROR_MESSAGES.NOT_AUTHENTICATED)
    }

    try {
      const response = await fetch(`${this.baseUrl}${API_ENDPOINTS.OPENAI.CHAT_COMPLETIONS}`, {
        method: 'POST',
        headers: {
          [HEADERS.CONTENT_TYPE]: CONTENT_TYPES.JSON,
          [HEADERS.AUTHORIZATION]: `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: this.model,
          messages: request.messages,
          max_completion_tokens: request.config?.maxTokens || 4000,
          temperature: request.config?.temperature || 0,
          stream: false,
          response_format: {
            type: 'json_object'
          }
        })
      })

      if (!response.ok) {
        const error = await response.text()
        console.error('CODY++: OpenAI provider error', error)
        throw new Error(`${ERROR_MESSAGES.NETWORK_ERROR} ${error}`)
      }

      const data = (await response.json()) as OpenAICompletionResponse
      console.log(`CODY++: OpenAI provider response`, data)
      return {
        text: data.choices[0].message.content.trim()
      }
    } catch (error) {
      if (error instanceof Error) {
        throw error
      }
      throw new Error(ERROR_MESSAGES.UNKNOWN_ERROR)
    }
  }

  async getLLMProviderToken(): Promise<string | undefined> {
    // This is handled by the provider selection command
    return this.apiKey
  }

  async logout(): Promise<void> {
    this.apiKey = undefined
    await vscode.workspace
      .getConfiguration('codyPlusPlus')
      .update(CONFIG_KEYS.API_KEY, undefined, true)
  }
}
