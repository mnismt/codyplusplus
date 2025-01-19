import * as vscode from 'vscode'
import { CODY_COMMAND } from '../constants/cody'
import { VIEW } from '../constants/webview'
import { CustomCommandService } from '../services/customCommand.service'
import { BaseWebview } from './BaseWebview'

export class MainWebviewView extends BaseWebview implements vscode.WebviewViewProvider {
  public static readonly viewType = 'mainView'
  private _view?: vscode.WebviewView
  private customCommandService: CustomCommandService

  constructor(extensionUri: vscode.Uri, extensionMode: vscode.ExtensionMode) {
    super(extensionUri, extensionMode)
    this.customCommandService = CustomCommandService.getInstance()
    this.customCommandService.onDidChangeCommands(() => {
      if (this._view) {
        this._view.webview.postMessage({
          type: 'refresh',
          commands: this.customCommandService.getCommands()
        })
      }
    })
  }

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ) {
    this._view = webviewView

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this._extensionUri]
    }

    webviewView.webview.html = this._getHtmlForWebview(
      webviewView.webview,
      `window.VIEW = '${VIEW.COMMAND_LIST}';`
    )

    webviewView.webview.onDidReceiveMessage(async message => {
      switch (message.type) {
        case 'addCommand':
          vscode.commands.executeCommand('cody-plus-plus.addCustomCommand', message.command)
          break
        case 'openTutorialVideo':
          vscode.env.openExternal(vscode.Uri.parse('https://youtu.be/ruVgjt0zIzk'))
          break
        case 'getCommands':
          webviewView.webview.postMessage({
            type: 'refresh',
            commands: this.customCommandService.getCommands()
          })
          break
        case 'deleteCommand':
          await this.customCommandService.removeCommand(message.commandId)
          vscode.window.showInformationMessage(
            `Command "${message.commandId}" deleted successfully.`
          )
          break
        case 'editCommand':
          vscode.commands.executeCommand('cody-plus-plus.editCommand', {
            commandId: message.commandId
          })
          break
        case 'executeCommand':
          vscode.commands.executeCommand(
            `${CODY_COMMAND.COMMAND.CUSTOM}.${message.commandId}`,
            message.commandId
          )
          break
      }
    })
  }
}
