import * as vscode from 'vscode'
import { COMMANDS, VIEW } from '../constants/webview'
import {
  CreateCommandSchema,
  CreateCustomCommand,
  CustomCommandService,
  UpdateCommandSchema,
  UpdateCustomCommand
} from '../services/customCommand.service'
import { BaseWebview } from './BaseWebview'

export class CustomCommandsWebview extends BaseWebview {
  public static currentPanel: CustomCommandsWebview | undefined
  private customCommandService: CustomCommandService
  private readonly _panel: vscode.WebviewPanel

  private constructor(
    panel: vscode.WebviewPanel,
    extensionUri: vscode.Uri,
    extensionMode: vscode.ExtensionMode,
    initialState?: any
  ) {
    super(extensionUri, extensionMode)
    this._panel = panel

    // Set the webview's initial HTML content
    this._panel.webview.html = this._getHtmlForWebview(
      this._panel.webview,
      `window.VIEW = '${VIEW.CUSTOM_COMMAND_FORM_VIEW}';${
        initialState ? ` window.initialState = ${JSON.stringify(initialState)};` : ''
      }`
    )
    this.customCommandService = CustomCommandService.getInstance()

    // Handle messages from the webview
    this._panel.webview.onDidReceiveMessage(
      message => {
        this._handleMessage(message)
      },
      undefined,
      []
    )
  }

  public static createOrShow(
    extensionUri: vscode.Uri,
    extensionMode: vscode.ExtensionMode,
    initialState?: CreateCustomCommand
  ) {
    const column = vscode.window.activeTextEditor
      ? vscode.window.activeTextEditor.viewColumn
      : undefined

    const panel = vscode.window.createWebviewPanel(
      'customCommandsWebview',
      initialState ? `Edit Command "${initialState.id}"` : 'Add Custom Command',
      column || vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        enableFindWidget: true,
        localResourceRoots: [vscode.Uri.joinPath(extensionUri)],
        enableCommandUris: true
      }
    )
    panel.iconPath = vscode.Uri.joinPath(extensionUri, 'resources', 'cody-plus-plus.png')

    CustomCommandsWebview.currentPanel = new CustomCommandsWebview(
      panel,
      extensionUri,
      extensionMode,
      initialState
    )
  }

  private _handleMessage(message: any) {
    switch (message.command) {
      case COMMANDS.CREATE_COMMAND:
        this._createCommand(message)
        break
      case COMMANDS.UPDATE_COMMAND:
        this._updateCommand(message)
        break
      default:
        console.log('Received unknown message:', message)
    }
  }

  private async _createCommand(message: CreateCustomCommand) {
    try {
      const parsedCommandData = CreateCommandSchema.parse(message)
      const { id, data } = parsedCommandData
      await this.customCommandService.addCommand(id, data)
      vscode.window.showInformationMessage(`Command ${id} created successfully.`)
    } catch (error: any) {
      vscode.window.showErrorMessage(`Failed to create command (${error.message})`)
    }
  }

  private async _updateCommand(message: UpdateCustomCommand) {
    try {
      const parsedCommandData = UpdateCommandSchema.parse(message)
      const { id, oldId, data } = parsedCommandData
      await this.customCommandService.updateCommand({ id, oldId, data })
      vscode.window.showInformationMessage(`Command ${id} updated successfully.`)
    } catch (error: any) {
      vscode.window.showErrorMessage(`Failed to update command (${error.message})`)
    }
  }
}
