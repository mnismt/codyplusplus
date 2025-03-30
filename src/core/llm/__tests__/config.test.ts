import * as assert from 'assert'
import * as fs from 'fs'
import * as path from 'path'
import * as vscode from 'vscode'

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
  let providerDirs: string[]

  // Using setup() instead of before()
  setup(() => {
    try {
      const workspaceRoot = getWorkspaceRoot()
      const packageJsonPath = path.join(workspaceRoot, 'package.json')
      const providersPath = path.join(workspaceRoot, 'src', 'core', 'llm', 'providers')

      // Read package.json
      const packageJsonContent = fs.readFileSync(packageJsonPath, 'utf8')
      packageJson = JSON.parse(packageJsonContent)

      // Read provider directory names
      providerDirs = fs
        .readdirSync(providersPath, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name)
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
    // No cleanup needed for this test (e.g., sandbox.restore() if Sinon was used)
  })

  // Using test() instead of it()
  test('should have llmProvider enum in package.json matching provider directories', () => {
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
    const dirProviderSet = new Set(providerDirs)

    assert.deepStrictEqual(
      enumProviderSet,
      dirProviderSet,
      `Mismatch between package.json llmProvider enum (${[...enumProviderSet].join(', ')}) and provider directories (${[...dirProviderSet].join(', ')})`
    )
  })

  // Add more configuration validation tests here if needed using test()
})
