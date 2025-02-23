import * as vscode from 'vscode'
import {
  BaseLLMProvider,
  CompletionRequest,
  CompletionResponse,
  LLMProvider,
  LLMProviderError
} from '../../types'

interface OpenAICompletionResponse {
  id: string
  object: string
  created: number
  model: string
  choices: Array<{
    text: string
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
      throw new LLMProviderError('Not authenticated', LLMProvider.OpenAI)
    }

    try {
      // Convert our message format to OpenAI's format
      const prompt = request.messages
        .map(msg => {
          switch (msg.speaker) {
            case 'system':
              return `System: ${msg.text}\n`
            case 'human':
              return `Human: ${msg.text}\n`
            case 'assistant':
              return `Assistant: ${msg.text}\n`
          }
        })
        .join('')

      const response = await fetch(`${this.baseUrl}/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: request.config?.model || 'gpt-3.5-turbo-instruct',
          prompt,
          max_tokens: request.config?.maxTokens || 2000,
          temperature: request.config?.temperature || 0,
          stream: false
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new LLMProviderError(
          error.error?.message || 'API request failed',
          LLMProvider.OpenAI,
          response.status.toString(),
          error
        )
      }

      const data = (await response.json()) as OpenAICompletionResponse
      return {
        text: data.choices[0].text.trim()
      }
    } catch (error) {
      if (error instanceof LLMProviderError) {
        throw error
      }
      throw new LLMProviderError(
        error instanceof Error ? error.message : 'Unknown error',
        LLMProvider.OpenAI
      )
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
