import * as vscode from 'vscode'
import { CompletionRequest, CompletionResponse, LLMProvider } from './types'

export abstract class BaseLLMProvider {
  constructor(protected context: vscode.ExtensionContext) {}

  // Provider name
  abstract get providerIdentifier(): LLMProvider

  abstract complete(request: CompletionRequest): Promise<CompletionResponse>

  // Validate the provider configuration (like API keys, etc.)
  abstract validateConfig(): Promise<boolean>

  protected handleError(error: unknown, customMessage?: string): never {
    // Show error in VS Code
    const errorMessage = error instanceof Error ? error.message : String(error)
    const displayMessage = customMessage ? `${customMessage}: ${errorMessage}` : errorMessage

    vscode.window.showErrorMessage(
      `LLM completion failed (${this.providerIdentifier}): ${displayMessage}`
    )

    throw error
  }
}
