export interface OpenAIModelsResponse {
  data: Array<{ id: string }>
}

export interface OpenAICompletionResponse {
  id: string
  object: string
  created: number
  model: string
  choices: Array<{
    message: {
      content: string
      role: string
    }
    index: number
    logprobs: null
    finish_reason: string
  }>
  usage: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}
