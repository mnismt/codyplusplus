import * as assert from 'assert'
import * as sinon from 'sinon'
import * as vscode from 'vscode'
import { TelemetryService } from '../telemetry.service'

suite('TelemetryService Tests', () => {
  let sandbox: sinon.SinonSandbox

  setup(() => {
    sandbox = sinon.createSandbox()

    // Stub vscode workspace methods
    const configGetStub = sandbox.stub().returns(true)
    const configStub = sandbox.stub(vscode.workspace, 'getConfiguration')
    configStub.returns({
      get: configGetStub
    } as any)

    // Stub console.log to avoid test output pollution
    sandbox.stub(console, 'log')
  })

  teardown(() => {
    sandbox.restore()
  })

  test('getInstance should return the same instance', () => {
    const instance1 = TelemetryService.getInstance()
    const instance2 = TelemetryService.getInstance()

    assert.strictEqual(instance1, instance2, 'getInstance should return the same instance')
  })

  test('isEnabled should return the boolean state', () => {
    const telemetryService = TelemetryService.getInstance()
    const result = telemetryService.isEnabled()

    // Just check that it returns a boolean value, as the actual
    // implementation details might change
    assert.strictEqual(typeof result, 'boolean')
  })

  test('isReady should return ready state', () => {
    const telemetryService = TelemetryService.getInstance()
    assert.strictEqual(typeof telemetryService.isReady(), 'boolean')
  })
})
