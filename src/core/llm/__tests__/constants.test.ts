import * as assert from 'assert'
import {
  API_ENDPOINTS,
  CONFIG_KEYS,
  CONTENT_TYPES,
  DEFAULT_MODELS,
  ERROR_MESSAGES,
  HEADERS,
  SOURCEGRAPH_SUPPORTED_LLM_PROVIDERS
} from '../constants'

suite('LLM Constants', () => {
  test('should export CONFIG_KEYS with correct values', () => {
    assert.deepStrictEqual(CONFIG_KEYS, {
      API_KEY: 'llmApiKey',
      MODEL: 'llmModel',
      OPENAI_BASE_URL: 'openaiBaseUrl'
    })
  })

  test('should export API_ENDPOINTS with correct values', () => {
    assert.ok(API_ENDPOINTS.SOURCEGRAPH)
    assert.strictEqual(API_ENDPOINTS.SOURCEGRAPH.BASE_URL, 'https://sourcegraph.com')
    assert.strictEqual(API_ENDPOINTS.SOURCEGRAPH.MODELS, '/.api/modelconfig/supported-models.json')
    assert.strictEqual(API_ENDPOINTS.SOURCEGRAPH.COMPLETIONS, '/.api/completions/stream')
    assert.strictEqual(API_ENDPOINTS.SOURCEGRAPH.GRAPHQL, '/.api/graphql')

    assert.ok(API_ENDPOINTS.OPENAI)
    assert.strictEqual(API_ENDPOINTS.OPENAI.DEFAULT_BASE_URL, 'https://api.openai.com/v1')
    assert.strictEqual(API_ENDPOINTS.OPENAI.MODELS, '/models')
    assert.strictEqual(API_ENDPOINTS.OPENAI.CHAT_COMPLETIONS, '/chat/completions')
  })

  test('should export DEFAULT_MODELS with correct values', () => {
    assert.deepStrictEqual(DEFAULT_MODELS, {
      SOURCEGRAPH: 'claude-3.5-sonnet',
      OPENAI: 'gpt-4o-mini'
    })
  })

  test('should export SOURCEGRAPH_SUPPORTED_LLM_PROVIDERS with correct values', () => {
    assert.deepStrictEqual(SOURCEGRAPH_SUPPORTED_LLM_PROVIDERS, ['anthropic', 'google', 'openai'])
  })

  test('should export ERROR_MESSAGES with correct values', () => {
    assert.deepStrictEqual(ERROR_MESSAGES, {
      NOT_AUTHENTICATED: 'Authentication required. Please sign in.',
      INVALID_TOKEN: 'Invalid authentication token.',
      NO_TOKEN: 'No token provided.',
      NETWORK_ERROR: 'Network request failed.',
      UNKNOWN_ERROR: 'An unknown error occurred.',
      INVALID_RESPONSE: 'Invalid response format from API.'
    })
  })

  test('should export HEADERS with correct values', () => {
    assert.deepStrictEqual(HEADERS, {
      CONTENT_TYPE: 'Content-Type',
      AUTHORIZATION: 'Authorization'
    })
  })

  test('should export CONTENT_TYPES with correct values', () => {
    assert.deepStrictEqual(CONTENT_TYPES, {
      JSON: 'application/json'
    })
  })
})
