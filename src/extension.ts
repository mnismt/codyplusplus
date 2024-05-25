import * as vscode from 'vscode'
import { addFolderCommand } from './commands/addFolder'

export function activate(context: vscode.ExtensionContext) {
  console.log('Cody++ is now active!')

  const addFolderDisposable = vscode.commands.registerCommand(
    'cody-plus-plus.addFolder',
    addFolderCommand
  )

  context.subscriptions.push(addFolderDisposable)
}

export function deactivate() {}
