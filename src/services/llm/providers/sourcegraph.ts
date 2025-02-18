import * as vscode from 'vscode'
import { SourcegraphService } from '../../sourcegraph.service'
import { BaseLLMProvider } from '../base'
import {
  CompletionRequest,
  CompletionResponse,
  DEFAULT_CONFIG,
  LLMProvider,
  LLMProviderError
} from '../types'

export class SourcegraphProvider extends BaseLLMProvider {
  private sourcegraphService: SourcegraphService

  constructor(context: vscode.ExtensionContext) {
    super(context)
    this.sourcegraphService = SourcegraphService.getInstance(context)
  }

  get providerIdentifier(): LLMProvider {
    return LLMProvider.Sourcegraph
  }

  async validateConfig(): Promise<boolean> {
    const token = await this.sourcegraphService.getToken()
    return !!token
  }

  public async complete(request: CompletionRequest): Promise<CompletionResponse> {
    const token = await this.sourcegraphService.getToken()

    if (!token) {
      throw new LLMProviderError(
        'Sourcegraph token not found. Please authenticate first.',
        this.providerIdentifier,
        'AUTH_REQUIRED'
      )
    }

    const config = {
      ...DEFAULT_CONFIG,
      ...request.config
    }

    const body = JSON.stringify({
      model: config.model,
      messages: request.messages,
      maxTokensToSample: config.maxTokens,
      temperature: config.temperature,
      stream: false,
      ...(config.responseFormat && { responseFormat: config.responseFormat })
    })

    try {
      const response = await fetch('https://sourcegraph.com/.api/completions/stream', {
        method: 'POST',
        headers: {
          Authorization: `token ${token}`,
          'Content-Type': 'application/json'
        },
        body
      })

      if (!response.ok) {
        const error = await response.text()
        throw new LLMProviderError(`API error: ${error}`, this.providerIdentifier, 'API_ERROR')
      }

      const result = (await response.json()) as { completion: string }

      if (!result?.completion) {
        throw new LLMProviderError(
          'No completion found in response',
          this.providerIdentifier,
          'INVALID_RESPONSE'
        )
      }

      return { text: result.completion }
    } catch (error) {
      return this.handleError(error, 'Completion request failed')
    }
  }
}
