// Import VS Code API and utility functions
import * as vscode from 'vscode'
import { CODY_COMMAND } from '../constants/cody'
import { countFilesInDirectory, walkDirectory } from '../utils/file'

// Command function to add all files in a folder to Cody
export async function addFolderCommand(uri: vscode.Uri) {
  // Retrieve extension configurations
  const config = vscode.workspace.getConfiguration('codyPlusPlus')
  // Maximum number of files before prompting the user
  const fileThreshold: number = config.get<number>('fileThreshold', 15)
  // List of file extensions to exclude
  const excludedFileTypes: string[] = config.get<string[]>('excludedFileTypes', [])
  // List of folder names to exclude
  const excludedFolders: string[] = config.get<string[]>('excludedFolders', [])

  console.log('CODY++', 'EXCLUDED FOLDERS', { excludedFolders })

  try {
    // Pass excludedFolders to countFilesInDirectory
    const fileCount = await countFilesInDirectory(uri, excludedFileTypes, excludedFolders)

    // Prompt the user if file count exceeds threshold
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

    // Traverse the directory
    await walkDirectory(uri, excludedFileTypes, excludedFolders, async fileUri => {
      await executeMentionFileCommand(fileUri)
    })
  } catch (error: any) {
    vscode.window.showErrorMessage(`Failed to add folder to Cody: ${error.message}`)
  }
}

// Helper function to execute the "Mention File" command in Cody for a given file
async function executeMentionFileCommand(uri: vscode.Uri) {
  try {
    console.log('CODY++', 'EXECUTING MENTION FILE COMMAND', uri)
    await vscode.commands.executeCommand(CODY_COMMAND.MENTION.FILE, uri)
  } catch (error: any) {
    vscode.window.showErrorMessage(`Failed to trigger Cody to mention file: ${error.message}`)
  }
}
