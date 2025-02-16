import * as vscode from 'vscode'
import { SourcegraphService } from './sourcegraph.service'

interface CompletionConfig {
  model?: string
  maxTokens?: number
  temperature?: number
  responseFormat?: {
    type: 'json' | 'text'
    schema?: object
  }
}

interface CompletionRequest {
  prompt: string
  config?: CompletionConfig
}

interface CompletionResponse {
  text: string
}

const DEFAULT_CONFIG: CompletionConfig = {
  model: 'gemini-2.0-flash',
  maxTokens: 4000,
  temperature: 0.0
}

export class LLMService {
  private static instance: LLMService
  private sourcegraphService: SourcegraphService

  private constructor(context: vscode.ExtensionContext) {
    this.sourcegraphService = SourcegraphService.getInstance(context)
  }

  public static getInstance(context: vscode.ExtensionContext): LLMService {
    if (!LLMService.instance) {
      LLMService.instance = new LLMService(context)
    }
    return LLMService.instance
  }

  public async complete(request: CompletionRequest): Promise<CompletionResponse> {
    const token = await this.sourcegraphService.getToken()

    if (!token) {
      throw new Error('Sourcegraph token not found. Please authenticate first.')
    }

    const config = {
      ...DEFAULT_CONFIG,
      ...request.config
    }

    const body = JSON.stringify({
      model: config.model,
      messages: [
        {
          speaker: 'human',
          text: request.prompt
        }
      ],
      maxTokensToSample: config.maxTokens,
      temperature: config.temperature,
      stream: false,
      ...(config.responseFormat && { responseFormat: config.responseFormat })
    })

    console.log(`Request body: ${body}`)

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
        throw new Error(`Sourcegraph API error: ${error}`)
      }

      const result = (await response.json()) as { completion: string }

      if (!result?.completion) {
        throw new Error('No completions found')
      }

      console.log(`Completion result: ${result.completion}`)

      return { text: result.completion }
    } catch (error) {
      // Show error in VS Code
      vscode.window.showErrorMessage(
        `LLM completion failed: ${error instanceof Error ? error.message : String(error)}`
      )
      throw error
    }
  }
}
