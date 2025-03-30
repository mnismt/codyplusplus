import { OpenAIProvider } from './openai-provider'

export { CompletionRequest, CompletionRequestMessage, CompletionResponse } from './types'
export { OpenAIProvider }

export const createProvider = (): OpenAIProvider => {
  return new OpenAIProvider()
}
