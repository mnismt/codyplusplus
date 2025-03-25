import * as assert from 'assert'
import * as path from 'path'
import proxyquire from 'proxyquire'
import * as sinon from 'sinon'
import * as vscode from 'vscode'
import { FileMetadata } from '../operations'

// Mock FileType enum
const MockFileType = {
  File: 1,
  Directory: 2,
  SymbolicLink: 64
}

suite('Filesystem Operations Tests', () => {
  let sandbox: sinon.SinonSandbox
  let fsReadFileStub: sinon.SinonStub
  let vscodeWorkspaceFsReadDirectoryStub: sinon.SinonStub
  let operationsModule: any
  let vscodeMock: any
  let ignoreModule: any

  setup(() => {
    sandbox = sinon.createSandbox()

    // Create stubs
    fsReadFileStub = sandbox.stub()
    fsReadFileStub.resolves('*.log\nnode_modules\nbuild/\ndist/')

    // Create VS Code read directory stub
    vscodeWorkspaceFsReadDirectoryStub = sandbox.stub()

    // Create a mock vscode object
    vscodeMock = {
      workspace: {
        fs: {
          readDirectory: vscodeWorkspaceFsReadDirectoryStub
        },
        workspaceFolders: [{ uri: vscode.Uri.file('/test/workspace') }]
      },
      FileType: MockFileType,
      Uri: vscode.Uri
    }
  })

  teardown(() => {
    sandbox.restore()
  })

  suite('getGitignore', () => {
    test('should load and cache gitignore file from workspace root', async () => {
      // Create a fresh module instance for each test
      const operationsModule = proxyquire.noCallThru().load('../operations', {
        'fs/promises': { readFile: fsReadFileStub },
        vscode: vscodeMock
      })

      const rootPath = '/test/workspace'

      const ig = await operationsModule.getGitignore(rootPath)

      // Check that readFile was called with the expected path
      assert.strictEqual(fsReadFileStub.calledOnce, true)
      assert.strictEqual(fsReadFileStub.firstCall.args[0], path.join(rootPath, '.gitignore'))

      // Test that the ignore instance was created
      assert.strictEqual(typeof ig.ignores, 'function')

      // Test that it correctly handles ignores
      assert.strictEqual(ig.ignores('test.log'), true)
      assert.strictEqual(ig.ignores('node_modules/package.json'), true)
      assert.strictEqual(ig.ignores('build/output.js'), true)
      assert.strictEqual(ig.ignores('src/app.js'), false)
    })

    test('should reuse cached gitignore for same workspace', async () => {
      // Create a fresh module instance for this test
      const testOperationsModule = proxyquire.noCallThru().load('../operations', {
        'fs/promises': { readFile: fsReadFileStub },
        vscode: vscodeMock
      })

      fsReadFileStub.reset()
      fsReadFileStub.resolves('*.log\nnode_modules\nbuild/\ndist/')

      const rootPath = '/test/workspace'

      const ig1 = await testOperationsModule.getGitignore(rootPath)
      const ig2 = await testOperationsModule.getGitignore(rootPath)

      // Check that readFile was called only once
      assert.strictEqual(fsReadFileStub.calledOnce, true)

      // Test that the same instance was returned
      assert.strictEqual(ig1, ig2)
    })
  })

  suite('formatFileTree', () => {
    test('should format a simple file tree correctly', () => {
      // Create a fresh module instance for this test
      const operationsModule = proxyquire.noCallThru().load('../operations', {
        'fs/promises': { readFile: fsReadFileStub },
        vscode: vscodeMock
      })

      const rootFolder = '/test/workspace'
      const files: FileMetadata[] = [
        { path: '/test/workspace/file1.js', type: 'file', name: 'file1.js' },
        { path: '/test/workspace/file2.js', type: 'file', name: 'file2.js' },
        { path: '/test/workspace/subfolder', type: 'directory', name: 'subfolder' },
        { path: '/test/workspace/subfolder/file3.js', type: 'file', name: 'file3.js' }
      ]

      const result = operationsModule.formatFileTree(rootFolder, files)

      // Instead of comparing the exact string, check for the presence of expected elements
      assert.ok(result.includes('workspace'))
      assert.ok(result.includes('file1.js'))
      assert.ok(result.includes('file2.js'))
      assert.ok(result.includes('subfolder'))
      assert.ok(result.includes('file3.js'))
    })

    test('should mark selected files correctly', () => {
      // Create a fresh module instance for this test
      const operationsModule = proxyquire.noCallThru().load('../operations', {
        'fs/promises': { readFile: fsReadFileStub },
        vscode: vscodeMock
      })

      const rootFolder = '/test/workspace'
      const files: FileMetadata[] = [
        { path: '/test/workspace/file1.js', type: 'file', name: 'file1.js' },
        { path: '/test/workspace/file2.js', type: 'file', name: 'file2.js' }
      ]
      const selectedFiles = ['/test/workspace/file1.js']

      const result = operationsModule.formatFileTree(rootFolder, files, selectedFiles)

      // Verify the formatted tree with selected file markers
      assert.ok(result.includes('workspace'))
      assert.ok(result.includes('✅ file1.js'))
      assert.ok(result.includes('❌ file2.js'))
    })

    test('should simplify tree display when too many files', () => {
      // Create a fresh module instance for this test
      const operationsModule = proxyquire.noCallThru().load('../operations', {
        'fs/promises': { readFile: fsReadFileStub },
        vscode: vscodeMock
      })

      const rootFolder = '/test/workspace'
      // Create more files than maxDisplayLength
      const files: FileMetadata[] = Array(25)
        .fill(null)
        .map((_, i) => ({
          path: `/test/workspace/file${i}.js`,
          type: 'file',
          name: `file${i}.js`
        }))

      // Add some nested files
      files.push(
        { path: '/test/workspace/src/components/Button.js', type: 'file', name: 'Button.js' },
        { path: '/test/workspace/src/utils/helpers.js', type: 'file', name: 'helpers.js' }
      )

      const selectedFiles = ['/test/workspace/file1.js', '/test/workspace/src/components/Button.js']

      const result = operationsModule.formatFileTree(rootFolder, files, selectedFiles, 20)

      // Verify simplified tree with selected items
      assert.ok(result.includes('workspace'))
      assert.ok(result.includes('file1.js ✅'))
      assert.ok(result.includes('components/Button.js ✅'))
      assert.ok(result.includes('└── ...'))
    })
  })

  suite('getWorkspaceFileTree', () => {
    test('should get file tree from workspace', async () => {
      // Create a fresh module instance for this test
      const operationsModule = proxyquire.noCallThru().load('../operations', {
        'fs/promises': { readFile: fsReadFileStub },
        vscode: vscodeMock
      })

      const rootUri = vscode.Uri.file('/test/workspace')

      // Mock the readDirectory implementation directly
      // to handle the call pattern in the module
      vscodeWorkspaceFsReadDirectoryStub.callsFake(async uri => {
        const uriPath = uri.fsPath

        if (uriPath === rootUri.fsPath) {
          return [
            ['file1.js', MockFileType.File],
            ['file2.js', MockFileType.File],
            ['subfolder', MockFileType.Directory]
          ]
        } else if (uriPath === path.join(rootUri.fsPath, 'subfolder')) {
          return [['file3.js', MockFileType.File]]
        }

        return []
      })

      const result = await operationsModule.getWorkspaceFileTree(rootUri)

      // Verify the file tree
      assert.strictEqual(result.length, 4)

      // Check first level files
      assert.deepStrictEqual(result[0], {
        path: path.join('/test/workspace', 'file1.js'),
        type: 'file',
        name: 'file1.js'
      })

      assert.deepStrictEqual(result[1], {
        path: path.join('/test/workspace', 'file2.js'),
        type: 'file',
        name: 'file2.js'
      })

      // Check directory entry
      assert.deepStrictEqual(result[2], {
        path: path.join('/test/workspace', 'subfolder'),
        type: 'directory',
        name: 'subfolder'
      })

      // Check subfolder file
      assert.deepStrictEqual(result[3], {
        path: path.join('/test/workspace', 'subfolder', 'file3.js'),
        type: 'file',
        name: 'file3.js'
      })
    })
  })
})
