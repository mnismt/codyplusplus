import { CreateCustomCommand } from '../../../services/customCommand.service'

declare global {
  interface Window {
    isCommandList?: boolean
    initialState?: CreateCustomCommand
  }
}

export {}
