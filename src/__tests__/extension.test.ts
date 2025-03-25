import * as assert from 'assert'
import * as vscode from 'vscode'

suite('Extension Test Suite', () => {
  vscode.window.showInformationMessage('Start all tests.')

  test('Extension should be present', async () => {
    const extension = vscode.extensions.getExtension('mnismt.cody-plus-plus')
    assert.notStrictEqual(extension, undefined)
  })

  test('Extension should activate', async function () {
    this.timeout(10000) // Allow more time for extension activation
    const extension = vscode.extensions.getExtension('mnismt.cody-plus-plus')
    if (!extension) {
      assert.fail('Extension not found')
    }

    try {
      await extension.activate()
      assert.strictEqual(extension.isActive, true)
    } catch (error) {
      assert.fail(`Failed to activate extension: ${error}`)
    }
  })

  test('Commands should be registered', async () => {
    const commands = await vscode.commands.getCommands(true)

    // Check if Cody++ commands are registered
    assert.strictEqual(commands.includes('cody-plus-plus.addFile'), true)
    assert.strictEqual(commands.includes('cody-plus-plus.addFolder'), true)
    assert.strictEqual(commands.includes('cody-plus-plus.addCustomCommand'), true)
  })
})
