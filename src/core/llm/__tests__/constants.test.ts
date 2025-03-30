import * as assert from 'assert'
import { CONFIG_KEYS, ERROR_MESSAGES, LLMProviderDetails, SUPPORTED_PROVIDERS } from '../constants'

suite('LLM Constants', () => {
  test('should export CONFIG_KEYS with correct values', () => {
    assert.deepStrictEqual(
      CONFIG_KEYS,
      {
        PROVIDER: 'llmProvider',
        API_KEY: 'llmApiKey',
        MODEL: 'llmModel',
        OPENAI_BASE_URL: 'openaiBaseUrl'
      },
      'CONFIG_KEYS mismatch'
    )
  })

  test('should export SUPPORTED_PROVIDERS with correct structure and values', () => {
    assert.ok(Array.isArray(SUPPORTED_PROVIDERS), 'SUPPORTED_PROVIDERS should be an array')
    assert.ok(SUPPORTED_PROVIDERS.length >= 3, 'Should have at least 3 providers defined')

    SUPPORTED_PROVIDERS.forEach((provider: LLMProviderDetails) => {
      assert.strictEqual(typeof provider.name, 'string', `Provider ${provider.code} name missing`)
      assert.strictEqual(typeof provider.code, 'string', `Provider ${provider.name} code missing`)
      assert.ok(
        ['openai-compatible', 'openai', 'gemini'].includes(provider.code),
        `Provider ${provider.name} has unexpected code: ${provider.code}`
      )
      assert.strictEqual(
        typeof provider.baseURL,
        'string',
        `Provider ${provider.name} baseURL missing`
      )
      assert.ok(provider.baseURL.length > 0, `Provider ${provider.name} baseURL empty`)
      assert.strictEqual(
        typeof provider.defaultModel,
        'string',
        `Provider ${provider.name} defaultModel missing`
      )
      assert.ok(provider.defaultModel.length > 0, `Provider ${provider.name} defaultModel empty`)
      assert.strictEqual(
        typeof provider.chatCompletionPath,
        'string',
        `Provider ${provider.name} chatCompletionPath missing`
      )
      assert.ok(
        provider.chatCompletionPath.length > 0,
        `Provider ${provider.name} chatCompletionPath empty`
      )
      assert.strictEqual(
        typeof provider.modelsPath,
        'string',
        `Provider ${provider.name} modelsPath missing`
      )
      assert.ok(provider.modelsPath.length > 0, `Provider ${provider.name} modelsPath empty`)

      // Specific checks (optional but good)
      if (provider.code === 'openai') {
        assert.strictEqual(provider.baseURL, 'https://api.openai.com/v1')
      }
      if (provider.code === 'gemini') {
        assert.strictEqual(provider.baseURL, 'https://generativelanguage.googleapis.com/v1beta')
        assert.ok(provider.chatCompletionPath.includes('openai')) // Check Gemini path specifics
      }
    })

    // Check if specific codes exist
    assert.ok(
      SUPPORTED_PROVIDERS.some(p => p.code === 'openai-compatible'),
      'openai-compatible provider missing'
    )
    assert.ok(
      SUPPORTED_PROVIDERS.some(p => p.code === 'openai'),
      'openai provider missing'
    )
    assert.ok(
      SUPPORTED_PROVIDERS.some(p => p.code === 'gemini'),
      'gemini provider missing'
    )
  })

  test('should export ERROR_MESSAGES with correct values', () => {
    assert.deepStrictEqual(
      ERROR_MESSAGES,
      {
        NOT_AUTHENTICATED: 'Authentication required. Please sign in.',
        INVALID_TOKEN: 'Invalid authentication token.',
        NO_TOKEN: 'No token provided.',
        NETWORK_ERROR: 'Network request failed.',
        UNKNOWN_ERROR: 'An unknown error occurred.',
        INVALID_RESPONSE: 'Invalid response format from API.'
      },
      'ERROR_MESSAGES mismatch'
    )
  })
})
