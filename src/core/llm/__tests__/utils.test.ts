import * as assert from 'assert'
import * as sinon from 'sinon'
import * as vscode from 'vscode'
import { FEW_SHOT_EXAMPLES, SYSTEM_PROMPT } from '../../../constants/llm'
import * as fileOperations from '../../filesystem/operations'
import { createCompletionRequestMessages, parseLLMResponse } from '../utils'

// Define FileMetadata interface to match what's expected by filesystem operations
interface FileMetadata {
  name: string
  path: string
  isDirectory: boolean
  type: string
}

suite('LLM Utils', () => {
  let sandbox: sinon.SinonSandbox

  setup(() => {
    sandbox = sinon.createSandbox()
  })

  teardown(() => {
    sandbox.restore()
  })

  suite('createCompletionRequestMessages', () => {
    test('should create messages with correct format and content', async () => {
      const mockRootUri = { fsPath: '/test/workspace' } as vscode.Uri

      // Mock the filesystem operations without specific type dependencies
      const mockFileTree = [
        {
          name: 'file1.ts',
          path: '/test/workspace/file1.ts',
          isDirectory: false,
          type: 'file'
        },
        {
          name: 'folder1',
          path: '/test/workspace/folder1',
          isDirectory: true,
          type: 'directory'
        }
      ]

      const mockFormattedTree = '├── file1.ts\n└── folder1/'

      // Stub the filesystem operations with any type to avoid type conflicts
      const getWorkspaceFileTreeStub = sandbox
        .stub(fileOperations, 'getWorkspaceFileTree')
        .resolves(mockFileTree as any)
      const formatFileTreeStub = sandbox
        .stub(fileOperations, 'formatFileTree')
        .returns(mockFormattedTree)

      const userPrompt = 'Find all typescript files'
      const result = await createCompletionRequestMessages(userPrompt, mockRootUri)

      // Verify the filesystem operations were called correctly
      sinon.assert.calledOnce(getWorkspaceFileTreeStub)
      sinon.assert.calledWith(getWorkspaceFileTreeStub, mockRootUri)
      sinon.assert.calledOnce(formatFileTreeStub)
      sinon.assert.calledWith(formatFileTreeStub, mockRootUri.fsPath, mockFileTree as any)

      // Check the result messages
      assert.strictEqual(result.length, FEW_SHOT_EXAMPLES.length + 2) // system + examples + user
      assert.strictEqual(result[0].role, 'system')
      assert.strictEqual(result[0].content, SYSTEM_PROMPT)

      // The last message should be the user message
      const userMessage = result[result.length - 1]
      assert.strictEqual(userMessage.role, 'user')
      assert.ok(userMessage.content.includes('<file-tree>'))
      assert.ok(userMessage.content.includes(mockRootUri.fsPath))
      assert.ok(userMessage.content.includes(mockFormattedTree))
      assert.ok(userMessage.content.includes(`User request: ${userPrompt}`))
    })
  })

  suite('parseLLMResponse', () => {
    test('should correctly parse valid JSON array response', () => {
      const response = '["file1.ts", "src/file2.ts"]'
      const result = parseLLMResponse(response)

      assert.deepStrictEqual(result, ['file1.ts', 'src/file2.ts'])
    })

    test('should correctly parse response with files property', () => {
      const response = '{"files": ["file1.ts", "src/file2.ts"]}'
      const result = parseLLMResponse(response)

      assert.deepStrictEqual(result, ['file1.ts', 'src/file2.ts'])
    })

    test('should return empty array for empty response', () => {
      const result = parseLLMResponse('')
      assert.deepStrictEqual(result, [])
    })

    test('should return empty array for response not matching expected format', () => {
      const response = '{"notFiles": ["file1.ts"]}'
      const result = parseLLMResponse(response)

      assert.deepStrictEqual(result, [])
    })
  })
})
