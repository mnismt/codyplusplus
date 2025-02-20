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
  files.sort((a, b) => a.path.localeCompare(b.path))

  const dirMap = new Map<string, Set<{ name: string; type: 'file' | 'directory' }>>()
  dirMap.set(rootFolder, new Set())

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
