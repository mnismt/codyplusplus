import * as assert from 'assert'
import * as fs from 'fs'
import * as path from 'path'
import * as vscode from 'vscode'
import { SUPPORTED_PROVIDERS } from '../constants'

// Note: No Sinon usage needed for this specific test, but structure follows guidelines

// Helper function to get the workspace root
function getWorkspaceRoot(): string {
  if (!vscode.workspace.workspaceFolders || vscode.workspace.workspaceFolders.length === 0) {
    throw new Error('Test requires an open workspace folder.')
  }
  return vscode.workspace.workspaceFolders[0].uri.fsPath
}

// Using suite() instead of describe()
suite('Cody++ LLM Configuration Validation', () => {
  let packageJson: any
  let supportedProviderCodes: string[]

  // Using setup() instead of before()
  setup(() => {
    try {
      const workspaceRoot = getWorkspaceRoot()
      const packageJsonPath = path.join(workspaceRoot, 'package.json')

      // Read package.json
      const packageJsonContent = fs.readFileSync(packageJsonPath, 'utf8')
      packageJson = JSON.parse(packageJsonContent)

      // Get codes from SUPPORTED_PROVIDERS array
      supportedProviderCodes = SUPPORTED_PROVIDERS.map(p => p.code)
    } catch (error) {
      console.error('Error during test setup:', error)
      // Fail the test suite if setup fails
      throw new Error(
        `Failed to set up configuration test: ${error instanceof Error ? error.message : error}`
      )
    }
  })

  // Using teardown() for consistency, even if empty
  teardown(() => {
    // No cleanup needed for this test
  })

  test('should have llmProvider enum in package.json matching SUPPORTED_PROVIDERS codes', () => {
    assert.ok(packageJson, 'package.json should be loaded')
    assert.ok(
      packageJson.contributes?.configuration?.properties?.['codyPlusPlus.llmProvider']?.enum,
      'codyPlusPlus.llmProvider.enum should exist in package.json'
    )

    const enumProviders = packageJson.contributes.configuration.properties[
      'codyPlusPlus.llmProvider'
    ].enum as string[]

    // Use Sets for easier comparison (ignores order and duplicates)
    const enumProviderSet = new Set(enumProviders)
    const supportedProvidersSet = new Set(supportedProviderCodes)

    assert.deepStrictEqual(
      enumProviderSet,
      supportedProvidersSet,
      `Mismatch between package.json llmProvider enum (${[...enumProviderSet].join(', ')}) and SUPPORTED_PROVIDERS codes (${[...supportedProvidersSet].join(', ')})`
    )
  })

  // Add more configuration validation tests here if needed using test()
})
