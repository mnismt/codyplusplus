import * as assert from 'assert'
import * as sinon from 'sinon'
import * as vscode from 'vscode'
import { executeMentionFileCommand } from '../commands'

suite('Cody Commands Tests', () => {
  let sandbox: sinon.SinonSandbox
  let executeCommandStub: sinon.SinonStub
  let showErrorMessageStub: sinon.SinonStub

  setup(() => {
    sandbox = sinon.createSandbox()
    executeCommandStub = sandbox.stub(vscode.commands, 'executeCommand')
    showErrorMessageStub = sandbox.stub(vscode.window, 'showErrorMessage')
  })

  teardown(() => {
    sandbox.restore()
  })

  suite('executeMentionFileCommand', () => {
    test('should successfully execute mention file command', async () => {
      // Setup
      const testUri = vscode.Uri.file('/test/file.js')
      executeCommandStub.resolves(true)

      // Execute
      const result = await executeMentionFileCommand(testUri)

      console.log({ result })

      // Verify
      assert.strictEqual(result, true)
      assert.strictEqual(executeCommandStub.calledOnce, true)
      assert.strictEqual(executeCommandStub.firstCall.args[0], 'cody.mention.file')
      assert.strictEqual(executeCommandStub.firstCall.args[1], testUri)
    })

    test('should handle command execution failure', async () => {
      // Setup
      const testUri = vscode.Uri.file('/test/file.js')
      const testError = new Error('Command failed')
      executeCommandStub.rejects(testError)

      // Execute
      const result = await executeMentionFileCommand(testUri)

      // Verify
      assert.strictEqual(result, false)
      assert.strictEqual(executeCommandStub.calledOnce, true)
      assert.strictEqual(showErrorMessageStub.calledOnce, true)
      assert.strictEqual(
        showErrorMessageStub.firstCall.args[0],
        'Failed to trigger Cody to mention file: Command failed'
      )
    })

    test('should handle invalid URI', async () => {
      // Setup
      const invalidUri = {} as vscode.Uri
      executeCommandStub.rejects(new Error('Invalid URI'))

      // Execute
      const result = await executeMentionFileCommand(invalidUri)

      // Verify
      assert.strictEqual(result, false)
      assert.strictEqual(executeCommandStub.calledOnce, true)
      assert.strictEqual(showErrorMessageStub.calledOnce, true)
    })
  })
})
