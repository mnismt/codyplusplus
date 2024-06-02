// src/vscodeApi.ts
type VscodeMessage = string | number | boolean | object | undefined
export { COMMANDS } from '../../../constants/webview'

interface VsCodeApi {
  postMessage: (message: VscodeMessage) => void
  getState: () => VscodeMessage
  setState: (newState: VscodeMessage) => void
}

declare global {
  interface Window {
    vscode: VsCodeApi
  }
}

const vscode = window.vscode

export const postMessage = (message: VscodeMessage) => {
  vscode.postMessage(message)
}

export const getState = () => {
  return vscode.getState()
}

export const setState = (newState: any) => {
  vscode.setState(newState)
}
