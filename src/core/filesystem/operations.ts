import fs from 'fs/promises'
import ignore from 'ignore'
import * as path from 'path'
import * as vscode from 'vscode'

/**
 * File metadata interface representing basic file information
 */
export interface FileMetadata {
  path: string
  type: 'file' | 'directory'
  name: string
}

/** Cache for gitignore instances to avoid repeated parsing */
const gitignoreCache: { [key: string]: ReturnType<typeof ignore> } = {}

/**
 * Get or create an ignore instance for a workspace
 * @param rootPath Optional root path of the workspace
 */
export async function getGitignore(rootPath?: string) {
  if (!rootPath) {
    rootPath = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath as string
  }

  if (gitignoreCache[rootPath]) {
    return gitignoreCache[rootPath]
  }

  const ig = ignore()
  try {
    const gitignorePath = path.join(rootPath, '.gitignore')
    const content = await fs.readFile(gitignorePath, 'utf8')
    ig.add(content)
  } catch (error) {
    console.log(
      'No .gitignore found or unable to read it:',
      error instanceof Error ? error.message : String(error)
    )
  }

  gitignoreCache[rootPath] = ig
  return ig
}

/**
 * Format a file tree structure as a string
 * @param rootFolder The root folder name
 * @param files Array of file metadata to format
 */
export function formatFileTree(rootFolder: string, files: FileMetadata[]): string {
  // Sort files by path for consistent ordering
  files.sort((a, b) => a.path.localeCompare(b.path))

  // Create a map of parent paths to their children
  const dirMap = new Map<string, Array<FileMetadata>>()

  // Initialize root directory
  dirMap.set(rootFolder, [])

  // Track processed directories to avoid duplication
  const processedDirs = new Set<string>()

  // Build directory structure
  files.forEach(file => {
    const parentDir = path.dirname(file.path)
    const relativePath = path.relative(rootFolder, parentDir)

    // Create parent directory entries if they don't exist
    let currentPath = rootFolder
    if (relativePath !== '') {
      const parts = relativePath.split(path.sep)
      parts.forEach(part => {
        const parentPath = currentPath
        currentPath = path.join(currentPath, part)

        if (!dirMap.has(currentPath)) {
          dirMap.set(currentPath, [])
          // Only add directory entry if not processed before
          if (!processedDirs.has(currentPath)) {
            dirMap.get(parentPath)?.push({
              path: currentPath,
              type: 'directory',
              name: part
            })
            processedDirs.add(currentPath)
          }
        }
      })
    }

    // Only add non-directory files or unprocessed directories
    if (file.type !== 'directory' || !processedDirs.has(file.path)) {
      dirMap.get(currentPath)?.push({
        path: file.path,
        type: file.type,
        name: file.name
      })
      if (file.type === 'directory') {
        processedDirs.add(file.path)
      }
    }
  })

  const treeLines: string[] = []
  treeLines.push(path.basename(rootFolder))

  // Recursive function to build the tree string
  function buildTree(dir: string, prefix: string = '') {
    const contents = dirMap.get(dir) || []

    contents.forEach((item, index) => {
      const isLast = index === contents.length - 1
      const itemPrefix = isLast ? '└── ' : '├── '
      const newPrefix = prefix + (isLast ? '    ' : '│   ')

      treeLines.push(`${prefix}${itemPrefix}${item.name}`)

      if (item.type === 'directory') {
        buildTree(item.path, newPrefix)
      }
    })
  }

  buildTree(rootFolder)
  return treeLines.join('\n')
}

/**
 * Retrieves a tree structure of files and directories in the workspace
 * @param rootUri The root URI of the workspace or folder to start from
 * @returns A promise that resolves to an array of FileMetadata objects representing the file tree
 */
export async function getWorkspaceFileTree(rootUri: vscode.Uri): Promise<FileMetadata[]> {
  const fileUris: FileMetadata[] = []
  const entries = await vscode.workspace.fs.readDirectory(rootUri)

  for (const [name, type] of entries) {
    const uri = vscode.Uri.joinPath(rootUri, name)
    if (type === vscode.FileType.File) {
      fileUris.push({
        path: uri.fsPath, // Store absolute path
        type: 'file',
        name
      })
    } else if (type === vscode.FileType.Directory) {
      fileUris.push({
        path: uri.fsPath, // Store absolute path
        type: 'directory',
        name
      })
      const subFileUris = await getWorkspaceFileTree(uri)
      fileUris.push(...subFileUris)
    }
  }
  return fileUris
}
