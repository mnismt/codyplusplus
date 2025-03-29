import * as assert from 'assert'
import { TELEMETRY_EVENTS } from '../telemetry'

suite('Telemetry Constants Tests', () => {
  test('should have correct file event names', () => {
    assert.strictEqual(TELEMETRY_EVENTS.FILES.ADD_FILE, 'add_file')
    assert.strictEqual(TELEMETRY_EVENTS.FILES.ADD_SELECTION, 'add_selection')
    assert.strictEqual(TELEMETRY_EVENTS.FILES.ADD_FOLDER, 'add_folder')
    assert.strictEqual(TELEMETRY_EVENTS.FILES.ADD_SMART_SELECTION, 'add_smart_selection')
  })

  test('should have correct custom command event names', () => {
    assert.strictEqual(TELEMETRY_EVENTS.CUSTOM_COMMANDS.CREATED, 'custom_command_created')
    assert.strictEqual(TELEMETRY_EVENTS.CUSTOM_COMMANDS.DELETED, 'custom_command_deleted')
    assert.strictEqual(TELEMETRY_EVENTS.CUSTOM_COMMANDS.EXECUTED, 'custom_command_executed')
  })
})
