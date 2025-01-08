import * as vscode from 'vscode'
import z from 'zod'
import { CODY_COMMAND } from '../constants/cody'
import { CustomCommandService, CustomCommandsSchema } from '../services/customCommand.service'

interface CommandTreeItem extends vscode.TreeItem {
  commandId: string
}

export class CustomCommandsTreeView implements vscode.TreeDataProvider<CommandTreeItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<CommandTreeItem | undefined | void> =
    new vscode.EventEmitter<CommandTreeItem | undefined | void>()
  readonly onDidChangeTreeData: vscode.Event<CommandTreeItem | undefined | void> =
    this._onDidChangeTreeData.event

  private customCommandService: CustomCommandService
  private commands: z.infer<typeof CustomCommandsSchema> = {}

  constructor() {
    this.customCommandService = CustomCommandService.getInstance()
    this.customCommandService.onDidChangeCommands(() => this.refresh())
  }

  getTreeItem(element: CommandTreeItem): vscode.TreeItem {
    return element
  }

  async getChildren(element?: CommandTreeItem): Promise<CommandTreeItem[]> {
    if (!element) {
      this.commands = this.customCommandService.getCommands()
      const commandKeys = Object.keys(this.commands)

      return commandKeys.map(commandId => {
        const command = this.commands[commandId]
        let iconPath: vscode.ThemeIcon

        switch (command.mode) {
          case 'ask':
            iconPath = new vscode.ThemeIcon('comment-discussion')
            break
          case 'insert':
            iconPath = new vscode.ThemeIcon('add')
            break
          case 'edit':
            iconPath = new vscode.ThemeIcon('edit')
            break
          default:
            iconPath = new vscode.ThemeIcon('comment-discussion')
            break
        }

        return {
          label: commandId,
          tooltip: command.description,
          commandId: commandId,
          collapsibleState: vscode.TreeItemCollapsibleState.None,
          iconPath: iconPath,
          contextValue: 'customCommand',
          command: {
            title: `Execute ${commandId}`,
            command: `${CODY_COMMAND.COMMAND.CUSTOM}.${commandId}`,
            arguments: [commandId]
          }
        } as CommandTreeItem
      })
    }
    return []
  }

  refresh(): void {
    this._onDidChangeTreeData.fire()
  }
}
