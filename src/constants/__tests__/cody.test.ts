import * as assert from 'assert'
import * as sinon from 'sinon'
import * as vscode from 'vscode'
import { CODY_COMMAND, CODY_CUSTOM_COMMANDS_FILE, getCodyJsonPath } from '../cody'

suite('Cody Constants Tests', () => {
  let sandbox: sinon.SinonSandbox

  setup(() => {
    sandbox = sinon.createSandbox()
  })

  teardown(() => {
    sandbox.restore()
  })

  test('should have correct command constants', () => {
    assert.strictEqual(CODY_COMMAND.MENTION.FILE, 'cody.mention.file')
    assert.strictEqual(CODY_COMMAND.COMMAND.CUSTOM, 'cody.command.custom')
  })

  test('should have correct custom commands file name', () => {
    assert.strictEqual(CODY_CUSTOM_COMMANDS_FILE, 'cody.json')
  })

  test('should return correct cody.json path when workspace exists', () => {
    const mockWorkspaceFolder = { uri: { fsPath: '/test/path' } }
    sandbox.stub(vscode.workspace, 'workspaceFolders').value([mockWorkspaceFolder])

    const result = getCodyJsonPath()
    assert.strictEqual(result, '/test/path/.vscode/cody.json')
  })

  test('should return undefined when no workspace exists', () => {
    sandbox.stub(vscode.workspace, 'workspaceFolders').value(undefined)

    const result = getCodyJsonPath()
    assert.strictEqual(result, undefined)
  })
})
