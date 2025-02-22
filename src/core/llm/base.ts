import * as vscode from 'vscode'
import { CompletionRequest, CompletionResponse, LLMProvider } from './types'

import { LLMProviderError } from './types'

interface BaseLLMProvider {
  providerIdentifier: LLMProvider
  complete: (request: CompletionRequest) => Promise<CompletionResponse>
}

export const createBaseLLMProvider = (
  providerIdentifier: LLMProvider,
  completeFn: (request: CompletionRequest) => Promise<CompletionResponse>
): BaseLLMProvider => {
  return {
    providerIdentifier,
    complete: completeFn
  }
}

export const handleError = (provider: LLMProvider, error: unknown): never => {
  let errorMessage: string
  let errorCode: string | undefined

  if (error instanceof LLMProviderError) {
    errorMessage = error.message
    errorCode = error.code
  } else if (error instanceof Error) {
    errorMessage = error.message
  } else {
    errorMessage = String(error)
  }

  if (errorCode) {
    vscode.window.showErrorMessage(`LLM (${provider}) error: [${errorCode}] ${errorMessage}`)
  } else {
    vscode.window.showErrorMessage(`LLM (${provider}) error: ${errorMessage}`)
  }

  throw error
}
