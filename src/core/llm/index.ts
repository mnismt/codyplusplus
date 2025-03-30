import { OpenAICompatibleProvider } from './providers/openai-compatible'

export { CompletionRequest, CompletionRequestMessage, CompletionResponse } from './types'
export { OpenAICompatibleProvider }

export const createProvider = (): OpenAICompatibleProvider => {
  return new OpenAICompatibleProvider()
}
