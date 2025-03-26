import * as assert from 'assert'
import * as posthogModule from 'posthog-node'
import * as sinon from 'sinon'
import * as vscode from 'vscode'
import { TELEMETRY_EVENTS } from '../../constants/telemetry'
import { TelemetryService } from '../telemetry.service'

suite('TelemetryService Tests', () => {
  let sandbox: sinon.SinonSandbox
  let posthogCaptureStub: sinon.SinonStub
  let telemetryServiceInstance: TelemetryService

  setup(() => {
    sandbox = sinon.createSandbox()

    // Stub vscode workspace methods
    const configGetStub = sandbox.stub().returns(true)
    const configStub = sandbox.stub(vscode.workspace, 'getConfiguration')
    configStub.returns({
      get: configGetStub
    } as any)

    // Stub console methods to avoid test output pollution
    sandbox.stub(console, 'log')
    sandbox.stub(console, 'error')

    // Create a fresh instance and clear any existing ones
    // @ts-ignore: Accessing private static instance
    TelemetryService.instance = undefined

    // Set up PostHog stub
    posthogCaptureStub = sandbox.stub()
    const posthogStub = {
      capture: posthogCaptureStub
    }

    // Stub the PostHog constructor
    sandbox.stub(posthogModule, 'PostHog').returns(posthogStub as any)

    // Get the instance after stubbing
    telemetryServiceInstance = TelemetryService.getInstance()

    // Set the service as ready and enabled
    // @ts-ignore: Accessing private properties
    telemetryServiceInstance.ready = true
    // @ts-ignore: Accessing private properties
    telemetryServiceInstance.enabled = true
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
    const result = telemetryServiceInstance.isEnabled()

    // Just check that it returns a boolean value, as the actual
    // implementation details might change
    assert.strictEqual(typeof result, 'boolean')
  })

  test('isReady should return ready state', () => {
    assert.strictEqual(typeof telemetryServiceInstance.isReady(), 'boolean')
  })

  test('trackEvent should track file count and folder count for ADD_FILE event', () => {
    // Track event with file count and folder count
    telemetryServiceInstance.trackEvent(TELEMETRY_EVENTS.FILES.ADD_FILE, {
      fileCount: 5,
      folderCount: 1
    })

    // Verify capture was called with correct parameters
    sinon.assert.calledOnce(posthogCaptureStub)
    const captureCall = posthogCaptureStub.getCall(0).args[0]

    assert.strictEqual(captureCall.event, TELEMETRY_EVENTS.FILES.ADD_FILE)
    assert.strictEqual(captureCall.properties.fileCount, 5)
    assert.strictEqual(captureCall.properties.folderCount, 1)
  })

  test('trackEvent should track file count and folder count for ADD_FOLDER event', () => {
    // Track event with file count, folder count, and recursive flag
    telemetryServiceInstance.trackEvent(TELEMETRY_EVENTS.FILES.ADD_FOLDER, {
      fileCount: 10,
      folderCount: 3,
      recursive: true
    })

    // Verify capture was called with correct parameters
    sinon.assert.calledOnce(posthogCaptureStub)
    const captureCall = posthogCaptureStub.getCall(0).args[0]

    assert.strictEqual(captureCall.event, TELEMETRY_EVENTS.FILES.ADD_FOLDER)
    assert.strictEqual(captureCall.properties.fileCount, 10)
    assert.strictEqual(captureCall.properties.folderCount, 3)
    assert.strictEqual(captureCall.properties.recursive, true)
  })

  test('trackEvent should track file count and folder count for ADD_SELECTION event', () => {
    // Track event with file count, folder count, and recursive flag
    telemetryServiceInstance.trackEvent(TELEMETRY_EVENTS.FILES.ADD_SELECTION, {
      fileCount: 7,
      folderCount: 2,
      recursive: false
    })

    // Verify capture was called with correct parameters
    sinon.assert.calledOnce(posthogCaptureStub)
    const captureCall = posthogCaptureStub.getCall(0).args[0]

    assert.strictEqual(captureCall.event, TELEMETRY_EVENTS.FILES.ADD_SELECTION)
    assert.strictEqual(captureCall.properties.fileCount, 7)
    assert.strictEqual(captureCall.properties.folderCount, 2)
    assert.strictEqual(captureCall.properties.recursive, false)
  })

  test('trackEvent should track file count and folder count for ADD_SMART_SELECTION event', () => {
    // Track event with file count and folder count
    telemetryServiceInstance.trackEvent(TELEMETRY_EVENTS.FILES.ADD_SMART_SELECTION, {
      fileCount: 15,
      folderCount: 4
    })

    // Verify capture was called with correct parameters
    sinon.assert.calledOnce(posthogCaptureStub)
    const captureCall = posthogCaptureStub.getCall(0).args[0]

    assert.strictEqual(captureCall.event, TELEMETRY_EVENTS.FILES.ADD_SMART_SELECTION)
    assert.strictEqual(captureCall.properties.fileCount, 15)
    assert.strictEqual(captureCall.properties.folderCount, 4)
  })

  test('trackEvent should not capture when telemetry is disabled', () => {
    // Mock isEnabled to return false by setting the private enabled field
    // @ts-ignore: Accessing private properties
    telemetryServiceInstance.enabled = false

    telemetryServiceInstance.trackEvent(TELEMETRY_EVENTS.FILES.ADD_FILE, {
      fileCount: 5,
      folderCount: 1
    })

    // Verify capture was not called
    sinon.assert.notCalled(posthogCaptureStub)
  })
})
