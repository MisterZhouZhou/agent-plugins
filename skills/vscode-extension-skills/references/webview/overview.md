# Webview 功能

## 何时读取

当用户需要在 VS Code 扩展里展示复杂 UI、表单、图表、预览、设置面板或双向交互时读取本文件。

## 选择准则

优先使用 VS Code 原生 UI：

- 简单输入：`showInputBox`
- 单选/多选：`showQuickPick`
- 状态展示：`StatusBarItem`
- 树形数据：`TreeView`

只有当原生 UI 无法表达复杂布局或富交互时，才创建 Webview。

## 基础结构

```ts
import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
  let currentPanel: vscode.WebviewPanel | undefined;

  const disposable = vscode.commands.registerCommand('myExtension.showPanel', () => {
    if (currentPanel) {
      currentPanel.reveal(vscode.window.activeTextEditor?.viewColumn);
      return;
    }

    currentPanel = vscode.window.createWebviewPanel(
      'myExtensionPanel',
      'My Extension',
      vscode.ViewColumn.One,
      {
        enableScripts: true,
        localResourceRoots: [vscode.Uri.joinPath(context.extensionUri, 'media')]
      }
    );

    currentPanel.webview.html = getWebviewContent(currentPanel.webview, context.extensionUri);

    currentPanel.onDidDispose(() => {
      currentPanel = undefined;
    }, undefined, context.subscriptions);
  });

  context.subscriptions.push(disposable);
}
```

## HTML 与 CSP

```ts
function getWebviewContent(webview: vscode.Webview, extensionUri: vscode.Uri) {
  const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, 'media', 'main.js'));
  const styleUri = webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, 'media', 'main.css'));
  const nonce = getNonce();

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; script-src 'nonce-${nonce}';">
  <link href="${styleUri}" rel="stylesheet">
  <title>My Extension</title>
</head>
<body>
  <main id="app"></main>
  <script nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>`;
}

function getNonce() {
  let text = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}
```

## 消息通信

扩展侧：

```ts
currentPanel.webview.onDidReceiveMessage(
  async (message) => {
    switch (message.command) {
      case 'save':
        await handleSave(message.payload);
        break;
      default:
        vscode.window.showWarningMessage(`Unknown webview command: ${message.command}`);
    }
  },
  undefined,
  context.subscriptions
);
```

Webview 侧：

```js
const vscode = acquireVsCodeApi();

vscode.postMessage({
  command: 'save',
  payload: { value: 'example' }
});
```

## 安全核查

- 只在需要脚本时开启 `enableScripts`。
- 本地资源必须用 `webview.asWebviewUri`。
- 限制 `localResourceRoots`，不要让 Webview 读取整个工作区。
- 必须设置 CSP；不要使用裸 `<script>`，用 nonce 或外部脚本。
- 处理 `onDidReceiveMessage` 时校验 `message.command` 和 payload 结构。
- 避免把工作区路径、token、环境变量等敏感信息直接注入 HTML。

