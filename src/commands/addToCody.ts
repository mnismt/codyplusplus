import * as vscode from 'vscode'
import { TELEMETRY_EVENTS } from '../constants/telemetry'
import { TelemetryService } from '../services/telemetry.service'
import { executeMentionFileCommand, processCodyFiles } from '../utils/codyFileProcessor'

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
