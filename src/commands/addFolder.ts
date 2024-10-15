// Import VS Code API
import * as vscode from 'vscode'
// Import constants and utility functions
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

  try {
    // Count the number of files in the selected directory, excluding specified file types
    const fileCount = await countFilesInDirectory(uri, excludedFileTypes)

    // If the number of files exceeds the threshold, prompt the user for confirmation
    if (fileCount > fileThreshold) {
      const userResponse = await vscode.window.showWarningMessage(
        `The folder contains ${fileCount} files. Do you want to proceed?`,
        { modal: true },
        'Yes',
        'No'
      )
      if (userResponse !== 'Yes') {
        // User chose not to proceed
        return
      }
    }

    // Traverse the directory and execute the "Mention File" command for each file
    await walkDirectory(uri, excludedFileTypes, async fileUri => {
      await executeMentionFileCommand(fileUri)
    })
  } catch (error: any) {
    // Display an error message if the operation fails
    vscode.window.showErrorMessage(`Failed to add folder to Cody: ${error.message}`)
  }
}

// Helper function to execute the "Mention File" command in Cody for a given file
async function executeMentionFileCommand(uri: vscode.Uri) {
  try {
    // Execute the Cody command to mention the file
    await vscode.commands.executeCommand(CODY_COMMAND.MENTION.FILE, uri)
  } catch (error: any) {
    // Notify the user if the command execution fails
    vscode.window.showErrorMessage(`Failed to trigger Cody to mention file: ${error.message}`)
  }
}
