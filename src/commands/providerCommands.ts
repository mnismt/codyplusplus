import * as vscode from 'vscode'
import { LLM_PROVIDER_API_BASE_URL, LLMProvider } from '../constants/llm'
import { OpenAIProvider } from '../core/llm/providers/openai'
import { SourcegraphProvider } from '../core/llm/providers/sourcegraph'

export const selectProvider = async (): Promise<boolean> => {
  const availableProviders = [LLMProvider.OpenAI, LLMProvider.Sourcegraph]
  const selectedProvider = await vscode.window.showQuickPick(availableProviders, {
    placeHolder: 'Select LLM Provider',
    title: 'Select LLM Provider',
    ignoreFocusOut: true
  })

  if (!selectedProvider) {
    return false
  }

  await vscode.workspace
    .getConfiguration('codyPlusPlus')
    .update('llmProvider', selectedProvider, true)

  // After selecting provider, prompt for API key
  const apiKey = await vscode.window.showInputBox({
    prompt: `Enter your ${selectedProvider} API key`,
    password: true,
    placeHolder: 'Paste your API key here...',
    ignoreFocusOut: true
  })

  if (!apiKey) {
    void vscode.window.showInformationMessage(
      'API key not provided. You can set it by open command palette and searching for "Cody++: Set LLM Provider"'
    )
    return false
  }

  // For providers that require base URL and model selection
  if (selectedProvider === LLMProvider.OpenAI || selectedProvider === LLMProvider.Sourcegraph) {
    const currentBaseUrl = vscode.workspace
      .getConfiguration('codyPlusPlus')
      .get<string>('openaiBaseUrl')

    let baseUrl = currentBaseUrl
    if (selectedProvider === LLMProvider.OpenAI) {
      baseUrl = await vscode.window.showInputBox({
        prompt: 'Enter base URL for OpenAI API (leave empty for default)',
        placeHolder: LLM_PROVIDER_API_BASE_URL[LLMProvider.OpenAI],
        value: currentBaseUrl,
        ignoreFocusOut: true
      })

      // Only update if user entered something or explicitly cleared it
      if (baseUrl !== undefined) {
        await vscode.workspace
          .getConfiguration('codyPlusPlus')
          .update('openaiBaseUrl', baseUrl || LLM_PROVIDER_API_BASE_URL[LLMProvider.OpenAI], true)
      }
    } else {
      baseUrl = LLM_PROVIDER_API_BASE_URL[LLMProvider.Sourcegraph]
    }

    // Ask for model
    const currentModel = vscode.workspace.getConfiguration('codyPlusPlus').get<string>('llmModel')

    // Fetch list of models based on provider
    const models =
      selectedProvider === LLMProvider.OpenAI
        ? await OpenAIProvider.fetchModels(
            baseUrl || LLM_PROVIDER_API_BASE_URL[LLMProvider.OpenAI],
            apiKey
          )
        : await SourcegraphProvider.fetchModels(
            baseUrl || LLM_PROVIDER_API_BASE_URL[LLMProvider.Sourcegraph],
            apiKey
          )

    let model: string | undefined
    if (models.length > 0) {
      model = await vscode.window.showQuickPick(models, {
        placeHolder: 'Select a model',
        title: `Choose ${selectedProvider} Model`
      })
    } else {
      model = await vscode.window.showInputBox({
        prompt: 'Enter model name (leave empty for default)',
        placeHolder:
          selectedProvider === LLMProvider.OpenAI ? 'gpt-4o-mini' : 'claude-3-5-sonnet-latest',
        value: currentModel,
        ignoreFocusOut: true
      })
    }

    // Only update if user entered something or explicitly cleared it
    if (model !== undefined) {
      await vscode.workspace
        .getConfiguration('codyPlusPlus')
        .update(
          'llmModel',
          model ||
            (selectedProvider === LLMProvider.OpenAI ? 'gpt-4o-mini' : 'claude-3-5-sonnet-latest'),
          true
        )
    }
  }

  await vscode.workspace.getConfiguration('codyPlusPlus').update('llmApiKey', apiKey, true)

  void vscode.window.showInformationMessage(
    `Successfully configured ${selectedProvider} as LLM provider`
  )
  return true
}
