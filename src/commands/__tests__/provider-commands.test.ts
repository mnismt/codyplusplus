import * as assert from 'assert'
import * as sinon from 'sinon'
import * as vscode from 'vscode'
import * as llmModule from '../../core/llm'
import { CONFIG_KEYS, SUPPORTED_PROVIDERS } from '../../core/llm/constants'
import * as workspaceConfigUtils from '../../utils/workspace-config'
import { selectLLM, selectProvider } from '../provider-commands'

suite('Provider Commands Tests', () => {
  let sandbox: sinon.SinonSandbox
  let showQuickPickStub: sinon.SinonStub
  let showInputBoxStub: sinon.SinonStub
  let showInformationMessageStub: sinon.SinonStub
  let showWarningMessageStub: sinon.SinonStub
  let showErrorMessageStub: sinon.SinonStub
  let getConfigurationStub: sinon.SinonStub
  let updateProviderConfigStub: sinon.SinonStub
  let updateApiKeyConfigStub: sinon.SinonStub
  let updateBaseUrlConfigStub: sinon.SinonStub
  let updateModelConfigStub: sinon.SinonStub
  let createProviderStub: sinon.SinonStub
  let fetchModelsStub: sinon.SinonStub
  let configGet: sinon.SinonStub

  setup(() => {
    sandbox = sinon.createSandbox()

    // UI stubs
    showQuickPickStub = sandbox.stub(vscode.window, 'showQuickPick')
    showInputBoxStub = sandbox.stub(vscode.window, 'showInputBox')
    showInformationMessageStub = sandbox.stub(vscode.window, 'showInformationMessage')
    showWarningMessageStub = sandbox.stub(vscode.window, 'showWarningMessage')
    showErrorMessageStub = sandbox.stub(vscode.window, 'showErrorMessage')

    // Configuration stubs
    configGet = sandbox.stub()
    const configStub = {
      get: configGet,
      update: sandbox.stub().resolves(),
      has: sandbox.stub().returns(false),
      inspect: sandbox.stub().returns(undefined)
    } as any as vscode.WorkspaceConfiguration

    getConfigurationStub = sandbox.stub(vscode.workspace, 'getConfiguration').returns(configStub)

    // Config update stubs
    updateProviderConfigStub = sandbox.stub(workspaceConfigUtils, 'updateProviderConfig').resolves()
    updateApiKeyConfigStub = sandbox.stub(workspaceConfigUtils, 'updateApiKeyConfig').resolves()
    updateBaseUrlConfigStub = sandbox.stub(workspaceConfigUtils, 'updateBaseUrlConfig').resolves()
    updateModelConfigStub = sandbox.stub(workspaceConfigUtils, 'updateModelConfig').resolves()

    // LLM provider stubs
    fetchModelsStub = sandbox.stub().resolves(['model-1', 'model-2'])
    const mockLlmProvider = {
      fetchModels: fetchModelsStub
    }
    createProviderStub = sandbox.stub(llmModule, 'createProvider').returns(mockLlmProvider as any)
  })

  teardown(() => {
    sandbox.restore()
  })

  suite('selectProvider', () => {
    test('should return false when provider selection is cancelled', async () => {
      // Simulate user cancelling provider selection
      showQuickPickStub.resolves(undefined)

      const result = await selectProvider()

      assert.strictEqual(result, false)
      assert.strictEqual(showQuickPickStub.calledOnce, true)
      assert.strictEqual(showInformationMessageStub.calledOnce, true)
      assert.strictEqual(
        showInformationMessageStub.firstCall.args[0],
        'Provider selection cancelled.'
      )
      assert.strictEqual(showInputBoxStub.called, false) // No further prompts
    })

    test('should return false when API key entry is cancelled', async () => {
      // Mock provider selection
      const mockProvider = SUPPORTED_PROVIDERS[0]
      showQuickPickStub.resolves({
        label: mockProvider.name,
        description: mockProvider.code,
        provider: mockProvider
      })

      // Simulate user cancelling API key input
      showInputBoxStub.onFirstCall().resolves(undefined)

      const result = await selectProvider()

      assert.strictEqual(result, false)
      assert.strictEqual(showQuickPickStub.calledOnce, true)
      assert.strictEqual(showInputBoxStub.calledOnce, true)
      assert.strictEqual(showInformationMessageStub.calledOnce, true)
      assert.strictEqual(showInformationMessageStub.firstCall.args[0], 'API key entry cancelled.')
    })

    test('should return false when API key is empty', async () => {
      // Mock provider selection
      const mockProvider = SUPPORTED_PROVIDERS[0]
      showQuickPickStub.resolves({
        label: mockProvider.name,
        description: mockProvider.code,
        provider: mockProvider
      })

      // Simulate user submitting empty API key
      showInputBoxStub.onFirstCall().resolves('')

      const result = await selectProvider()

      assert.strictEqual(result, false)
      assert.strictEqual(showQuickPickStub.calledOnce, true)
      assert.strictEqual(showInputBoxStub.calledOnce, true)
      assert.strictEqual(showWarningMessageStub.calledOnce, true)
      assert.strictEqual(
        showWarningMessageStub.firstCall.args[0],
        'API key cannot be empty. Provider setup cancelled.'
      )
    })

    test('should return false when base URL entry is cancelled for openai-compatible provider', async () => {
      // Find the OpenAI Compatible provider
      const openAICompatibleProvider = SUPPORTED_PROVIDERS.find(
        p => p.code === 'openai-compatible'
      )!

      // Mock provider selection
      showQuickPickStub.resolves({
        label: openAICompatibleProvider.name,
        description: openAICompatibleProvider.code,
        provider: openAICompatibleProvider
      })

      // Mock API key input
      showInputBoxStub.onFirstCall().resolves('test-api-key')

      // Mock current base URL config
      configGet.withArgs(CONFIG_KEYS.OPENAI_BASE_URL).returns('https://current-url.com')

      // Simulate user cancelling base URL input
      showInputBoxStub.onSecondCall().resolves(undefined)

      const result = await selectProvider()

      assert.strictEqual(result, false)
      assert.strictEqual(showQuickPickStub.calledOnce, true)
      assert.strictEqual(showInputBoxStub.callCount, 2)
      assert.strictEqual(showInformationMessageStub.calledOnce, true)
      assert.strictEqual(showInformationMessageStub.firstCall.args[0], 'Base URL entry cancelled.')
    })

    test('should handle model fetch errors and fall back to input box', async () => {
      // Mock provider selection
      const mockProvider = SUPPORTED_PROVIDERS[0]
      showQuickPickStub.onFirstCall().resolves({
        label: mockProvider.name,
        description: mockProvider.code,
        provider: mockProvider
      })

      // Mock API key input
      showInputBoxStub.onFirstCall().resolves('test-api-key')

      // Mock current model config
      configGet.withArgs(CONFIG_KEYS.MODEL).returns('current-model')

      // Simulate models fetch error
      fetchModelsStub.rejects(new Error('Network error'))

      // Mock model input (after fetch error)
      showInputBoxStub.onSecondCall().resolves('user-entered-model')

      const result = await selectProvider()

      assert.strictEqual(result, false)
      assert.strictEqual(showWarningMessageStub.calledOnce, true)
      assert.ok(showWarningMessageStub.firstCall.args[0].includes('Could not fetch models'))
      assert.strictEqual(showInputBoxStub.callCount, 3)
      assert.strictEqual(createProviderStub.calledOnce, true)
    })

    test('should successfully update configuration for standard provider', async () => {
      // Mock standard provider selection
      const mockProvider = SUPPORTED_PROVIDERS.find(p => p.code === 'openai')!
      showQuickPickStub.onFirstCall().resolves({
        label: mockProvider.name,
        description: mockProvider.code,
        provider: mockProvider
      })

      // Mock API key input
      showInputBoxStub.onFirstCall().resolves('test-api-key')

      // Mock model selection
      showQuickPickStub.onSecondCall().resolves('gpt-4')

      const result = await selectProvider()

      assert.strictEqual(result, true)
      assert.strictEqual(showQuickPickStub.callCount, 2)
      assert.strictEqual(updateProviderConfigStub.calledOnceWith(mockProvider.code), true)
      assert.strictEqual(updateApiKeyConfigStub.calledOnceWith('test-api-key'), true)
      assert.strictEqual(updateBaseUrlConfigStub.calledOnceWith(mockProvider.code, undefined), true)
      assert.strictEqual(updateModelConfigStub.calledOnceWith('gpt-4'), true)
      assert.strictEqual(showInformationMessageStub.calledOnce, true)
      assert.ok(showInformationMessageStub.firstCall.args[0].includes('Successfully configured'))
    })
  })

  suite('selectLLM', () => {
    test('should return false when provider or API key is not configured', async () => {
      // Simulate missing provider and API key
      configGet.withArgs(CONFIG_KEYS.PROVIDER).returns(undefined)
      configGet.withArgs(CONFIG_KEYS.API_KEY).returns(undefined)

      const result = await selectLLM()

      assert.strictEqual(result, false)
      assert.strictEqual(showWarningMessageStub.calledOnce, true)
      assert.strictEqual(
        showWarningMessageStub.firstCall.args[0],
        'Provider and API key must be configured first. Use the "Select LLM Provider" command.'
      )
      assert.strictEqual(showQuickPickStub.called, false) // No further prompts
    })

    test('should return false when provider code is invalid', async () => {
      // Simulate configured but invalid provider
      configGet.withArgs(CONFIG_KEYS.PROVIDER).returns('invalid-provider')
      configGet.withArgs(CONFIG_KEYS.API_KEY).returns('test-api-key')

      const result = await selectLLM()

      assert.strictEqual(result, false)
      assert.strictEqual(showErrorMessageStub.calledOnce, true)
      assert.strictEqual(
        showErrorMessageStub.firstCall.args[0],
        "Configuration Error: Invalid provider code 'invalid-provider'."
      )
      assert.strictEqual(showQuickPickStub.called, false) // No further prompts
    })

    test('should return false when model selection is cancelled', async () => {
      // Mock valid configuration
      const mockProvider = SUPPORTED_PROVIDERS[0]
      configGet.withArgs(CONFIG_KEYS.PROVIDER).returns(mockProvider.code)
      configGet.withArgs(CONFIG_KEYS.API_KEY).returns('test-api-key')
      configGet.withArgs(CONFIG_KEYS.MODEL).returns('current-model')

      // Simulate user cancelling model selection
      showQuickPickStub.resolves(undefined)

      const result = await selectLLM()

      assert.strictEqual(result, false)
      assert.strictEqual(showQuickPickStub.calledOnce, true)
      assert.strictEqual(showInformationMessageStub.calledOnce, true)
      assert.strictEqual(showInformationMessageStub.firstCall.args[0], 'Model selection cancelled.')
    })

    test('should handle model fetch errors and fall back to input box', async () => {
      // Mock valid configuration
      const mockProvider = SUPPORTED_PROVIDERS[0]
      configGet.withArgs(CONFIG_KEYS.PROVIDER).returns(mockProvider.code)
      configGet.withArgs(CONFIG_KEYS.API_KEY).returns('test-api-key')
      configGet.withArgs(CONFIG_KEYS.MODEL).returns('current-model')

      // Simulate models fetch error
      fetchModelsStub.rejects(new Error('Network error'))

      // Mock model input (after fetch error)
      showInputBoxStub.resolves('new-model')

      const result = await selectLLM()

      assert.strictEqual(result, true)
      assert.strictEqual(showWarningMessageStub.calledOnce, true)
      assert.ok(showWarningMessageStub.firstCall.args[0].includes('Could not fetch models'))
      assert.strictEqual(showInputBoxStub.calledOnce, true)
      assert.strictEqual(updateModelConfigStub.calledOnceWith('new-model'), true)
    })

    test('should return true without updating when selected model is the same as current', async () => {
      // Mock valid configuration
      const mockProvider = SUPPORTED_PROVIDERS[0]
      configGet.withArgs(CONFIG_KEYS.PROVIDER).returns(mockProvider.code)
      configGet.withArgs(CONFIG_KEYS.API_KEY).returns('test-api-key')
      configGet.withArgs(CONFIG_KEYS.MODEL).returns('current-model')

      // Simulate user selecting the same model
      showQuickPickStub.resolves('current-model')

      const result = await selectLLM()

      assert.strictEqual(result, true)
      assert.strictEqual(showQuickPickStub.calledOnce, true)
      assert.strictEqual(showInformationMessageStub.calledOnce, true)
      assert.strictEqual(
        showInformationMessageStub.firstCall.args[0],
        'Selected model is the same as the current one. No changes made.'
      )
      assert.strictEqual(updateModelConfigStub.called, false) // Config not updated
    })

    test('should successfully update model configuration for OpenAI-compatible provider', async () => {
      // Find the OpenAI Compatible provider
      const openAICompatibleProvider = SUPPORTED_PROVIDERS.find(
        p => p.code === 'openai-compatible'
      )!

      // Mock valid configuration
      configGet.withArgs(CONFIG_KEYS.PROVIDER).returns(openAICompatibleProvider.code)
      configGet.withArgs(CONFIG_KEYS.API_KEY).returns('test-api-key')
      configGet.withArgs(CONFIG_KEYS.OPENAI_BASE_URL).returns('https://custom-api.com')
      configGet.withArgs(CONFIG_KEYS.MODEL).returns('current-model')

      // Simulate user selecting a different model
      showQuickPickStub.resolves('new-model')

      const result = await selectLLM()

      assert.strictEqual(result, true)
      assert.strictEqual(showQuickPickStub.calledOnce, true)
      assert.strictEqual(createProviderStub.calledOnce, true)
      assert.deepStrictEqual(createProviderStub.firstCall.args, [
        openAICompatibleProvider.code,
        {
          apiKey: 'test-api-key',
          baseUrl: 'https://custom-api.com'
        }
      ])
      assert.strictEqual(updateModelConfigStub.calledOnceWith('new-model'), true)
      assert.strictEqual(showInformationMessageStub.calledOnce, true)
      assert.strictEqual(
        showInformationMessageStub.firstCall.args[0],
        'Successfully updated LLM model to new-model'
      )
    })

    test('should handle config update errors', async () => {
      // Mock valid configuration
      const mockProvider = SUPPORTED_PROVIDERS[0]
      configGet.withArgs(CONFIG_KEYS.PROVIDER).returns(mockProvider.code)
      configGet.withArgs(CONFIG_KEYS.API_KEY).returns('test-api-key')
      configGet.withArgs(CONFIG_KEYS.MODEL).returns('current-model')

      // Simulate user selecting a new model
      showQuickPickStub.resolves('new-model')

      // Mock configuration update error
      const updateError = new Error('Configuration update failed')
      updateModelConfigStub.rejects(updateError)

      const result = await selectLLM()

      assert.strictEqual(result, false)
      assert.strictEqual(showQuickPickStub.calledOnce, true)
      assert.strictEqual(updateModelConfigStub.calledOnceWith('new-model'), true)
      assert.strictEqual(showErrorMessageStub.calledOnce, true)
      assert.strictEqual(
        showErrorMessageStub.firstCall.args[0],
        'Failed to save model configuration: Configuration update failed'
      )
    })
  })
})
