import * as vscode from 'vscode'
import { CODY_COMMAND } from '../constants/cody'
import { countFilesInDirectory, walkDirectory } from '../utils/file'

export async function addFile(uri: vscode.Uri) {
  try {
    await executeMentionFileCommand(uri)
  } catch (error: any) {
    vscode.window.showErrorMessage(`Failed to add file to Cody: ${error.message}`)
  }
}

export async function addSelection(uris: vscode.Uri[]) {
  if (!uris || uris.length === 0) {
    vscode.window.showWarningMessage('No files selected to add to Cody.')
    return
  }

  const config = vscode.workspace.getConfiguration('codyPlusPlus')
  const fileThreshold: number = config.get<number>('fileThreshold', 15)
  const excludedFileTypes: string[] = config.get<string[]>('excludedFileTypes', [])

  try {
    let totalFileCount = 0
    for (const uri of uris) {
      const stat = await vscode.workspace.fs.stat(uri)
      if (stat.type === vscode.FileType.Directory) {
        totalFileCount += await countFilesInDirectory(uri, excludedFileTypes)
      } else {
        totalFileCount++
      }
    }

    if (totalFileCount > fileThreshold) {
      const userResponse = await vscode.window.showWarningMessage(
        `The selection contains ${totalFileCount} files. Do you want to proceed?`,
        { modal: true },
        'Yes',
        'No'
      )
      if (userResponse !== 'Yes') {
        return
      }
    }

    for (const uri of uris) {
      const stat = await vscode.workspace.fs.stat(uri)
      if (stat.type === vscode.FileType.File) {
        await executeMentionFileCommand(uri)
      } else if (stat.type === vscode.FileType.Directory) {
        await walkDirectory(uri, excludedFileTypes, async fileUri => {
          await executeMentionFileCommand(fileUri)
        })
      }
    }
  } catch (error: any) {
    vscode.window.showErrorMessage(`Failed to add selection to Cody: ${error.message}`)
  }
}

async function executeMentionFileCommand(uri: vscode.Uri) {
  try {
    await vscode.commands.executeCommand(CODY_COMMAND.MENTION.FILE, uri)
  } catch (error: any) {
    vscode.window.showErrorMessage(`Failed to trigger Cody to mention file: ${error.message}`)
  }
}
