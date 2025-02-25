export interface GraphQLResponse {
  data?: {
    currentUser?: {
      username: string
    }
  }
  error?: string
}

export interface ValidationResult {
  isValid: boolean
  username?: string
  error?: string
}

// Sourcegraph-specific types
export type SourcegraphCompletionRequestMessage = {
  speaker: 'human' | 'assistant' | 'system'
  text: string
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
