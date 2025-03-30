# Change Log

## [Unreleased]

## [0.4.0] - 2025-03-30

- Refactor OpenAI provider to OpenAI & OpenAI-compatible for better configuration
- Add Gemini provider
- Add "Select LLM (switch model)" command to switch between models of the selected provider

  ![image](https://github.com/user-attachments/assets/025a69a1-51ba-4ce7-8529-b06f5ecd2e62)

  - Supported LLM Providers:
    - OpenAI
    - Gemini
    - OpenAI-compatible

  ![image](https://github.com/user-attachments/assets/2ac04927-db04-4280-8cba-04e409a1eb7e)

  - Select and switch between available models for each provider using the "Select LLM (switch model)" command.

  - Google Gemini Models

    ![image](https://github.com/user-attachments/assets/03916253-210c-4aa6-85e9-cb7cab6f6289)

  - OpenAI-compatible (Groq, Ollama, etc.) (example: Groq)

    ![groq(openai-compatible)](https://github.com/user-attachments/assets/dd3d83f0-82e7-4730-b8cc-87ed01986b92)

- Improve tests coverage

## [0.3.2] - 2025-03-26

- New: Add Telemetry to track folder counts
- Security: Remove release-it.sh from the bundle (added to .vscodeignore)

## [0.3.1] - 2025-02-28

- Fix: Telemetry doesn't track file count for "Add Files to Cody (Smart)"
- Fix: Add ignoreFocusOut to prevent the input box from disappearing in the "Add Files to Cody (Smart)" command

## [0.3.0] - 2025-02-27

- New: Add Files to Cody (Smart) command
  - Supported Providers: OpenAI-compatible
- Improve UI for adding custom commands
- Add Telemetry option and update dependencies
- Refactors the extension to use webviews instead of a tree view for displaying custom commands
- Upgraded VS Code API from 1.89.0 to 1.93.0

## [0.2.1] - 2025-01-08

- Add welcome message to the custom commands tree view when no commands are added

## [0.2.0] - 2025-01-04

- Add commands "Add File to Cody", "Add Folder to Cody" and "Add Selection to Cody" (#10 - thanks @Yandrik)
- Rename "Add Folder to Cody" to "Add Folder (Recursive) to Cody"
- Add "Add Selected Files (Recursive) to Cody" to recursively add selected multiple files & folders
- Improve UX with progress indicator when adding files

## [0.1.3] - 2024-10-23

- Add support for excluding folders from being added to Cody (#8)

## [0.1.2] - 2024-10-15

- Introduce a new logo that is distinct from the original Cody
- Create FUNDING.yml

## [0.1.1] - 2024-06-11

- Implement file watcher for hot-reloading and command execution (#4)

## [0.1.0] - 2024-06-09

- Implement Cody Custom Management (#3)

## [0.0.1] - 2024-05-19

- Initial release
