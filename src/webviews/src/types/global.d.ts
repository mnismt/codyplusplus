import { VIEW } from '../../../constants/webview'
import { CreateCustomCommand } from '../../../services/customCommand.service'

declare global {
  interface Window {
    VIEW?: keyof typeof VIEW
    initialState?: CreateCustomCommand
  }
}

export {}
