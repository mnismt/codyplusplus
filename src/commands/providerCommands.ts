import * as vscode from 'vscode'
import { LLM_PROVIDERS } from '../constants/llm'

async function fetchOpenAIModels(baseUrl: string, apiKey: string): Promise<string[]> {
  try {
    console.log(`Fetching OpenAI models from ${baseUrl}/models`)
    const response = await fetch(`${baseUrl}/models`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      }
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch models: ${response.statusText}`)
    }

    const data = (await response.json()) as { data: { id: string }[] }
    return data.data.map((model: { id: string }) => model.id)
  } catch (error) {
    console.error('Error fetching OpenAI models:', error)
    return []
  }
}

export const selectProvider = async (): Promise<boolean> => {
  const avaiableProviders = Object.values(LLM_PROVIDERS)
  const selectedProvider = await vscode.window.showQuickPick(avaiableProviders, {
    placeHolder: 'Select LLM Provider',
    title: 'Select LLM Provider'
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
    placeHolder: 'Paste your API key here...'
  })

  if (!apiKey) {
    void vscode.window.showInformationMessage(
      'API key not provided. You can set it by open command palette and searching for "Cody++: Set LLM Provider"'
    )
    return false
  }

  // For OpenAI and compatible providers, prompt for base URL and model
  if (selectedProvider === LLM_PROVIDERS.openai) {
    const currentBaseUrl = vscode.workspace
      .getConfiguration('codyPlusPlus')
      .get<string>('openaiBaseUrl')

    const baseUrl = await vscode.window.showInputBox({
      prompt: 'Enter base URL for OpenAI API (leave empty for default)',
      placeHolder: 'https://api.openai.com/v1',
      value: currentBaseUrl
    })

    // Only update if user entered something or explicitly cleared it
    if (baseUrl !== undefined) {
      await vscode.workspace
        .getConfiguration('codyPlusPlus')
        .update('openaiBaseUrl', baseUrl || 'https://api.openai.com/v1', true)
    }

    // Ask for model
    const currentModel = vscode.workspace
      .getConfiguration('codyPlusPlus')
      .get<string>('openaiModel')

    // Fetch list of models from OpenAI API
    const models = await fetchOpenAIModels(baseUrl || 'https://api.openai.com/v1', apiKey)
    console.log(`Fetched models: ${JSON.stringify(models)}`)

    let model: string | undefined
    if (models.length > 0) {
      model = await vscode.window.showQuickPick(models, {
        placeHolder: 'Select a model',
        title: 'Choose OpenAI Model'
      })
    } else {
      model = await vscode.window.showInputBox({
        prompt: 'Enter model name (leave empty for default)',
        placeHolder: 'gpt-4o-mini',
        value: currentModel
      })
    }

    // Only update if user entered something or explicitly cleared it
    if (model !== undefined) {
      await vscode.workspace
        .getConfiguration('codyPlusPlus')
        .update('openaiModel', model || 'gpt-4o-mini', true)
    }
  }

  await vscode.workspace.getConfiguration('codyPlusPlus').update('llmApiKey', apiKey, true)

  void vscode.window.showInformationMessage(
    `Successfully configured ${selectedProvider} as LLM provider`
  )
  return true
}
