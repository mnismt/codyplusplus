import * as assert from 'assert'
import { COMMANDS, DEV_WEBVIEW_URL } from '../webview'

suite('Webview Constants Tests', () => {
  test('should have correct dev webview URL', () => {
    assert.strictEqual(DEV_WEBVIEW_URL, 'http://localhost:5173')
  })

  test('should have correct command names', () => {
    assert.strictEqual(COMMANDS.CREATE_COMMAND, 'create_command')
    assert.strictEqual(COMMANDS.UPDATE_COMMAND, 'update_command')
  })
})
