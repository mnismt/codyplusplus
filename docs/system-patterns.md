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

## Design Patterns in Use
- **Factory Pattern**: The `CustomCommandService` dynamically creates commands using the factory method to ensure flexibility in how commands are instantiated and modified.
- **Observer Pattern**: The system uses the observer pattern for tracking changes to commands, where components like the `CustomCommandsWebview` listen for changes and update the UI accordingly.
- **Singleton Pattern**: Ensures there is only one instance of critical services such as `TelemetryService` and `CustomCommandService` across the application.

## Component Relationships
- **Webviews**: Display custom commands managed by `CustomCommandService` and interact with the user.
- **CustomCommandService**: Manages the state of custom commands and tracks changes, notifying subscribers like the UI.
- **TelemetryService**: Tracks system events like command creation, execution, and deletion to gather usage data for improvements.

## Architecture Diagram
```mermaid
graph LR
    A[Frontend (React, Webviews)] --> B[CustomCommandService]
    B --> C[Custom Commands (JSON File)]
    A --> D[TelemetryService]
    D --> E[PostHog Telemetry]
    C --> F[VS Code API]
    F --> A
    F --> B
```