import * as assert from 'assert'
import * as sinon from 'sinon'
import * as vscode from 'vscode'
import { TELEMETRY_EVENTS } from '../../constants/telemetry'
import * as codyCommands from '../../core/cody/commands'
import * as fileOperations from '../../core/filesystem/operations'
import * as fileProcessor from '../../core/filesystem/processor'
import * as llmModule from '../../core/llm'
import * as llmUtils from '../../core/llm/utils'
import { TelemetryService } from '../../services/telemetry.service'
import { addFile, addFilesSmart, addFolder, addSelection } from '../addToCody'

suite('Add to Cody Commands Tests', () => {
  let sandbox: sinon.SinonSandbox
  let telemetryTrackStub: sinon.SinonStub

  setup(() => {
    sandbox = sinon.createSandbox()

    // Mock telemetry service
    telemetryTrackStub = sandbox.stub()
    const telemetryInstance = {
      trackEvent: telemetryTrackStub
    }
    sandbox.stub(TelemetryService, 'getInstance').returns(telemetryInstance as any)
  })

  teardown(() => {
    sandbox.restore()
  })

  suite('addFile', () => {
    let getSelectedFileUrisStub: sinon.SinonStub
    let executeMentionFileCommandStub: sinon.SinonStub
    let showErrorMessageStub: sinon.SinonStub

    setup(() => {
      getSelectedFileUrisStub = sandbox.stub(fileProcessor, 'getSelectedFileUris')
      executeMentionFileCommandStub = sandbox.stub(codyCommands, 'executeMentionFileCommand')
      showErrorMessageStub = sandbox.stub(vscode.window, 'showErrorMessage')
    })

    test('should add a file to Cody successfully', async () => {
      const testUri = vscode.Uri.file('/test/file.js')
      const files = [testUri]

      getSelectedFileUrisStub.resolves(files)
      executeMentionFileCommandStub.resolves(true)

      await addFile(testUri)

      assert.strictEqual(getSelectedFileUrisStub.calledOnce, true)
      assert.deepStrictEqual(getSelectedFileUrisStub.firstCall.args[0], [testUri])
      assert.strictEqual(executeMentionFileCommandStub.calledOnce, true)
      assert.strictEqual(executeMentionFileCommandStub.firstCall.args[0], testUri)
      assert.strictEqual(telemetryTrackStub.calledOnce, true)
      assert.strictEqual(telemetryTrackStub.firstCall.args[0], TELEMETRY_EVENTS.FILES.ADD_FILE)
      assert.deepStrictEqual(telemetryTrackStub.firstCall.args[1], {
        fileCount: 1,
        folderCount: 1
      })
    })

    test('should handle errors when adding a file', async () => {
      const testUri = vscode.Uri.file('/test/file.js')
      const testError = new Error('Test error')

      getSelectedFileUrisStub.rejects(testError)

      await addFile(testUri)

      assert.strictEqual(showErrorMessageStub.calledOnce, true)
      assert.strictEqual(
        showErrorMessageStub.firstCall.args[0],
        'Failed to add file to Cody: Test error'
      )
      assert.strictEqual(telemetryTrackStub.called, false)
    })
  })

  suite('addSelection', () => {
    let getSelectedFolderCountStub: sinon.SinonStub
    let executeMentionFileCommandStub: sinon.SinonStub
    let showErrorMessageStub: sinon.SinonStub

    setup(() => {
      getSelectedFolderCountStub = sandbox.stub(fileProcessor, 'getSelectedFolderCount')
      executeMentionFileCommandStub = sandbox.stub(codyCommands, 'executeMentionFileCommand')
      showErrorMessageStub = sandbox.stub(vscode.window, 'showErrorMessage')
    })

    test('should add selected files to Cody non-recursively', async () => {
      const testUri1 = vscode.Uri.file('/test/file1.js')
      const testUri2 = vscode.Uri.file('/test/file2.js')
      const folderUris = [testUri1, testUri2]
      const fileUris = [testUri1, testUri2]

      getSelectedFolderCountStub.resolves({
        folderCount: 2,
        fileUris
      })
      executeMentionFileCommandStub.resolves(true)

      await addSelection(folderUris, false)

      assert.strictEqual(getSelectedFolderCountStub.calledOnce, true)
      assert.deepStrictEqual(getSelectedFolderCountStub.firstCall.args[0], folderUris)
      assert.strictEqual(getSelectedFolderCountStub.firstCall.args[1].recursive, false)
      assert.strictEqual(executeMentionFileCommandStub.callCount, 2)
      assert.strictEqual(telemetryTrackStub.calledOnce, true)
      assert.strictEqual(telemetryTrackStub.firstCall.args[0], TELEMETRY_EVENTS.FILES.ADD_SELECTION)
      assert.deepStrictEqual(telemetryTrackStub.firstCall.args[1], {
        fileCount: 2,
        folderCount: 2,
        recursive: false
      })
    })

    test('should add selected files to Cody recursively', async () => {
      const testUri1 = vscode.Uri.file('/test/file1.js')
      const testUri2 = vscode.Uri.file('/test/file2.js')
      const folderUris = [testUri1, testUri2]
      const fileUris = [testUri1, testUri2]

      getSelectedFolderCountStub.resolves({
        folderCount: 2,
        fileUris
      })
      executeMentionFileCommandStub.resolves(true)

      await addSelection(folderUris, true)

      assert.strictEqual(getSelectedFolderCountStub.calledOnce, true)
      assert.deepStrictEqual(getSelectedFolderCountStub.firstCall.args[0], folderUris)
      assert.strictEqual(getSelectedFolderCountStub.firstCall.args[1].recursive, true)
      assert.strictEqual(executeMentionFileCommandStub.callCount, 2)
      assert.strictEqual(telemetryTrackStub.calledOnce, true)
      assert.strictEqual(telemetryTrackStub.firstCall.args[0], TELEMETRY_EVENTS.FILES.ADD_SELECTION)
      assert.deepStrictEqual(telemetryTrackStub.firstCall.args[1], {
        fileCount: 2,
        folderCount: 2,
        recursive: true
      })
    })

    test('should handle errors when adding selected files', async () => {
      const testUri1 = vscode.Uri.file('/test/file1.js')
      const testError = new Error('Test error')

      getSelectedFolderCountStub.rejects(testError)

      await addSelection([testUri1], false)

      assert.strictEqual(showErrorMessageStub.calledOnce, true)
      assert.strictEqual(
        showErrorMessageStub.firstCall.args[0],
        'Failed to add selection to Cody: Test error'
      )
      assert.strictEqual(telemetryTrackStub.called, false)
    })
  })

  suite('addFolder', () => {
    let getSelectedFolderCountStub: sinon.SinonStub
    let executeMentionFileCommandStub: sinon.SinonStub
    let showErrorMessageStub: sinon.SinonStub

    setup(() => {
      getSelectedFolderCountStub = sandbox.stub(fileProcessor, 'getSelectedFolderCount')
      executeMentionFileCommandStub = sandbox.stub(codyCommands, 'executeMentionFileCommand')
      showErrorMessageStub = sandbox.stub(vscode.window, 'showErrorMessage')
    })

    test('should add folder to Cody recursively by default', async () => {
      const folderUri = vscode.Uri.file('/test/folder')
      const fileUri1 = vscode.Uri.file('/test/folder/file1.js')
      const fileUri2 = vscode.Uri.file('/test/folder/file2.js')
      const fileUris = [fileUri1, fileUri2]

      getSelectedFolderCountStub.resolves({
        folderCount: 1,
        fileUris
      })
      executeMentionFileCommandStub.resolves(true)

      await addFolder(folderUri) // Default is recursive=true

      assert.strictEqual(getSelectedFolderCountStub.calledOnce, true)
      assert.deepStrictEqual(getSelectedFolderCountStub.firstCall.args[0], [folderUri])
      assert.strictEqual(getSelectedFolderCountStub.firstCall.args[1].recursive, true)
      assert.strictEqual(executeMentionFileCommandStub.callCount, 2)
      assert.strictEqual(telemetryTrackStub.calledOnce, true)
      assert.strictEqual(telemetryTrackStub.firstCall.args[0], TELEMETRY_EVENTS.FILES.ADD_FOLDER)
      assert.deepStrictEqual(telemetryTrackStub.firstCall.args[1], {
        fileCount: 2,
        folderCount: 1,
        recursive: true
      })
    })

    test('should add folder to Cody non-recursively when specified', async () => {
      const folderUri = vscode.Uri.file('/test/folder')
      const fileUri1 = vscode.Uri.file('/test/folder/file1.js')
      const fileUris = [fileUri1]

      getSelectedFolderCountStub.resolves({
        folderCount: 1,
        fileUris
      })
      executeMentionFileCommandStub.resolves(true)

      await addFolder(folderUri, false) // Non-recursive

      assert.strictEqual(getSelectedFolderCountStub.calledOnce, true)
      assert.deepStrictEqual(getSelectedFolderCountStub.firstCall.args[0], [folderUri])
      assert.strictEqual(getSelectedFolderCountStub.firstCall.args[1].recursive, false)
      assert.strictEqual(executeMentionFileCommandStub.callCount, 1)
      assert.strictEqual(telemetryTrackStub.calledOnce, true)
      assert.strictEqual(telemetryTrackStub.firstCall.args[0], TELEMETRY_EVENTS.FILES.ADD_FOLDER)
      assert.deepStrictEqual(telemetryTrackStub.firstCall.args[1], {
        fileCount: 1,
        folderCount: 1,
        recursive: false
      })
    })

    test('should handle errors when adding a folder', async () => {
      const folderUri = vscode.Uri.file('/test/folder')
      const testError = new Error('Test error')

      getSelectedFolderCountStub.rejects(testError)

      await addFolder(folderUri)

      assert.strictEqual(showErrorMessageStub.calledOnce, true)
      assert.strictEqual(
        showErrorMessageStub.firstCall.args[0],
        'Failed to add folder to Cody: Test error'
      )
      assert.strictEqual(telemetryTrackStub.called, false)
    })
  })

  suite('addFilesSmart', () => {
    let showInputBoxStub: sinon.SinonStub
    let fsStatStub: sinon.SinonStub
    let createProviderStub: sinon.SinonStub
    let withProgressStub: sinon.SinonStub
    let getWorkspaceFileTreeStub: sinon.SinonStub
    let createCompletionRequestMessagesStub: sinon.SinonStub
    let parseLLMResponseStub: sinon.SinonStub
    let executeMentionFileCommandStub: sinon.SinonStub
    let formatFileTreeStub: sinon.SinonStub
    let showInformationMessageStub: sinon.SinonStub
    let showErrorMessageStub: sinon.SinonStub
    let asRelativePathStub: sinon.SinonStub
    let mockLlmComplete: sinon.SinonStub

    setup(() => {
      showInputBoxStub = sandbox.stub(vscode.window, 'showInputBox')
      fsStatStub = sandbox.stub(vscode.workspace.fs, 'stat')

      // Setup workspace folders
      sandbox.stub(vscode.workspace, 'workspaceFolders').value([
        {
          uri: vscode.Uri.file('/test/workspace'),
          name: 'workspace',
          index: 0
        }
      ])

      // Mock LLM provider
      mockLlmComplete = sandbox.stub().resolves({ text: '["file1.js", "file2.js"]' })
      const mockLlm = {
        complete: mockLlmComplete
      }
      createProviderStub = sandbox.stub(llmModule, 'createProvider').returns(mockLlm as any)

      // Mock progress reporting
      withProgressStub = sandbox.stub(vscode.window, 'withProgress')
      withProgressStub.callsFake(async (options, task) => {
        // Mock progress reporting
        const progress = {
          report: sandbox.stub()
        }
        const token = {
          isCancellationRequested: false
        }
        return task(progress, token)
      })

      // Mock file operations
      getWorkspaceFileTreeStub = sandbox.stub(fileOperations, 'getWorkspaceFileTree')
      createCompletionRequestMessagesStub = sandbox.stub(
        llmUtils,
        'createCompletionRequestMessages'
      )
      parseLLMResponseStub = sandbox.stub(llmUtils, 'parseLLMResponse')

      // Mock Cody operations
      executeMentionFileCommandStub = sandbox.stub(codyCommands, 'executeMentionFileCommand')

      // Mock formatting and UI
      formatFileTreeStub = sandbox.stub(fileOperations, 'formatFileTree')
      showInformationMessageStub = sandbox.stub(vscode.window, 'showInformationMessage')
      showErrorMessageStub = sandbox.stub(vscode.window, 'showErrorMessage')
      asRelativePathStub = sandbox.stub(vscode.workspace, 'asRelativePath')
    })

    test('should add files using AI when prompt is provided', async () => {
      const folderUri = vscode.Uri.file('/test/folder')
      const prompt = 'test files'
      const context = {} as vscode.ExtensionContext

      // Mock user input
      showInputBoxStub.resolves(prompt)

      // Mock file system check
      fsStatStub.resolves({ type: vscode.FileType.Directory })

      // Mock file tree operations
      const mockFileTree = [
        { name: 'file1.js', path: '/test/folder/file1.js', type: 'file' },
        { name: 'file2.js', path: '/test/folder/file2.js', type: 'file' }
      ]
      getWorkspaceFileTreeStub.resolves(mockFileTree)

      // Mock LLM operations
      createCompletionRequestMessagesStub.resolves([{ role: 'user', content: 'test prompt' }])
      parseLLMResponseStub.returns(['/test/folder/file1.js', '/test/folder/file2.js'])

      // Mock Cody operations
      executeMentionFileCommandStub.resolves(true)

      // Mock formatting and UI
      formatFileTreeStub.returns('formatted tree')
      asRelativePathStub.returns('folder')

      await addFilesSmart([folderUri], context)

      // Verify user input was requested
      assert.strictEqual(showInputBoxStub.calledOnce, true)

      // Verify file system was checked
      assert.strictEqual(fsStatStub.calledOnce, true)

      // Verify file tree was fetched
      assert.strictEqual(getWorkspaceFileTreeStub.calledOnce, true)

      // Verify LLM operations
      assert.strictEqual(createCompletionRequestMessagesStub.calledOnce, true)
      assert.strictEqual(mockLlmComplete.calledOnce, true)
      assert.strictEqual(parseLLMResponseStub.calledOnce, true)

      // Verify file operations
      assert.strictEqual(executeMentionFileCommandStub.callCount, 2)

      // Verify UI feedback
      assert.strictEqual(showInformationMessageStub.calledOnce, true)

      // Verify telemetry
      assert.strictEqual(telemetryTrackStub.calledOnce, true)
      assert.strictEqual(
        telemetryTrackStub.firstCall.args[0],
        TELEMETRY_EVENTS.FILES.ADD_SMART_SELECTION
      )
      assert.deepStrictEqual(telemetryTrackStub.firstCall.args[1], {
        fileCount: 2,
        folderCount: 1
      })
    })

    test('should cancel operation when user cancels prompt', async () => {
      const folderUri = vscode.Uri.file('/test/folder')
      const context = {} as vscode.ExtensionContext

      // Mock user canceling the input box
      showInputBoxStub.resolves(undefined)

      await addFilesSmart([folderUri], context)

      // Verify input was requested but no further operations took place
      assert.strictEqual(showInputBoxStub.calledOnce, true)
      assert.strictEqual(createProviderStub.called, false)
      assert.strictEqual(getWorkspaceFileTreeStub.called, false)
      assert.strictEqual(executeMentionFileCommandStub.called, false)
      assert.strictEqual(telemetryTrackStub.called, false)
    })

    test('should handle errors during LLM processing', async () => {
      const folderUri = vscode.Uri.file('/test/folder')
      const prompt = 'test files'
      const context = {} as vscode.ExtensionContext
      const testError = new Error('LLM error')

      // Mock user input
      showInputBoxStub.resolves(prompt)

      // Mock file system check
      fsStatStub.resolves({ type: vscode.FileType.Directory })

      // Force LLM error
      mockLlmComplete.rejects(testError)

      // Use withProgress to execute the task even though it'll error
      withProgressStub.callsFake(async (options, task) => {
        try {
          const progress = { report: sandbox.stub() }
          const token = { isCancellationRequested: false }
          await task(progress, token)
        } catch (error) {
          // Expected to throw
        }
      })

      await addFilesSmart([folderUri], context)

      // Verify error was shown
      assert.strictEqual(showErrorMessageStub.called, true)
      assert.strictEqual(telemetryTrackStub.called, false)
    })

    test('should handle missing workspace or folder', async () => {
      const folderUri = vscode.Uri.file('/test/folder')
      const prompt = 'test files'
      const context = {} as vscode.ExtensionContext

      // Mock user input
      showInputBoxStub.resolves(prompt)

      // Mock workspace folders as empty
      sandbox.stub(vscode.workspace, 'workspaceFolders').value(undefined)

      await addFilesSmart([folderUri], context)

      // Verify error was shown
      assert.strictEqual(showErrorMessageStub.called, true)
      assert.strictEqual(executeMentionFileCommandStub.called, false)
      assert.strictEqual(telemetryTrackStub.called, false)
    })

    test('should handle API configuration errors', async () => {
      const folderUri = vscode.Uri.file('/test/folder')
      const prompt = 'test files'
      const context = {} as vscode.ExtensionContext

      // Mock user input
      showInputBoxStub.resolves(prompt)

      // Mock file system check
      fsStatStub.resolves({ type: vscode.FileType.Directory })

      // Mock missing API configuration
      sandbox.stub(vscode.workspace, 'getConfiguration').returns({
        get: sandbox.stub().returns(undefined)
      } as any)

      // Force provider selection to fail
      const selectProviderStub = sandbox.stub().resolves(false)
      sandbox
        .stub(vscode.commands, 'executeCommand')
        .callsFake((command: string, ...args: any[]) => {
          if (command === 'cody-plus-plus.selectProvider') {
            return selectProviderStub()
          }
          return Promise.resolve()
        })

      await addFilesSmart([folderUri], context)

      // Verify provider selection was attempted but failed
      assert.strictEqual(selectProviderStub.calledOnce, true)
      assert.strictEqual(showInformationMessageStub.called, true)
      assert.strictEqual(executeMentionFileCommandStub.called, false)
      assert.strictEqual(telemetryTrackStub.called, false)
    })

    test('should handle empty LLM response', async () => {
      const folderUri = vscode.Uri.file('/test/folder')
      const prompt = 'test files'
      const context = {} as vscode.ExtensionContext

      // Mock user input
      showInputBoxStub.resolves(prompt)

      // Mock file system check
      fsStatStub.resolves({ type: vscode.FileType.Directory })

      // Mock file tree operations
      const mockFileTree = [
        { name: 'file1.js', path: '/test/folder/file1.js', type: 'file' },
        { name: 'file2.js', path: '/test/folder/file2.js', type: 'file' }
      ]
      getWorkspaceFileTreeStub.resolves(mockFileTree)

      // Mock LLM operations to return empty result
      createCompletionRequestMessagesStub.resolves([{ role: 'user', content: 'test prompt' }])
      mockLlmComplete.resolves({ text: '[]' })
      parseLLMResponseStub.returns([])

      // Mock formatting and UI
      formatFileTreeStub.returns('formatted tree')
      asRelativePathStub.returns('folder')

      await addFilesSmart([folderUri], context)

      // Verify LLM was called
      assert.strictEqual(mockLlmComplete.calledOnce, true)

      // Verify no files were added
      assert.strictEqual(executeMentionFileCommandStub.called, false)

      // Verify telemetry was still tracked
      assert.strictEqual(telemetryTrackStub.calledOnce, true)
      assert.strictEqual(
        telemetryTrackStub.firstCall.args[0],
        TELEMETRY_EVENTS.FILES.ADD_SMART_SELECTION
      )
      assert.deepStrictEqual(telemetryTrackStub.firstCall.args[1], {
        fileCount: 0,
        folderCount: 0
      })
    })
  })
})
