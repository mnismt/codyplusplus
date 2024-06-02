import * as vscode from 'vscode'
import z from 'zod'
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

      return Object.keys(this.commands).map(
        commandId =>
          ({
            label: commandId,
            tooltip: this.commands[commandId].description,
            commandId: commandId,
            collapsibleState: vscode.TreeItemCollapsibleState.None,
            iconPath: new vscode.ThemeIcon('terminal-bash'),
            contextValue: 'customCommand'
          }) as CommandTreeItem
      )
    }
    return []
  }
  refresh(): void {
    this._onDidChangeTreeData.fire()
  }
}
