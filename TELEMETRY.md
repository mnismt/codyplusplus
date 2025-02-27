# Telemetry in Cody++

## Overview

Cody++ collects **anonymous** usage information to help us improve the extension and understand how users interact with its features. This data helps us optimize the user experience and prioritize future development. You can opt out of telemetry collection at any time.

We use PostHog, an open-source platform for product analytics, to collect and analyze this data.

## What We Track

The following usage information is collected and reported:

### File Operations

- When files are added to Cody (excluding file contents)
- When folders are added to Cody (excluding folder contents)
- When selections are added to Cody (excluding selected content)
- When smart selections are added to Cody (excluding selected content)

#### File Counting

We track the total number of files added to Cody, but **we never read or store the actual contents of these files**. This helps us understand usage patterns without compromising your privacy. The count is purely numerical and anonymized.

### Custom Commands

- When custom commands are created (excluding command content/prompt)
- When custom commands are deleted
- When custom commands are executed (excluding execution details)

## Data Privacy

All telemetry data is:

- Anonymized using your machine ID
- Stripped of personal identifiable information (PII)
- Never includes actual code, file contents, or command prompts
- Only includes basic event names and timestamps

Additional metadata included with events:

- VS Code version
- Extension version

## Telemetry Implementation

For complete transparency, you can review our telemetry implementation in these files:

- [src/services/telemetry.service.ts](src/services/telemetry.service.ts): Core telemetry service
- [src/constants/telemetry.ts](src/constants/telemetry.ts): Defined telemetry events

## How to Opt Out

You can disable telemetry through VS Code settings:

1. Open VS Code Settings (⌘/Ctrl + ,)
2. Search for "Cody Plus Plus"
3. Find "Enable Telemetry" setting
4. Uncheck the box to disable telemetry

Alternatively, you can add this to your VS Code `settings.json`:

```json
{
  "codyPlusPlus.enableTelemetry": false
}
```

## Questions or Concerns?

If you have any questions about our telemetry practices, please:

1. Open an issue on our [GitHub repository](https://github.com/mnismt/codyplusplus)
2. Contact us through the repository discussions
