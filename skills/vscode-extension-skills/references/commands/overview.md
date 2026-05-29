# 命令功能

## 何时读取

当用户要新增命令、修改命令逻辑、把功能暴露到命令面板/菜单/快捷键时读取本文件。

## 必改位置

新增命令通常至少修改两个地方：

1. `package.json` 的 `contributes.commands`。
2. `src/extension.ts` 或项目已有命令模块中的 `vscode.commands.registerCommand`。

## package.json 示例

```json
{
  "activationEvents": [
    "onCommand:myExtension.doSomething"
  ],
  "contributes": {
    "commands": [
      {
        "command": "myExtension.doSomething",
        "title": "My Extension: Do Something",
        "category": "My Extension"
      }
    ]
  }
}
```

## 注册命令示例

```ts
import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
  const disposable = vscode.commands.registerCommand('myExtension.doSomething', async () => {
    try {
      vscode.window.showInformationMessage('Command executed!');
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      vscode.window.showErrorMessage(`Command failed: ${message}`);
    }
  });

  context.subscriptions.push(disposable);
}
```

## 常见扩展点

- 命令面板：只需要 `contributes.commands`。
- 菜单入口：添加 `contributes.menus.commandPalette`、`editor/context`、`explorer/context` 等。
- 快捷键：添加 `contributes.keybindings`，同时设置合适的 `when` 条件。
- 配置项：添加 `contributes.configuration`，读取时用 `vscode.workspace.getConfiguration()`。

## 实现规则

- 命令 ID 使用 `<extensionName>.<actionName>`，不要使用泛泛的 `extension.myCommand`，除非项目已有这种约定。
- `package.json`、注册代码、README 示例中的命令 ID 必须一致。
- 异步命令使用 `async` 回调；长任务可配合 `vscode.window.withProgress`。
- 所有 disposable 都加入 `context.subscriptions`。
- 需要当前编辑器时，先检查 `vscode.window.activeTextEditor` 是否存在。
- 修改文档内容优先使用 `WorkspaceEdit` 或 `TextEditorEdit`，不要直接写磁盘绕过编辑器状态。

