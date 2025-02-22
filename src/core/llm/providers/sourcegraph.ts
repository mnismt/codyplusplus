import * as vscode from 'vscode'
import { createSecretStorage } from '../../../core/secret-storage/secretStore.service'
import {
  CompletionRequest,
  CompletionResponse,
  DEFAULT_CONFIG,
  LLMProvider,
  LLMProviderError
} from '../types'

interface GraphQLResponse {
  data?: {
    currentUser?: {
      username: string
    }
  }
  error?: string
}

interface ValidationResult {
  isValid: boolean
  username?: string
  error?: string
}

export const createSourcegraphProvider = (context: vscode.ExtensionContext) => {
  const secretStorage = createSecretStorage(context)

  const getToken = () => secretStorage.getToken()
  const storeToken = (token: string) => secretStorage.storeToken(token)
  const deleteToken = () => secretStorage.deleteToken()

  const validateToken = async (token: string): Promise<ValidationResult> => {
    try {
      const headers = {
        Authorization: `token ${token}`,
        'Content-Type': 'application/json'
      }

      const response = await fetch('https://sourcegraph.com/.api/graphql', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          query: 'query { currentUser { username } }'
        })
      })

      const data = (await response.json()) as GraphQLResponse

      if (!response.ok) {
        return {
          isValid: false,
          error: data.error || 'Network request failed'
        }
      }

      const username = data?.data?.currentUser?.username

      if (!username) {
        return {
          isValid: false,
          error: 'Invalid token or insufficient permissions'
        }
      }

      return { isValid: true, username }
    } catch (error) {
      return {
        isValid: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  }

  const loginAndObtainToken = async (): Promise<string | undefined> => {
    const existingToken = await getToken()

    if (existingToken) {
      const validationResult = await validateToken(existingToken)
      if (validationResult.isValid) {
        await vscode.window.showInformationMessage(
          `Already authenticated as ${validationResult.username} with Sourcegraph.`
        )
        return existingToken
      }
    }

    const OPEN_SOURCEGRAPH_ACCESS_TOKEN_PAGE = "Open Sourcegraph's Page"
    const ADD_TOKEN_DIRECTLY = 'Add token directly'

    const result = await vscode.window.showInformationMessage(
      `Enter Sourcegraph's Access Token`,
      OPEN_SOURCEGRAPH_ACCESS_TOKEN_PAGE,
      ADD_TOKEN_DIRECTLY
    )

    if (result === OPEN_SOURCEGRAPH_ACCESS_TOKEN_PAGE) {
      vscode.window.showInformationMessage(
        'A browser window will open where you can create a Sourcegraph access token. After creating the token, copy it and paste it back here.'
      )

      const loginUrl = new URL('https://sourcegraph.com/sign-in')
      loginUrl.searchParams.set('returnTo', '/user/settings/tokens')
      await vscode.env.openExternal(vscode.Uri.parse(loginUrl.toString()))
    }

    if (result === OPEN_SOURCEGRAPH_ACCESS_TOKEN_PAGE || result === ADD_TOKEN_DIRECTLY) {
      while (true) {
        const token = await vscode.window.showInputBox({
          prompt: `Enter your Sourcegraph's access token`,
          password: true,
          placeHolder: 'Paste your token here...',
          ignoreFocusOut: true
        })

        if (!token) {
          throw new Error('No token provided')
        }

        vscode.window.showInformationMessage('Validating your token...')

        const validationResult = await validateToken(token)

        if (!validationResult.isValid) {
          await vscode.window.showErrorMessage(`Invalid token. Please try again.`)
          continue
        }

        await storeToken(token)
        return token
      }
    }
    return undefined
  }

  const logout = () => deleteToken()

  const complete = async (request: CompletionRequest): Promise<CompletionResponse> => {
    const token = await getToken()

    if (!token) {
      throw new LLMProviderError(
        'Authentication required. Please sign in to Sourcegraph.',
        LLMProvider.Sourcegraph,
        'NEEDS_AUTH'
      )
    }

    const config = {
      ...DEFAULT_CONFIG,
      ...request.config
    }

    const body = JSON.stringify({
      model: config.model,
      messages: request.messages,
      maxTokensToSample: config.maxTokens,
      temperature: config.temperature,
      stream: false,
      ...(config.responseFormat && { responseFormat: config.responseFormat })
    })

    try {
      const response = await fetch('https://sourcegraph.com/.api/completions/stream', {
        method: 'POST',
        headers: {
          Authorization: `token ${token}`,
          'Content-Type': 'application/json'
        },
        body
      })

      if (!response.ok) {
        const error = await response.text()
        throw new LLMProviderError(`API error: ${error}`, LLMProvider.Sourcegraph, 'API_ERROR')
      }

      const result = (await response.json()) as { completion: string }

      if (!result?.completion) {
        throw new LLMProviderError(
          'Invalid response: no completion found.',
          LLMProvider.Sourcegraph,
          'INVALID_RESPONSE'
        )
      }

      return { text: result.completion }
    } catch (error) {
      if (error instanceof LLMProviderError) {
        throw error // Re-throw if already an LLMProviderError
      }

      throw new LLMProviderError(
        `Completion request failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        LLMProvider.Sourcegraph,
        'COMPLETION_ERROR'
      )
    }
  }

  const validateConfig = async (): Promise<boolean> => {
    try {
      const token = await getToken()
      return !!token
    } catch (error) {
      console.error('Error validating Sourcegraph config:', error)
      return false
    }
  }

  return {
    providerIdentifier: LLMProvider.Sourcegraph,
    complete,
    validateConfig,
    loginAndObtainToken,
    logout
  }
}
