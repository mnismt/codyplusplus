// Import VS Code API and necessary modules
import * as vscode from 'vscode'
// Import custom command handlers
import { addCustomCommand, editCustomCommand } from './commands/add-custom-command'
import { addFile, addFilesSmart, addFolder, addSelection } from './commands/add-to-cody'
import { selectLLM, selectProvider } from './commands/provider-commands'
// Import services and views
import { CustomCommandService } from './services/customCommand.service'
import { TelemetryService } from './services/telemetry.service'
import { MainWebviewView } from './views/MainWebviewView'

// Function called when the extension is activated
export async function activate(context: vscode.ExtensionContext) {
  console.log('Cody++ is now active!')

  // Initialize telemetry
  TelemetryService.getInstance()

  // Initialize the singleton service for managing custom commands
  const customCommandService = CustomCommandService.getInstance()

  const addFolderDisposable = vscode.commands.registerCommand(
    'cody-plus-plus.addFolder',
    (uri: vscode.Uri) => addFolder(uri, true)
  )

  const addShallowFolderDisposable = vscode.commands.registerCommand(
    'cody-plus-plus.addShallowFolder',
    (uri: vscode.Uri) => addFolder(uri, false)
  )

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
      try {
        // Check if API key is configured
        const apiKey = vscode.workspace.getConfiguration('codyPlusPlus').get<string>('llmApiKey')

        if (!apiKey) {
          const result = await selectProvider()
          if (!result) {
            void vscode.window.showInformationMessage(
              'Please configure an LLM provider and API key to use smart features'
            )
            return
          }
        }

        const urisToAdd = allSelections || [contextSelection]
        await addFilesSmart(urisToAdd, context)
      } catch (error) {
        void vscode.window.showErrorMessage(
          error instanceof Error ? error.message : 'An unknown error occurred'
        )
      }
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

  const selectProviderDisposable = vscode.commands.registerCommand(
    'cody-plus-plus.selectProvider',
    selectProvider
  )

  const selectLlmDisposable = vscode.commands.registerCommand('cody-plus-plus.selectLlm', selectLLM)

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
    addFileDisposable,
    addSelectionDisposable,
    addSelectionRecursiveDisposable,
    addFilesSmartDisposable,
    selectProviderDisposable,
    selectLlmDisposable,
    addCustomCommandDisposable,
    editCommandDisposable,
    deleteCommandDisposable
  )
}

// Function called when the extension is deactivated
export function deactivate() {
  // Dispose of resources used by the custom command service if it exists
  if (CustomCommandService && CustomCommandService.getInstance()) {
    CustomCommandService.getInstance().disposeFileWatcher()
  }
}
