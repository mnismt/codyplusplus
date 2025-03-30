import * as vscode from 'vscode'
import {
  CONFIG_KEYS,
  ERROR_MESSAGES,
  SUPPORTED_PROVIDER_CODES,
  SUPPORTED_PROVIDERS
} from '../../constants'
import { CompletionRequest, CompletionResponse } from '../../types'
import { OpenAICompletionResponse, OpenAIModelsResponse } from './types'

// Re-define or import the options interface
interface ProviderOptions {
  apiKey?: string
  baseUrl?: string
  model?: string // Allow overriding model via options
}

export class OpenAICompatibleProvider {
  protected apiKey?: string
  protected baseUrl: string
  protected model: string
  protected chatCompletionPath: string
  protected modelsPath: string
  private readonly headers = { 'Content-Type': 'application/json' }

  constructor(options?: ProviderOptions) {
    const config = vscode.workspace.getConfiguration('codyPlusPlus')
    const configuredProviderCode = config.get<SUPPORTED_PROVIDER_CODES>(
      CONFIG_KEYS.PROVIDER,
      'openai-compatible' // Default to openai-compatible if not set
    )

    // Find the details for the configured provider or default to openai-compatible
    const providerDetails =
      SUPPORTED_PROVIDERS.find(provider => provider.code === configuredProviderCode) ??
      SUPPORTED_PROVIDERS.find(p => p.code === 'openai-compatible')!

    // Prioritize options.apiKey, then config, then undefined
    this.apiKey = options?.apiKey ?? config.get<string>(CONFIG_KEYS.API_KEY)

    // Prioritize options.baseUrl, then specific config (openaiBaseUrl), then provider default
    this.baseUrl =
      options?.baseUrl ?? config.get<string>(CONFIG_KEYS.OPENAI_BASE_URL) ?? providerDetails.baseURL

    // Prioritize options.model, then config, then provider default
    this.model =
      options?.model ?? config.get<string>(CONFIG_KEYS.MODEL) ?? providerDetails.defaultModel

    // Set paths from provider details
    this.chatCompletionPath = providerDetails.chatCompletionPath
    this.modelsPath = providerDetails.modelsPath
  }

  async complete(request: CompletionRequest): Promise<CompletionResponse> {
    if (!this.apiKey) {
      throw new Error(ERROR_MESSAGES.NOT_AUTHENTICATED)
    }

    // Ensure paths don't start with / if baseUrl ends with /
    const cleanBaseUrl = this.baseUrl.endsWith('/') ? this.baseUrl.slice(0, -1) : this.baseUrl
    const cleanChatPath = this.chatCompletionPath.startsWith('/')
      ? this.chatCompletionPath
      : `/${this.chatCompletionPath}`
    const fullUrl = `${cleanBaseUrl}${cleanChatPath}`

    try {
      const response = await fetch(fullUrl, {
        method: 'POST',
        headers: {
          ...this.headers,
          Authorization: `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: this.model,
          messages: request.messages,
          max_tokens: request.config?.maxTokens || 4000,
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

  async fetchModels(): Promise<string[]> {
    if (!this.apiKey) {
      // Can't fetch models without an API key
      console.warn('CODY++: Cannot fetch models without an API key.')
      return []
    }

    const cleanBaseUrl = this.baseUrl.endsWith('/') ? this.baseUrl.slice(0, -1) : this.baseUrl
    const cleanModelsPath = this.modelsPath.startsWith('/')
      ? this.modelsPath
      : `/${this.modelsPath}`
    const fullUrl = `${cleanBaseUrl}${cleanModelsPath}`

    try {
      const response = await fetch(fullUrl, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`
        }
      })

      if (!response.ok) {
        throw new Error(`${ERROR_MESSAGES.NETWORK_ERROR} ${response.statusText}`)
      }

      const data = (await response.json()) as OpenAIModelsResponse
      // Ensure data.data exists and is an array before mapping
      const models = Array.isArray(data?.data) ? data.data.map(model => model.id) : []
      console.log(`Available models: ${JSON.stringify(models)}`)
      return models
    } catch (error) {
      console.error('Error fetching models:', error)
      // Return empty array on error, but consider logging or notifying user
      return []
    }
  }
}
