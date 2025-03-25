# Contributing to Cody++

Thank you for your interest in contributing to Cody++! This document provides guidelines and instructions for contributing to this project.

## Development Setup

1. **Fork and clone the repository**

   ```bash
   git clone https://github.com/YOUR_USERNAME/codyplusplus.git
   cd codyplusplus
   ```

2. **Prerequisites**

   - Node.js 18.x
   - pnpm 9.11.0

   If you don't have pnpm installed or need to update it:

   ```bash
   npm install -g pnpm@9.11.0
   ```

3. **Install dependencies**

   ```bash
   pnpm install
   ```

4. **Build the extension**

   ```bash
   pnpm run compile
   ```

5. **Run the extension**

   Press `F5` in VS Code to launch a new instance with the extension loaded.

## Testing

All contributions should include appropriate tests. The project uses VS Code's extension testing framework.

### Running Tests Locally

```bash
pnpm test
```

For debugging tests:

1. Open the Debug panel in VS Code
2. Select "Extension Tests" from the dropdown
3. Press play to run tests with the debugger attached

### Continuous Integration

The project uses GitHub Actions for CI:

- Tests run automatically on pull requests
- The workflow runs on Windows, macOS, and Linux
- Tests run against both stable and insiders VS Code versions

If CI tests fail on your PR:

1. Check the logs to identify the issue
2. Make necessary changes and push updates to your branch
3. If needed, add `[ci skip]` to your commit message to avoid running CI for minor doc changes

## Pull Request Process

1. **Create a feature branch**

   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**

3. **Write tests**

   - Add tests for any new functionality
   - Ensure existing tests still pass

4. **Format your code**

   ```bash
   pnpm run lint
   ```

5. **Submit your pull request**
   - Ensure all tests pass
   - Fill out the PR template completely
   - Reference any related issues using the syntax `Fixes #issue-number`

## Code Style

- Follow TypeScript best practices
- Use [VS Code extension guidelines](https://code.visualstudio.com/api/references/extension-guidelines)
- Maintain the existing style for consistency

## Adding Features

When adding new features:

1. Consider VS Code's extension API limitations and best practices
2. Maintain backward compatibility when possible
3. Document new features thoroughly
4. Add tests covering the new functionality
5. Update the README.md if needed with feature explanations

## Documentation

- Update README.md with any necessary information about your changes
- Document any new settings or commands
- Add inline documentation for complex code

## License

By contributing, you agree that your contributions will be licensed under the project's MIT License.
