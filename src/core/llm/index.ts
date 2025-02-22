import * as vscode from 'vscode'
import { createSourcegraphProvider } from './providers/sourcegraph'
import { LLMProvider } from './types'

export { LLMProvider } from './types'

export const createProvider = (type: LLMProvider, context: vscode.ExtensionContext) => {
  switch (type) {
    case LLMProvider.Sourcegraph:
      return createSourcegraphProvider(context)
    default:
      throw new Error(`Unsupported LLM provider: ${type}`)
  }
}

export const createDefaultProvider = (context: vscode.ExtensionContext) => {
  return createProvider(LLMProvider.Sourcegraph, context)
}
