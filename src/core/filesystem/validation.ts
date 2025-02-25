import * as path from 'path'

/**
 * Check if a file should be excluded based on its extension
 * @param fileName The name of the file to check
 * @param excludedFileTypes Array of file extensions to exclude
 */
export function isFileTypeExcluded(fileName: string, excludedFileTypes: string[] = []): boolean {
  const fileExtension = path.extname(fileName)
  return excludedFileTypes.includes(fileExtension)
}

/**
 * Check if a folder should be excluded based on its name
 * @param folderName The name of the folder to check
 * @param excludedFolders Array of folder names to exclude
 */
export function isFolderNameExcluded(folderName: string, excludedFolders: string[] = []): boolean {
  return excludedFolders.includes(folderName)
}
