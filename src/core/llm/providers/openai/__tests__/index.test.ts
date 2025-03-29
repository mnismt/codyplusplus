import * as assert from 'assert'
import * as sinon from 'sinon'
import * as vscode from 'vscode'
import { LLMProvider } from '../../../../../constants/llm'
import { API_ENDPOINTS, CONFIG_KEYS, DEFAULT_MODELS, ERROR_MESSAGES } from '../../../constants'
import { CompletionRequest, CompletionRequestMessage } from '../../../types'
import { OpenAIProvider } from '../index'
import { OpenAICompletionResponse, OpenAIModelsResponse } from '../types'

suite('OpenAI Provider', () => {
  let sandbox: sinon.SinonSandbox
  let getConfigurationStub: sinon.SinonStub
  let configGetStub: sinon.SinonStub
  let fetchStub: sinon.SinonStub

  setup(() => {
    sandbox = sinon.createSandbox()

    // Mock VS Code workspace configuration
    configGetStub = sandbox.stub()
    configGetStub.withArgs(CONFIG_KEYS.API_KEY).returns('test-api-key')
    configGetStub.withArgs(CONFIG_KEYS.MODEL).returns('test-model')
    configGetStub.withArgs(CONFIG_KEYS.OPENAI_BASE_URL).returns('https://test-openai-api.com/v1')

    getConfigurationStub = sandbox.stub(vscode.workspace, 'getConfiguration')
    getConfigurationStub.returns({
      get: configGetStub
    })

    // Mock global fetch
    global.fetch = sandbox.stub() as any
    fetchStub = global.fetch as sinon.SinonStub
  })

  teardown(() => {
    sandbox.restore()
    delete (global as any).fetch
  })

  test('should correctly initialize with configuration values', () => {
    const provider = new OpenAIProvider()

    sinon.assert.calledWith(getConfigurationStub, 'codyPlusPlus')
    sinon.assert.calledWith(configGetStub, CONFIG_KEYS.API_KEY)
    sinon.assert.calledWith(configGetStub, CONFIG_KEYS.OPENAI_BASE_URL)

    assert.strictEqual(provider.providerIdentifier, LLMProvider.OpenAI)
    assert.strictEqual(provider.model, 'test-model')
  })

  test('should use default base URL when not configured', () => {
    configGetStub.withArgs(CONFIG_KEYS.OPENAI_BASE_URL).returns(undefined)

    const provider = new OpenAIProvider()

    // Create a completion to ensure the default URL is used
    const mockResponse = {
      ok: true,
      json: sandbox.stub().resolves({
        choices: [{ message: { content: 'test response' } }]
      } as OpenAICompletionResponse)
    }
    fetchStub.resolves(mockResponse)

    return provider
      .complete({
        messages: [{ role: 'user', content: 'test' }]
      })
      .then(() => {
        sinon.assert.calledOnce(fetchStub)
        sinon.assert.calledWithMatch(
          fetchStub,
          `${API_ENDPOINTS.OPENAI.DEFAULT_BASE_URL}${API_ENDPOINTS.OPENAI.CHAT_COMPLETIONS}`
        )
      })
  })

  test('should use default model when not configured', () => {
    configGetStub.withArgs(CONFIG_KEYS.MODEL).returns(undefined)

    const provider = new OpenAIProvider()

    assert.strictEqual(provider.model, DEFAULT_MODELS.OPENAI)

    // Create a completion to ensure the default model is used
    const mockResponse = {
      ok: true,
      json: sandbox.stub().resolves({
        choices: [{ message: { content: 'test response' } }]
      } as OpenAICompletionResponse)
    }
    fetchStub.resolves(mockResponse)

    return provider
      .complete({
        messages: [{ role: 'user', content: 'test' }]
      })
      .then(() => {
        sinon.assert.calledOnce(fetchStub)

        const requestBody = JSON.parse(fetchStub.args[0][1].body)
        assert.strictEqual(requestBody.model, DEFAULT_MODELS.OPENAI)
      })
  })

  test('should throw error when API key not provided', async () => {
    configGetStub.withArgs(CONFIG_KEYS.API_KEY).returns(undefined)

    const provider = new OpenAIProvider()

    try {
      await provider.complete({
        messages: [{ role: 'user', content: 'test' }]
      })
      assert.fail('Expected an error to be thrown')
    } catch (error) {
      assert.strictEqual((error as Error).message, ERROR_MESSAGES.NOT_AUTHENTICATED)
    }
  })

  test('should complete successfully with valid request', async () => {
    const expectedContent = 'This is a test completion'
    const mockResponse = {
      ok: true,
      json: sandbox.stub().resolves({
        choices: [{ message: { content: expectedContent } }]
      } as OpenAICompletionResponse)
    }
    fetchStub.resolves(mockResponse)

    const provider = new OpenAIProvider()

    const request: CompletionRequest = {
      messages: [
        { role: 'system', content: 'You are a helpful assistant' },
        { role: 'user', content: 'Hello' }
      ] as CompletionRequestMessage[],
      config: {
        maxTokens: 100,
        temperature: 0.5
      }
    }

    const response = await provider.complete(request)

    sinon.assert.calledOnce(fetchStub)

    // Verify request format
    const [url, options] = fetchStub.args[0]
    assert.strictEqual(url, 'https://test-openai-api.com/v1/chat/completions')
    assert.strictEqual(options.method, 'POST')
    assert.strictEqual(options.headers['Content-Type'], 'application/json')
    assert.strictEqual(options.headers['Authorization'], 'Bearer test-api-key')

    const requestBody = JSON.parse(options.body)
    assert.strictEqual(requestBody.model, 'test-model')
    assert.deepStrictEqual(requestBody.messages, request.messages)
    assert.strictEqual(requestBody.max_completion_tokens, 100)
    assert.strictEqual(requestBody.temperature, 0.5)
    assert.strictEqual(requestBody.stream, false)
    assert.deepStrictEqual(requestBody.response_format, { type: 'json_object' })

    // Verify response
    assert.strictEqual(response.text, expectedContent)
  })

  test('should throw error when API request fails', async () => {
    const errorMessage = 'API error'
    const mockResponse = {
      ok: false,
      text: sandbox.stub().resolves(errorMessage)
    }
    fetchStub.resolves(mockResponse)

    const provider = new OpenAIProvider()

    try {
      await provider.complete({
        messages: [{ role: 'user', content: 'test' }]
      })
      assert.fail('Expected an error to be thrown')
    } catch (error) {
      assert.strictEqual(
        (error as Error).message,
        `${ERROR_MESSAGES.NETWORK_ERROR} ${errorMessage}`
      )
    }
  })

  test('should fetch models successfully', async () => {
    const mockModels = ['model1', 'model2', 'model3']
    const mockResponse = {
      ok: true,
      json: sandbox.stub().resolves({
        data: mockModels.map(id => ({ id }))
      } as OpenAIModelsResponse)
    }
    fetchStub.resolves(mockResponse)

    const baseUrl = 'https://test-api.com/v1'
    const apiKey = 'test-key'

    const models = await OpenAIProvider.fetchModels(baseUrl, apiKey)

    sinon.assert.calledOnce(fetchStub)
    sinon.assert.calledWithMatch(fetchStub, `${baseUrl}${API_ENDPOINTS.OPENAI.MODELS}`)

    const options = fetchStub.args[0][1]
    assert.strictEqual(options.headers['Authorization'], `Bearer ${apiKey}`)

    assert.deepStrictEqual(models, mockModels)
  })
})
