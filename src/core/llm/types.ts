export interface CompletionConfig {
  model?: string
  maxTokens?: number
  temperature?: number
  responseFormat?: {
    type: 'json' | 'text'
    schema?: object
  }
}

export type CompletionRequestMessage = { speaker: 'system' | 'human' | 'assistant'; text: string }

export interface CompletionRequest {
  messages: Array<CompletionRequestMessage>
  config?: CompletionConfig
}

export interface CompletionResponse {
  text: string
}

export enum LLMProvider {
  Sourcegraph = 'sourcegraph'
  // Future providers:
  // Gemini = 'gemini'
}

export interface BaseLLMProvider {
  providerIdentifier: LLMProvider
  complete: (request: CompletionRequest) => Promise<CompletionResponse>
  loginAndObtainToken?: () => Promise<string | undefined>
  logout?: () => Promise<void>
}

export interface LLMError extends Error {
  provider: LLMProvider
  code?: string
  details?: unknown
}

export class LLMProviderError extends Error implements LLMError {
  constructor(
    message: string,
    public provider: LLMProvider,
    public code?: string,
    public details?: unknown
  ) {
    super(message)
    this.name = 'LLMProviderError'
  }
}

export const DEFAULT_CONFIG: CompletionConfig = {
  model: 'claude-3.5-sonnet',
  maxTokens: 4000,
  temperature: 0.0
}
