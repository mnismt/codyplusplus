import * as vscode from 'vscode'
import { CONFIG_KEYS, SUPPORTED_PROVIDERS } from '../../constants'
import { OpenAICompatibleProvider } from '../openai-compatible'

// Define the options interface
interface ProviderOptions {
  apiKey?: string
  baseUrl?: string // Included for consistency, but will be ignored
  model?: string // Included for consistency, but will be ignored
}

/**
 * LLM provider implementation specifically for the official OpenAI API.
 * Inherits from OpenAICompatibleProvider but forces the use of the default OpenAI base URL.
 */
export class OpenAIProvider extends OpenAICompatibleProvider {
  constructor(options?: ProviderOptions) {
    // Pass options to parent, but we will override specific properties.
    super(options)

    const config = vscode.workspace.getConfiguration('codyPlusPlus')

    // Find the specific OpenAI provider details
    const openAIDetails = SUPPORTED_PROVIDERS.find(p => p.code === 'openai')
    if (!openAIDetails) {
      // This should theoretically never happen if constants are defined correctly
      throw new Error('Cody++: OpenAI provider details not found in constants.')
    }

    // ALWAYS set the baseUrl to the default OpenAI endpoint for this specific provider,
    // ignoring any options.baseUrl or custom base URL setting.
    this.baseUrl = openAIDetails.baseURL

    // Re-read API key from options or config.
    // Prioritize options if passed during temporary creation (e.g., testing).
    this.apiKey = options?.apiKey ?? config.get<string>(CONFIG_KEYS.API_KEY)

    // Force the model to the OpenAI specific default, ignoring options.model and config.
    this.model = openAIDetails.defaultModel

    // Force the paths to the OpenAI specific ones.
    this.chatCompletionPath = openAIDetails.chatCompletionPath
    this.modelsPath = openAIDetails.modelsPath

    if (!this.apiKey) {
      // The parent's `complete` method checks for apiKey, but we can warn earlier.
      console.warn(
        'Cody++: OpenAIProvider initialized without an API key. Please configure codyPlusPlus.llmApiKey.'
      )
    }
  }

  // The `complete` and `fetchModels` methods are inherited from OpenAICompatibleProvider
  // and will use the forced `this.baseUrl`, `this.model`, `this.chatCompletionPath`,
  // and `this.modelsPath` set here.
}
