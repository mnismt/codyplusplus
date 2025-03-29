import * as assert from 'assert'
import * as sinon from 'sinon'
import * as vscode from 'vscode'
import { LLMProvider } from '../../../constants/llm'
import { createProvider } from '../index'
import { OpenAIProvider } from '../providers/openai'
import { SourcegraphProvider } from '../providers/sourcegraph'

suite('LLM Provider Factory', () => {
  let sandbox: sinon.SinonSandbox
  let getConfigurationStub: sinon.SinonStub
  let configGetStub: sinon.SinonStub

  setup(() => {
    sandbox = sinon.createSandbox()

    // Mock VS Code workspace configuration
    configGetStub = sandbox.stub()

    getConfigurationStub = sandbox.stub(vscode.workspace, 'getConfiguration')
    getConfigurationStub.returns({
      get: configGetStub
    })
  })

  teardown(() => {
    sandbox.restore()
  })

  test('should create OpenAI provider when configured', () => {
    configGetStub.withArgs('llmProvider').returns(LLMProvider.OpenAI)

    const provider = createProvider()

    // Verify getConfiguration was called at least once with 'codyPlusPlus'
    sinon.assert.calledWith(getConfigurationStub, 'codyPlusPlus')
    // Verify the provider type get was called
    sinon.assert.calledWith(configGetStub, 'llmProvider')

    assert.ok(provider instanceof OpenAIProvider)
    assert.strictEqual(provider.providerIdentifier, LLMProvider.OpenAI)
  })

  test('should create Sourcegraph provider when configured', () => {
    configGetStub.withArgs('llmProvider').returns(LLMProvider.Sourcegraph)

    const provider = createProvider()

    // Verify getConfiguration was called at least once with 'codyPlusPlus'
    sinon.assert.calledWith(getConfigurationStub, 'codyPlusPlus')
    // Verify the provider type get was called
    sinon.assert.calledWith(configGetStub, 'llmProvider')

    assert.ok(provider instanceof SourcegraphProvider)
    assert.strictEqual(provider.providerIdentifier, LLMProvider.Sourcegraph)
  })

  test('should throw error when invalid provider configured', () => {
    configGetStub.withArgs('llmProvider').returns('invalid-provider')

    assert.throws(() => {
      createProvider()
    }, /Unsupported LLM provider: invalid-provider/)

    // Verify getConfiguration was called with 'codyPlusPlus'
    sinon.assert.calledWith(getConfigurationStub, 'codyPlusPlus')
    // Verify the provider type get was called
    sinon.assert.calledWith(configGetStub, 'llmProvider')
  })
})
