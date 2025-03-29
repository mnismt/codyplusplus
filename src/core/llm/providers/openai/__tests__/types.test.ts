import * as assert from 'assert'
import { OpenAICompletionResponse, OpenAIModelsResponse } from '../types'

suite('OpenAI Provider Types', () => {
  test('should correctly type OpenAIModelsResponse', () => {
    const response: OpenAIModelsResponse = {
      data: [{ id: 'model1' }, { id: 'model2' }, { id: 'model3' }]
    }

    assert.strictEqual(response.data.length, 3)
    assert.strictEqual(response.data[0].id, 'model1')
    assert.strictEqual(response.data[1].id, 'model2')
    assert.strictEqual(response.data[2].id, 'model3')
  })

  test('should correctly type OpenAICompletionResponse', () => {
    const response: OpenAICompletionResponse = {
      id: 'test-id',
      object: 'chat.completion',
      created: 1616941267,
      model: 'gpt-4o',
      choices: [
        {
          message: {
            content: 'This is a test response',
            role: 'assistant'
          },
          index: 0,
          logprobs: null,
          finish_reason: 'stop'
        }
      ],
      usage: {
        prompt_tokens: 10,
        completion_tokens: 20,
        total_tokens: 30
      }
    }

    assert.strictEqual(response.id, 'test-id')
    assert.strictEqual(response.object, 'chat.completion')
    assert.strictEqual(response.created, 1616941267)
    assert.strictEqual(response.model, 'gpt-4o')

    assert.strictEqual(response.choices.length, 1)
    assert.strictEqual(response.choices[0].message.content, 'This is a test response')
    assert.strictEqual(response.choices[0].message.role, 'assistant')
    assert.strictEqual(response.choices[0].index, 0)
    assert.strictEqual(response.choices[0].finish_reason, 'stop')

    assert.strictEqual(response.usage.prompt_tokens, 10)
    assert.strictEqual(response.usage.completion_tokens, 20)
    assert.strictEqual(response.usage.total_tokens, 30)
  })
})
