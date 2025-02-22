import * as vscode from 'vscode'
import { BaseLLMProvider } from '../../types'
import { createSourcegraphAuth } from './auth'
import { createSourcegraphCompletion } from './completion'

export const createSourcegraphProvider = async (
  context: vscode.ExtensionContext
): Promise<BaseLLMProvider> => {
  const auth = createSourcegraphAuth(context)
  const completion = createSourcegraphCompletion(auth)

  const { isValid } = await auth.validateToken(await auth.getToken())

  return {
    ...completion,
    loginAndObtainToken: auth.loginAndObtainToken,
    logout: auth.logout,
    isAuthenticated: isValid
  }
}
