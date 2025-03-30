import { CompletionRequestMessage } from './types'

export type SUPPORTED_PROVIDER_CODES = 'openai-compatible' | 'openai' | 'gemini'

export interface LLMProviderDetails {
  name: string // User-friendly name (e.g., "OpenAI Compatible")
  code: SUPPORTED_PROVIDER_CODES // Unique identifier (e.g., "openai-compatible")
  defaultModel: string
  baseURL: string
  chatCompletionPath: string // e.g., /chat/completions
  modelsPath: string // e.g., /models
}

// Define the supported providers using the new structure
export const SUPPORTED_PROVIDERS: LLMProviderDetails[] = [
  {
    name: 'OpenAI Compatible',
    code: 'openai-compatible',
    defaultModel: 'gpt-4o-mini',
    baseURL: 'https://api.openai.com/v1',
    chatCompletionPath: '/chat/completions',
    modelsPath: '/models'
  },
  {
    name: 'OpenAI',
    code: 'openai',
    defaultModel: 'gpt-4o-mini',
    baseURL: 'https://api.openai.com/v1',
    chatCompletionPath: '/chat/completions',
    modelsPath: '/models'
  },
  {
    name: 'Gemini',
    code: 'gemini',
    defaultModel: 'gemini-2.0-flash', // Note: Model name updated based on package.json description
    baseURL: 'https://generativelanguage.googleapis.com/v1beta', // Keeping this simpler for now
    chatCompletionPath: '/openai/chat/completions', // Adjusted for Gemini's OpenAI compatibility layer
    modelsPath: '/openai/models' // Adjusted for Gemini's OpenAI compatibility layer
  }
]

export const CONFIG_KEYS = {
  PROVIDER: 'llmProvider',
  API_KEY: 'llmApiKey',
  MODEL: 'llmModel',
  OPENAI_BASE_URL: 'openaiBaseUrl'
} as const

export const ERROR_MESSAGES = {
  NOT_AUTHENTICATED: 'Authentication required. Please sign in.',
  INVALID_TOKEN: 'Invalid authentication token.',
  NO_TOKEN: 'No token provided.',
  NETWORK_ERROR: 'Network request failed.',
  UNKNOWN_ERROR: 'An unknown error occurred.',
  INVALID_RESPONSE: 'Invalid response format from API.'
} as const

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
