import path from 'path'
import * as vscode from 'vscode'
import { TELEMETRY_EVENTS } from '../constants/telemetry'
import { LLMService } from '../services/llm.service'
import { TelemetryService } from '../services/telemetry.service'
import { executeMentionFileCommand, processCodyFiles } from '../utils/codyFileProcessor'
import { getWorkspaceFiles, processLLMFileSelection } from '../utils/smartFileSelection'

export async function addFile(uri: vscode.Uri) {
  const telemetry = TelemetryService.getInstance()
  try {
    await executeMentionFileCommand(uri)
    telemetry.trackEvent(TELEMETRY_EVENTS.FILES.ADD_FILE, {
      fileCount: 1
    })
  } catch (error: any) {
    vscode.window.showErrorMessage(`Failed to add file to Cody: ${error.message}`)
  }
}

export async function addSelection(uris: vscode.Uri[], recursive: boolean = false) {
  const telemetry = TelemetryService.getInstance()
  const fileCount = await processCodyFiles(uris, executeMentionFileCommand, {
    progressTitle: 'Adding selected items to Cody',
    recursive
  })
  telemetry.trackEvent(TELEMETRY_EVENTS.FILES.ADD_SELECTION, {
    fileCount,
    recursive
  })
}

export async function addFolderCommand(uri: vscode.Uri) {
  const telemetry = TelemetryService.getInstance()
  const fileCount = await processCodyFiles([uri], executeMentionFileCommand, {
    recursive: true,
    progressTitle: 'Adding folder to Cody'
  })
  telemetry.trackEvent(TELEMETRY_EVENTS.FILES.ADD_FOLDER, {
    fileCount,
    recursive: true
  })
}

export async function addShallowFolderCommand(uri: vscode.Uri) {
  const telemetry = TelemetryService.getInstance()
  const fileCount = await processCodyFiles([uri], executeMentionFileCommand, {
    recursive: false,
    progressTitle: 'Adding current directory to Cody'
  })
  telemetry.trackEvent(TELEMETRY_EVENTS.FILES.ADD_FOLDER, {
    fileCount,
    recursive: false
  })
}

export async function addFilesSmartCommand(uri?: vscode.Uri, context?: vscode.ExtensionContext) {
  const telemetry = TelemetryService.getInstance()
  const llmService = LLMService.getInstance(context as vscode.ExtensionContext)

  try {
    // Get user's selection criteria
    const query = await vscode.window.showInputBox({
      prompt: 'Describe which files you want to add to Cody',
      placeHolder: 'e.g., "Add all test files related to authentication"'
    })

    if (!query) {
      return
    }

    await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: 'Smart File Selection',
        cancellable: false
      },
      async progress => {
        progress.report({ message: 'Analyzing workspace files...' })

        // Get workspace files
        const config = vscode.workspace.getConfiguration('codyPlusPlus')
        const excludedTypes = config.get<string[]>('excludedFileTypes', [])
        const excludedFolders = config.get<string[]>('excludedFolders', [])

        const files = await getWorkspaceFiles(uri, excludedTypes, excludedFolders)

        console.log('files', files)

        progress.report({ message: 'Processing selection criteria...' })

        // Process with LLM
        const selectedPaths = await processLLMFileSelection(query, files, llmService)

        if (selectedPaths.length === 0) {
          vscode.window.showInformationMessage('No files matched your selection criteria.')
          return
        }

        // Convert paths to URIs
        const rootPath =
          uri?.fsPath || (vscode.workspace.workspaceFolders?.[0]?.uri.fsPath as string)
        const uris = selectedPaths.map(filePath => vscode.Uri.file(path.join(rootPath, filePath)))

        progress.report({ message: 'Adding selected files to Cody...' })

        // Process selected files
        const fileCount = await processCodyFiles(uris, executeMentionFileCommand, {
          progressTitle: 'Adding smart selection to Cody'
        })

        telemetry.trackEvent(TELEMETRY_EVENTS.FILES.ADD_SMART_SELECTION, {
          fileCount,
          queryLength: query.length
        })

        progress.report({ message: 'Done!' })
        vscode.window.showInformationMessage(
          `Added ${fileCount} files to Cody based on your criteria.`
        )
      }
    )
  } catch (error: any) {
    vscode.window.showErrorMessage(`Failed to process smart file selection: ${error.message}`)
  }
}
