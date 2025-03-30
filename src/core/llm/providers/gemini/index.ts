import * as vscode from 'vscode'
import { CONFIG_KEYS, SUPPORTED_PROVIDERS } from '../../constants'
import { OpenAICompatibleProvider } from '../openai-compatible'

// Define the options interface
interface ProviderOptions {
  apiKey?: string
  baseUrl?: string // Included for consistency, but will be overridden
  model?: string // Included for consistency, but will be overridden
}

/**
 * LLM provider implementation for Google Gemini using its OpenAI-compatible API.
 * Inherits from OpenAICompatibleProvider and overrides configuration for Gemini endpoints.
 * Reference: https://ai.google.dev/gemini-api/docs/openai
 */
export class GeminiProvider extends OpenAICompatibleProvider {
  constructor(options?: ProviderOptions) {
    // Pass options to parent, but we will override specific properties.
    super(options)

    const config = vscode.workspace.getConfiguration('codyPlusPlus')

    // Find the specific Gemini provider details
    const geminiDetails = SUPPORTED_PROVIDERS.find(p => p.code === 'gemini')
    if (!geminiDetails) {
      // This should theoretically never happen
      throw new Error('Cody++: Gemini provider details not found in constants.')
    }

    // Prioritize options.apiKey, then config.
    this.apiKey = options?.apiKey ?? config.get<string>(CONFIG_KEYS.API_KEY)

    // ALWAYS override the baseUrl to point to the Gemini endpoint.
    this.baseUrl = geminiDetails.baseURL

    // Force the model to the Gemini specific default, ignoring options.model and config.
    this.model = geminiDetails.defaultModel

    // Force the paths to the Gemini specific ones.
    this.chatCompletionPath = geminiDetails.chatCompletionPath
    this.modelsPath = geminiDetails.modelsPath

    if (!this.apiKey) {
      // The parent's `complete` method checks for apiKey, but we can warn earlier.
      console.warn(
        'Cody++: GeminiProvider initialized without an API key. Please configure codyPlusPlus.llmApiKey.'
      )
    }
  }

  // The `complete` and `fetchModels` methods are inherited from OpenAICompatibleProvider
  // and will use the forced `this.baseUrl`, `this.model`, `this.chatCompletionPath`,
  // and `this.modelsPath` set here.
}
