import * as vscode from 'vscode'
import { countFilesInDirectory, walkDirectory } from '../filesystem/walker'
import { ProcessingConfig, getProcessingConfig, validateFileCount } from './config'

/**
 * Process multiple files with progress tracking and configuration
 * @param uris Array of URIs to process
 * @param callback Function to execute for each file
 * @param options Optional processing configuration
 */
export async function processFiles(
  uris: vscode.Uri[],
  callback: (uri: vscode.Uri) => Promise<void>,
  options: Partial<ProcessingConfig> = {}
): Promise<number> {
  if (!uris || uris.length === 0) {
    vscode.window.showWarningMessage('No files or folders are selected to process.')
    return 0
  }

  const config = getProcessingConfig(options)

  try {
    // Count files first to check against threshold
    let totalFileCount = 0
    for (const uri of uris) {
      const stat = await vscode.workspace.fs.stat(uri)
      if (stat.type === vscode.FileType.Directory) {
        totalFileCount += await countFilesInDirectory(
          uri,
          config.excludedFileTypes,
          config.excludedFolders,
          !config.recursive
        )
      } else {
        totalFileCount++
      }
    }

    // Validate file count with user
    const shouldProceed = await validateFileCount(totalFileCount, config.fileThreshold)
    if (!shouldProceed) {
      return 0
    }

    // Process files with progress indicator
    await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: config.progressTitle,
        cancellable: false
      },
      async progress => {
        progress.report({ message: 'Processing files...' })

        for (const uri of uris) {
          const stat = await vscode.workspace.fs.stat(uri)
          if (stat.type === vscode.FileType.File) {
            await callback(uri)
          } else if (stat.type === vscode.FileType.Directory) {
            await walkDirectory(
              uri,
              config.excludedFileTypes,
              config.excludedFolders,
              callback,
              !config.recursive
            )
          }
        }

        progress.report({ message: 'Done!' })
      }
    )

    return totalFileCount
  } catch (error: any) {
    vscode.window.showErrorMessage(`Failed to process files: ${error.message}`)
    return 0
  }
}

/**
 * Process a single file
 * @param uri URI of file to process
 * @param callback Function to execute on the file
 */
export async function processFile(
  uri: vscode.Uri,
  callback: (uri: vscode.Uri) => Promise<void>
): Promise<void> {
  try {
    await callback(uri)
  } catch (error: any) {
    vscode.window.showErrorMessage(`Failed to process file: ${error.message}`)
  }
}
