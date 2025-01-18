import { PostHog } from 'posthog-node'
import * as vscode from 'vscode'

export class TelemetryService {
  private static instance: TelemetryService
  private enabled: boolean = false
  private ready: boolean = false
  private posthog: PostHog | null = null

  private constructor() {
    try {
      // Initialize PostHog with a public key
      this.posthog = new PostHog('phc_qQGWJ0SO1UBkIsm0vV1K4DP1RbnKUYuxrxHFDuzz1j3', {
        host: 'https://us.i.posthog.com'
      })

      // Get telemetry setting
      this.enabled = vscode.workspace.getConfiguration('codyPlusPlus').get('enableTelemetry', true)
      this.ready = true
      console.log('CODY++: Telemetry initialized and ready. Enabled:', this.enabled)

      // Listen for configuration changes
      vscode.workspace.onDidChangeConfiguration(e => {
        if (e.affectsConfiguration('codyPlusPlus.enableTelemetry')) {
          this.enabled = vscode.workspace
            .getConfiguration('codyPlusPlus')
            .get('enableTelemetry', true)
          console.log('CODY++: Telemetry setting changed. Enabled:', this.enabled)
        }
      })
    } catch (error) {
      console.error('CODY++: Failed to initialize telemetry:', error)
      this.ready = false
      this.enabled = false
    }
  }

  public static getInstance(): TelemetryService {
    if (!TelemetryService.instance) {
      TelemetryService.instance = new TelemetryService()
    }
    return TelemetryService.instance
  }

  public trackEvent(eventName: string, properties?: Record<string, any>) {
    if (!this.ready || !this.enabled || !this.posthog) return

    try {
      console.log(`CODY++: Tracking event: ${eventName}`, properties)
      this.posthog.capture({
        distinctId: vscode.env.machineId,
        event: eventName,
        properties: {
          ...properties,
          vscodeVersion: vscode.version,
          extensionVersion:
            vscode.extensions.getExtension('mnismt.cody-plus-plus')?.packageJSON.version
        }
      })
    } catch (error) {
      console.error('CODY++: Failed to track telemetry event:', error)
    }
  }

  public isEnabled(): boolean {
    return this.enabled
  }

  public isReady(): boolean {
    return this.ready
  }
}
