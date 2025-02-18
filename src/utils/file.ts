import fs from 'fs/promises'
import ignore from 'ignore'
import * as path from 'path'
import * as vscode from 'vscode'

export interface FileMetadata {
  path: string
  type: 'file' | 'directory'
  name: string
}

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

const gitignoreCache: { [key: string]: ReturnType<typeof ignore> } = {}

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
    // No .gitignore found, use empty ignore instance
    console.log(
      'No .gitignore found or unable to read it:',
      error instanceof Error ? error.message : String(error)
    )
  }

  gitignoreCache[rootPath] = ig
  return ig
}

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

      // Check gitignore first
      if (ig.ignores(relPath)) {
        continue
      }

      // Skip excluded folders
      if (type === vscode.FileType.Directory && excludedFolders.includes(name)) {
        continue
      }

      // Skip excluded file types
      if (type === vscode.FileType.File && excludedTypes.some(ext => name.endsWith(ext))) {
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

export function formatFileTree(rootFolder: string, files: FileMetadata[]): string {
  files.sort((a, b) => a.path.localeCompare(b.path))

  const dirMap = new Map<string, Set<{ name: string; type: 'file' | 'directory' }>>()
  dirMap.set(rootFolder, new Set())

  // Helper function to compare entries
  const entryEquals = (a: any, b: any) => a.name === b.name && a.type === b.type

  files.forEach(file => {
    const dir = file.path.split('/').slice(0, -1).join('/') || rootFolder

    if (!dirMap.has(dir)) {
      dirMap.set(dir, new Set())

      const parentDir = dir.split('/').slice(0, -1).join('/') || rootFolder
      if (parentDir !== '.') {
        const dirEntry = {
          name: dir.split('/').pop()!,
          type: 'directory' as const
        }

        // Only add if not already present
        const parentSet = dirMap.get(parentDir)!
        if (![...parentSet].some(entry => entryEquals(entry, dirEntry))) {
          parentSet.add(dirEntry)
        }
      }
    }

    const fileEntry = {
      name: file.name,
      type: file.type
    }

    // Only add if not already present
    const dirSet = dirMap.get(dir)!
    if (![...dirSet].some(entry => entryEquals(entry, fileEntry))) {
      dirSet.add(fileEntry)
    }
  })

  const treeLines: string[] = []
  treeLines.push(rootFolder)

  function buildTree(dir: string, prefix: string = '') {
    const contents = Array.from(dirMap.get(dir) || new Set()) as FileMetadata[]

    contents.forEach((item: FileMetadata, index) => {
      const isLast = index === contents.length - 1
      const itemPrefix = isLast ? '└── ' : '├── '
      const line = `${prefix}${itemPrefix}${item.name}`
      treeLines.push(line)

      if (item.type === 'directory') {
        const newDir = dir === rootFolder ? item.name : `${dir}/${item.name}`
        const newPrefix = prefix + (isLast ? '    ' : '│   ')
        buildTree(newDir, newPrefix)
      }
    })
  }

  buildTree(rootFolder)
  return treeLines.join('\n')
}
