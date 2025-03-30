import * as vscode from 'vscode'
import { LLM_PROVIDER_API_BASE_URL, LLMProvider } from '../constants/llm'
import { OpenAIProvider } from '../core/llm/openai-provider'

export const selectProvider = async (): Promise<boolean> => {
  // Currently we only support OpenAI, but this function is designed
  // to be extensible for future Langchain integration
  const selectedProvider = LLMProvider.OpenAI

  await vscode.workspace
    .getConfiguration('codyPlusPlus')
    .update('llmProvider', selectedProvider, true)

  // Prompt for API key
  const apiKey = await vscode.window.showInputBox({
    prompt: `Enter your OpenAI API key`,
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

  // For OpenAI, prompt for base URL
  const currentBaseUrl = vscode.workspace
    .getConfiguration('codyPlusPlus')
    .get<string>('openaiBaseUrl')

  const baseUrl = await vscode.window.showInputBox({
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

  // Ask for model
  const currentModel = vscode.workspace.getConfiguration('codyPlusPlus').get<string>('llmModel')

  // Fetch list of models
  const models = await OpenAIProvider.fetchModels(
    baseUrl || LLM_PROVIDER_API_BASE_URL[LLMProvider.OpenAI],
    apiKey
  )

  let model: string | undefined
  if (models.length > 0) {
    model = await vscode.window.showQuickPick(models, {
      placeHolder: 'Select a model',
      title: `Choose OpenAI Model`
    })
  } else {
    model = await vscode.window.showInputBox({
      prompt: 'Enter model name (leave empty for default)',
      placeHolder: 'gpt-4o-mini',
      value: currentModel,
      ignoreFocusOut: true
    })
  }

  // Only update if user entered something or explicitly cleared it
  if (model !== undefined) {
    await vscode.workspace
      .getConfiguration('codyPlusPlus')
      .update('llmModel', model || 'gpt-4o-mini', true)
  }

  await vscode.workspace.getConfiguration('codyPlusPlus').update('llmApiKey', apiKey, true)

  void vscode.window.showInformationMessage(`Successfully configured OpenAI as LLM provider`)

  return true
}
