import { SUPPORTED_PROVIDER_CODES } from './constants'
import { GeminiProvider } from './providers/gemini'
import { OpenAIProvider } from './providers/openai'
import { OpenAICompatibleProvider } from './providers/openai-compatible'

export { CompletionRequest, CompletionRequestMessage, CompletionResponse } from './types'
export { OpenAICompatibleProvider }

/**
 * Optional configuration for creating a provider instance,
 * typically used for temporary credentials during setup.
 */
interface ProviderOptions {
  apiKey?: string
  baseUrl?: string
}

export const createProvider = (
  provider: SUPPORTED_PROVIDER_CODES,
  options?: ProviderOptions // Add optional options parameter
): OpenAICompatibleProvider => {
  switch (provider) {
    case 'openai-compatible':
      // Pass options to the constructor
      return new OpenAICompatibleProvider(options)
    case 'openai':
      // Pass options to the constructor
      return new OpenAIProvider(options)
    case 'gemini':
      // Pass options to the constructor
      return new GeminiProvider(options)
    default:
      throw new Error(`Unsupported provider: ${provider}`)
  }
}
