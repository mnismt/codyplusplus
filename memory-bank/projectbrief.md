# Project Brief: Cody++

## Overview
Cody++ is a Visual Studio Code extension that enhances Sourcegraph's Cody AI with advanced capabilities. The extension focuses on two primary features:

1. Advanced File Management for Cody's Context
2. Custom Command Creation and Management

## Core Requirements

### File Management
- Enable single and multiple file addition to Cody's context
- Support recursive and non-recursive folder addition
- Implement progress tracking with configurable thresholds
- Provide extension-based file filtering
- Handle file system operations safely and efficiently

### Custom Commands
- Allow users to create, edit, and delete custom commands
- Integrate with VS Code workspace settings
- Provide rich configuration UI for command management
- Implement context-aware command execution
- Support command persistence across sessions

### Configuration
- Support file exclusion patterns
- Enable folder exclusions
- Provide threshold settings
- Include telemetry controls with opt-out options

## Technical Goals
- Build with TypeScript and strict type checking
- Follow VS Code extension best practices
- Ensure proper resource management and disposal
- Maintain high performance standards
- Implement robust error handling
- Support VS Code theming
- Ensure security through proper input validation

## Quality Standards
- Maintain clean, typed, and self-documenting code
- Follow established project patterns
- Implement comprehensive error handling
- Support proper VS Code extension lifecycle
- Ensure responsive user experience

## Success Criteria
- Seamless integration with VS Code
- Intuitive user interface for file and command management
- Reliable performance with large file sets
- Proper error recovery and user feedback
- Consistent with VS Code's UX patterns
