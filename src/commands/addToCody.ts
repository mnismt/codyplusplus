import * as vscode from 'vscode'
import { TELEMETRY_EVENTS } from '../constants/telemetry'
import { executeMentionFileCommand } from '../core/cody/commands'
import { getSelectedFileUris } from '../core/filesystem/processor'
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
  console.log(
    `Adding selection: ${folderUris.map(uri => uri.path).join(', ')} with recursive: ${recursive}`
  )
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
  console.log(`Adding folder: ${folderUri.path} with recursive: ${recursive}`)
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

export async function addFilesSmart(folderUris: vscode.Uri[], recursive = true) {
  console.log(
    `Adding files smart: ${folderUris.map(uri => uri.path).join(', ')} with recursive: ${recursive}`
  )
  // TODO: implement addFilesSmart using Sourcegraph and LLMs
}
