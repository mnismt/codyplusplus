import * as vscode from 'vscode'
import { CODY_COMMAND } from '../constants/cody'
import { countFilesInDirectory, walkDirectory } from './file'

export interface CodyFileProcessorOptions {
  fileThreshold?: number
  excludedFileTypes?: string[]
  excludedFolders?: string[]
  recursive?: boolean
  progressTitle?: string
}

export async function processCodyFiles(
  uris: vscode.Uri[],
  callback: (uri: vscode.Uri) => Promise<void>,
  options: CodyFileProcessorOptions = {}
) {
  if (!uris || uris.length === 0) {
    vscode.window.showWarningMessage('No files or folders are selected to add to Cody.')
    return
  }

  const config = vscode.workspace.getConfiguration('codyPlusPlus')
  const fileThreshold = options.fileThreshold ?? config.get<number>('fileThreshold', 15)
  const excludedFileTypes =
    options.excludedFileTypes ?? config.get<string[]>('excludedFileTypes', [])
  const excludedFolders = options.excludedFolders ?? config.get<string[]>('excludedFolders', [])
  const recursive = options.recursive ?? true
  const progressTitle = options.progressTitle ?? 'Processing files for Cody'

  try {
    let totalFileCount = 0
    for (const uri of uris) {
      const stat = await vscode.workspace.fs.stat(uri)
      if (stat.type === vscode.FileType.Directory) {
        totalFileCount += await countFilesInDirectory(
          uri,
          excludedFileTypes,
          excludedFolders,
          !recursive
        )
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

    await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: progressTitle,
        cancellable: false
      },
      async progress => {
        progress.report({ message: 'Processing files...' })
        for (const uri of uris) {
          const stat = await vscode.workspace.fs.stat(uri)
          if (stat.type === vscode.FileType.File) {
            await callback(uri)
          } else if (stat.type === vscode.FileType.Directory) {
            await walkDirectory(uri, excludedFileTypes, excludedFolders, callback, !recursive)
          }
        }
        progress.report({ message: 'Done!' })
      }
    )
  } catch (error: any) {
    vscode.window.showErrorMessage(`Failed to process files: ${error.message}`)
  }
}

export async function executeMentionFileCommand(uri: vscode.Uri) {
  try {
    await vscode.commands.executeCommand(CODY_COMMAND.MENTION.FILE, uri)
  } catch (error: any) {
    vscode.window.showErrorMessage(`Failed to trigger Cody to mention file: ${error.message}`)
  }
}
