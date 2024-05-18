<div align=center>

# <img src="https://i.imgur.com/jGfMIyy.png" width="52">  Cody++

</div>

# Cody++ README

Cody++ is a VSCode extension that adds some missing features for developers who love Cody.

This extension provides additional commands to enhance your development workflow with Cody.

*Psst... This extension was developed with a little help from Cody too! :P*

## Requirements

- You must have the [Cody](https://marketplace.visualstudio.com/items?itemName=sourcegraph.cody-ai) extension installed in VS Code.

## Features

- **Add Folder to Cody**: Recursively adds all files in a folder to Cody, with a confirmation prompt if the folder contains a large number of files.

## Usage

1. **Add Folder to Cody**:
    - Right-click on a folder in the Explorer view.
    - Select `Add folder to Cody` from the context menu.
    - If the folder contains a large number of files, you will be prompted to confirm before proceeding.
    - **Note**: The chat panel must be opened for this feature to work.

## Extension Settings

This extension contributes the following settings:

- `codyPlusPlus.fileThreshold`: The maximum number of files allowed before showing a warning message. Default is 15.

To configure this setting in two ways:

1. Using the Settings UI:
    - Open the Command Palette (`Ctrl+Shift+P` or `Cmd+Shift+P` on Mac).
    - Type `Preferences: Open Settings (UI)` and press Enter.
    - In the search bar, type `Cody Plus Plus`.
    - Adjust the `File Threshold` setting to your desired value.

2. Using the `settings.json` file:
    - Add this line to your `settings.json` file:

        ```json
        "codyPlusPlus.fileThreshold": 15
        ```

## Known Issues

- None at the moment. Please report any issues you encounter.

## Release Notes

### 0.0.1

- Initial release of Cody++.
