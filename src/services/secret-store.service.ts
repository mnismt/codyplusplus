import * as vscode from 'vscode'

export class SecretStorage {
  private static instance: SecretStorage
  private storage: vscode.SecretStorage

  private constructor(context: vscode.ExtensionContext) {
    this.storage = context.secrets
  }

  public static getInstance(context: vscode.ExtensionContext): SecretStorage {
    if (!SecretStorage.instance) {
      SecretStorage.instance = new SecretStorage(context)
    }
    return SecretStorage.instance
  }

  public async storeToken(token: string): Promise<void> {
    try {
      await this.storage.store('sourcegraph-token', token)
    } catch (error) {
      throw new Error(
        `Failed to store Sourcegraph token: ${error instanceof Error ? error.message : String(error)}`
      )
    }
  }

  public async getToken(): Promise<string | undefined> {
    try {
      return await this.storage.get('sourcegraph-token')
    } catch (error) {
      throw new Error(
        `Failed to retrieve Sourcegraph token: ${error instanceof Error ? error.message : String(error)}`
      )
    }
  }

  public async deleteToken(): Promise<void> {
    try {
      await this.storage.delete('sourcegraph-token')
    } catch (error) {
      throw new Error(
        `Failed to delete Sourcegraph token: ${error instanceof Error ? error.message : String(error)}`
      )
    }
  }
}
