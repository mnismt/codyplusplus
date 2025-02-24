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

// Sourcegraph-specific types
export type SourcegraphCompletionRequestMessage = {
  speaker: 'human' | 'assistant' | 'system'
  text: string
}

export interface CompletionRequest {
  messages: Array<CompletionRequestMessage>
  config?: CompletionConfig
}

export interface CompletionResponse {
  text: string
}

export enum LLMProvider {
  Sourcegraph = 'sourcegraph',
  OpenAI = 'openai'
  // Future providers:
  // Gemini = 'gemini'
}

export interface BaseLLMProvider {
  providerIdentifier: LLMProvider
  isAuthenticated: boolean
  complete: (request: CompletionRequest) => Promise<CompletionResponse>
  getLLMProviderToken: () => Promise<string | undefined>
  logout: () => Promise<void>
}

export const DEFAULT_CONFIG: CompletionConfig = {
  model: 'claude-3.5-sonnet',
  maxTokens: 4000,
  temperature: 0.0
}

export interface SourcegraphModelConfig {
  schemaVersion: string
  revision: string
  providers: {
    id: string
    displayName: string
  }[]
  models: {
    modelRef: string
    displayName: string
    modelName: string
    capabilities: string[]
    category: string
    status: string
    tier: string
    contextWindow: {
      maxInputTokens: number
      maxOutputTokens: number
    }
    estimatedModelCost?: {
      unit: string
      inputTokenPennies: number
      outputTokenPennies: number
    }
  }[]
}
