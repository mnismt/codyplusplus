import { CompletionRequestMessage } from '../core/llm/types'

export enum LLMProvider {
  OpenAI = 'openai-compatible'
  // Future providers:
  // Langchain = 'langchain'
}

export const AVAILABLE_LLM_PROVIDERS = [LLMProvider.OpenAI]

export const LLM_PROVIDER_API_BASE_URL: Record<LLMProvider, string> = {
  [LLMProvider.OpenAI]: 'https://api.openai.com/v1/'
}

export const SYSTEM_PROMPT = `
You are a helpful assistant that helps select files in a codebase based on user requests.
You are given the file tree of the codebase and the user's request.
You should respond with a JSON array of file paths that should be added to the codebase.
The file paths should be absolute paths.
Do not include any additional text in your response, only the JSON array.
`

export const FEW_SHOT_EXAMPLES: CompletionRequestMessage[] = [
  {
    role: 'user',
    content: `<file-tree>
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
    role: 'assistant',
    content: `{"files": [
      "/Users/users/Work/Tools/mcp-servers/src/servers/perplexity/index.ts",
      "/Users/users/Work/Tools/mcp-servers/src/servers/perplexity/tools/search.ts"
    ]}`
  },
  {
    role: 'user',
    content: `<file-tree>
/Users/user/projects/go-project
├── main.go
├── database
│   ├── db.go
│   └── migrations
│       ├── 0001_init.sql
│       └── 0002_add_users.sql
└── utils
     └── helpers.go
</file-tree>
User request: files related to database interactions
`
  },
  {
    role: 'assistant',
    content: `{"files": [
      "/Users/user/projects/go-project/database/db.go",
      "/Users/user/projects/go-project/database/migrations/0001_init.sql",
      "/Users/user/projects/go-project/database/migrations/0002_add_users.sql"
    ]}`
  },
  {
    role: 'user',
    content: `<file-tree>
/Users/user/projects/webapp
├── frontend
│    ├── src
│    │    ├── components
│    │    │    ├── AuthForm.js
│    │    │    └── Button.js
│    │    ├── styles
│    │    │    └── AuthForm.css
│    │    └── index.html
│    └── package.json
├── backend
│    ├── auth.py
│    └── server.py
└── README.md
</file-tree>
User request: styling files
`
  },
  {
    role: 'assistant',
    content: `{"files": [
      "/Users/user/projects/webapp/frontend/src/styles/AuthForm.css"
    ]}`
  },
  {
    role: 'user',
    content: `<file-tree>
/Users/user/projects/python-project
├── src
│    ├── main.py
│    └── utils.py
└── tests
      ├── test_main.py
      └── test_utils.py
</file-tree>
User request: test files
`
  },
  {
    role: 'assistant',
    content: `{"files": [
      "/Users/user/projects/python-project/tests/test_main.py",
      "/Users/user/projects/python-project/tests/test_utils.py"
    ]}`
  }
]
