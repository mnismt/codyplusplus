import * as assert from 'assert'
import { LLMProvider } from '../../../constants/llm'
import { BaseLLMProvider, CompletionConfig, CompletionRequest, CompletionResponse } from '../types'

suite('LLM Types', () => {
  test('should correctly type CompletionConfig', () => {
    const config: CompletionConfig = {
      model: 'test-model',
      maxTokens: 500,
      temperature: 0.7,
      responseFormat: {
        type: 'json',
        schema: { type: 'object' }
      }
    }

    assert.strictEqual(config.model, 'test-model')
    assert.strictEqual(config.maxTokens, 500)
    assert.strictEqual(config.temperature, 0.7)
    assert.strictEqual(config.responseFormat?.type, 'json')
  })

  test('should correctly type CompletionRequest', () => {
    const request: CompletionRequest = {
      messages: [
        { role: 'system', content: 'You are a helpful assistant' },
        { role: 'user', content: 'Hello' }
      ],
      config: {
        model: 'test-model',
        maxTokens: 100
      }
    }

    assert.strictEqual(request.messages.length, 2)
    assert.strictEqual(request.messages[0].role, 'system')
    assert.strictEqual(request.messages[0].content, 'You are a helpful assistant')
    assert.strictEqual(request.messages[1].role, 'user')
    assert.strictEqual(request.messages[1].content, 'Hello')
    assert.strictEqual(request.config?.model, 'test-model')
  })

  test('should correctly type CompletionResponse', () => {
    const response: CompletionResponse = {
      text: 'This is a response'
    }

    assert.strictEqual(response.text, 'This is a response')
  })

  test('should correctly implement BaseLLMProvider interface', async () => {
    // Create a mock implementation of BaseLLMProvider
    const mockProvider: BaseLLMProvider = {
      providerIdentifier: LLMProvider.OpenAI,
      complete: async (request: CompletionRequest): Promise<CompletionResponse> => {
        return { text: 'Mock response' }
      }
    }

    assert.strictEqual(mockProvider.providerIdentifier, LLMProvider.OpenAI)

    const response = await mockProvider.complete({
      messages: [{ role: 'user', content: 'Test' }]
    })

    assert.strictEqual(response.text, 'Mock response')
  })
})
