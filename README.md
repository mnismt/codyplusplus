<div align=center>

# <img src="https://i.imgur.com/T1aoBgL.png" width="64"> Cody++

</div>

# Cody++ README

Enhances [Cody AI](https://sourcegraph.com/cody) with additional files control and custom command features.

[![](https://img.shields.io/badge/Chat_with_Cody++-Ask_Cody-%238A16D7?labelColor=%23383838)](https://sourcegraph.com/github.com/mnismt/CodyPlusPlus)
[![X (formerly Twitter) Follow](https://img.shields.io/twitter/follow/CodyPlusPlus)](https://twitter.com/CodyPlusPlus)
![CI Tests](https://github.com/mnismt/CodyPlusPlus/actions/workflows/test.yml/badge.svg)

## Requirements

- You must have the [Cody](https://marketplace.visualstudio.com/items?itemName=sourcegraph.cody-ai) extension installed in VS Code.

## Installation

You can install the Cody++ extension from the [Visual Studio Code Marketplace](https://marketplace.visualstudio.com/items?itemName=mnismt.cody-plus-plus)

You can also install the extension from the command line:

```sh
code --install-extension mnismt.cody-plus-plus
```

## Features

### Files control

- **Add Files to Cody (Smart)**:
  - Describe what files you want to add to Cody, and let's AI do the rest.

![image](https://github.com/user-attachments/assets/025a69a1-51ba-4ce7-8529-b06f5ecd2e62)

- **Add File to Cody**:
  - Adds a single file to Cody's context.
- **Add Selected Files to Cody**:
  - Adds multiple selected files to Cody's context.
- **Add Selected Files to Cody (Recursive)**:
  - Recursively adds multiple selected files, including those in subdirectories, to Cody's context.
- **Add Folder to Cody**:
  - Adds only the files in the selected folder (non-recursive) to Cody's context.
- **Add Folder to Cody (Recursive)**:
  - Recursively adds all files in a folder to Cody.
  - You can configure the file extensions to exclude from being added to Cody.
  - You can configure the folders to exclude from being added to Cody.
  - You can configure the maximum number of files allowed before showing a warning message.

![main-post](https://github.com/user-attachments/assets/9f2bc225-77da-4d54-a814-946606b43972)

### Custom Commands

- **Add Custom Command**:
  - Add, edit, and remove custom commands from the workspace settings.
  - Custom commands are managed in a `cody.json` file within your workspace's `.vscode` directory.
  - Provides a user-friendly UI for creating and editing custom commands.
- **Edit Custom Command**:
  - Edit an existing custom command.
- **Delete Custom Command**:
  - Delete a custom command.

![Cody++](https://github.com/user-attachments/assets/8426387a-62ee-49c7-9627-c438e28f079e)

## Extension Settings

This extension contributes the following settings:

- `codyPlusPlus.fileThreshold`: The maximum number of files allowed before showing a warning message. Default is 15.
- `codyPlusPlus.excludedFileTypes`: List of file extensions to exclude from being added to Cody. Default is [".exe", ".bin"].
- `codyPlusPlus.excludedFolders`: List of folders to exclude from being added to Cody.

To configure this setting in two ways:

1. Using the Settings UI:

   - Open the Command Palette (`Ctrl+Shift+P` or `Cmd+Shift+P` on Mac).
   - Type `Preferences: Open Settings (UI)` and press Enter.
   - In the search bar, type `Cody Plus Plus`.
   - Adjust the:
     - `File Threshold` setting to your desired value.
     - `Excluded File Types` setting to your desired value.
     - `Excluded Folders` setting to your desired value.

2. Using the `settings.json` file:

   - Add these lines to your `settings.json` file:

     ```json
     "codyPlusPlus.fileThreshold": 15,
     "codyPlusPlus.excludedFileTypes": [".exe", ".bin"],
     "codyPlusPlus.excludedFolders": [".git", "node_modules"]
     ```

## Development

### Requirements

- Node.js 18.x
- pnpm 9.11.0 (specified as the package manager)

### Testing

The extension comes with a comprehensive test suite. To run tests locally:

```sh
# Install dependencies
pnpm install

# Run linting checks
pnpm run lint

# Compile the extension
pnpm run compile

# Run tests
pnpm test
```

### Continuous Integration

The project uses GitHub Actions for automated testing and building:

- Tests run on push to main branch and pull requests
- Tests run on multiple platforms (Windows, macOS, Linux)
- Tests run against multiple VS Code versions (stable and insiders)

For details about the CI setup, see [docs/ci-setup.md](docs/ci-setup.md).

## Telemetry

Cody++ collects anonymous usage information to help improve the extension. We are committed to protecting your privacy:

- **What We Track**: Basic usage events like file additions and custom command interactions
- **What We Don't Track**:
  - No file contents
  - No personal identifiable information
  - No code snippets

You can easily opt out of telemetry:

1. Open VS Code Settings
2. Search for "Cody Plus Plus"
3. Uncheck "Enable Telemetry"

For full details, see our [TELEMETRY.md](TELEMETRY.md) document.

## Contributing

We welcome contributions! Please see our GitHub repository for guidelines.
