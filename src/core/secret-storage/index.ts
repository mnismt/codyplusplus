import * as vscode from 'vscode'

interface SecretStorageFunctions {
  storeToken: (token: string) => Promise<void>
  getToken: () => Promise<string | undefined>
  deleteToken: () => Promise<void>
}

export const createSecretStorage = (context: vscode.ExtensionContext): SecretStorageFunctions => {
  const storage = context.secrets

  const storeToken = async (token: string): Promise<void> => {
    try {
      await storage.store('sourcegraph-token', token)
      console.log('Sourcegraph Token stored')
    } catch (error) {
      throw new Error(
        `Failed to store Sourcegraph token: ${error instanceof Error ? error.message : String(error)}`
      )
    }
  }

  const getToken = async (): Promise<string | undefined> => {
    try {
      return await storage.get('sourcegraph-token')
    } catch (error) {
      throw new Error(
        `Failed to retrieve Sourcegraph token: ${error instanceof Error ? error.message : String(error)}`
      )
    }
  }

  const deleteToken = async (): Promise<void> => {
    try {
      await storage.delete('sourcegraph-token')
    } catch (error) {
      throw new Error(
        `Failed to delete Sourcegraph token: ${error instanceof Error ? error.message : String(error)}`
      )
    }
  }

  return {
    storeToken,
    getToken,
    deleteToken
  }
}
