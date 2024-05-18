// src/fileUtils.ts
import * as path from 'path'
import * as vscode from 'vscode'

export async function countFilesInDirectory(
  uri: vscode.Uri,
  excludedFileTypes: string[] = []
): Promise<number> {
  let fileCount = 0
  const files = await vscode.workspace.fs.readDirectory(uri)
  for (const [fileName, fileType] of files) {
    const fileUri = vscode.Uri.file(path.join(uri.fsPath, fileName))
    const isFileExcluded = isFileTypeExcluded(fileName, excludedFileTypes)
    if (fileType === vscode.FileType.File && !isFileExcluded) {
      fileCount++
    } else if (fileType === vscode.FileType.Directory) {
      fileCount += await countFilesInDirectory(fileUri, excludedFileTypes)
    }
  }
  return fileCount
}

export async function walkDirectory(
  uri: vscode.Uri,
  excludedFileTypes: string[] = [],
  callback: (fileUri: vscode.Uri) => Promise<void>
) {
  const files = await vscode.workspace.fs.readDirectory(uri)

  for (const [fileName, fileType] of files) {
    const fileUri = vscode.Uri.file(path.join(uri.fsPath, fileName))
    const isFileExcluded = isFileTypeExcluded(fileName, excludedFileTypes)

    if (fileType === vscode.FileType.File && !isFileExcluded) {
      await callback(fileUri)
    } else if (fileType === vscode.FileType.Directory) {
      await walkDirectory(fileUri, excludedFileTypes, callback)
    }
  }
}

export function isFileTypeExcluded(fileName: string, excludedFileTypes: string[] = []): boolean {
  const fileExtension = path.extname(fileName)
  return excludedFileTypes.includes(fileExtension)
}
