import * as vscode from 'vscode'
import { CODY_COMMAND } from '../constants/cody'
import { countFilesInDirectory, walkDirectory } from '../utils/file'

export async function addFolderCommand(uri: vscode.Uri) {
  const config = vscode.workspace.getConfiguration('codyPlusPlus')
  const fileThreshold: number = config.get<number>('fileThreshold', 15)
  const excludedFileTypes: string[] = config.get<string[]>('excludedFileTypes', [])

  try {
    const fileCount = await countFilesInDirectory(uri, excludedFileTypes)

    if (fileCount > fileThreshold) {
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

    await walkDirectory(uri, excludedFileTypes, async fileUri => {
      await executeMentionFileCommand(fileUri)
    })
  } catch (error: any) {
    vscode.window.showErrorMessage(`Failed to add folder to Cody: ${error.message}`)
  }
}

async function executeMentionFileCommand(uri: vscode.Uri) {
  try {
    await vscode.commands.executeCommand(CODY_COMMAND.MENTION.FILE, uri)
  } catch (error: any) {
    vscode.window.showErrorMessage(`Failed to trigger Cody to mention file: ${error.message}`)
  }
}
