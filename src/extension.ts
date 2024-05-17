import * as path from 'path'
import * as vscode from 'vscode'
export function activate(context: vscode.ExtensionContext) {
  console.log('Cody++ is now active!')

  let disposable = vscode.commands.registerCommand(
    'cody-plus-plus.addFolder',
    async (uri: vscode.Uri) => {
      const stat = await vscode.workspace.fs.stat(uri)

      if (stat.type === vscode.FileType.Directory) {
        // If the URI is a directory, read the directory contents
        const files = await vscode.workspace.fs.readDirectory(uri)
        for (const [fileName, fileType] of files) {
          if (fileType === vscode.FileType.File) {
            const fileUri = vscode.Uri.file(path.join(uri.fsPath, fileName))
            await executeMentionFileCommand(fileUri)
          }
        }
      } else {
        // If the URI is a file, execute the command directly
        await executeMentionFileCommand(uri)
      }
    }
  )

  context.subscriptions.push(disposable)
}

async function executeMentionFileCommand(uri: vscode.Uri) {
  try {
    await vscode.commands.executeCommand('cody.mention.file', uri)
  } catch (error: any) {
    vscode.window.showErrorMessage(`Failed to trigger cody to mention file: ${error.message}`)
  }
}

export function deactivate() {}
