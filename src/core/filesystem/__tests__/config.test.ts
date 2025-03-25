import * as assert from 'assert'
import proxyquire from 'proxyquire'
import * as sinon from 'sinon'

suite('Filesystem Config Tests', () => {
  let sandbox: sinon.SinonSandbox
  let configGetStub: sinon.SinonStub
  let showWarningMessageStub: sinon.SinonStub
  let configModule: any
  let configStub: sinon.SinonStub

  setup(() => {
    sandbox = sinon.createSandbox()

    // Stub vscode.workspace.getConfiguration
    configGetStub = sandbox.stub()
    configStub = sandbox.stub()
    configStub.returns({
      get: configGetStub
    })

    // Stub vscode.window.showWarningMessage
    showWarningMessageStub = sandbox.stub()
    showWarningMessageStub.resolves('Yes')

    // Setup the get stub to return the second parameter (default) when no value is set
    configGetStub.callsFake((key, defaultValue) => {
      return defaultValue
    })

    // Load the config module with stubs
    configModule = proxyquire.noCallThru().load('../config', {
      vscode: {
        workspace: {
          getConfiguration: configStub
        },
        window: {
          showWarningMessage: showWarningMessageStub
        }
      }
    })
  })

  teardown(() => {
    sandbox.restore()
  })

  suite('getProcessingConfig', () => {
    test('should use default values when no workspace settings exist', () => {
      // Keep the default behavior of returning the default parameter

      const config = configModule.getProcessingConfig()

      // Check for default values
      assert.strictEqual(config.fileThreshold, 15)
      assert.deepStrictEqual(config.excludedFileTypes, [])
      assert.deepStrictEqual(config.excludedFolders, [])
      assert.strictEqual(config.recursive, true)
      assert.strictEqual(config.progressTitle, 'Processing files')
    })

    test('should use workspace settings when available', () => {
      // Simulate workspace settings by overriding specific values
      configGetStub.withArgs('fileThreshold', 15).returns(20)
      configGetStub.withArgs('excludedFileTypes', []).returns(['.exe', '.dll'])
      configGetStub.withArgs('excludedFolders', []).returns(['node_modules', '.git'])

      const config = configModule.getProcessingConfig()

      assert.strictEqual(config.fileThreshold, 20)
      assert.deepStrictEqual(config.excludedFileTypes, ['.exe', '.dll'])
      assert.deepStrictEqual(config.excludedFolders, ['node_modules', '.git'])
      assert.strictEqual(config.recursive, true)
      assert.strictEqual(config.progressTitle, 'Processing files')
    })

    test('should override with provided options', () => {
      // Simulate workspace settings
      configGetStub.withArgs('fileThreshold', 15).returns(20)
      configGetStub.withArgs('excludedFileTypes', []).returns(['.exe', '.dll'])
      configGetStub.withArgs('excludedFolders', []).returns(['node_modules', '.git'])

      const options = {
        fileThreshold: 30,
        excludedFileTypes: ['.bin'],
        recursive: false,
        progressTitle: 'Custom Progress'
      }

      const config = configModule.getProcessingConfig(options)

      assert.strictEqual(config.fileThreshold, 30)
      assert.deepStrictEqual(config.excludedFileTypes, ['.bin'])
      assert.deepStrictEqual(config.excludedFolders, ['node_modules', '.git'])
      assert.strictEqual(config.recursive, false)
      assert.strictEqual(config.progressTitle, 'Custom Progress')
    })
  })

  suite('validateFileCount', () => {
    test('should return false when file count is 0', async () => {
      const result = await configModule.validateFileCount(0, 15)

      assert.strictEqual(result, false)
      assert.strictEqual(showWarningMessageStub.calledOnce, true)
      assert.strictEqual(
        showWarningMessageStub.firstCall.args[0],
        'No files or folders are selected to add to Cody.'
      )
    })

    test('should return true when file count is below threshold', async () => {
      const result = await configModule.validateFileCount(10, 15)

      assert.strictEqual(result, true)
      assert.strictEqual(showWarningMessageStub.called, false)
    })

    test('should prompt user when file count exceeds threshold and return true if confirmed', async () => {
      showWarningMessageStub.resolves('Yes')

      const result = await configModule.validateFileCount(20, 15)

      assert.strictEqual(result, true)
      assert.strictEqual(showWarningMessageStub.calledOnce, true)
      assert.strictEqual(
        showWarningMessageStub.firstCall.args[0],
        'The selection contains 20 files. Do you want to proceed?'
      )
    })

    test('should prompt user when file count exceeds threshold and return false if rejected', async () => {
      showWarningMessageStub.resolves('No')

      const result = await configModule.validateFileCount(20, 15)

      assert.strictEqual(result, false)
    })
  })
})
