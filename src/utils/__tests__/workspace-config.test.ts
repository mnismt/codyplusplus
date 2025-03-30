import assert from 'assert'
import * as sinon from 'sinon'
import * as vscode from 'vscode'
import { CONFIG_KEYS, SUPPORTED_PROVIDER_CODES } from '../../core/llm/constants'
import * as workspaceConfig from '../workspace-config'
import {
  updateApiKeyConfig,
  updateBaseUrlConfig,
  updateModelConfig,
  updateProviderConfig,
  verifyLLMProviderConfig
} from '../workspace-config'

suite('Workspace Config Utilities', () => {
  let sandbox: sinon.SinonSandbox
  let getConfigurationStub: sinon.SinonStub
  let configStub: { get: sinon.SinonStub; update: sinon.SinonStub }

  setup(() => {
    sandbox = sinon.createSandbox()

    configStub = {
      get: sandbox.stub(),
      update: sandbox.stub().resolves()
    }

    getConfigurationStub = sandbox.stub(vscode.workspace, 'getConfiguration')
    getConfigurationStub.withArgs('codyPlusPlus').returns(configStub)
  })

  teardown(() => {
    sandbox.restore()
  })

  suite('Config Getters', () => {
    test('should get provider configuration when called', async () => {
      const expectedProvider = 'openai' as SUPPORTED_PROVIDER_CODES
      configStub.get.withArgs(CONFIG_KEYS.PROVIDER).returns(expectedProvider)

      const result = await workspaceConfig.getProviderConfig()

      assert.strictEqual(result, expectedProvider)
      assert.ok(getConfigurationStub.calledWith('codyPlusPlus'))
      assert.ok(configStub.get.calledWith(CONFIG_KEYS.PROVIDER))
    })

    test('should get API key configuration when called', async () => {
      const expectedApiKey = 'test-api-key'
      configStub.get.withArgs(CONFIG_KEYS.API_KEY).returns(expectedApiKey)

      const result = await workspaceConfig.getApiKeyConfig()

      assert.strictEqual(result, expectedApiKey)
      assert.ok(getConfigurationStub.calledWith('codyPlusPlus'))
      assert.ok(configStub.get.calledWith(CONFIG_KEYS.API_KEY))
    })

    test('should get base URL configuration when called', async () => {
      const expectedBaseUrl = 'https://api.example.com'
      configStub.get.withArgs(CONFIG_KEYS.OPENAI_BASE_URL).returns(expectedBaseUrl)

      const result = await workspaceConfig.getBaseUrlConfig()

      assert.strictEqual(result, expectedBaseUrl)
      assert.ok(getConfigurationStub.calledWith('codyPlusPlus'))
      assert.ok(configStub.get.calledWith(CONFIG_KEYS.OPENAI_BASE_URL))
    })

    test('should get model configuration when called', async () => {
      const expectedModel = 'gpt-4'
      configStub.get.withArgs(CONFIG_KEYS.MODEL).returns(expectedModel)

      const result = await workspaceConfig.getModelConfig()

      assert.strictEqual(result, expectedModel)
      assert.ok(getConfigurationStub.calledWith('codyPlusPlus'))
      assert.ok(configStub.get.calledWith(CONFIG_KEYS.MODEL))
    })
  })

  suite('Config Updaters', () => {
    test('should update provider configuration with provided value', async () => {
      const providerToSet = 'anthropic' as SUPPORTED_PROVIDER_CODES

      await updateProviderConfig(providerToSet)

      assert.ok(getConfigurationStub.calledWith('codyPlusPlus'))
      assert.ok(configStub.update.calledWith(CONFIG_KEYS.PROVIDER, providerToSet, true))
    })

    test('should update API key configuration with provided value', async () => {
      const apiKeyToSet = 'new-api-key'

      await updateApiKeyConfig(apiKeyToSet)

      assert.ok(getConfigurationStub.calledWith('codyPlusPlus'))
      assert.ok(configStub.update.calledWith(CONFIG_KEYS.API_KEY, apiKeyToSet, true))
    })

    test('should update base URL for OpenAI-compatible provider', async () => {
      const baseUrlToSet = 'https://api.new-example.com'

      await updateBaseUrlConfig('openai-compatible', baseUrlToSet)

      assert.ok(getConfigurationStub.calledWith('codyPlusPlus'))
      assert.ok(configStub.update.calledWith(CONFIG_KEYS.OPENAI_BASE_URL, baseUrlToSet, true))
    })

    test('should clear base URL for non-OpenAI-compatible provider', async () => {
      await updateBaseUrlConfig('anthropic', 'https://should-be-ignored.com')

      assert.ok(getConfigurationStub.calledWith('codyPlusPlus'))
      assert.ok(configStub.update.calledWith(CONFIG_KEYS.OPENAI_BASE_URL, undefined, true))
    })

    test('should update model configuration with provided value', async () => {
      const modelToSet = 'claude-2'

      await updateModelConfig(modelToSet)

      assert.ok(getConfigurationStub.calledWith('codyPlusPlus'))
      assert.ok(configStub.update.calledWith(CONFIG_KEYS.MODEL, modelToSet, true))
    })
  })

  suite('Configuration Verification', () => {
    test('should return true when all required configurations are set for standard provider', async () => {
      // Configure the underlying config getter stub
      configStub.get.withArgs(CONFIG_KEYS.PROVIDER).returns('anthropic' as SUPPORTED_PROVIDER_CODES)
      configStub.get.withArgs(CONFIG_KEYS.API_KEY).returns('test-api-key')
      configStub.get.withArgs(CONFIG_KEYS.MODEL).returns('claude-2')

      const result = await verifyLLMProviderConfig() // Call the actual function

      assert.strictEqual(result, true)
    })

    test('should return true when all required configurations including base URL are set for OpenAI-compatible provider', async () => {
      // Configure the underlying config getter stub
      configStub.get
        .withArgs(CONFIG_KEYS.PROVIDER)
        .returns('openai-compatible' as SUPPORTED_PROVIDER_CODES)
      configStub.get.withArgs(CONFIG_KEYS.API_KEY).returns('test-api-key')
      configStub.get.withArgs(CONFIG_KEYS.MODEL).returns('gpt-4')
      configStub.get.withArgs(CONFIG_KEYS.OPENAI_BASE_URL).returns('https://api.example.com')

      const result = await verifyLLMProviderConfig() // Call the actual function

      assert.strictEqual(result, true)
    })

    test('should return false when provider configuration is missing', async () => {
      // Configure the underlying config getter stub
      configStub.get.withArgs(CONFIG_KEYS.PROVIDER).returns(undefined)
      configStub.get.withArgs(CONFIG_KEYS.API_KEY).returns('test-api-key') // Still need to define others
      configStub.get.withArgs(CONFIG_KEYS.MODEL).returns('gpt-4')

      const result = await verifyLLMProviderConfig()

      assert.strictEqual(result, false)
    })

    test('should return false when API key configuration is missing', async () => {
      // Configure the underlying config getter stub
      configStub.get.withArgs(CONFIG_KEYS.PROVIDER).returns('openai' as SUPPORTED_PROVIDER_CODES)
      configStub.get.withArgs(CONFIG_KEYS.API_KEY).returns(undefined)
      configStub.get.withArgs(CONFIG_KEYS.MODEL).returns('gpt-4')

      const result = await verifyLLMProviderConfig()

      assert.strictEqual(result, false)
    })

    test('should return false when model configuration is missing', async () => {
      // Configure the underlying config getter stub
      configStub.get.withArgs(CONFIG_KEYS.PROVIDER).returns('openai' as SUPPORTED_PROVIDER_CODES)
      configStub.get.withArgs(CONFIG_KEYS.API_KEY).returns('test-api-key')
      configStub.get.withArgs(CONFIG_KEYS.MODEL).returns(undefined)

      const result = await verifyLLMProviderConfig()

      assert.strictEqual(result, false)
    })

    test('should return false when base URL is missing for OpenAI-compatible provider', async () => {
      // Configure the underlying config getter stub
      configStub.get
        .withArgs(CONFIG_KEYS.PROVIDER)
        .returns('openai-compatible' as SUPPORTED_PROVIDER_CODES)
      configStub.get.withArgs(CONFIG_KEYS.API_KEY).returns('test-api-key')
      configStub.get.withArgs(CONFIG_KEYS.MODEL).returns('gpt-4')
      configStub.get.withArgs(CONFIG_KEYS.OPENAI_BASE_URL).returns(undefined)

      const result = await verifyLLMProviderConfig()

      assert.strictEqual(result, false)
    })
  })
})
