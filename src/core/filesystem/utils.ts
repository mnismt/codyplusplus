import * as path from 'path'
import * as vscode from 'vscode'

// Create a tree structure with status indicators
export function createStatusTree(
  files: string[],
  selectedFiles: string[],
  rootUri: vscode.Uri
): string {
  const dirMap = new Map<
    string,
    Set<{ name: string; type: 'file' | 'directory'; selected: boolean }>
  >()

  // Initialize root
  dirMap.set(rootUri.fsPath, new Set())

  // Build directory and file structure
  files.forEach(file => {
    const isSelected = selectedFiles.includes(file)
    let currentPath = rootUri.fsPath
    const relativePath = path.relative(rootUri.fsPath, file)
    const parts = relativePath.split(path.sep)

    // Add directories to the map
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i]
      const nextPath = path.join(currentPath, part)
      if (!dirMap.has(nextPath)) {
        dirMap.set(nextPath, new Set())
        dirMap.get(currentPath)?.add({ name: part, type: 'directory', selected: false })
      }
      currentPath = nextPath
    }

    // Add file to the map
    const fileName = parts[parts.length - 1]
    dirMap.get(currentPath)?.add({ name: fileName, type: 'file', selected: isSelected })
  })

  // Build tree string
  const treeLines: string[] = []
  treeLines.push(path.basename(rootUri.fsPath))

  function buildTree(dir: string, prefix = '') {
    const contents = Array.from(dirMap.get(dir) || []).sort((a, b) => a.name.localeCompare(b.name))

    contents.forEach((item, index) => {
      const isLast = index === contents.length - 1
      const itemPrefix = isLast ? '└── ' : '├── '
      const newPrefix = prefix + (isLast ? '    ' : '│   ')
      const statusIcon = item.selected ? '✅ ' : '❌ '

      // Add status icon for files only
      const displayName = item.type === 'file' ? `${statusIcon}${item.name}` : item.name
      treeLines.push(`${prefix}${itemPrefix}${displayName}`)

      if (item.type === 'directory') {
        buildTree(path.join(dir, item.name), newPrefix)
      }
    })
  }

  buildTree(rootUri.fsPath)
  return treeLines.join('\n')
}
