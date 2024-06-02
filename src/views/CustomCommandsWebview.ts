import * as vscode from 'vscode'
import { DEV_WEBVIEW_URL } from '../constants/webview'
import { getNonce } from '../utils'

export class CustomCommandsWebview {
  public static currentPanel: CustomCommandsWebview | undefined
  private readonly _panel: vscode.WebviewPanel
  private readonly _extensionUri: vscode.Uri
  private readonly _extensionMode: vscode.ExtensionMode

  private constructor(
    panel: vscode.WebviewPanel,
    extensionUri: vscode.Uri,
    extensionMode: vscode.ExtensionMode
  ) {
    this._panel = panel
    this._extensionUri = extensionUri
    this._extensionMode = extensionMode

    // Set the webview's initial HTML content
    this._panel.webview.html = this._getHtmlForWebview(this._panel.webview)

    // Handle messages from the webview
    this._panel.webview.onDidReceiveMessage(
      message => {
        switch (message.command) {
          case 'alert':
            vscode.window.showErrorMessage(message.text)
            return
        }
      },
      undefined,
      []
    )
  }

  public static createOrShow(extensionUri: vscode.Uri, extensionMode: vscode.ExtensionMode) {
    const column = vscode.window.activeTextEditor
      ? vscode.window.activeTextEditor.viewColumn
      : undefined

    // If we already have a panel, show it.
    if (CustomCommandsWebview.currentPanel) {
      CustomCommandsWebview.currentPanel._panel.reveal(column)
      return
    }

    // Otherwise, create a new panel.
    const panel = vscode.window.createWebviewPanel(
      'customCommandsWebview',
      'Add Custom Command',
      column || vscode.ViewColumn.One,
      {
        enableScripts: true,
        localResourceRoots: [vscode.Uri.joinPath(extensionUri, 'src', 'webviews', 'dist')]
      }
    )

    CustomCommandsWebview.currentPanel = new CustomCommandsWebview(
      panel,
      extensionUri,
      extensionMode
    )
  }

  private _getHtmlForWebview(webview: vscode.Webview): string {
    if (this._extensionMode === vscode.ExtensionMode.Development) {
      return this._getDevHtml()
    }
    return this._getProdHtml(webview)
  }

  private _getDevHtml(): string {
    return `
<!doctype html>
<html lang="en">
  <head>
    <script type="module">
      import { injectIntoGlobalHook } from '${DEV_WEBVIEW_URL}/@react-refresh';
      injectIntoGlobalHook(window);
      window.$RefreshReg$ = () => {};
      window.$RefreshSig$ = () => (type) => type;
      window.__vite_plugin_react_preamble_installed__ = true;
    </script>
    <script type="module" src="${DEV_WEBVIEW_URL}/@vite/client"></script>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Cody++</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="${DEV_WEBVIEW_URL}/src/main.tsx"></script>
  </body>
</html>
`
  }

  private _getProdHtml(webview: vscode.Webview): string {
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, 'src', 'webviews', 'dist', 'assets', 'index.js')
    )
    const styleUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, 'src', 'webviews', 'dist', 'assets', 'index.css')
    )
    const cspSource = webview.cspSource
    const nonce = getNonce()

    return `<!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Add Custom Command</title>
      <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${cspSource} https:; script-src 'nonce-${nonce}' ${cspSource}; style-src 'unsafe-inline' ${cspSource};">
      <link rel="stylesheet" type="text/css" href="${styleUri}">
    </head>
    <body>
      <div id="root"></div>
      <script type="module" nonce="${nonce}" src="${scriptUri}"></script>
    </body>
    </html>`
  }
}
