import { LLMProvider } from '../../constants/llm'

export interface CompletionConfig {
  model?: string
  maxTokens?: number
  temperature?: number
  responseFormat?: {
    type: 'json' | 'text'
    schema?: object
  }
}

export type CompletionRequestMessage = {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface CompletionRequest {
  messages: Array<CompletionRequestMessage>
  config?: CompletionConfig
}

export interface CompletionResponse {
  text: string
}

export interface BaseLLMProvider {
  providerIdentifier: LLMProvider
  complete: (request: CompletionRequest) => Promise<CompletionResponse>
}
