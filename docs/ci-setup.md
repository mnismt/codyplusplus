# Continuous Integration Setup

This document describes the CI/CD pipeline setup for Cody++.

## GitHub Actions Workflow

Cody++ uses GitHub Actions for continuous integration and testing. The workflow is defined in `.github/workflows/test.yml` and performs the following tasks:

### Test Job

This job runs on every push to main and on pull requests:

1. **Matrix Testing**: Tests are run on multiple configurations:

   - Operating Systems: Ubuntu, macOS, and Windows
   - Node.js versions: 18.x
   - VS Code versions: Stable and Insiders

2. **Setup and Caching**:

   - Checks out the repository
   - Sets up Node.js
   - Installs pnpm 9.11.0 (as specified in package.json)
   - Configures caching for pnpm packages to speed up builds

3. **Testing and Building**:

   - Linting: Runs ESLint to verify code quality
   - Compilation: Compiles TypeScript code
   - Testing: Runs tests using VS Code's extension testing framework
     - On Linux: Uses Xvfb for headless testing
     - On macOS/Windows: Runs tests in a VS Code window

4. **Artifacts**:
   - Uploads test results as artifacts for later debugging

### Build Job

This job runs only after successful tests on the main branch:

1. Packages the VS Code extension (.vsix file)
2. Uploads the packaged extension as an artifact

## Running Tests Locally

To run the same tests locally:

```bash
# Install dependencies
pnpm install

# Run lint checks
pnpm run lint

# Compile TypeScript
pnpm run compile

# Run tests
pnpm test
```

## Package Versioning

The CI workflow respects the versions specified in the project's `package.json`:

- Uses pnpm version 9.11.0 as specified in `packageManager`
- Uses Node.js 18.x to ensure compatibility with modern development environments

## Adding New Test Workflows

When adding new test workflows, consider:

1. **Test Environment**: Ensure tests are runnable in CI environments
2. **Dependencies**: Make sure all required dependencies are installed in the workflow
3. **Platform Compatibility**: Account for differences between operating systems
4. **Performance**: Keep test runs as efficient as possible

## Troubleshooting CI Failures

If CI tests are failing:

1. Check the workflow run logs for specific error messages
2. Verify if failures are platform-specific or occur across all environments
3. Try reproducing the failure locally in a clean environment
4. Check for recent dependency changes that might affect test stability
