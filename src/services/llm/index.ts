import * as vscode from 'vscode'
import { BaseLLMProvider } from './base'
import { SourcegraphProvider } from './providers/sourcegraph'
import { LLMProvider } from './types'

export * from './base'
export * from './types'

export class LLMFactory {
  private static providers = new Map<LLMProvider, BaseLLMProvider>()

  public static createProvider(
    type: LLMProvider,
    context: vscode.ExtensionContext
  ): BaseLLMProvider {
    // Check if provider instance already exists
    const existingProvider = this.providers.get(type)
    if (existingProvider) {
      return existingProvider
    }

    // Create new provider instance
    let provider: BaseLLMProvider
    switch (type) {
      case LLMProvider.Sourcegraph:
        provider = new SourcegraphProvider(context)
        break
      default:
        throw new Error(`Unsupported LLM provider: ${type}`)
    }

    // Cache the provider instance
    this.providers.set(type, provider)
    return provider
  }

  public static async validateProvider(
    type: LLMProvider,
    context: vscode.ExtensionContext
  ): Promise<boolean> {
    const provider = this.createProvider(type, context)
    return provider.validateConfig()
  }

  public static reset(): void {
    this.providers.clear()
  }
}

export function createDefaultProvider(context: vscode.ExtensionContext) {
  return LLMFactory.createProvider(LLMProvider.Sourcegraph, context)
}
