import * as vscode from 'vscode'
import { addCustomCommand, editCustomCommand } from './commands/addCustomCommand'
import { addFolderCommand } from './commands/addFolder'
import { addFile, addSelection } from './commands/addToCody'
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
    async (item: any) => editCustomCommand(context, item.commandId)
  )

  const deleteCommandDisposable = vscode.commands.registerCommand(
    'codyPlusPlus.deleteCommand',
    async (item: any) => {
      const confirmation = await vscode.window.showWarningMessage(
        `Are you sure you want to delete the "${item.commandId}" command?`,
        { modal: true },
        'Yes',
        'No'
      )

      if (confirmation === 'Yes') {
        customCommandService.removeCommand(item.commandId)
        vscode.window.showInformationMessage(`Command "${item.commandId}" deleted successfully.`)
      }
    }
  )

  const addFileToCodyDisposable = vscode.commands.registerCommand('cody-plus-plus.addFile', addFile)

  const addSelectionToCodyDisposable = vscode.commands.registerCommand(
    'cody-plus-plus.addSelection',
    async (contextSelection: vscode.Uri, allSelections: vscode.Uri[]) => {
      const urisToAdd = allSelections || [contextSelection]
      await addSelection(urisToAdd)
    }
  )

  const customCommandsTreeView = new CustomCommandsTreeView()
  vscode.window.registerTreeDataProvider('customCommands', customCommandsTreeView)

  context.subscriptions.push(
    addFolderDisposable,
    addCustomCommandDisposable,
    editCommandDisposable,
    deleteCommandDisposable,
    addFileToCodyDisposable,
    addSelectionToCodyDisposable
  )
}

export function deactivate() {
  if (CustomCommandService && CustomCommandService.getInstance()) {
    CustomCommandService.getInstance().disposeFileWatcher()
  }
}
