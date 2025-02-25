# Development Environment and Stack

## Technologies Used
- **Frontend**: React, TypeScript, Vite, and VS Code Webviews for creating interactive UI elements.
- **Backend**: TypeScript-based services for managing command data and telemetry. Utilizes the VS Code API for interactions.
- **Data Storage**: Command data is stored in a JSON file (`cody.json`) in the `.vscode` folder, ensuring ease of integration and portability.
- **Telemetry**: PostHog for tracking telemetry data (e.g., command creation, execution, deletion).
- **Package Manager**: `pnpm` for efficient dependency management and faster package installations.

## Development Setup
- **Local Development**: VS Code with the extension loaded. Webviews are powered by Vite for fast development and HMR.
- **Commands**: Custom commands are added, updated, and executed via a set of React-based webviews and VS Code commands.
  - Standard file selection through UI and commands
  - Smart file selection using natural language queries
- **Build and Watch**: `esbuild` is used for building the extension, with watches for changes in the codebase and webview assets.

## Technical Constraints
- **VS Code API**: The extension relies heavily on the VS Code API, limiting the integration with non-VS Code environments.
- **Command Limits**: The system imposes a file threshold (default 15) before a warning is triggered when adding files to the context, to prevent performance issues.
- **Telemetry Opt-out**: Users can disable telemetry through the settings, respecting privacy concerns.
- **Smart Selection**: Requires Sourcegraph authentication for LLM features.

## Dependencies
- **PostHog**: Used for telemetry tracking to gather anonymous data on usage and improve the extension.
- **zod**: A schema validation library used to ensure data integrity for custom commands and settings.
- **React and React-DOM**: For building the interactive UI in the webviews.
- **Vite**: For building and serving the webview assets with hot-module reloading.
- **Sourcegraph API**: Used for LLM capabilities and smart file selection.

## Technology Stack Diagram
```mermaid
graph TD
    A[Frontend] -->|React, Vite| B[Webviews]
    B --> C[VS Code API]
    C -->|Interaction| A
    B --> D[Telemetry]
    D --> E[PostHog]
    F[Backend] --> C
    F --> G[Services]
    G --> H[Custom Command JSON]
    G --> I[LLM Service]
    I --> J[Sourcegraph API]
    K[Dependencies] --> L[PostHog]
    K --> M[zod]
    K --> N[React, Vite]
