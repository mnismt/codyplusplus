import * as assert from 'assert'
import * as sinon from 'sinon'
import * as vscode from 'vscode'
import { CustomCommandService } from '../../services/customCommand.service'
import { CustomCommandsWebview } from '../../views/CustomCommandsWebview'
import { addCustomCommand, editCustomCommand } from '../add-custom-command'

suite('Add Custom Command Tests', () => {
  let sandbox: sinon.SinonSandbox
  let customCommandServiceStub: sinon.SinonStubbedInstance<CustomCommandService>
  let customCommandsWebviewCreateOrShowStub: sinon.SinonStub
  let showErrorMessageStub: sinon.SinonStub

  setup(() => {
    sandbox = sinon.createSandbox()

    // Stub the CustomCommandService
    customCommandServiceStub = {
      getCommand: sandbox.stub(),
      getInstance: sandbox.stub()
    } as unknown as sinon.SinonStubbedInstance<CustomCommandService>

    sandbox
      .stub(CustomCommandService, 'getInstance')
      .returns(customCommandServiceStub as unknown as CustomCommandService)

    // Stub the CustomCommandsWebview.createOrShow method
    customCommandsWebviewCreateOrShowStub = sandbox.stub(CustomCommandsWebview, 'createOrShow')

    // Stub VS Code APIs
    showErrorMessageStub = sandbox.stub(vscode.window, 'showErrorMessage')
  })

  teardown(() => {
    sandbox.restore()
  })

  suite('addCustomCommand', () => {
    test('should create or show the custom commands webview', async () => {
      // Create mock extension context
      const mockContext: vscode.ExtensionContext = {
        extensionUri: vscode.Uri.file('/test/extension'),
        extensionMode: vscode.ExtensionMode.Development,
        subscriptions: []
      } as unknown as vscode.ExtensionContext

      // Call the function being tested
      addCustomCommand(mockContext)

      // Verify the webview was created/shown with correct parameters
      assert.strictEqual(customCommandsWebviewCreateOrShowStub.calledOnce, true)
      assert.strictEqual(
        customCommandsWebviewCreateOrShowStub.firstCall.args[0].toString(),
        mockContext.extensionUri.toString()
      )
      assert.strictEqual(
        customCommandsWebviewCreateOrShowStub.firstCall.args[1],
        vscode.ExtensionMode.Development
      )
      assert.strictEqual(customCommandsWebviewCreateOrShowStub.firstCall.args.length, 2)
    })
  })

  suite('editCustomCommand', () => {
    test('should show error message when command does not exist', async () => {
      // Create mock extension context
      const mockContext: vscode.ExtensionContext = {
        extensionUri: vscode.Uri.file('/test/extension'),
        extensionMode: vscode.ExtensionMode.Development,
        subscriptions: []
      } as unknown as vscode.ExtensionContext

      // Command ID to test with
      const commandId = 'non-existent-command'

      // Set up the stub to return null (command not found)
      customCommandServiceStub.getCommand.withArgs(commandId).resolves(undefined)

      // Call the function being tested
      await editCustomCommand(mockContext, commandId)

      // Verify error message was shown
      assert.strictEqual(showErrorMessageStub.calledOnce, true)
      assert.strictEqual(
        showErrorMessageStub.firstCall.args[0],
        `Command ${commandId} does not exist.`
      )

      // Verify webview was not created
      assert.strictEqual(customCommandsWebviewCreateOrShowStub.called, false)
    })

    test('should handle errors when getting command', async () => {
      // Create mock extension context
      const mockContext: vscode.ExtensionContext = {
        extensionUri: vscode.Uri.file('/test/extension'),
        extensionMode: vscode.ExtensionMode.Development,
        subscriptions: []
      } as unknown as vscode.ExtensionContext

      // Command ID to test with
      const commandId = 'error-command'
      const testError = new Error('Test error')

      // Set up the stub to throw an error
      customCommandServiceStub.getCommand.withArgs(commandId).rejects(testError)

      // Call the function being tested
      await editCustomCommand(mockContext, commandId)

      // Verify error was shown
      assert.strictEqual(showErrorMessageStub.calledOnce, true)
      assert.strictEqual(
        showErrorMessageStub.firstCall.args[0],
        `Command ${commandId} does not exist.`
      )

      // Verify webview was not created
      assert.strictEqual(customCommandsWebviewCreateOrShowStub.called, false)
    })
  })
})
