// Import necessary modules
import * as path from 'path'
import * as vscode from 'vscode'

// Count the number of files in a directory, excluding specified file types
export async function countFilesInDirectory(
  uri: vscode.Uri,
  excludedFileTypes: string[] = []
): Promise<number> {
  let fileCount = 0
  // Read the contents of the directory
  const files = await vscode.workspace.fs.readDirectory(uri)
  for (const [fileName, fileType] of files) {
    const fileUri = vscode.Uri.file(path.join(uri.fsPath, fileName))
    const isFileExcluded = isFileTypeExcluded(fileName, excludedFileTypes)
    if (fileType === vscode.FileType.File && !isFileExcluded) {
      // Increment count for non-excluded files
      fileCount++
    } else if (fileType === vscode.FileType.Directory) {
      // Recursively count files in subdirectories
      fileCount += await countFilesInDirectory(fileUri, excludedFileTypes)
    }
  }
  return fileCount
}

// Walk through a directory and execute a callback for each file
export async function walkDirectory(
  uri: vscode.Uri,
  excludedFileTypes: string[] = [],
  callback: (fileUri: vscode.Uri) => Promise<void>
) {
  // Read the contents of the directory
  const files = await vscode.workspace.fs.readDirectory(uri)

  for (const [fileName, fileType] of files) {
    const fileUri = vscode.Uri.file(path.join(uri.fsPath, fileName))
    const isFileExcluded = isFileTypeExcluded(fileName, excludedFileTypes)

    if (fileType === vscode.FileType.File && !isFileExcluded) {
      // Execute callback for non-excluded files
      await callback(fileUri)
    } else if (fileType === vscode.FileType.Directory) {
      // Recursively walk through subdirectories
      await walkDirectory(fileUri, excludedFileTypes, callback)
    }
  }
}

// Check if a file should be excluded based on its extension
export function isFileTypeExcluded(fileName: string, excludedFileTypes: string[] = []): boolean {
  const fileExtension = path.extname(fileName)
  return excludedFileTypes.includes(fileExtension)
}
