import * as vscode from 'vscode'
import { CustomCommandsWebview } from '../views/CustomCommandsWebview'

export function addCustomCommand(context: vscode.ExtensionContext) {
  CustomCommandsWebview.createOrShow(context.extensionUri, context.extensionMode)
}
