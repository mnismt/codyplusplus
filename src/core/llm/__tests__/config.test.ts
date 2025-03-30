import * as assert from 'assert'
import * as fs from 'fs'
import * as path from 'path'
// No longer need vscode for workspace folders here
// import * as vscode from 'vscode'
import { SUPPORTED_PROVIDERS } from '../constants'

// Note: No Sinon usage needed for this specific test, but structure follows guidelines

// Helper function removed as it's no longer needed for finding package.json

// Using suite() instead of describe()
suite('Cody++ LLM Configuration Validation', () => {
  let packageJson: any
  let supportedProviderCodes: string[]

  // Using setup() instead of before()
  setup(() => {
    try {
      // Construct path relative to the current test file directory (__dirname)
      // Go up three levels: __tests__ -> llm -> core -> root
      const packageJsonPath = path.join(__dirname, '../../../../package.json')

      // Verify the path exists before reading
      if (!fs.existsSync(packageJsonPath)) {
        throw new Error(`package.json not found at expected path: ${packageJsonPath}`)
      }

      // Read package.json
      const packageJsonContent = fs.readFileSync(packageJsonPath, 'utf8')
      packageJson = JSON.parse(packageJsonContent)

      // Get codes from SUPPORTED_PROVIDERS array
      supportedProviderCodes = SUPPORTED_PROVIDERS.map(p => p.code)
    } catch (error) {
      console.error('Error during test setup:', error)
      // Fail the test suite if setup fails
      throw new Error(
        `Failed to set up configuration test: ${error instanceof Error ? error.message : String(error)}`
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
