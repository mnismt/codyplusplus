import * as vscode from 'vscode'
import { createOpenAIProvider } from './providers/openai/factory'
import { createSourcegraphProvider } from './providers/sourcegraph/factory'
import { LLMProvider } from './types'

export { LLMProvider } from './types'

export const createProvider = () => {
  const llmProvider = vscode.workspace
    .getConfiguration('codyPlusPlus')
    .get<LLMProvider>('llmProvider')

  switch (llmProvider) {
    case LLMProvider.Sourcegraph:
      return createSourcegraphProvider()
    case LLMProvider.OpenAI:
      return createOpenAIProvider()
    default:
      throw new Error(`Unsupported LLM provider: ${llmProvider}`)
  }
}
