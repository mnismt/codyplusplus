import * as path from 'path'
import * as vscode from 'vscode'
import { CODY_COMMAND } from './constants/cody'

export function activate(context: vscode.ExtensionContext) {
  console.log('Cody++ is now active!')

  let openFolderDisposable = vscode.commands.registerCommand(
    'cody-plus-plus.addFolder',
    async (uri: vscode.Uri) => {
      await walkDirectory(uri, async fileUri => {
        await executeMentionFileCommand(fileUri)
      })
    }
  )

  context.subscriptions.push(openFolderDisposable)
}

async function walkDirectory(uri: vscode.Uri, callback: (fileUri: vscode.Uri) => Promise<void>) {
  const files = await vscode.workspace.fs.readDirectory(uri)
  for (const [fileName, fileType] of files) {
    const fileUri = vscode.Uri.file(path.join(uri.fsPath, fileName))
    if (fileType === vscode.FileType.File) {
      await callback(fileUri)
    } else if (fileType === vscode.FileType.Directory) {
      await walkDirectory(fileUri, callback)
    }
  }
}

async function executeMentionFileCommand(uri: vscode.Uri) {
  try {
    await vscode.commands.executeCommand(CODY_COMMAND.MENTION.FILE, uri)
  } catch (error: any) {
    vscode.window.showErrorMessage(`Failed to trigger cody to mention file: ${error.message}`)
  }
}

export function deactivate() {}
