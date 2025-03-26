import * as path from 'path'
import * as vscode from 'vscode'
import { ProcessingConfig, getProcessingConfig, validateFileCount } from './config'
import { isFileTypeExcluded, isFolderNameExcluded } from './validation'

async function collectFileUrisFromDirectory(
  dirUri: vscode.Uri,
  options: { recursive: boolean; excludedFileTypes: string[]; excludedFolders: string[] }
): Promise<vscode.Uri[]> {
  const fileUris: vscode.Uri[] = []
  const entries = await vscode.workspace.fs.readDirectory(dirUri)
  for (const [name, type] of entries) {
    const entryUri = vscode.Uri.joinPath(dirUri, name)
    if (type === vscode.FileType.File) {
      if (!isFileTypeExcluded(name, options.excludedFileTypes)) {
        fileUris.push(entryUri)
      }
    } else if (type === vscode.FileType.Directory && options.recursive) {
      if (!isFolderNameExcluded(name, options.excludedFolders)) {
        const subFileUris = await collectFileUrisFromDirectory(entryUri, options)
        fileUris.push(...subFileUris)
      }
    }
  }
  return fileUris
}

async function collectFileUris(
  uris: vscode.Uri[],
  options: { recursive: boolean; excludedFileTypes: string[]; excludedFolders: string[] }
): Promise<vscode.Uri[]> {
  const fileUris: vscode.Uri[] = []
  for (const uri of uris) {
    const stat = await vscode.workspace.fs.stat(uri)
    if (stat.type === vscode.FileType.File) {
      const name = path.basename(uri.fsPath)
      if (!isFileTypeExcluded(name, options.excludedFileTypes)) {
        fileUris.push(uri)
      }
    } else if (stat.type === vscode.FileType.Directory) {
      const dirFileUris = await collectFileUrisFromDirectory(uri, options)
      fileUris.push(...dirFileUris)
    }
  }
  return fileUris
}

export async function getSelectedFileUris(
  uris: vscode.Uri[],
  options: Partial<ProcessingConfig> = {}
): Promise<vscode.Uri[]> {
  if (uris.length === 0) {
    vscode.window.showWarningMessage('No files or folders are selected to process.')
    return []
  }

  const config = getProcessingConfig(options)
  const fileUris = await collectFileUris(uris, {
    recursive: config.recursive,
    excludedFileTypes: config.excludedFileTypes,
    excludedFolders: config.excludedFolders
  })

  const fileCount = fileUris.length
  const shouldProceed = await validateFileCount(fileCount, config.fileThreshold)
  if (!shouldProceed) {
    return []
  }

  return fileUris
}

/**
 * Gets both the selected file URIs and counts the number of folders processed
 * @param uris Input URIs to process
 * @param options Processing configuration options
 * @returns Object containing folder count and file URIs
 */
export async function getSelectedFolderCount(
  uris: vscode.Uri[],
  options: Partial<ProcessingConfig> = {}
): Promise<{ folderCount: number; fileUris: vscode.Uri[] }> {
  if (uris.length === 0) {
    vscode.window.showWarningMessage('No files or folders are selected to process.')
    return { folderCount: 0, fileUris: [] }
  }

  const config = getProcessingConfig(options)

  // Count folders and collect file URIs
  let folderCount = 0
  const processedFolderPaths = new Set<string>()

  // Count initial folders
  for (const uri of uris) {
    const stat = await vscode.workspace.fs.stat(uri)
    if (stat.type === vscode.FileType.Directory) {
      folderCount++
      processedFolderPaths.add(uri.fsPath)
    }
  }

  // Track subfolders during collection if recursive
  const trackFolderCallback = (folderPath: string) => {
    if (!processedFolderPaths.has(folderPath)) {
      folderCount++
      processedFolderPaths.add(folderPath)
    }
  }

  const fileUris = await collectFileUrisWithFolderTracking(
    uris,
    {
      recursive: config.recursive,
      excludedFileTypes: config.excludedFileTypes,
      excludedFolders: config.excludedFolders
    },
    trackFolderCallback
  )

  const fileCount = fileUris.length
  const shouldProceed = await validateFileCount(fileCount, config.fileThreshold)
  if (!shouldProceed) {
    return { folderCount: 0, fileUris: [] }
  }

  return { folderCount, fileUris }
}

/**
 * Collects file URIs while tracking folder paths
 */
async function collectFileUrisWithFolderTracking(
  uris: vscode.Uri[],
  options: { recursive: boolean; excludedFileTypes: string[]; excludedFolders: string[] },
  folderCallback: (folderPath: string) => void
): Promise<vscode.Uri[]> {
  const fileUris: vscode.Uri[] = []

  for (const uri of uris) {
    const stat = await vscode.workspace.fs.stat(uri)
    if (stat.type === vscode.FileType.File) {
      const name = path.basename(uri.fsPath)
      if (!isFileTypeExcluded(name, options.excludedFileTypes)) {
        fileUris.push(uri)
      }
    } else if (stat.type === vscode.FileType.Directory) {
      const dirFileUris = await collectFileUrisFromDirectoryWithTracking(
        uri,
        options,
        folderCallback
      )
      fileUris.push(...dirFileUris)
    }
  }

  return fileUris
}

/**
 * Collects file URIs from a directory while tracking subfolder paths
 */
async function collectFileUrisFromDirectoryWithTracking(
  dirUri: vscode.Uri,
  options: { recursive: boolean; excludedFileTypes: string[]; excludedFolders: string[] },
  folderCallback: (folderPath: string) => void
): Promise<vscode.Uri[]> {
  const fileUris: vscode.Uri[] = []
  const entries = await vscode.workspace.fs.readDirectory(dirUri)

  for (const [name, type] of entries) {
    const entryUri = vscode.Uri.joinPath(dirUri, name)

    if (type === vscode.FileType.File) {
      if (!isFileTypeExcluded(name, options.excludedFileTypes)) {
        fileUris.push(entryUri)
      }
    } else if (type === vscode.FileType.Directory && options.recursive) {
      if (!isFolderNameExcluded(name, options.excludedFolders)) {
        // Track this subfolder
        folderCallback(entryUri.fsPath)

        // Process its contents
        const subFileUris = await collectFileUrisFromDirectoryWithTracking(
          entryUri,
          options,
          folderCallback
        )
        fileUris.push(...subFileUris)
      }
    }
  }

  return fileUris
}
