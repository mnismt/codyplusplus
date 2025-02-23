import {
  CompletionRequest,
  CompletionResponse,
  DEFAULT_CONFIG,
  LLMProvider,
  LLMProviderError
} from '../../types'
import { AuthOperations } from './auth'
import { CompletionOperations } from './types'

export const createSourcegraphCompletion = (
  authOperations: AuthOperations
): CompletionOperations => {
  const complete = async (request: CompletionRequest): Promise<CompletionResponse> => {
    const token = await authOperations.getToken()

    if (!token) {
      throw new LLMProviderError(
        'Authentication required. Please sign in to Sourcegraph.',
        LLMProvider.Sourcegraph,
        'NEEDS_AUTH'
      )
    }

    const config = {
      ...DEFAULT_CONFIG,
      ...request.config
    }

    const body = JSON.stringify({
      model: config.model,
      messages: request.messages,
      maxTokensToSample: config.maxTokens,
      temperature: config.temperature,
      stream: false,
      ...(config.responseFormat && { responseFormat: config.responseFormat })
    })

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
        throw new LLMProviderError(`API error: ${error}`, LLMProvider.Sourcegraph, 'API_ERROR')
      }

      const result = (await response.json()) as { completion: string }

      if (!result?.completion) {
        throw new LLMProviderError(
          'Invalid response: no completion found.',
          LLMProvider.Sourcegraph,
          'INVALID_RESPONSE'
        )
      }

      return { text: result.completion }
    } catch (error) {
      console.log(`Sourcegraph completion error: ${error}`)
      if (error instanceof LLMProviderError) {
        throw error // Re-throw if already an LLMProviderError
      }

      throw new LLMProviderError(
        `Completion request failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        LLMProvider.Sourcegraph,
        'COMPLETION_ERROR'
      )
    }
  }

  return {
    providerIdentifier: LLMProvider.Sourcegraph,
    complete
  }
}
