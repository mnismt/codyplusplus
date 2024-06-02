import * as vscode from 'vscode'
import { addCustomCommand } from './commands/addCustomCommand'
import { addFolderCommand } from './commands/addFolder'
import { CustomCommandService } from './services/customCommand.service'
import { CustomCommandsTreeView } from './views/CustomCommandsTreeView'

export function activate(context: vscode.ExtensionContext) {
  console.log('Cody++ is now active!')
  const customCommandService = CustomCommandService.getInstance()

  const addFolderDisposable = vscode.commands.registerCommand(
    'cody-plus-plus.addFolder',
    addFolderCommand
  )

  const addCustomCommandDisposable = vscode.commands.registerCommand(
    'cody-plus-plus.addCustomCommand',
    () => addCustomCommand(context)
  )

  const editCommandDisposable = vscode.commands.registerCommand(
    'codyPlusPlus.editCommand',
    (item: any) => {
      // Implement the edit functionality here
      vscode.window.showInformationMessage(`Edit command: ${item.commandId}`)
    }
  )

  const deleteCommandDisposable = vscode.commands.registerCommand(
    'codyPlusPlus.deleteCommand',
    (item: any) => {
      customCommandService.removeCommand(item.commandId)
      vscode.window.showInformationMessage(`Delete command: ${item.commandId}`)
    }
  )

  const customCommandsTreeView = new CustomCommandsTreeView()
  vscode.window.registerTreeDataProvider('customCommands', customCommandsTreeView)

  context.subscriptions.push(
    addFolderDisposable,
    addCustomCommandDisposable,
    editCommandDisposable,
    deleteCommandDisposable
  )
}

export function deactivate() {}
