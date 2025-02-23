import { OpenAIProvider } from '.'
import { BaseLLMProvider } from '../../types'

export const createOpenAIProvider = (): BaseLLMProvider => {
  return new OpenAIProvider()
}
