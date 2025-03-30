import * as vscode from 'vscode'
import { API_ENDPOINTS, CONFIG_KEYS, DEFAULT_MODELS } from '../../constants'
import { OpenAICompatibleProvider } from '../openai-compatible'

/**
 * LLM provider implementation for Google Gemini using its OpenAI-compatible API.
 * Inherits from OpenAICompatibleProvider and overrides configuration for Gemini endpoints.
 * Reference: https://ai.google.dev/gemini-api/docs/openai
 */
export class GeminiProvider extends OpenAICompatibleProvider {
  // Note: Private fields apiKey, baseUrl, model, and headers are inherited from OpenAICompatibleProvider

  constructor() {
    // Call the parent constructor to potentially initialize default values or common logic
    super()

    const config = vscode.workspace.getConfiguration('codyPlusPlus')

    // Use the same API key configuration setting as OpenAI for now.
    // Consider adding a specific 'codyPlusPlus.geminiApiKey' if differentiation is needed.
    this.apiKey = config.get<string>(CONFIG_KEYS.API_KEY)

    // Override the baseUrl to point to the Gemini OpenAI-compatible endpoint.
    this.baseUrl = API_ENDPOINTS.GEMINI.BASE_URL

    // Override the model, using the specific LLM model setting or the Gemini default.
    // This assumes the user selects a Gemini-compatible model when configuring 'codyPlusPlus.llmModel'.
    this.model = config.get<string>(CONFIG_KEYS.MODEL) || DEFAULT_MODELS.GEMINI

    if (!this.apiKey) {
      // The parent's `complete` method checks for apiKey, but we can warn earlier.
      console.warn(
        'Cody++: GeminiProvider initialized without an API key. Please configure codyPlusPlus.llmApiKey.'
      )
      // Optionally throw new Error(ERROR_MESSAGES.NO_TOKEN); if preferred
    }

    // No need to override headers unless Gemini requires specific ones different from OpenAI defaults.
  }

  // The `complete` method is inherited from OpenAICompatibleProvider and will use the
  // `this.apiKey`, `this.baseUrl`, and `this.model` set in this constructor.

  // The static `fetchModels` method is also inherited. To fetch Gemini models,
  // it would need to be called with the Gemini base URL and API key, like:
  // GeminiProvider.fetchModels(API_ENDPOINTS.GEMINI.BASE_URL, apiKey)
  // The provider selection logic should handle passing the correct arguments.
}
