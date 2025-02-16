import * as vscode from 'vscode'
import { SecretStorage } from './secret-store.service'

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

export class SourcegraphService {
  private static instance: SourcegraphService
  private secretStorage: SecretStorage

  private context: vscode.ExtensionContext

  private constructor(context: vscode.ExtensionContext) {
    this.context = context
    this.secretStorage = SecretStorage.getInstance(context)
  }

  public static getInstance(context: vscode.ExtensionContext): SourcegraphService {
    if (!SourcegraphService.instance) {
      SourcegraphService.instance = new SourcegraphService(context)
    }
    return SourcegraphService.instance
  }

  public async getToken(): Promise<string | undefined> {
    return await this.secretStorage.getToken()
  }

  public async loginAndObtainToken(): Promise<string | undefined> {
    // Before we start, check if we already have a token
    const existingToken = await this.getToken()

    if (existingToken) {
      const validationResult = await this.validateToken(existingToken)
      if (validationResult.isValid) {
        await vscode.window.showInformationMessage(
          `Already authenticated as ${validationResult.username} with Sourcegraph. You can now use Smart File Selection feature.`
        )
        return existingToken
      }
    }

    // Show login options using VSCode UI
    const result = await vscode.window.showInformationMessage(
      'Sign in to Sourcegraph',
      'Sign In',
      'Enter the token'
    )

    if (result === 'Sign In') {
      // First show an info message about the next steps
      vscode.window.showInformationMessage(
        'A browser window will open where you can create a Sourcegraph access token. After creating the token, copy it and paste it back here.'
      )

      // Open Sourcegraph tokens page
      const loginUrl = new URL('https://sourcegraph.com/sign-in')
      loginUrl.searchParams.set('returnTo', '/user/settings/tokens')
      await vscode.env.openExternal(vscode.Uri.parse(loginUrl.toString()))
    }

    if (result === 'Sign In' || result === 'Enter the token') {
      // Keep showing the input box until either a valid token is provided or user cancels
      while (true) {
        // Prompt for token input
        const token = await vscode.window.showInputBox({
          prompt: 'Enter your Sourcegraph API token',
          password: true,
          placeHolder: 'Paste your token here...',
          ignoreFocusOut: true // This keeps the input box open when focus is lost
        })

        if (!token) {
          throw new Error('No token provided')
        }

        // Show a loading message while we validate the token
        vscode.window.showInformationMessage('Validating your token...')

        // Validate token
        const validationResult = await this.validateToken(token)

        if (!validationResult.isValid) {
          // Show error and continue the loop to let user try again
          await vscode.window.showErrorMessage(`Invalid token. Please try again.`)
          continue
        } else {
          // If we get here, token is valid
          await vscode.window.showInformationMessage(
            `Successfully authenticated as ${validationResult.username} with Sourcegraph. You can now use Cody++ features.`
          )
        }

        // If we get here, token is valid
        await this.secretStorage.storeToken(token)
        return token
      }
    }
    return undefined
  }

  async validateToken(token: string): Promise<ValidationResult> {
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

  public async logout(): Promise<void> {
    await this.secretStorage.deleteToken()
  }
}
