import * as vscode from 'vscode'
import { executeMentionFileCommand, processCodyFiles } from '../utils/codyFileProcessor'

export async function addFile(uri: vscode.Uri) {
  try {
    await executeMentionFileCommand(uri)
  } catch (error: any) {
    vscode.window.showErrorMessage(`Failed to add file to Cody: ${error.message}`)
  }
}

export async function addSelection(uris: vscode.Uri[], recursive: boolean = false) {
  await processCodyFiles(uris, executeMentionFileCommand, {
    progressTitle: 'Adding selected items to Cody',
    recursive: recursive
  })
}

export async function addFolderCommand(uri: vscode.Uri) {
  await processCodyFiles([uri], executeMentionFileCommand, {
    recursive: true,
    progressTitle: 'Adding folder to Cody'
  })
}

export async function addShallowFolderCommand(uri: vscode.Uri) {
  await processCodyFiles([uri], executeMentionFileCommand, {
    recursive: false,
    progressTitle: 'Adding current directory to Cody'
  })
}
