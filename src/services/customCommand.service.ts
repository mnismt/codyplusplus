import * as fs from 'fs'
import * as vscode from 'vscode'

import { z } from 'zod'
import { CODY_CUSTOM_COMMANDS_FILE, getCodyJsonPath } from '../constants/cody'
import { TELEMETRY_EVENTS } from '../constants/telemetry'
import { TelemetryService } from './telemetry.service'

export const CustomCommandId = z.string()

export const CommandContextSchema = z.object({
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

export const CustomCommandSchema = z.object({
  description: z.string().optional(),
  prompt: z.string(),
  mode: z.enum(['ask', 'edit', 'insert']).optional(),
  context: CommandContextSchema.optional()
})

export const CreateCommandSchema = z.object({
  id: CustomCommandId,
  data: CustomCommandSchema
})

export const UpdateCommandSchema = z.object({
  id: CustomCommandId,
  oldId: CustomCommandId.optional(),
  data: CustomCommandSchema
})

export const CustomCommandsSchema = z.record(CustomCommandId, CustomCommandSchema)

type CommandContext = z.infer<typeof CommandContextSchema>
export type CustomCommand = z.infer<typeof CustomCommandSchema>
export type CreateCustomCommand = z.infer<typeof CreateCommandSchema>
export type UpdateCustomCommand = z.infer<typeof UpdateCommandSchema>
type CustomCommands = z.infer<typeof CustomCommandsSchema>

export class CustomCommandService {
  private static instance: CustomCommandService
  private commands: CustomCommands = {}
  private fileWatcher: vscode.FileSystemWatcher | undefined
  private _onDidChangeCommands: vscode.EventEmitter<void> = new vscode.EventEmitter<void>()
  public readonly onDidChangeCommands: vscode.Event<void> = this._onDidChangeCommands.event
  private telemetry = TelemetryService.getInstance()

  private constructor() {
    this.loadCommands()
    this.setupFileWatcher()
  }

  public static getInstance(): CustomCommandService {
    if (!CustomCommandService.instance) {
      CustomCommandService.instance = new CustomCommandService()
    }
    return CustomCommandService.instance
  }

  private async loadCommands() {
    const codyJsonPath = getCodyJsonPath()

    if (!codyJsonPath) {
      return
    }

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
      this._onDidChangeCommands?.fire()
    } catch (error: any) {
      console.error(`CODY++: Failed to load ${CODY_CUSTOM_COMMANDS_FILE}: ${error.message}`)
    }
  }

  private setupFileWatcher() {
    const codyJsonPath = getCodyJsonPath()

    if (!codyJsonPath) {
      return
    }

    this.fileWatcher = vscode.workspace.createFileSystemWatcher(codyJsonPath)

    this.fileWatcher.onDidChange(() => this.loadCommands())
    this.fileWatcher.onDidCreate(() => this.loadCommands())
    this.fileWatcher.onDidDelete(() => this.loadCommands())
  }

  public disposeFileWatcher() {
    if (this.fileWatcher) {
      this.fileWatcher.dispose()
      this.fileWatcher = undefined
    }
  }

  public getCommands(): CustomCommands {
    return this.commands
  }

  public async addCommand(id: string, command: CustomCommand): Promise<void> {
    this.commands[id] = command
    await this.saveCommands()
    this._onDidChangeCommands.fire()
    this.telemetry.trackEvent(TELEMETRY_EVENTS.CUSTOM_COMMANDS.CREATED, {
      commandMode: command.mode,
      hasContext: Object.values(command.context || {}).some(v => v)
    })
  }

  public async getCommand(id: string): Promise<CustomCommand> {
    return this.commands[id]
  }

  public async updateCommand({ id, oldId, data }: UpdateCustomCommand): Promise<void> {
    // If id !== oldId, we need to delete the old command and add the new one
    if (oldId && id !== oldId) {
      await this.removeCommand(oldId)
      await this.addCommand(id, data)
      return
    }

    this.commands[id] = data
    await this.saveCommands()
    this._onDidChangeCommands.fire()
  }

  public async removeCommand(id: string): Promise<void> {
    if (this.commands[id]) {
      delete this.commands[id]
      await this.saveCommands()
      this._onDidChangeCommands.fire()
      this.telemetry.trackEvent(TELEMETRY_EVENTS.CUSTOM_COMMANDS.DELETED)
    } else {
      console.error(`CODY++: Command with id ${id} does not exist.`)
    }
  }

  private async saveCommands(): Promise<void> {
    const codyJsonPath = getCodyJsonPath()

    if (!codyJsonPath) {
      return
    }

    try {
      const fileContent = JSON.stringify(this.commands, null, 2)
      await fs.promises.writeFile(codyJsonPath, fileContent, 'utf-8')
    } catch (error: any) {
      console.error(`CODY++: Failed to save ${CODY_CUSTOM_COMMANDS_FILE}: ${error.message}`)
    }
  }

  public refreshCommands(): void {
    this.loadCommands()
  }

  public async executeCommand(id: string): Promise<void> {
    this.telemetry.trackEvent(TELEMETRY_EVENTS.CUSTOM_COMMANDS.EXECUTED, {
      commandId: id
    })
  }
}
