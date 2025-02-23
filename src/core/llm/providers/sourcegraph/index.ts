import * as vscode from 'vscode'
import {
  BaseLLMProvider,
  CompletionRequest,
  CompletionResponse,
  DEFAULT_CONFIG,
  LLMProvider,
  LLMProviderError
} from '../../types'

interface GraphQLResponse {
  data?: {
    currentUser?: {
      username: string
    }
  }
  error?: string
}

interface ValidationResult {
  isValid: boolean
  username?: string
  error?: string
}

export class SourcegraphProvider implements BaseLLMProvider {
  private apiKey?: string

  constructor() {
    this.apiKey = vscode.workspace.getConfiguration('codyPlusPlus').get<string>('llmApiKey')
  }

  get providerIdentifier(): LLMProvider {
    return LLMProvider.Sourcegraph
  }

  get isAuthenticated(): boolean {
    return !!this.apiKey
  }

  private async validateToken(token?: string): Promise<ValidationResult> {
    if (!token) {
      return {
        isValid: false,
        error: 'No token provided'
      }
    }

    try {
      const headers = {
        Authorization: `token ${token}`,
        'Content-Type': 'application/json'
      }

      const response = await fetch('https://sourcegraph.com/.api/graphql', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          query: 'query { currentUser { username } }'
        })
      })

      const data = (await response.json()) as GraphQLResponse

      if (!response.ok) {
        return {
          isValid: false,
          error: data.error || 'Network request failed'
        }
      }

      if (!data.data?.currentUser?.username) {
        return {
          isValid: false,
          error: 'Invalid token'
        }
      }

      return {
        isValid: true,
        username: data.data.currentUser.username
      }
    } catch (error) {
      return {
        isValid: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  }

  async complete(request: CompletionRequest): Promise<CompletionResponse> {
    if (!this.apiKey) {
      throw new LLMProviderError(
        'Authentication required. Please sign in to Sourcegraph.',
        LLMProvider.Sourcegraph,
        'NEEDS_AUTH'
      )
    }

    const config = {
      ...DEFAULT_CONFIG,
      ...request.config
    }

    try {
      const response = await fetch('https://sourcegraph.com/.api/completions/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `token ${this.apiKey}`
        },
        body: JSON.stringify({
          model: config.model,
          messages: request.messages,
          temperature: config.temperature,
          maxTokens: config.maxTokens,
          topK: -1,
          topP: -1
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new LLMProviderError(
          error.error?.message || 'API request failed',
          LLMProvider.Sourcegraph,
          response.status.toString(),
          error
        )
      }

      const data = await response.json()
      return {
        text: data.message
      }
    } catch (error) {
      if (error instanceof LLMProviderError) {
        throw error
      }
      throw new LLMProviderError(
        error instanceof Error ? error.message : 'Unknown error',
        LLMProvider.Sourcegraph
      )
    }
  }

  async getLLMProviderToken(): Promise<string | undefined> {
    const token = await vscode.window.showInputBox({
      prompt: 'Enter your Sourcegraph API token',
      password: true,
      placeHolder: 'Paste your token here...'
    })

    if (!token) {
      return undefined
    }

    const validation = await this.validateToken(token)
    if (!validation.isValid) {
      void vscode.window.showErrorMessage(`Invalid token: ${validation.error}`)
      return undefined
    }

    this.apiKey = token
    await vscode.workspace.getConfiguration('codyPlusPlus').update('llmApiKey', token, true)
    return token
  }

  async logout(): Promise<void> {
    this.apiKey = undefined
    await vscode.workspace.getConfiguration('codyPlusPlus').update('llmApiKey', undefined, true)
  }
}
