import * as vscode from 'vscode'
import { DEV_WEBVIEW_URL } from '../constants/webview'
import { getNonce } from '../utils'

export abstract class BaseWebview {
  protected constructor(
    protected readonly _extensionUri: vscode.Uri,
    protected readonly _extensionMode: vscode.ExtensionMode
  ) {}

  protected _getHtmlForWebview(webview: vscode.Webview, additionalScriptVars?: string): string {
    if (this._extensionMode === vscode.ExtensionMode.Development) {
      return this._getDevHtml(additionalScriptVars)
    }
    return this._getProdHtml(webview, additionalScriptVars)
  }

  protected _getDevHtml(additionalScriptVars?: string): string {
    const nonce = getNonce()
    return `
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link href="${DEV_WEBVIEW_URL}/node_modules/@vscode/codicons/dist/codicon.css" rel="stylesheet" id="vscode-codicon-stylesheet" />
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; font-src ${DEV_WEBVIEW_URL}; connect-src http://localhost:5173 ws://localhost:5173; img-src http://localhost:5173 https:; script-src 'unsafe-eval' 'unsafe-inline' http://localhost:5173; style-src 'unsafe-inline' http://localhost:5173;">
    <script type="module">
      import { injectIntoGlobalHook } from "${DEV_WEBVIEW_URL}/@react-refresh"
      injectIntoGlobalHook(window)
      window.$RefreshReg$ = () => {}
      window.$RefreshSig$ = () => (type) => type
      window.__vite_plugin_react_preamble_installed__ = true
    </script>
    <script type="module" src="${DEV_WEBVIEW_URL}/@vite/client"></script>
    <link rel="icon" type="image/svg+xml" href="${DEV_WEBVIEW_URL}/vite.svg" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="${DEV_WEBVIEW_URL}/src/main.tsx"></script>
    <script nonce="${nonce}">
      window.nonce = "${nonce}"
      window.vscode = acquireVsCodeApi()
      ${additionalScriptVars || ''}
    </script>
  </body>
</html>`
  }

  protected _getProdHtml(webview: vscode.Webview, additionalScriptVars?: string): string {
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, 'dist', 'webviews', 'assets', 'index.js')
    )
    const styleUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, 'dist', 'webviews', 'assets', 'index.css')
    )
    const codiconUri = webview.asWebviewUri(
      vscode.Uri.joinPath(
        this._extensionUri,
        'node_modules',
        '@vscode',
        'codicons',
        'dist',
        'codicon.css'
      )
    )
    const nonce = getNonce()
    const cspSource = webview.cspSource

    return `<!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <link href="${codiconUri}" rel="stylesheet" id="vscode-codicon-stylesheet" />
      <meta http-equiv="Content-Security-Policy" content="default-src 'none'; font-src ${cspSource}; img-src ${cspSource} https:; script-src 'nonce-${nonce}' ${cspSource}; style-src 'unsafe-inline' ${cspSource};">
      <link rel="stylesheet" type="text/css" href="${styleUri}">
    </head>
    <body>
      <div id="root"></div>
      <script type="module" nonce="${nonce}" src="${scriptUri}"></script>
      <script nonce="${nonce}">
        window.nonce = "${nonce}"
        window.vscode = acquireVsCodeApi()
        ${additionalScriptVars || ''}
      </script>
    </body>
    </html>`
  }
}
