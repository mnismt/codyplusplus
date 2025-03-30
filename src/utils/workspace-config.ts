import * as vscode from 'vscode'
import { CONFIG_KEYS, SUPPORTED_PROVIDER_CODES } from '../core/llm/constants'

export async function getProviderConfig(): Promise<SUPPORTED_PROVIDER_CODES | undefined> {
  return vscode.workspace
    .getConfiguration('codyPlusPlus')
    .get<SUPPORTED_PROVIDER_CODES>(CONFIG_KEYS.PROVIDER)
}

export async function getApiKeyConfig(): Promise<string | undefined> {
  return vscode.workspace.getConfiguration('codyPlusPlus').get<string>(CONFIG_KEYS.API_KEY)
}

export async function getBaseUrlConfig(): Promise<string | undefined> {
  return vscode.workspace.getConfiguration('codyPlusPlus').get<string>(CONFIG_KEYS.OPENAI_BASE_URL)
}

export async function getModelConfig(): Promise<string | undefined> {
  return vscode.workspace.getConfiguration('codyPlusPlus').get<string>(CONFIG_KEYS.MODEL)
}

/**
 * Updates the provider configuration in user settings
 */
export async function updateProviderConfig(provider: SUPPORTED_PROVIDER_CODES): Promise<void> {
  await vscode.workspace
    .getConfiguration('codyPlusPlus')
    .update(CONFIG_KEYS.PROVIDER, provider, true)
}

/**
 * Updates the API key configuration in user settings
 */
export async function updateApiKeyConfig(apiKey: string): Promise<void> {
  await vscode.workspace.getConfiguration('codyPlusPlus').update(CONFIG_KEYS.API_KEY, apiKey, true)
}

/**
 * Updates the base URL configuration for OpenAI-compatible providers
 */
export async function updateBaseUrlConfig(
  providerCode: string,
  baseUrl: string | undefined
): Promise<void> {
  if (providerCode === 'openai-compatible' && baseUrl !== undefined) {
    await vscode.workspace
      .getConfiguration('codyPlusPlus')
      .update(CONFIG_KEYS.OPENAI_BASE_URL, baseUrl || undefined, true)
  } else {
    // For non-compatible providers, clear the specific openaiBaseUrl setting
    await vscode.workspace
      .getConfiguration('codyPlusPlus')
      .update(CONFIG_KEYS.OPENAI_BASE_URL, undefined, true)
  }
}

/**
 * Updates the model configuration in user settings
 */
export async function updateModelConfig(model: string): Promise<void> {
  await vscode.workspace.getConfiguration('codyPlusPlus').update(CONFIG_KEYS.MODEL, model, true)
}

export async function verifyLLMProviderConfig(): Promise<boolean> {
  // Check if provider is set
  const provider = await getProviderConfig()
  if (!provider) {
    return false
  }

  // Check if API key is set
  const apiKey = await getApiKeyConfig()
  if (!apiKey) {
    return false
  }

  // Check if model is set
  const model = await getModelConfig()
  if (!model) {
    return false
  }

  // If provider is openai-compatible, check if base URL is set
  if (provider === 'openai-compatible') {
    const baseUrl = await getBaseUrlConfig()
    if (!baseUrl) {
      return false
    }
  }

  return true
}
