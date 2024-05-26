import * as vscode from 'vscode'
import { addFolderCommand } from './commands/addFolder'
import { CustomCommandsTreeView } from './views/CustomCommandsTreeView'

export function activate(context: vscode.ExtensionContext) {
  console.log('Cody++ is now active!')

  const addFolderDisposable = vscode.commands.registerCommand(
    'cody-plus-plus.addFolder',
    addFolderCommand
  )

  const addCustomCommandDisposable = vscode.commands.registerCommand(
    'cody-plus-plus.addCustomCommand',
    () => {}
  )

  const customCommandsTreeView = new CustomCommandsTreeView()
  vscode.window.registerTreeDataProvider('customCommands', customCommandsTreeView)

  context.subscriptions.push(addFolderDisposable, addCustomCommandDisposable)
}

export function deactivate() {}
