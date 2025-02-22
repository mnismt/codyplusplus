import * as vscode from 'vscode'

/**
 * Configuration interface for file processing
 */
export interface ProcessingConfig {
  fileThreshold: number
  excludedFileTypes: string[]
  excludedFolders: string[]
  recursive: boolean
  progressTitle: string
}

/**
 * Default configuration values
 */
const DEFAULT_CONFIG: ProcessingConfig = {
  fileThreshold: 15,
  excludedFileTypes: [],
  excludedFolders: [],
  recursive: true,
  progressTitle: 'Processing files'
}

/**
 * Get processing configuration with defaults and workspace settings
 * @param options Optional configuration overrides
 */
export function getProcessingConfig(options: Partial<ProcessingConfig> = {}): ProcessingConfig {
  const config = vscode.workspace.getConfiguration('codyPlusPlus')

  return {
    fileThreshold:
      options.fileThreshold ?? config.get<number>('fileThreshold', DEFAULT_CONFIG.fileThreshold),
    excludedFileTypes:
      options.excludedFileTypes ??
      config.get<string[]>('excludedFileTypes', DEFAULT_CONFIG.excludedFileTypes),
    excludedFolders:
      options.excludedFolders ??
      config.get<string[]>('excludedFolders', DEFAULT_CONFIG.excludedFolders),
    recursive: options.recursive ?? DEFAULT_CONFIG.recursive,
    progressTitle: options.progressTitle ?? DEFAULT_CONFIG.progressTitle
  }
}

/**
 * Validate and confirm file count with user if above threshold
 * @param fileCount Number of files to process
 * @param threshold Maximum number of files before confirmation
 */
export async function validateFileCount(fileCount: number, threshold: number): Promise<boolean> {
  if (fileCount === 0) {
    vscode.window.showWarningMessage('No files or folders are selected to add to Cody.')
    return false
  }

  if (fileCount <= threshold) {
    return true
  }

  const userResponse = await vscode.window.showWarningMessage(
    `The selection contains ${fileCount} files. Do you want to proceed?`,
    { modal: true },
    'Yes',
    'No'
  )

  return userResponse === 'Yes'
}
