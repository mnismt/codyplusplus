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
