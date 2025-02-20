import * as vscode from 'vscode'
import { TELEMETRY_EVENTS } from '../constants/telemetry'
import { executeMentionFileCommand } from '../core/cody/commands'
import { processFiles } from '../core/processing/processor'
import { TelemetryService } from '../services/telemetry.service'

/**
 * Add a single file to Cody through context menu
 */
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

/**
 * Add multiple selected files to Cody
 */
export async function addSelection(uris: vscode.Uri[], recursive = false) {
  const telemetry = TelemetryService.getInstance()
  try {
    const fileCount = await processFiles(
      uris,
      async uri => {
        await executeMentionFileCommand(uri)
      },
      {
        progressTitle: 'Adding selected items to Cody',
        recursive
      }
    )

    telemetry.trackEvent(TELEMETRY_EVENTS.FILES.ADD_SELECTION, {
      fileCount,
      recursive
    })
  } catch (error: any) {
    vscode.window.showErrorMessage(`Failed to add selection to Cody: ${error.message}`)
  }
}

/**
 * Add all files in a folder to Cody recursively
 */
export async function addFolderCommand(uri: vscode.Uri, recursive = true) {
  const telemetry = TelemetryService.getInstance()
  try {
    const fileCount = await processFiles(
      [uri],
      async uri => {
        await executeMentionFileCommand(uri)
      },
      {
        recursive,
        progressTitle: 'Adding folder to Cody'
      }
    )

    telemetry.trackEvent(TELEMETRY_EVENTS.FILES.ADD_FOLDER, {
      fileCount,
      recursive
    })
  } catch (error: any) {
    vscode.window.showErrorMessage(`Failed to add folder to Cody: ${error.message}`)
  }
}
