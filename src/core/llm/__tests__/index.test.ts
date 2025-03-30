import * as assert from 'assert'
import * as sinon from 'sinon'
import * as vscode from 'vscode'
import { createProvider, OpenAIProvider } from '../index'

suite('LLM Provider Factory', () => {
  let sandbox: sinon.SinonSandbox
  let getConfigurationStub: sinon.SinonStub

  setup(() => {
    sandbox = sinon.createSandbox()
    getConfigurationStub = sandbox.stub(vscode.workspace, 'getConfiguration')
    getConfigurationStub.returns({
      get: sandbox.stub()
    })
  })

  teardown(() => {
    sandbox.restore()
  })

  test('should create OpenAI provider', () => {
    const provider = createProvider()
    assert.ok(provider instanceof OpenAIProvider)
  })
})
