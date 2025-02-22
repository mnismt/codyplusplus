import { CompletionRequest, CompletionResponse, LLMProvider } from '../../types'

export interface CompletionOperations {
  providerIdentifier: LLMProvider
  complete: (request: CompletionRequest) => Promise<CompletionResponse>
}
