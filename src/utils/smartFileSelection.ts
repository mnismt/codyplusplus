import path from 'path'
import * as vscode from 'vscode'
import { z } from 'zod'
import { LLMService } from '../services/llm.service'

export const FileSelectionResponseSchema = z.object({
  files: z.array(z.string()),
  reasoning: z.string()
})

export type FileSelectionResponse = z.infer<typeof FileSelectionResponseSchema>

export interface FileMetadata {
  path: string
  type: 'file' | 'directory'
  name: string
}

export async function getWorkspaceFiles(
  uri?: vscode.Uri,
  excludedTypes: string[] = [],
  excludedFolders: string[] = []
): Promise<FileMetadata[]> {
  const files: FileMetadata[] = []
  const rootPath = uri?.fsPath || (vscode.workspace.workspaceFolders?.[0]?.uri.fsPath as string)

  if (!rootPath) {
    throw new Error('No workspace or folder selected')
  }

  const processDirectory = async (dirPath: string, relativePath: string = '') => {
    const entries = await vscode.workspace.fs.readDirectory(vscode.Uri.file(dirPath))

    for (const [name, type] of entries) {
      const fullPath = path.join(dirPath, name)
      const relPath = path.join(relativePath, name)

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

  await processDirectory(rootPath)
  return files
}

function formatFileTree(files: FileMetadata[]): string {
  const treeLines: string[] = []
  const pathMap = new Map<string, FileMetadata>()

  // Sort files to ensure consistent structure
  files.sort((a, b) => a.path.localeCompare(b.path))

  files.forEach(file => {
    const parts = file.path.split(path.sep)
    let indent = ''

    for (let i = 0; i < parts.length; i++) {
      indent = '  '.repeat(i)
      treeLines.push(`${indent}${parts[i]}${file.type === 'directory' ? '/' : ''}`)
    }
  })

  return treeLines.join('\n')
}

function extractJsonFromResponse(text: string): string {
  // Try to find JSON within markdown code blocks
  const markdownMatch = text.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/)
  if (markdownMatch) {
    return markdownMatch[1].trim()
  }

  // Try to find standalone JSON object
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (jsonMatch) {
    return jsonMatch[0].trim()
  }

  // If no JSON found, return original text for error handling
  return text.trim()
}

export async function processLLMFileSelection(
  query: string,
  files: FileMetadata[],
  llmService: LLMService
): Promise<string[]> {
  const prompt = `
You are a file selection assistant. Given a file structure and selection criteria, select the most relevant files.

<guidelines>
1. Only select files that directly match the criteria
2. Exclude files that are irrelevant or only tangentially related
3. Consider file naming patterns and directory structure
4. If the query mentions excluding certain files, make sure to exclude them
5. Return relative paths from the root of the given structure
6. If there are no matching files, return an empty array
</guidelines>

<goal>
Your response will be automatically formatted as JSON with the following structure:
{
  "files": string[],   // Array of selected file paths
  "reasoning": string  // Brief explanation of your selection
}
</goal>

<file-tree>
${formatFileTree(files)}
</file-tree>

<selection-criteria>
${query}
</selection-criteria> 
`
  console.log('Prompt:', prompt)

  try {
    const response = await llmService.complete({
      prompt,
      config: {
        temperature: 0.0, // Low temperature for more deterministic output
        responseFormat: {
          type: 'json',
          schema: FileSelectionResponseSchema.shape
        }
      }
    })

    let result: FileSelectionResponse
    try {
      // First try to parse with Zod schema
      const parsedData = FileSelectionResponseSchema.safeParse(JSON.parse(response.text))

      if (parsedData.success) {
        result = parsedData.data
      } else {
        // If Zod validation fails, try extracting JSON and validate again
        const jsonText = extractJsonFromResponse(response.text)
        const extractedData = FileSelectionResponseSchema.safeParse(JSON.parse(jsonText))

        if (extractedData.success) {
          result = extractedData.data
        } else {
          throw new Error(
            `Invalid response format: ${extractedData.error.message}. Response was: ${response.text.substring(0, 200)}...`
          )
        }
      }
    } catch (error) {
      // Handle both SyntaxError from JSON.parse and ZodError from schema validation
      const errorMessage = error instanceof Error ? error.message : String(error)
      throw new Error(
        `Failed to parse LLM response: ${errorMessage}. Response was: ${response.text.substring(0, 200)}...`
      )
    }

    // Validate paths
    const validPaths = result.files.filter(file => {
      const fileMetadata = files.find(f => f.path === file)
      return fileMetadata && fileMetadata.type === 'file'
    })

    if (validPaths.length === 0 && result.files.length > 0) {
      throw new Error('None of the selected files were found in the workspace')
    }

    return validPaths
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error(`Failed to parse LLM response as JSON: ${error.message}`)
    }
    throw error
  }
}
