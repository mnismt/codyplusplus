import * as assert from 'assert'
import proxyquire from 'proxyquire'
import * as sinon from 'sinon'
import * as vscode from 'vscode'

// Mock FileType enum
const MockFileType = {
  File: 1,
  Directory: 2,
  SymbolicLink: 64
}

suite('Filesystem Processor Tests', () => {
  let sandbox: sinon.SinonSandbox
  let vscodeWindowStub: sinon.SinonStub
  let vscodeWorkspaceFsStatStub: sinon.SinonStub
  let vscodeWorkspaceFsReadDirectoryStub: sinon.SinonStub
  let validateFileCountStub: sinon.SinonStub
  let getProcessingConfigStub: sinon.SinonStub
  let processorModule: any
  let vscodeMock: any

  setup(() => {
    sandbox = sinon.createSandbox()

    // Stub vscode.window.showWarningMessage
    vscodeWindowStub = sandbox.stub()
    vscodeWindowStub.resolves('Yes')

    // Create stubs for vscode functions
    vscodeWorkspaceFsStatStub = sandbox.stub()
    vscodeWorkspaceFsReadDirectoryStub = sandbox.stub()

    // Stub config functions
    validateFileCountStub = sandbox.stub()
    validateFileCountStub.resolves(true)
    getProcessingConfigStub = sandbox.stub()
    getProcessingConfigStub.returns({
      fileThreshold: 15,
      excludedFileTypes: ['.exe', '.dll'],
      excludedFolders: ['node_modules', '.git'],
      recursive: true,
      progressTitle: 'Processing files'
    })

    // Create a mock vscode object with the required properties
    vscodeMock = {
      window: { showWarningMessage: vscodeWindowStub },
      workspace: {
        fs: {
          stat: vscodeWorkspaceFsStatStub,
          readDirectory: vscodeWorkspaceFsReadDirectoryStub
        }
      },
      FileType: MockFileType,
      Uri: vscode.Uri
    }

    // Load the processor module with stubs
    processorModule = proxyquire.noCallThru().load('../processor', {
      vscode: vscodeMock,
      './config': {
        validateFileCount: validateFileCountStub,
        getProcessingConfig: getProcessingConfigStub
      }
    })
  })

  teardown(() => {
    sandbox.restore()
  })

  test('should return empty array when no files are provided', async () => {
    const result = await processorModule.getSelectedFileUris([])

    assert.deepStrictEqual(result, [])
    assert.strictEqual(vscodeWindowStub.calledOnce, true)
    assert.strictEqual(
      vscodeWindowStub.firstCall.args[0],
      'No files or folders are selected to process.'
    )
  })

  test('should collect files from directories recursively', async () => {
    const rootUri = vscode.Uri.file('/test/workspace')
    const fileUri = vscode.Uri.file('/test/workspace/file.js')
    const excludedFileUri = vscode.Uri.file('/test/workspace/app.exe')
    const dirUri = vscode.Uri.file('/test/workspace/src')
    const subDirUri = vscode.Uri.file('/test/workspace/src/components')
    const fileInSubDirUri = vscode.Uri.file('/test/workspace/src/components/Button.js')
    const excludedDirUri = vscode.Uri.file('/test/workspace/node_modules')

    // Setup stat responses
    vscodeWorkspaceFsStatStub.withArgs(rootUri).resolves({ type: MockFileType.Directory })
    vscodeWorkspaceFsStatStub.withArgs(fileUri).resolves({ type: MockFileType.File })
    vscodeWorkspaceFsStatStub.withArgs(excludedFileUri).resolves({ type: MockFileType.File })
    vscodeWorkspaceFsStatStub.withArgs(dirUri).resolves({ type: MockFileType.Directory })
    vscodeWorkspaceFsStatStub.withArgs(subDirUri).resolves({ type: MockFileType.Directory })
    vscodeWorkspaceFsStatStub.withArgs(fileInSubDirUri).resolves({ type: MockFileType.File })
    vscodeWorkspaceFsStatStub.withArgs(excludedDirUri).resolves({ type: MockFileType.Directory })

    // Setup readDirectory responses
    vscodeWorkspaceFsReadDirectoryStub.withArgs(rootUri).resolves([
      ['file.js', MockFileType.File],
      ['app.exe', MockFileType.File],
      ['src', MockFileType.Directory],
      ['node_modules', MockFileType.Directory]
    ])
    vscodeWorkspaceFsReadDirectoryStub
      .withArgs(dirUri)
      .resolves([['components', MockFileType.Directory]])
    vscodeWorkspaceFsReadDirectoryStub
      .withArgs(subDirUri)
      .resolves([['Button.js', MockFileType.File]])
    vscodeWorkspaceFsReadDirectoryStub
      .withArgs(excludedDirUri)
      .resolves([['package.json', MockFileType.File]])

    const result = await processorModule.getSelectedFileUris([rootUri])

    // Should include file.js and src/components/Button.js but not app.exe or files in node_modules
    assert.strictEqual(result.length, 2)
    assert.deepStrictEqual(result[0].fsPath, fileUri.fsPath)
    assert.deepStrictEqual(result[1].fsPath, fileInSubDirUri.fsPath)

    // Verify validateFileCount was called
    assert.strictEqual(validateFileCountStub.calledOnce, true)
    assert.strictEqual(validateFileCountStub.firstCall.args[0], 2) // 2 files
    assert.strictEqual(validateFileCountStub.firstCall.args[1], 15) // threshold
  })

  test('should use non-recursive mode when specified', async () => {
    // Override config to set recursive: false
    getProcessingConfigStub.returns({
      fileThreshold: 15,
      excludedFileTypes: ['.exe', '.dll'],
      excludedFolders: ['node_modules', '.git'],
      recursive: false,
      progressTitle: 'Processing files'
    })

    const rootUri = vscode.Uri.file('/test/workspace')
    const fileUri = vscode.Uri.file('/test/workspace/file.js')
    const dirUri = vscode.Uri.file('/test/workspace/src')

    // Setup stat responses
    vscodeWorkspaceFsStatStub.withArgs(rootUri).resolves({ type: MockFileType.Directory })
    vscodeWorkspaceFsStatStub.withArgs(fileUri).resolves({ type: MockFileType.File })
    vscodeWorkspaceFsStatStub.withArgs(dirUri).resolves({ type: MockFileType.Directory })

    // Setup readDirectory responses
    vscodeWorkspaceFsReadDirectoryStub.withArgs(rootUri).resolves([
      ['file.js', MockFileType.File],
      ['src', MockFileType.Directory]
    ])

    const result = await processorModule.getSelectedFileUris([rootUri])

    // Should only include file.js since we're in non-recursive mode
    assert.strictEqual(result.length, 1)
    assert.deepStrictEqual(result[0].fsPath, fileUri.fsPath)
  })

  test('should respect excluded file types and folders', async () => {
    const rootUri = vscode.Uri.file('/test/workspace')
    const fileUri = vscode.Uri.file('/test/workspace/file.js')
    const excludedFileUri = vscode.Uri.file('/test/workspace/app.exe')
    const excludedFolderUri = vscode.Uri.file('/test/workspace/node_modules')

    // Setup stat responses
    vscodeWorkspaceFsStatStub.withArgs(rootUri).resolves({ type: MockFileType.Directory })

    // Setup readDirectory responses
    vscodeWorkspaceFsReadDirectoryStub.withArgs(rootUri).resolves([
      ['file.js', MockFileType.File],
      ['app.exe', MockFileType.File],
      ['node_modules', MockFileType.Directory]
    ])

    const result = await processorModule.getSelectedFileUris([rootUri])

    // Should only include file.js
    assert.strictEqual(result.length, 1)
    assert.deepStrictEqual(result[0].fsPath, fileUri.fsPath)
  })

  test('should return empty array when validateFileCount returns false', async () => {
    validateFileCountStub.resolves(false)

    const fileUri = vscode.Uri.file('/test/workspace/file.js')
    vscodeWorkspaceFsStatStub.withArgs(fileUri).resolves({ type: MockFileType.File })

    const result = await processorModule.getSelectedFileUris([fileUri])

    // Should return empty array
    assert.deepStrictEqual(result, [])
    assert.strictEqual(validateFileCountStub.calledOnce, true)
  })
})
