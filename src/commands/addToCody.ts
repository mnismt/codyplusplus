import * as vscode from 'vscode'
import { FEW_SHOT_EXAMPLES, SYSTEM_PROMPT } from '../constants/llm'
import { TELEMETRY_EVENTS } from '../constants/telemetry'
import { executeMentionFileCommand } from '../core/cody/commands'
import { formatFileTree, getWorkspaceFileTree } from '../core/filesystem/operations'
import { getSelectedFileUris } from '../core/filesystem/processor'
import { createStatusTree } from '../core/filesystem/utils'
import { createProvider } from '../core/llm'
import { CompletionRequestMessage } from '../core/llm/types'
import { TelemetryService } from '../services/telemetry.service'

function getSuccessCount(count: number, successes: boolean): number {
  return count + (successes ? 1 : 0)
}

export async function addFile(folderUri: vscode.Uri) {
  const telemetry = TelemetryService.getInstance()
  try {
    const files = await getSelectedFileUris([folderUri])
    const fileCount = (await Promise.all(files.map(executeMentionFileCommand))).reduce(
      getSuccessCount,
      0
    )

    telemetry.trackEvent(TELEMETRY_EVENTS.FILES.ADD_FILE, {
      fileCount
    })
  } catch (error: any) {
    vscode.window.showErrorMessage(`Failed to add file to Cody: ${error.message}`)
  }
}

export async function addSelection(folderUris: vscode.Uri[], recursive = false) {
  const telemetry = TelemetryService.getInstance()
  try {
    const files = await getSelectedFileUris(folderUris, {
      recursive,
      progressTitle: 'Adding selection to Cody'
    })
    const fileCount = (await Promise.all(files.map(executeMentionFileCommand))).reduce(
      getSuccessCount,
      0
    )

    telemetry.trackEvent(TELEMETRY_EVENTS.FILES.ADD_SELECTION, {
      fileCount,
      recursive
    })
  } catch (error: any) {
    vscode.window.showErrorMessage(`Failed to add selection to Cody: ${error.message}`)
  }
}

export async function addFolderCommand(folderUri: vscode.Uri, recursive = true) {
  const telemetry = TelemetryService.getInstance()
  try {
    const files = await getSelectedFileUris([folderUri], {
      recursive,
      progressTitle: 'Adding folder to Cody'
    })
    const fileCount = (await Promise.all(files.map(executeMentionFileCommand))).reduce(
      getSuccessCount,
      0
    )

    telemetry.trackEvent(TELEMETRY_EVENTS.FILES.ADD_FOLDER, {
      fileCount,
      recursive
    })
  } catch (error: any) {
    vscode.window.showErrorMessage(`Failed to add folder to Cody: ${error.message}`)
  }
}

export async function addFilesSmart(folderUris: vscode.Uri[], context: vscode.ExtensionContext) {
  const telemetry = TelemetryService.getInstance()

  try {
    // Prompt user for file selection criteria
    const prompt = await vscode.window.showInputBox({
      prompt: 'Describe the files you want to add to Cody',
      placeHolder: 'e.g., all test files and services related to user authentication'
    })

    if (!prompt) {
      return // User cancelled
    }

    // Determine the root URI (workspace or specific folder)
    const rootUri =
      folderUris.length === 1 &&
      (await vscode.workspace.fs.stat(folderUris[0])).type === vscode.FileType.Directory
        ? folderUris[0]
        : vscode.workspace.workspaceFolders?.[0].uri

    if (!rootUri) {
      vscode.window.showErrorMessage('No workspace or folder selected.')
      return
    }

    // Get the file tree structure
    const fileTree = await getWorkspaceFileTree(rootUri)
    const formattedFileTree = formatFileTree(
      rootUri.fsPath, // Use the full fsPath
      fileTree
    )

    // Create LLM provider and ensure authenticated
    const llm = createProvider()
    if (!llm.isAuthenticated) {
      await llm.getLLMProviderToken()
    }

    const userMessage = `
<file-tree>
${rootUri.fsPath}
${formattedFileTree}
</file-tree>

User request: ${prompt}
`

    const messages: CompletionRequestMessage[] = [
      {
        role: 'system',
        content: SYSTEM_PROMPT
      },
      ...FEW_SHOT_EXAMPLES,
      {
        role: 'user',
        content: userMessage
      }
    ]

    console.log(`CODY++: LLM provider messages`, messages)

    // Call LLM
    const response = await llm.complete({
      messages,
      config: {
        responseFormat: {
          type: 'json'
        }
      }
    })

    // Parse LLM Response
    let selectedFiles: string[] = []
    try {
      selectedFiles = JSON.parse(response.text)
      if (!Array.isArray(selectedFiles)) {
        throw new Error('Invalid response format. Expected an array of file paths.')
      }
    } catch (error: any) {
      vscode.window.showErrorMessage(`Error parsing LLM response: ${error.message}`)
      return
    }

    // Convert paths to URIs and add to Cody
    // No need to change this part as selectedFiles should now contain absolute paths.
    const selectedFileUris = selectedFiles.map(filePath => vscode.Uri.file(filePath))
    const fileCount = (await Promise.all(selectedFileUris.map(executeMentionFileCommand))).reduce(
      getSuccessCount,
      0
    )

    telemetry.trackEvent(TELEMETRY_EVENTS.FILES.ADD_SMART_SELECTION, {
      fileCount
    })

    // Provide feedback to the user.
    const relativePath = vscode.workspace.asRelativePath(rootUri)
    const successMessage = `Added ${fileCount} file${fileCount !== 1 ? 's' : ''} from '${relativePath}' that match your criteria: "${prompt}"`

    const allFiles = fileTree.map(f => f.path)
    const treeStructure = createStatusTree(allFiles, selectedFiles, rootUri)

    vscode.window.showInformationMessage(successMessage, {
      detail: treeStructure,
      modal: true
    })
  } catch (error: any) {
    vscode.window.showErrorMessage(`Failed to add files smart to Cody: ${error.message}`)
  }
}
