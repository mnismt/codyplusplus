import * as vscode from 'vscode'
import {
  API_ENDPOINTS,
  CONFIG_KEYS,
  DEFAULT_MODELS,
  ERROR_MESSAGES,
  HEADERS
} from '../../constants'
import { CompletionRequest, CompletionResponse } from '../../types'
import { OpenAICompletionResponse, OpenAIModelsResponse } from '../openai-compatible/types' // Reuse types

/**
 * LLM provider implementation specifically for the official OpenAI API.
 * Uses the default OpenAI base URL and does not read the custom base URL setting.
 */
export class OpenAIProvider {
  // Static method to fetch models - uses the default base URL
  static async fetchModels(apiKey: string): Promise<string[]> {
    try {
      const response = await fetch(
        `${API_ENDPOINTS.OPENAI.DEFAULT_BASE_URL}${API_ENDPOINTS.OPENAI.MODELS}`,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`
          }
        }
      )

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

  // Make properties protected for potential future subclassing if needed
  protected apiKey?: string
  protected readonly baseUrl: string = API_ENDPOINTS.OPENAI.DEFAULT_BASE_URL // Hardcoded base URL
  protected model: string
  private readonly headers = { 'Content-Type': 'application/json' }

  constructor() {
    const config = vscode.workspace.getConfiguration('codyPlusPlus')
    this.apiKey = config.get<string>(CONFIG_KEYS.API_KEY)
    // NOTE: We explicitly DO NOT read CONFIG_KEYS.OPENAI_BASE_URL here.
    this.model = config.get<string>(CONFIG_KEYS.MODEL) || DEFAULT_MODELS.OPENAI

    if (!this.apiKey) {
      console.warn(
        'Cody++: OpenAIProvider initialized without an API key. Please configure codyPlusPlus.llmApiKey.'
      )
    }
  }

  async complete(request: CompletionRequest): Promise<CompletionResponse> {
    if (!this.apiKey) {
      // Consider using a more specific error or relying on the fetch failure
      throw new Error(ERROR_MESSAGES.NO_TOKEN)
    }

    try {
      const response = await fetch(`${this.baseUrl}${API_ENDPOINTS.OPENAI.CHAT_COMPLETIONS}`, {
        method: 'POST',
        headers: {
          ...this.headers,
          [HEADERS.AUTHORIZATION]: `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: this.model,
          messages: request.messages,
          max_tokens: request.config?.maxTokens || 4000, // Use a reasonable default or make configurable
          temperature: request.config?.temperature || 0, // Default to deterministic output
          stream: false, // Smart Add requires the full response
          response_format: {
            type: 'json_object' // Assuming Smart Add requires JSON output
          }
        })
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('CODY++: OpenAI provider API error:', response.status, errorText)
        // Provide a more informative error based on status code if possible
        throw new Error(`${ERROR_MESSAGES.NETWORK_ERROR} Status: ${response.status} - ${errorText}`)
      }

      const data = (await response.json()) as OpenAICompletionResponse

      // Basic validation of the response structure
      if (!data?.choices?.length || typeof data.choices[0]?.message?.content !== 'string') {
        console.error('CODY++: Invalid OpenAI response format:', data)
        throw new Error(ERROR_MESSAGES.INVALID_RESPONSE)
      }

      return {
        text: data.choices[0].message.content.trim()
      }
    } catch (error) {
      console.error('CODY++: OpenAI provider completion error:', error)
      // Re-throw specific errors or a generic one
      if (error instanceof Error) {
        // Avoid exposing raw fetch errors directly if they contain sensitive info
        throw new Error(`OpenAI API request failed: ${error.message}`)
      }
      throw new Error(ERROR_MESSAGES.UNKNOWN_ERROR)
    }
  }
}
