# System Architecture and Decisions

## System Architecture
The system follows a modular, layered architecture that emphasizes separation of concerns, scalability, and maintainability. The key components include:
- **Frontend**: Webviews and React-based user interfaces for interaction with custom commands.
- **Backend**: Services for managing commands, telemetry, and file operations.
- **Storage**: Commands and configuration are stored in a JSON file (`cody.json`).

## Key Technical Decisions
- **Single Responsibility Principle (SRP)**: Each module or service handles a specific task, ensuring clean and maintainable code.
- **Singleton Pattern**: Used for services like `TelemetryService` and `CustomCommandService` to ensure a single instance across the application.
- **Event-driven Communication**: Utilizes events like `onDidChangeCommands` to handle real-time updates to command data.
- **LLM Integration**: Uses Sourcegraph's structured output format for reliable file selection.

## File Selection Approaches
- **Standard Selection**: UI-based file and folder selection with recursive options.
- **Smart Selection**: Natural language queries processed by LLM to select relevant files.
  - Uses Sourcegraph's JSON schema validation
  - Fallback parsing for non-standard responses
  - Path validation and filtering

## Design Patterns in Use
- **Factory Pattern**: The `CustomCommandService` dynamically creates commands using the factory method.
- **Observer Pattern**: Components listen for changes and update the UI accordingly.
- **Singleton Pattern**: Single instances for critical services like `TelemetryService` and `LLMService`.
- **Strategy Pattern**: Different file selection strategies (manual vs. smart) with consistent interface.

## Component Relationships
- **Webviews**: Display custom commands and interact with the user.
- **CustomCommandService**: Manages custom commands state and changes.
- **TelemetryService**: Tracks system events and usage data.
- **LLMService**: Handles Sourcegraph API communication for smart file selection.
- **SourcegraphService**: Manages authentication and API tokens.

## Architecture Diagram
```mermaid
graph LR
    A[Frontend] --> B[VS Code Commands]
    B --> C[File Processors]
    C --> D[Smart Selection] & E[Manual Selection]
    D --> F[LLM Service]
    F --> G[Sourcegraph API]
    E --> H[VS Code File System]
