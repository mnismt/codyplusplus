export const TELEMETRY_EVENTS = {
  FILES: {
    ADD_FILE: 'add_file',
    ADD_SELECTION: 'add_selection',
    ADD_FOLDER: 'add_folder',
    ADD_SMART_SELECTION: 'add_smart_selection'
  },
  CUSTOM_COMMANDS: {
    CREATED: 'custom_command_created',
    DELETED: 'custom_command_deleted',
    EXECUTED: 'custom_command_executed'
  }
} as const
