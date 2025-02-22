import { CompletionRequestMessage } from '../core/llm/types'

export const SYSTEM_PROMPT = `
You are a helpful assistant that helps select files in a codebase based on user requests.
You are given the file tree of the codebase and the user's request.
You should respond with a JSON array of file paths that should be added to the codebase.
The file paths should be absolute paths.
Do not include any additional text in your response, only the JSON array.
`

export const FEW_SHOT_EXAMPLES: CompletionRequestMessage[] = [
  {
    speaker: 'human',
    text: `<file-tree>
/Users/users/Work/Tools/mcp-servers/src/servers/perplexity
├── perplexity
│   ├── __pycache__
│   ├── index.ts
│   └── tools
│       ├── cookies.json
│       └── search.ts
</file-tree>
User request: typescript files
`
  },
  {
    speaker: 'assistant',
    text: `[
      "/Users/users/Work/Tools/mcp-servers/src/servers/perplexity/index.ts",
      "/Users/users/Work/Tools/mcp-servers/src/servers/perplexity/tools/search.ts"
    ]`
  }
]
