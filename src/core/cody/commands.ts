import * as vscode from 'vscode'
import { CODY_COMMAND } from '../../constants/cody'

/**
 * Execute Cody command to mention a file
 * @param uri URI of file to mention
 */
export async function executeMentionFileCommand(uri: vscode.Uri): Promise<void> {
  try {
    await vscode.commands.executeCommand(CODY_COMMAND.MENTION.FILE, uri)
  } catch (error: any) {
    vscode.window.showErrorMessage(`Failed to trigger Cody to mention file: ${error.message}`)
    throw error // Re-throw to allow caller to handle error
  }
}

/**
 * Validate that Cody commands are available
 * @returns True if Cody commands are available
 */
export async function validateCodyCommands(): Promise<boolean> {
  const commands = await vscode.commands.getCommands()
  const hasCodyCommands = commands.some(cmd => cmd.startsWith('cody.'))

  if (!hasCodyCommands) {
    vscode.window.showErrorMessage(
      'Cody commands are not available. Please ensure Cody extension is installed and activated.'
    )
    return false
  }

  return true
}
