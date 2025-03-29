# Testing Guidelines for Cody++

## File Patterns

- `src/**/__tests__/**/*.test.ts` - All test files

## Testing Framework

Cody++ uses:

- Mocha testing framework with `suite` and `test` functions
- Sinon for stubbing and mocking dependencies
- Assert from Node.js for assertions
- VS Code test API for extension testing

## Test Structure Guidelines

1. Location and Naming

- Place test files in a **tests** directory adjacent to the file being tested
- Name test files with the pattern [filename].test.ts
- Use descriptive test names following the pattern: should <expected behavior> when <condition>

2. Tests should follow the pattern:

   - `setup()` - Set up test dependencies and stubs
   - Test cases with descriptive names
   - `teardown()` - Clean up stubs and resources

3. Use Sinon sandbox pattern:

```typescript
let sandbox: sinon.SinonSandbox

setup(() => {
  sandbox = sinon.createSandbox()
  // Setup stubs
})

teardown(() => {
  sandbox.restore()
})
```

4. For VS Code API testing:

   - Use `vscode.workspace` stubs for configuration
   - Mock filesystem operations
   - Use proper event emitters for testing events

5. For service testing (like telemetry):
   - Reset singletons between tests
   - Mock external dependencies
   - Verify correct calls are made

## Extension Testing

For extension-level tests:

- Verify command registration
- Test activation events
- Use timeouts for async operations

## Running Tests

After writing or modifying tests, always run the full test suite to ensure all tests pass:

```
pnpm test
```

This command will:

- Compile the TypeScript files
- Start the VS Code extension host
- Execute all test suites
- Report test results and any failures
