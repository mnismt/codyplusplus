// Import VS Code API and necessary modules
import * as vscode from 'vscode'
// Import custom command handlers
import { addCustomCommand, editCustomCommand } from './commands/addCustomCommand'
import { addFile, addFilesSmart, addFolderCommand, addSelection } from './commands/addToCody'
// Import services and views
import { CustomCommandService } from './services/customCommand.service'
import { SourcegraphService } from './services/sourcegraph.service'
import { TelemetryService } from './services/telemetry.service'
import { MainWebviewView } from './views/MainWebviewView'

// Function called when the extension is activated
export async function activate(context: vscode.ExtensionContext) {
  console.log('Cody++ is now active!')

  // Initialize telemetry
  TelemetryService.getInstance()

  // Initialize the singleton service for managing custom commands
  const customCommandService = CustomCommandService.getInstance()

  // Register the "Add Folder" command, which adds all files in a folder to Cody
  const addFolderDisposable = vscode.commands.registerCommand(
    'cody-plus-plus.addFolder',
    (uri: vscode.Uri) => addFolderCommand(uri, true)
  )

  // Register the "Add Shallow Folder" command, which adds only files in the current folder to Cody
  const addShallowFolderDisposable = vscode.commands.registerCommand(
    'cody-plus-plus.addShallowFolder',
    (uri: vscode.Uri) => addFolderCommand(uri, false)
  )

  // Register the "Add File" command, which adds a single file to Cody
  const addFileDisposable = vscode.commands.registerCommand('cody-plus-plus.addFile', addFile)

  const addSelectionDisposable = vscode.commands.registerCommand(
    'cody-plus-plus.addSelection',
    async (contextSelection: vscode.Uri, allSelections: vscode.Uri[]) => {
      const urisToAdd = allSelections || [contextSelection]
      await addSelection(urisToAdd, false)
    }
  )

  const addSelectionRecursiveDisposable = vscode.commands.registerCommand(
    'cody-plus-plus.addSelectionRecursive',
    async (contextSelection: vscode.Uri, allSelections: vscode.Uri[]) => {
      const urisToAdd = allSelections || [contextSelection]
      await addSelection(urisToAdd, true)
    }
  )

  // Register the "Add Files Smart" command, which adds all files in a folder to Cody
  const addFilesSmartDisposable = vscode.commands.registerCommand(
    'cody-plus-plus.addFilesToCodySmart',
    async (contextSelection: vscode.Uri, allSelections: vscode.Uri[]) => {
      const urisToAdd = allSelections || [contextSelection]
      await addFilesSmart(urisToAdd, true)
    }
  )

  // Register the "Add Custom Command" command, which opens a UI to create a custom command
  const addCustomCommandDisposable = vscode.commands.registerCommand(
    'cody-plus-plus.addCustomCommand',
    () => addCustomCommand(context)
  )

  // Register the "Edit Command" command, allowing users to edit existing custom commands
  const editCommandDisposable = vscode.commands.registerCommand(
    'cody-plus-plus.editCommand',
    async (item: any) => editCustomCommand(context, item.commandId)
  )

  // Register the "Delete Command" command, enabling users to delete custom commands
  const deleteCommandDisposable = vscode.commands.registerCommand(
    'cody-plus-plus.deleteCommand',
    async (item: any) => {
      // Prompt the user for confirmation before deleting the command
      const confirmation = await vscode.window.showWarningMessage(
        `Are you sure you want to delete the "${item.commandId}" command?`,
        { modal: true },
        'Yes',
        'No'
      )

      if (confirmation === 'Yes') {
        // Remove the command from the custom command service
        customCommandService.removeCommand(item.commandId)
        // Notify the user that the command was deleted successfully
        vscode.window.showInformationMessage(`Command "${item.commandId}" deleted successfully.`)
      }
    }
  )

  const requestSourcegraphTokenDisposable = vscode.commands.registerCommand(
    'cody-plus-plus.requestSourcegraphToken',
    async () => {
      try {
        const sourcegraphService = SourcegraphService.getInstance(context)
        const token = await sourcegraphService.loginAndObtainToken()

        if (token) {
          vscode.window.showInformationMessage(
            'Successfully authenticated with Sourcegraph. You can now use Smart File Selection feature.'
          )
        } else {
          // User cancelled the flow
          vscode.window.showInformationMessage(
            'Authentication cancelled. You can try again later by running the "Sign in to Sourcegraph" command.'
          )
        }
      } catch (error) {
        if (error instanceof Error && error.message === 'No token provided') {
          vscode.window.showInformationMessage(
            'No token was entered. You can try again later by running the "Sign in to Sourcegraph" command.'
          )
        } else {
          vscode.window.showErrorMessage(
            `Failed to authenticate with Sourcegraph: ${error instanceof Error ? error.message : String(error)}. ` +
              'Please make sure you created a valid access token with the required permissions.'
          )
        }
      }
    }
  )

  const removeSourcegraphTokenDisposable = vscode.commands.registerCommand(
    'cody-plus-plus.removeSourcegraphToken',
    async () => {
      try {
        const sourcegraphService = SourcegraphService.getInstance(context)
        await sourcegraphService.logout()
        vscode.window.showInformationMessage('Successfully logged out from Sourcegraph.')
      } catch (error) {
        vscode.window.showErrorMessage(
          `Failed to log out from Sourcegraph: ${error instanceof Error ? error.message : String(error)}.`
        )
      }
    }
  )

  // Create and register the webview view for displaying custom commands in the sidebar
  const customCommandsWebviewProvider = new MainWebviewView(
    context.extensionUri,
    context.extensionMode
  )
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      MainWebviewView.viewType,
      customCommandsWebviewProvider
    )
  )

  // Add all disposables to the extension context for proper cleanup on deactivation
  context.subscriptions.push(
    addFolderDisposable,
    addShallowFolderDisposable,
    addSelectionRecursiveDisposable,
    addCustomCommandDisposable,
    editCommandDisposable,
    deleteCommandDisposable,
    addFileDisposable,
    addSelectionDisposable,
    addFilesSmartDisposable,
    requestSourcegraphTokenDisposable,
    removeSourcegraphTokenDisposable
  )
}

// Function called when the extension is deactivated
export function deactivate() {
  // Dispose of resources used by the custom command service if it exists
  if (CustomCommandService && CustomCommandService.getInstance()) {
    CustomCommandService.getInstance().disposeFileWatcher()
  }
}
