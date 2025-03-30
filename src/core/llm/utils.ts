import * as vscode from 'vscode'
import { formatFileTree, getWorkspaceFileTree } from '../filesystem/operations'
import { FEW_SHOT_EXAMPLES, SYSTEM_PROMPT } from './constants'
import { CompletionRequestMessage } from './types'

export async function createCompletionRequestMessages(
  userPrompt: string,
  rootUri: vscode.Uri
): Promise<CompletionRequestMessage[]> {
  // Get the file tree structure
  const fileTree = await getWorkspaceFileTree(rootUri)
  const formattedFileTree = formatFileTree(
    rootUri.fsPath, // Use the full fsPath
    fileTree
  )

  const userMessage = `
<file-tree>
${rootUri.fsPath}
${formattedFileTree}
</file-tree>

User request: ${userPrompt}
`

  const messages: CompletionRequestMessage[] = [
    {
      role: 'system',
      content: SYSTEM_PROMPT
    },
    ...FEW_SHOT_EXAMPLES,
    {
      role: 'user',
      content: userMessage
    }
  ]

  return messages
}

export function parseLLMResponse(response: string): string[] {
  if (!response) return []

  try {
    const parsedResponse = JSON.parse(response)

    if (Array.isArray(parsedResponse)) {
      return parsedResponse
    }

    if (typeof parsedResponse === 'object' && Array.isArray(parsedResponse.files)) {
      return parsedResponse.files
    }

    return []
  } catch (error) {
    console.error(
      'Error parsing LLM response:',
      error instanceof Error ? error.message : String(error)
    )
    vscode.window.showErrorMessage(
      'Error parsing LLM response: ' + (error instanceof Error ? error.message : String(error))
    )
    return []
  }
}
