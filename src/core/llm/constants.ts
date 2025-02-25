export const CONFIG_KEYS = {
  API_KEY: 'llmApiKey',
  MODEL: 'llmModel',
  OPENAI_BASE_URL: 'openaiBaseUrl'
} as const

export const API_ENDPOINTS = {
  SOURCEGRAPH: {
    BASE_URL: 'https://sourcegraph.com',
    MODELS: '/.api/modelconfig/supported-models.json',
    COMPLETIONS: '/.api/completions/stream',
    GRAPHQL: '/.api/graphql'
  },
  OPENAI: {
    DEFAULT_BASE_URL: 'https://api.openai.com/v1',
    MODELS: '/models',
    CHAT_COMPLETIONS: '/chat/completions'
  }
} as const

export const DEFAULT_MODELS = {
  SOURCEGRAPH: 'claude-3.5-sonnet',
  OPENAI: 'gpt-4o-mini'
} as const

export const ERROR_MESSAGES = {
  NOT_AUTHENTICATED: 'Authentication required. Please sign in.',
  INVALID_TOKEN: 'Invalid authentication token.',
  NO_TOKEN: 'No token provided.',
  NETWORK_ERROR: 'Network request failed.',
  UNKNOWN_ERROR: 'An unknown error occurred.',
  INVALID_RESPONSE: 'Invalid response format from API.'
} as const

export const HEADERS = {
  CONTENT_TYPE: 'Content-Type',
  AUTHORIZATION: 'Authorization'
} as const

export const CONTENT_TYPES = {
  JSON: 'application/json'
} as const
