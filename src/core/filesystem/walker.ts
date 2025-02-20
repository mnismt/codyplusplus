import * as path from 'path'
import * as vscode from 'vscode'
import { FileMetadata, getGitignore } from './operations'
import { isFileTypeExcluded, isFolderNameExcluded } from './validation'

/**
 * Count files in a directory with exclusion support
 * @param uri Directory URI to count files in
 * @param excludedFileTypes Array of file extensions to exclude
 * @param excludedFolders Array of folder names to exclude
 * @param shallow If true, only count files in the current directory
 */
export async function countFilesInDirectory(
  uri: vscode.Uri,
  excludedFileTypes: string[] = [],
  excludedFolders: string[] = [],
  shallow: boolean = false
): Promise<number> {
  let fileCount = 0
  const files = await vscode.workspace.fs.readDirectory(uri)

  for (const [fileName, fileType] of files) {
    const fileUri = vscode.Uri.file(path.join(uri.fsPath, fileName))
    const isFileExcluded = isFileTypeExcluded(fileName, excludedFileTypes)
    const isFolderExcluded = isFolderNameExcluded(fileName, excludedFolders)

    if (isFolderExcluded) {
      continue
    }

    if (fileType === vscode.FileType.File && !isFileExcluded) {
      fileCount++
    } else if (fileType === vscode.FileType.Directory && !shallow) {
      fileCount += await countFilesInDirectory(fileUri, excludedFileTypes, excludedFolders, shallow)
    }
  }

  return fileCount
}

/**
 * Walk through a directory and execute a callback for each file
 * @param uri Directory URI to walk through
 * @param excludedFileTypes Array of file extensions to exclude
 * @param excludedFolders Array of folder names to exclude
 * @param callback Function to execute for each file
 * @param shallow If true, only process files in the current directory
 */
export async function walkDirectory(
  uri: vscode.Uri,
  excludedFileTypes: string[] = [],
  excludedFolders: string[] = [],
  callback: (fileUri: vscode.Uri) => Promise<void>,
  shallow: boolean = false
): Promise<void> {
  const files = await vscode.workspace.fs.readDirectory(uri)

  for (const [fileName, fileType] of files) {
    const fileUri = vscode.Uri.file(path.join(uri.fsPath, fileName))
    const isFileExcluded = isFileTypeExcluded(fileName, excludedFileTypes)

    if (fileType === vscode.FileType.File && !isFileExcluded) {
      await callback(fileUri)
    } else if (fileType === vscode.FileType.Directory && !shallow) {
      const isFolderExcluded = isFolderNameExcluded(fileName, excludedFolders)
      if (isFolderExcluded) {
        console.log('CODY++', `Folder ${fileName} is excluded`)
        continue
      }
      await walkDirectory(fileUri, excludedFileTypes, excludedFolders, callback, shallow)
    }
  }
}

/**
 * Get all files in the workspace with exclusion support
 * @param uri Optional directory URI to start from
 * @param excludedTypes Array of file extensions to exclude
 * @param excludedFolders Array of folder names to exclude
 */
export async function getWorkspaceFiles(
  uri?: vscode.Uri,
  excludedTypes: string[] = [],
  excludedFolders: string[] = []
): Promise<FileMetadata[]> {
  const files: FileMetadata[] = []
  const dirPath = uri?.fsPath as string

  const ig = await getGitignore()

  const processDirectory = async (dirPath: string, relativePath: string = '') => {
    const entries = await vscode.workspace.fs.readDirectory(vscode.Uri.file(dirPath))

    for (const [name, type] of entries) {
      const fullPath = path.join(dirPath, name)
      const relPath = path.join(relativePath, name)

      if (ig.ignores(relPath)) {
        continue
      }

      if (type === vscode.FileType.Directory && isFolderNameExcluded(name, excludedFolders)) {
        continue
      }

      if (type === vscode.FileType.File && isFileTypeExcluded(name, excludedTypes)) {
        continue
      }

      files.push({
        path: relPath,
        type: type === vscode.FileType.Directory ? 'directory' : 'file',
        name
      })

      if (type === vscode.FileType.Directory) {
        await processDirectory(fullPath, relPath)
      }
    }
  }

  await processDirectory(dirPath)
  return files
}
