import * as path from 'path'
import * as vscode from 'vscode'
import { FILE_THRESHOLD } from './constants'
import { CODY_COMMAND } from './constants/cody'

export function activate(context: vscode.ExtensionContext) {
  console.log('Cody++ is now active!')

  let disposable = vscode.commands.registerCommand(
    'cody-plus-plus.addFolder',
    async (uri: vscode.Uri) => {
      const fileCount = await countFilesInDirectory(uri)
      if (fileCount > FILE_THRESHOLD) {
        const userResponse = await vscode.window.showWarningMessage(
          `The folder contains ${fileCount} files. Do you want to proceed?`,
          { modal: true },
          'Yes',
          'No'
        )
        if (userResponse !== 'Yes') {
          return
        }
      }
      await walkDirectory(uri, async fileUri => {
        await executeMentionFileCommand(fileUri)
      })
    }
  )

  context.subscriptions.push(disposable)
}

async function countFilesInDirectory(uri: vscode.Uri): Promise<number> {
  let fileCount = 0
  const files = await vscode.workspace.fs.readDirectory(uri)
  for (const [fileName, fileType] of files) {
    const fileUri = vscode.Uri.file(path.join(uri.fsPath, fileName))
    if (fileType === vscode.FileType.File) {
      fileCount++
    } else if (fileType === vscode.FileType.Directory) {
      fileCount += await countFilesInDirectory(fileUri)
    }
  }
  return fileCount
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
