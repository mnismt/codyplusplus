<div align=center>

# <img src="https://i.imgur.com/vgcnIwy.png" width="52">  Cody++

</div>

# Cody++ README

Cody++ is a VSCode extension that adds some missing features for developers who love Cody.

This extension provides additional commands to enhance your development workflow with Cody.

*Psst... This extension was developed with a little help from Cody too! :P*

## Requirements

- You must have the [Cody](https://marketplace.visualstudio.com/items?itemName=sourcegraph.cody-ai) extension installed in VS Code.

## Features

- **Add Folder to Cody**:
  - Recursively adds all files in a folder to Cody.
  - You can configure the maximum number of files allowed before showing a warning message.
  - You can configure the file extensions to exclude from being added to Cody.

## Usage

- **Add Folder to Cody**:
  - Right-click on a folder in the Explorer view.
  - Select `Add folder to Cody` from the context menu.
  - If the folder contains a large number of files, you will be prompted to confirm before proceeding.
  - **Note**: The Cody chat panel must be opened for this feature to work.

## Demo

<https://github.com/mnismt/codyplusplus/assets/27861064/b2b664bb-4f74-48eb-b18f-f0a24b87bf82>

## Extension Settings

This extension contributes the following settings:

- `codyPlusPlus.fileThreshold`: The maximum number of files allowed before showing a warning message. Default is 15.
- `codyPlusPlus.excludedFileTypes`: List of file extensions to exclude from being added to Cody. Default is [".exe", ".bin"].

To configure this setting in two ways:

1. Using the Settings UI:
    - Open the Command Palette (`Ctrl+Shift+P` or `Cmd+Shift+P` on Mac).
    - Type `Preferences: Open Settings (UI)` and press Enter.
    - In the search bar, type `Cody Plus Plus`.
    - Adjust the `File Threshold` setting to your desired value.

2. Using the `settings.json` file:
    - Add these lines to your `settings.json` file:

        ```json
        "codyPlusPlus.fileThreshold": 15,
        "codyPlusPlus.excludedFileTypes": [".exe", ".bin"]
        ```
