import * as vscode from 'vscode'
import { createSecretStorage } from '../../../../core/secret-storage'

interface GraphQLResponse {
  data?: {
    currentUser?: {
      username: string
    }
  }
  error?: string
}

export interface ValidationResult {
  isValid: boolean
  username?: string
  error?: string
}

export interface AuthOperations {
  getToken: () => Promise<string | undefined>
  validateToken: (token?: string) => Promise<ValidationResult>
  loginAndObtainToken: () => Promise<string | undefined>
  logout: () => Promise<void>
}

export const createSourcegraphAuth = (context: vscode.ExtensionContext): AuthOperations => {
  const secretStorage = createSecretStorage(context)

  const getToken = () => secretStorage.getToken()
  const storeToken = (token: string) => secretStorage.storeToken(token)
  const deleteToken = () => secretStorage.deleteToken()

  const validateToken = async (token?: string): Promise<ValidationResult> => {
    if (!token) {
      return {
        isValid: false,
        error: 'No token provided'
      }
    }

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

    const TITLE = `Add Sourcegraph Access Token`
    const OPEN_SOURCEGRAPH_ACCESS_TOKEN_PAGE = "Open Sourcegraph's Page"
    const ADD_TOKEN_DIRECTLY = 'Enter Token Directly'

    const result = await vscode.window.showInformationMessage(
      TITLE,
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

  return {
    getToken,
    validateToken,
    loginAndObtainToken,
    logout
  }
}
