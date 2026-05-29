---
name: vscode-extension-skill
description: VS Code 扩展开发专项技能。用于创建、维护、调试、打包或发布 VS Code Extension，覆盖 TypeScript 脚手架、package.json manifest、activationEvents、contributes.commands、命令注册、Webview、ExtensionContext、VSIX 打包、本地安装与发布前检查；详细文档按 vscode-skills 参考内容拆分在 references/。
---

# VS Code Extension Skill

## 使用场景

当用户需要处理 VS Code 扩展项目时使用本技能，尤其是：

- 从零创建 TypeScript VS Code 扩展项目。
- 新增或修改命令、菜单、快捷键、配置项、视图、Webview 等贡献点。
- 排查 `package.json` manifest、激活事件、命令 ID、打包和本地安装问题。
- 将扩展打包成 `.vsix`，或准备发布到 VS Code Marketplace / Open VSX。

## 工作流

1. 先识别项目状态：查看 `package.json`、`src/extension.ts`、`tsconfig.json`、测试和构建脚本。
2. 优先沿用现有扩展结构：命令注册位置、命名空间、日志/错误提示方式、UI 组织、构建工具。
3. 根据任务读取最相关的引用文档，避免一次加载所有内容。
4. 修改 manifest 时同步检查实现代码：`contributes.*`、`activationEvents`、命令注册和 `context.subscriptions` 要彼此对应。
5. 完成后优先运行项目已有的 `npm run compile`、`npm run lint`、`npm test`、`npm run package` 或 `npx @vscode/vsce package`。

## 文档结构

详细文档按参考仓库 `skills/vscode-skills` 的主题拆分在 `references/`：

```text
references/
  project-init/
  commands/
  webview/
  package/
```

## 引用文档导航

- 新建 VS Code 扩展项目、Yeoman `generator-code`、基础目录和入口：读 [references/project-init/overview.md](references/project-init/overview.md)。
- 新增命令、更新 `contributes.commands`、注册 `vscode.commands.registerCommand`：读 [references/commands/overview.md](references/commands/overview.md)。
- 创建 Webview、自定义 HTML、消息通信、本地资源和 CSP：读 [references/webview/overview.md](references/webview/overview.md)。
- VSIX 打包、本地安装、发布前检查、publisher/version/README/CHANGELOG：读 [references/package/overview.md](references/package/overview.md)。

## 决策规则

- TypeScript 扩展默认以 `src/extension.ts` 为入口，导出 `activate(context)` 和可选 `deactivate()`。
- 命令 ID 使用稳定命名空间，例如 `<extensionName>.<actionName>`；manifest、代码注册、文档示例必须一致。
- 能用 VS Code 原生 UI 的场景优先用 `window.showQuickPick`、`showInputBox`、`TreeView`、`StatusBarItem`；只有复杂表单、预览、仪表盘或富交互才使用 Webview。
- Webview 默认按安全模型实现：限制 `localResourceRoots`、使用 `asWebviewUri`、添加 CSP、只在确实需要时开启 `enableScripts`。
- 异步命令用 `async`/`await`，对文件系统、网络、外部命令等失败路径给出明确的 `showErrorMessage` 或日志。
- 新增 disposable 对象时放入 `context.subscriptions`，避免窗口重载或扩展停用后泄漏。
- 不要为了新增一个小命令重写整个扩展结构；保持改动贴近已有文件和贡献点。

## 常用核查

- Manifest：`engines.vscode`、`activationEvents`、`main`、`contributes.commands`、`publisher`、`version` 是否合理。
- 命令：命令 ID 是否唯一；`package.json` 中的 title/category 和代码里的注册 ID 是否一致。
- Webview：是否有 CSP；本地资源是否通过 `webview.asWebviewUri`；消息传递是否校验 command/type。
- 文件系统：优先用 `vscode.workspace.fs` 和 `Uri`，不要只写死 Node 路径逻辑。
- 质量：运行编译、lint、测试、打包；需要交互验证时用 Extension Development Host 手动或自动检查关键命令。
