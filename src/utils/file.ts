import * as path from 'path'
import * as vscode from 'vscode'

// Count the number of files in a directory, excluding specified file types and folders
export async function countFilesInDirectory(
  uri: vscode.Uri,
  excludedFileTypes: string[] = [],
  excludedFolders: string[] = [],
  shallow: boolean = false
): Promise<number> {
  let fileCount = 0
  // Read the contents of the directory
  const files = await vscode.workspace.fs.readDirectory(uri)
  for (const [fileName, fileType] of files) {
    const fileUri = vscode.Uri.file(path.join(uri.fsPath, fileName))
    const isFileExcluded = isFileTypeExcluded(fileName, excludedFileTypes)
    const isFolderExcluded = isFolderNameExcluded(fileName, excludedFolders)

    console.log('CODY++', 'fileName', fileName)
    console.log('CODY++', 'fileType', fileType)
    console.log('CODY++', 'isFileExcluded', isFileExcluded)
    console.log('CODY++', 'isFolderExcluded', isFolderExcluded)

    if (isFolderExcluded) {
      // Skip excluded folders
      continue
    }

    if (fileType === vscode.FileType.File && !isFileExcluded) {
      // Increment count for non-excluded files
      fileCount++
    } else if (fileType === vscode.FileType.Directory && !shallow) {
      // Recursively count files in subdirectories
      fileCount += await countFilesInDirectory(fileUri, excludedFileTypes, excludedFolders, shallow)
    }
  }
  return fileCount
}
// Walk through a directory and execute a callback for each file, excluding specified folders
export async function walkDirectory(
  uri: vscode.Uri,
  excludedFileTypes: string[] = [],
  excludedFolders: string[] = [],
  callback: (fileUri: vscode.Uri) => Promise<void>,
  shallow: boolean = false
) {
  // Read the contents of the directory
  const files = await vscode.workspace.fs.readDirectory(uri)

  for (const [fileName, fileType] of files) {
    const fileUri = vscode.Uri.file(path.join(uri.fsPath, fileName))
    const isFileExcluded = isFileTypeExcluded(fileName, excludedFileTypes)

    if (fileType === vscode.FileType.File && !isFileExcluded) {
      console.log('CODY++', `File ${fileName} is being processed`)
      // Execute callback for non-excluded files
      await callback(fileUri)
    } else if (fileType === vscode.FileType.Directory && !shallow) {
      const isFolderExcluded = isFolderNameExcluded(fileName, excludedFolders)
      if (isFolderExcluded) {
        console.log('CODY++', `Folder ${fileName} is excluded`)
        continue
      }
      // Recursively walk through subdirectories unless shallow mode is enabled
      await walkDirectory(fileUri, excludedFileTypes, excludedFolders, callback, shallow)
    }
  }
}

// Check if a file should be excluded based on its extension
export function isFileTypeExcluded(fileName: string, excludedFileTypes: string[] = []): boolean {
  const fileExtension = path.extname(fileName)
  return excludedFileTypes.includes(fileExtension)
}

// Check if a folder should be excluded based on its name
export function isFolderNameExcluded(folderName: string, excludedFolders: string[] = []): boolean {
  return excludedFolders.includes(folderName)
}
