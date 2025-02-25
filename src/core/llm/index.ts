import * as vscode from 'vscode'
import { LLMProvider } from '../../constants/llm'
import { OpenAIProvider } from './providers/openai'
import { SourcegraphProvider } from './providers/sourcegraph'

export const createProvider = () => {
  const llmProvider = vscode.workspace
    .getConfiguration('codyPlusPlus')
    .get<LLMProvider>('llmProvider')

  switch (llmProvider) {
    case LLMProvider.Sourcegraph:
      return new SourcegraphProvider()
    case LLMProvider.OpenAI:
      return new OpenAIProvider()
    default:
      throw new Error(`Unsupported LLM provider: ${llmProvider}`)
  }
}
