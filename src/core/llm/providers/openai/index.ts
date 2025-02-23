import * as vscode from 'vscode'
import { LLMProvider } from '../../../../constants/llm'
import { BaseLLMProvider, CompletionRequest, CompletionResponse } from '../../types'

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
  private apiKey?: string
  private baseUrl: string

  constructor() {
    this.apiKey = vscode.workspace.getConfiguration('codyPlusPlus').get<string>('llmApiKey')
    this.baseUrl =
      vscode.workspace.getConfiguration('codyPlusPlus').get<string>('openaiBaseUrl') ||
      'https://api.openai.com/v1'
  }

  get providerIdentifier(): LLMProvider {
    return LLMProvider.OpenAI
  }

  get isAuthenticated(): boolean {
    return !!this.apiKey
  }

  async complete(request: CompletionRequest): Promise<CompletionResponse> {
    if (!this.apiKey) {
      throw new Error('Not authenticated')
    }

    try {
      const model =
        vscode.workspace.getConfiguration('codyPlusPlus').get<string>('openaiModel') ||
        'gpt-4o-mini'

      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model,
          messages: request.messages,
          max_completion_tokens: request.config?.maxTokens || 4000,
          temperature: request.config?.temperature || 0,
          stream: false
        })
      })

      if (!response.ok) {
        const error = await response.text()
        console.error('CODY++: OpenAI provider error', error)
        throw new Error(`API request failed: ${error}`)
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
      throw new Error('Unknown error')
    }
  }

  async getLLMProviderToken(): Promise<string | undefined> {
    // This is handled by the provider selection command
    return this.apiKey
  }

  async logout(): Promise<void> {
    this.apiKey = undefined
    await vscode.workspace.getConfiguration('codyPlusPlus').update('llmApiKey', undefined, true)
  }
}
