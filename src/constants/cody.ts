import * as path from 'path'
import * as vscode from 'vscode'

export const CODY_COMMAND = {
  MENTION: {
    FILE: 'cody.mention.file'
  }
}

export const CODY_CUSTOM_COMMANDS_FILE = 'cody.json'

export function getCodyJsonPath(): string | undefined {
  const workspaceFolders = vscode.workspace.workspaceFolders
  if (!workspaceFolders) {
    console.error('CODY++: No workspace folder is open.')
    return undefined
  }

  const vscodeFolderPath = path.join(workspaceFolders[0].uri.fsPath, '.vscode')
  return path.join(vscodeFolderPath, CODY_CUSTOM_COMMANDS_FILE)
}
