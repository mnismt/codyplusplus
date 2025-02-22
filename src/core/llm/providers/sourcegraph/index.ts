import * as vscode from 'vscode'
import { BaseLLMProvider } from '../../types'
import { createSourcegraphAuth } from './auth'
import { createSourcegraphCompletion } from './completion'

export const createSourcegraphProvider = (context: vscode.ExtensionContext): BaseLLMProvider => {
  const auth = createSourcegraphAuth(context)
  const completion = createSourcegraphCompletion(auth)

  return {
    ...completion,
    loginAndObtainToken: auth.loginAndObtainToken,
    logout: auth.logout
  }
}
