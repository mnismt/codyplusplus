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
import * as workspaceConfigUtils from '../../utils/workspace-config'
import { addFile, addFilesSmart, addFolder, addSelection } from '../add-to-cody'
import * as providerCommands from '../provider-commands'

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
    let createProviderStub: sinon.SinonStub
    let withProgressStub: sinon.SinonStub
    let getWorkspaceFileTreeStub: sinon.SinonStub
    let createCompletionRequestMessagesStub: sinon.SinonStub
    let parseLLMResponseStub: sinon.SinonStub
    let executeMentionFileCommandStub: sinon.SinonStub
    let formatFileTreeStub: sinon.SinonStub
    let showInformationMessageStub: sinon.SinonStub
    let showErrorMessageStub: sinon.SinonStub
    let showWarningMessageStub: sinon.SinonStub
    let asRelativePathStub: sinon.SinonStub
    let mockLlmComplete: sinon.SinonStub
    let getProviderConfigStub: sinon.SinonStub
    let selectProviderStub: sinon.SinonStub
    let executeCommandStub: sinon.SinonStub
    let selectProviderDirectStub: sinon.SinonStub

    // Declare fsStatStub here but initialize it in setup
    let fsStatStub: sinon.SinonStub

    setup(() => {
      showInputBoxStub = sandbox.stub(vscode.window, 'showInputBox')
      getProviderConfigStub = sandbox.stub(workspaceConfigUtils, 'getProviderConfig')

      // Create a mock fs object with a stubbed stat method
      fsStatStub = sandbox.stub()
      const mockFs = {
        stat: fsStatStub
      }

      // Stub vscode.workspace to return our mock fs
      // Note: This might be too broad if other fs methods are needed by the tests
      // We might need to add more methods to mockFs if required.
      sandbox.stub(vscode.workspace, 'fs').value(mockFs)

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
      showWarningMessageStub = sandbox.stub(vscode.window, 'showWarningMessage')
      asRelativePathStub = sandbox.stub(vscode.workspace, 'asRelativePath')

      // Stub executeCommand for selectProvider
      selectProviderStub = sandbox.stub().resolves(true)
      executeCommandStub = sandbox.stub(vscode.commands, 'executeCommand')
      executeCommandStub.callsFake((command: string, ...args: any[]) => {
        if (command === 'cody-plus-plus.selectProvider') {
          return selectProviderStub()
        }
        return Promise.resolve()
      })

      // Stub the directly imported selectProvider function
      selectProviderDirectStub = sandbox.stub(providerCommands, 'selectProvider').resolves(true)
    })

    test('should add files using AI when prompt and provider are provided', async () => {
      const folderUri = vscode.Uri.file('/test/folder')
      const prompt = 'test files'
      const context = {} as vscode.ExtensionContext
      const mockProviderConfig = { provider: 'openai', apiKey: 'key', model: 'gpt-4' }

      // Mock user input
      showInputBoxStub.resolves(prompt)
      // Mock existing provider config
      getProviderConfigStub.resolves(mockProviderConfig)
      // Mock file system check
      fsStatStub.resolves({ type: vscode.FileType.Directory } as vscode.FileStat)

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
      // Verify provider config was checked
      assert.strictEqual(getProviderConfigStub.calledOnce, true)
      // Verify selectProvider was NOT called (neither command nor direct)
      assert.strictEqual(executeCommandStub.withArgs('cody-plus-plus.selectProvider').called, false)
      assert.strictEqual(selectProviderDirectStub.called, false)
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

    test('should prompt for provider setup if none exists, then proceed', async () => {
      const folderUri = vscode.Uri.file('/test/folder')
      const prompt = 'test files'
      const context = {} as vscode.ExtensionContext
      const mockProviderConfig = { provider: 'openai', apiKey: 'key', model: 'gpt-4' }

      // Mock user input
      showInputBoxStub.resolves(prompt)
      // Mock NO initial provider config, then mock it after selection
      getProviderConfigStub.onFirstCall().resolves(undefined)
      getProviderConfigStub.onSecondCall().resolves(mockProviderConfig)
      // Mock successful provider selection
      selectProviderStub.resolves(true)
      // Mock file system check
      fsStatStub.resolves({ type: vscode.FileType.Directory } as vscode.FileStat)

      // Mock downstream operations (file tree, LLM, etc.)
      const mockFileTree = [
        { name: 'file1.js', path: '/test/folder/file1.js', type: 'file' },
        { name: 'file2.js', path: '/test/folder/file2.js', type: 'file' }
      ]
      getWorkspaceFileTreeStub.resolves(mockFileTree)
      createCompletionRequestMessagesStub.resolves([{ role: 'user', content: 'test prompt' }])
      parseLLMResponseStub.returns(['/test/folder/file1.js']) // Simulate 1 file selected
      executeMentionFileCommandStub.resolves(true)
      formatFileTreeStub.returns('formatted tree')
      asRelativePathStub.returns('folder')

      await addFilesSmart([folderUri], context)

      // Verify user input was requested
      assert.strictEqual(showInputBoxStub.calledOnce, true)
      // Verify provider config was checked twice
      assert.strictEqual(getProviderConfigStub.callCount, 2)
      // Verify selectProvider was called (direct import path)
      assert.strictEqual(selectProviderDirectStub.calledOnce, true)
      // Verify selectProvider command was NOT called
      assert.strictEqual(executeCommandStub.withArgs('cody-plus-plus.selectProvider').called, false)
      // Verify downstream operations happened
      assert.strictEqual(fsStatStub.calledOnce, true)
      assert.strictEqual(getWorkspaceFileTreeStub.calledOnce, true)
      assert.strictEqual(mockLlmComplete.calledOnce, true)
      assert.strictEqual(executeMentionFileCommandStub.callCount, 1) // Only 1 file added
      assert.strictEqual(telemetryTrackStub.calledOnce, true)
      assert.deepStrictEqual(telemetryTrackStub.firstCall.args[1], {
        fileCount: 1,
        folderCount: 1 // Based on the directory of the selected file
      })
    })

    test('should cancel if provider setup is cancelled or fails', async () => {
      const folderUri = vscode.Uri.file('/test/folder')
      const prompt = 'test files'
      const context = {} as vscode.ExtensionContext

      // Mock user input
      showInputBoxStub.resolves(prompt)
      // Mock NO initial provider config
      getProviderConfigStub.onFirstCall().resolves(undefined)
      // Mock FAILED/CANCELLED provider selection (direct import path)
      selectProviderDirectStub.resolves(false)
      // Mock provider config still undefined after failed attempt
      getProviderConfigStub.onSecondCall().resolves(undefined)

      await addFilesSmart([folderUri], context)
      // Verify provider config checked
      assert.strictEqual(getProviderConfigStub.callCount, 1)
      assert.strictEqual(getProviderConfigStub.calledOnce, true) // Only first check happens
      // Verify selectProvider was called (direct import path)
      assert.strictEqual(selectProviderDirectStub.calledOnce, true)
      // Verify warning message shown
      assert.strictEqual(
        showWarningMessageStub.calledOnceWith(
          'Provider setup cancelled or failed. Smart Add cannot proceed.'
        ),
        true
      )
      // Verify NO downstream operations happened
      assert.strictEqual(fsStatStub.called, false)
      assert.strictEqual(getWorkspaceFileTreeStub.called, false)
      assert.strictEqual(mockLlmComplete.called, false)
      assert.strictEqual(telemetryTrackStub.called, false)
    })

    test('should use workspace root if multiple folderUris or a file URI is provided', async () => {
      const fileUri = vscode.Uri.file('/test/workspace/file.js')
      const folderUri = vscode.Uri.file('/test/workspace/folder')
      const folderUris = [fileUri, folderUri] // Mixed URIs
      const prompt = 'test files'
      const context = {} as vscode.ExtensionContext
      const mockProviderConfig = { provider: 'openai', apiKey: 'key', model: 'gpt-4' }
      const workspaceUri = vscode.workspace.workspaceFolders![0].uri

      showInputBoxStub.resolves(prompt)
      getProviderConfigStub.resolves(mockProviderConfig)
      // fs.stat will NOT be called because folderUris.length > 1
      fsStatStub.resolves({ type: vscode.FileType.Directory } as vscode.FileStat) // Setup just in case, but shouldn't be called

      const mockFileTree = [
        { name: 'file1.js', path: '/test/workspace/file1.js', type: 'file' },
        { name: 'sub/file2.js', path: '/test/workspace/sub/file2.js', type: 'file' }
      ]
      // Expect getWorkspaceFileTree to be called with the workspace root
      getWorkspaceFileTreeStub.withArgs(workspaceUri).resolves(mockFileTree)

      createCompletionRequestMessagesStub.resolves([{ role: 'user', content: 'test prompt' }])
      // Simulate LLM selecting files from different subdirectories
      parseLLMResponseStub.returns(['/test/workspace/file1.js', '/test/workspace/sub/file2.js'])
      executeMentionFileCommandStub.resolves(true)
      formatFileTreeStub.returns('formatted tree')
      asRelativePathStub.withArgs(workspaceUri).returns('workspace') // Expect relative path of workspace root

      await addFilesSmart(folderUris, context)

      assert.strictEqual(fsStatStub.called, false, 'fs.stat should not be called for multiple URIs')
      assert.strictEqual(
        getWorkspaceFileTreeStub.calledOnceWith(workspaceUri),
        true,
        'Should scan workspace root'
      )
      assert.strictEqual(
        createCompletionRequestMessagesStub.calledOnceWith(prompt, workspaceUri),
        true,
        'Should use workspace URI for context message'
      )
      assert.strictEqual(executeMentionFileCommandStub.callCount, 2)
      assert.strictEqual(asRelativePathStub.calledOnceWith(workspaceUri), true) // Verify root used for message
      assert.strictEqual(telemetryTrackStub.calledOnce, true)
      assert.deepStrictEqual(telemetryTrackStub.firstCall.args[1], {
        fileCount: 2,
        folderCount: 2 // Folders are /test/workspace and /test/workspace/sub
      })
    })

    test('should cancel operation when user cancels prompt', async () => {
      const folderUri = vscode.Uri.file('/test/folder')
      const context = {} as vscode.ExtensionContext

      // Mock user canceling the input box
      showInputBoxStub.resolves(undefined)

      await addFilesSmart([folderUri], context)

      // Verify input was requested but no further operations took place
      assert.strictEqual(getProviderConfigStub.called, true)
      assert.strictEqual(selectProviderDirectStub.called, true)
      assert.strictEqual(executeCommandStub.withArgs('cody-plus-plus.selectProvider').called, false) // Command should not be called
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
      const mockProviderConfig = { provider: 'openai', apiKey: 'key', model: 'gpt-4' }

      // Mock user input
      showInputBoxStub.resolves(prompt)
      // Mock provider config
      getProviderConfigStub.resolves(mockProviderConfig)
      // Mock file system check
      fsStatStub.resolves({ type: vscode.FileType.Directory } as vscode.FileStat)
      // Mock file tree
      getWorkspaceFileTreeStub.resolves([{ name: 'f.js', path: '/test/folder/f.js', type: 'file' }])
      createCompletionRequestMessagesStub.resolves([{ role: 'user', content: 'msg' }])

      // Mock LLM operations to return empty result
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
      assert.strictEqual(
        showErrorMessageStub.firstCall.args[0],
        'Failed to add files smart to Cody: LLM error'
      )
      assert.strictEqual(telemetryTrackStub.called, false)
    })

    test('should handle missing workspace', async () => {
      const folderUri = vscode.Uri.file('/test/folder')
      const prompt = 'test files'
      const context = {} as vscode.ExtensionContext
      const mockProviderConfig = { provider: 'openai', apiKey: 'key', model: 'gpt-4' }

      // Mock user input
      showInputBoxStub.resolves(prompt)
      // Mock provider config
      getProviderConfigStub.resolves(mockProviderConfig)

      // Mock workspace folders as empty
      sandbox.stub(vscode.workspace, 'workspaceFolders').value(undefined)
      // Mock fs.stat to return FileType.File when workspace is missing
      // This forces the rootUri ternary to check workspaceFolders, resulting in undefined rootUri
      fsStatStub.resolves({ type: vscode.FileType.File } as vscode.FileStat)

      await addFilesSmart([folderUri], context)

      // Verify error was shown because workspace is needed
      assert.strictEqual(
        showErrorMessageStub.calledOnceWith('No workspace or folder selected.'),
        true
      )
      assert.strictEqual(fsStatStub.calledOnce, true) // fs.stat is called to check folderUri[0]
      assert.strictEqual(executeMentionFileCommandStub.called, false)
      assert.strictEqual(telemetryTrackStub.called, false)
    })

    test('should handle empty LLM response', async () => {
      const folderUri = vscode.Uri.file('/test/folder')
      const prompt = 'test files'
      const context = {} as vscode.ExtensionContext
      const mockProviderConfig = { provider: 'openai', apiKey: 'key', model: 'gpt-4' }

      // Mock user input
      showInputBoxStub.resolves(prompt)
      // Mock provider config
      getProviderConfigStub.resolves(mockProviderConfig)
      // Mock file system check
      fsStatStub.resolves({ type: vscode.FileType.Directory } as vscode.FileStat)

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
      // Verify telemetry was still tracked with 0 files/folders
      assert.strictEqual(telemetryTrackStub.calledOnce, true)
      assert.strictEqual(
        telemetryTrackStub.firstCall.args[0],
        TELEMETRY_EVENTS.FILES.ADD_SMART_SELECTION
      )
      assert.deepStrictEqual(telemetryTrackStub.firstCall.args[1], {
        fileCount: 0,
        folderCount: 0 // Since no files were selected, folder count is 0
      })
      // Verify user feedback indicates no files added
      assert.strictEqual(showInformationMessageStub.calledOnce, true)
      assert.ok(
        showInformationMessageStub.firstCall.args[0].includes('0/2 files successfully added')
      )
    })
  })
})
