import { BaseLLMProvider } from '../../types'
import { SourcegraphProvider } from './index'

export const createSourcegraphProvider = (): BaseLLMProvider => {
  return new SourcegraphProvider()
}
