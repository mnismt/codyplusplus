import * as fs from 'fs'
import * as path from 'path'
import * as vscode from 'vscode'

import { z } from 'zod'
import { CODY_CUSTOM_COMMANDS_FILE } from '../constants/cody'

const CommandContextSchema = z.object({
  codebase: z.boolean().optional(),
  command: z.string().optional(),
  currentDir: z.boolean().optional(),
  currentFile: z.boolean().optional(),
  directoryPath: z.string().optional(),
  filePath: z.string().optional(),
  none: z.boolean().optional(),
  openTabs: z.boolean().optional(),
  selection: z.boolean().optional()
})

const CustomCommandSchema = z.object({
  description: z.string(),
  prompt: z.string(),
  mode: z.enum(['ask', 'edit', 'insert']).optional(),
  context: CommandContextSchema
})

const CustomCommandsSchema = z.record(z.string(), CustomCommandSchema)

type CommandContext = z.infer<typeof CommandContextSchema>
type CustomCommand = z.infer<typeof CustomCommandSchema>
type CustomCommands = z.infer<typeof CustomCommandsSchema>

export class CustomCommandService {
  private static instance: CustomCommandService
  private commands: CustomCommands = {}
  private _onDidChangeCommands: vscode.EventEmitter<void> = new vscode.EventEmitter<void>()
  public readonly onDidChangeCommands: vscode.Event<void> = this._onDidChangeCommands.event

  private constructor() {
    this.loadCommands()
  }

  public static getInstance(): CustomCommandService {
    if (!CustomCommandService.instance) {
      CustomCommandService.instance = new CustomCommandService()
    }
    return CustomCommandService.instance
  }

  private async loadCommands() {
    const workspaceFolders = vscode.workspace.workspaceFolders
    if (!workspaceFolders) {
      console.error('CODY++: No workspace folder is open.')
      return
    }

    const vscodeFolderPath = path.join(workspaceFolders[0].uri.fsPath, '.vscode')
    const codyJsonPath = path.join(vscodeFolderPath, CODY_CUSTOM_COMMANDS_FILE)

    try {
      const fileContent = await fs.promises.readFile(codyJsonPath, 'utf-8')
      const parsedCommands = JSON.parse(fileContent)
      const validationResult = CustomCommandsSchema.safeParse(parsedCommands)

      if (!validationResult.success) {
        vscode.window.showErrorMessage(`Invalid ${CODY_CUSTOM_COMMANDS_FILE} format.`)
        console.error(validationResult.error)
        return
      }

      this.commands = validationResult.data
      this._onDidChangeCommands.fire()
    } catch (error: any) {
      console.error(`CODY++: Failed to load ${CODY_CUSTOM_COMMANDS_FILE}: ${error.message}`)
    }
  }

  public getCommands(): CustomCommands {
    return this.commands
  }

  public async addCommand(id: string, command: CustomCommand): Promise<void> {
    this.commands[id] = command
    await this.saveCommands()
    this._onDidChangeCommands.fire()
  }

  public async modifyCommand(id: string, command: CustomCommand): Promise<void> {
    if (this.commands[id]) {
      this.commands[id] = command
      await this.saveCommands()
      this._onDidChangeCommands.fire()
    } else {
      console.error(`CODY++: Command with id ${id} does not exist.`)
    }
  }

  public async removeCommand(id: string): Promise<void> {
    if (this.commands[id]) {
      delete this.commands[id]
      await this.saveCommands()
      this._onDidChangeCommands.fire()
    } else {
      console.error(`CODY++: Command with id ${id} does not exist.`)
    }
  }

  private async saveCommands(): Promise<void> {
    const workspaceFolders = vscode.workspace.workspaceFolders
    if (!workspaceFolders) {
      console.error('CODY++: No workspace folder is open.')
      return
    }

    const vscodeFolderPath = path.join(workspaceFolders[0].uri.fsPath, '.vscode')
    const codyJsonPath = path.join(vscodeFolderPath, `${CODY_CUSTOM_COMMANDS_FILE}`)

    try {
      const fileContent = JSON.stringify(this.commands, null, 2)
      await fs.promises.writeFile(codyJsonPath, fileContent, 'utf-8')
      vscode.window.showInformationMessage('Custom commands saved successfully.')
    } catch (error: any) {
      console.error(`CODY++: Failed to save ${CODY_CUSTOM_COMMANDS_FILE}: ${error.message}`)
    }
  }

  public refreshCommands(): void {
    this.loadCommands()
  }
}
