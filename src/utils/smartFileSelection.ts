import { z } from 'zod'
import { BaseLLMProvider, CompletionRequestMessage } from '../services/llm'

export const FileSelectionResponseSchema = z.object({
  files: z.array(z.string()),
  reasoning: z.string()
})

export type FileSelectionResponse = z.infer<typeof FileSelectionResponseSchema>

function createPrompts(query: string, filesTree: string): CompletionRequestMessage[] {
  const systemPrompt: CompletionRequestMessage = {
    speaker: 'system',
    text: `You are a file selection assistant. Given a file structure and selection criteria, select the most relevant files.

<guidelines>
1. Only select files that directly match the criteria
2. Exclude files that are irrelevant or only tangentially related
3. Consider file naming patterns and directory structure
4. If the query mentions excluding certain files, make sure to exclude them
5. Return relative paths from the root of the given structure
6. If there are no matching files, return an empty array
</guidelines>

You have to return a JSON with the following structure:
{
  "files": string[],   // Array of selected file paths
  "reasoning": string  // Brief explanation of your selection
}`
  }

  const fewShotExamples: CompletionRequestMessage[] = []

  const userPrompt: CompletionRequestMessage = {
    speaker: 'human',
    text: `
Given the following file structure:
<file-tree>
${filesTree}
</file-tree>

Select the files that best match the query: "${query}"
`
  }

  return [systemPrompt, ...fewShotExamples, userPrompt]
}

export async function processLLMFileSelection(
  query: string,
  filesTree: string,
  llmProvider: BaseLLMProvider
): Promise<string> {
  const promptMessages = createPrompts(query, filesTree)

  try {
    const response = await llmProvider.complete({
      messages: promptMessages,
      config: {
        temperature: 0.0, // Low temperature for more deterministic output
        responseFormat: {
          type: 'json',
          schema: FileSelectionResponseSchema.shape
        }
      }
    })

    return response.text
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error(`Failed to parse LLM response as JSON: ${error.message}`)
    }
    throw error
  }
}

export function extractJsonFromResponse(response: string): FileSelectionResponse {
  // First, try to parse json with zod
  const parsedData = FileSelectionResponseSchema.safeParse(JSON.parse(response))

  if (parsedData.success) {
    return parsedData.data
  }

  // If zod validation fails, try to extract json from the response

  const jsonStartIndex = response.indexOf('{')
  const jsonEndIndex = response.lastIndexOf('}') + 1

  if (jsonStartIndex !== -1 && jsonEndIndex !== -1) {
    return JSON.parse(response.substring(jsonStartIndex, jsonEndIndex)) as FileSelectionResponse
  }

  throw new Error('No valid JSON found in response')
}

export function validatePaths(files: FileSelectionResponse['files']) {
  // Validate paths
  const validPaths = files.filter(file => {
    const fileMetadata = files.find(f => f === file)
    return fileMetadata
  })

  if (validPaths.length === 0 && files.length > 0) {
    throw new Error('None of the selected files were found in the workspace')
  }

  return validPaths
}
