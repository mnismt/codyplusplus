import * as assert from 'assert'
import * as fs from 'fs'
import * as sinon from 'sinon'
import * as vscode from 'vscode'
import * as codyConstants from '../../constants/cody'
import { CustomCommandService } from '../customCommand.service'
import { TelemetryService } from '../telemetry.service'

suite('CustomCommandService Tests', () => {
  let sandbox: sinon.SinonSandbox

  setup(() => {
    sandbox = sinon.createSandbox()

    // Stub getCodyJsonPath
    sandbox.stub(codyConstants, 'getCodyJsonPath').returns('/fake/path/cody.json')

    // Directly stub the fs.promises methods we use
    sandbox.stub(fs.promises, 'readFile').resolves('{}')
    sandbox.stub(fs.promises, 'writeFile').resolves()

    // Stub vscode.workspace.createFileSystemWatcher
    const mockFileWatcher = {
      onDidChange: sandbox.stub().returns({ dispose: () => {} }),
      onDidCreate: sandbox.stub().returns({ dispose: () => {} }),
      onDidDelete: sandbox.stub().returns({ dispose: () => {} }),
      dispose: sandbox.stub()
    }
    sandbox.stub(vscode.workspace, 'createFileSystemWatcher').returns(mockFileWatcher as any)

    // Stub telemetry service
    const telemetryInstance = {
      trackEvent: sandbox.stub(),
      isEnabled: () => true,
      isReady: () => true
    }
    sandbox.stub(TelemetryService, 'getInstance').returns(telemetryInstance as any)
  })

  teardown(() => {
    sandbox.restore()
  })

  test('getInstance should return the same instance', () => {
    const instance1 = CustomCommandService.getInstance()
    const instance2 = CustomCommandService.getInstance()

    assert.strictEqual(instance1, instance2, 'getInstance should return the same instance')
  })

  test('getCommands should return commands object', () => {
    const service = CustomCommandService.getInstance()
    const commands = service.getCommands()

    assert.strictEqual(typeof commands, 'object')
  })
})
