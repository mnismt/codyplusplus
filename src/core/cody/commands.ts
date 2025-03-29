import * as vscode from 'vscode'

/**
 * Execute Cody command to mention a file
 * @param uri URI of file to mention
 */
export async function executeMentionFileCommand(uri: vscode.Uri): Promise<boolean> {
  try {
    await vscode.commands.executeCommand('cody.mention.file', uri)
    return true
  } catch (error: any) {
    vscode.window.showErrorMessage(`Failed to trigger Cody to mention file: ${error.message}`)
    return false
  }
}
