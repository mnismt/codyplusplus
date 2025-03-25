# Colocated Tests for Cody++

This project uses a colocated test structure where tests are placed in `__tests__` directories alongside the code they're testing.

## Test Structure

Tests are organized as follows:

- `src/__tests__/` - Tests for extension activation and core functionality
- `src/services/__tests__/` - Tests for service classes
- `src/core/filesystem/__tests__/` - Tests for filesystem utilities

This approach keeps tests close to the implementation they're testing, making the relationship clearer and navigation easier.

## Running Tests

To run the tests, use the following command:

```bash
pnpm run test
```

This will:

1. Compile the tests (`pnpm run compile-tests`)
2. Compile the extension (`pnpm run compile`)
3. Run the linter (`pnpm run lint`)
4. Execute the tests using `vscode-test`

## Writing New Tests

When adding new features or fixing bugs, please add corresponding tests following the colocated structure. Follow these guidelines:

1. Create test files with a `.test.ts` extension
2. Place tests in a `__tests__` directory adjacent to the implementation files
3. Use descriptive test names that explain what's being tested
4. Use Sinon for mocking dependencies
5. Clean up mocks after each test in the `teardown` function
6. Test both the success path and error handling

## Test Configuration

Test file locations are configured in `.vscode-test.mjs` to look for files matching:

```
out/**/__tests__/**/*.test.js
```
