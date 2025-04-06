import * as vscode from 'vscode'
import { CustomCommandService } from '../services/customCommand.service'
import { CustomCommandsWebview } from '../views/CustomCommandsWebview'

const customCommandService = CustomCommandService.getInstance()

export function addCustomCommand(context: vscode.ExtensionContext) {
  CustomCommandsWebview.createOrShow(context.extensionUri, context.extensionMode)
}

export async function editCustomCommand(context: vscode.ExtensionContext, commandId: string) {
  try {
    const commandData = await customCommandService.getCommand(commandId)
    if (!commandData) {
      vscode.window.showErrorMessage(`Command ${commandId} does not exist.`)
      return
    }

    CustomCommandsWebview.createOrShow(context.extensionUri, context.extensionMode, {
      id: commandId,
      data: commandData
    })
  } catch (error) {
    vscode.window.showErrorMessage(
      `Failed to get command ${commandId}: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}
