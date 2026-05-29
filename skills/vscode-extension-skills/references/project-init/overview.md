# VS Code 扩展项目初始化

## 何时读取

当用户要从零创建 VS Code 扩展，或需要判断一个目录是不是标准扩展项目时读取本文件。

## 快速流程

1. 如果用户没有给项目名，先根据上下文选择一个简洁的 kebab-case 名称，风险较高时再询问。
2. 使用官方 Yeoman 模板创建 TypeScript 扩展：

```bash
npx --package yo --package generator-code -- yo code <project-name> --template typescript --quick
```

3. 进入项目目录后检查关键文件：

```text
package.json
src/extension.ts
tsconfig.json
vsc-extension-quickstart.md
```

4. 如生成器没有安装依赖，运行 `npm install`。
5. 说明可验证方式：按 `F5` 打开 Extension Development Host，或运行项目脚本中的 compile/test 命令。

## 标准入口

`src/extension.ts` 通常包含：

```ts
import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
  const disposable = vscode.commands.registerCommand('extension.helloWorld', () => {
    vscode.window.showInformationMessage('Hello World from the extension!');
  });

  context.subscriptions.push(disposable);
}

export function deactivate() {}
```

## package.json 关键字段

- `name`: 扩展包名，通常 kebab-case。
- `displayName`: Marketplace 和扩展列表展示名。
- `description`: 简洁说明扩展能力。
- `version`: 语义化版本。
- `publisher`: 打包发布必需；本地测试可临时用 `"local"`。
- `engines.vscode`: 支持的 VS Code 版本范围。
- `main`: 编译后的入口，常见为 `"./out/extension.js"`。
- `activationEvents`: 触发扩展激活的事件。
- `contributes`: 命令、菜单、配置、视图等贡献点。

## 初始化后检查

- 不要在未确认用户需要时引入复杂构建系统；先使用生成器默认配置。
- 新项目默认使用 TypeScript。
- 如果当前目录已有 `package.json`，先确认是否要在当前目录改造，还是创建子目录。
- 遇到 npm/yarn/pnpm 项目时，优先沿用已有包管理器。

