# Pi Extensions and Packages

适用基线：Pi `0.84.1`。Extension 是在 Pi 进程内执行的 TypeScript/JavaScript 模块；Pi Package 是可通过 npm、git、URL 或本地路径分发 extensions、skills、prompt templates 和 themes 的资源包。

## Extension 的能力和权限

Extension 可监听生命周期事件、注册 LLM 可调用的 custom tool、命令、shortcut、provider、UI 和 session entry。它可以执行任意代码并继承 Pi 进程的系统权限；安装前应审查源码、依赖、网络和文件操作。

常见自动发现位置：

- 用户：`~/.pi/agent/extensions/`
- 项目：`.pi/extensions/`（需项目 trust）
- `settings.json` 的 `extensions` 和 package manifest

最小 extension 试运行：

```bash
pi --no-extensions -e ./path/to/extension.ts --no-session -p "reply with OK"
```

`--no-extensions` 用于隔离自动发现；显式 `-e` 只重新加入指定资源。不要把 `--approve` 当成 extension 工具调用批准，它只影响项目资源信任。

## Package manifest 和安装

Package 可以在 `package.json` 的 `pi` 字段声明资源，也可以使用约定目录：`extensions/`、`skills/`、`prompts/`、`themes/`。

```json
{
  "name": "example-pi-package",
  "pi": {
    "extensions": ["extensions"],
    "skills": ["skills"],
    "prompts": ["prompts"]
  }
}
```

说明性命令：

```bash
pi install npm:<package>@<version>
pi install git:<host>/<owner>/<repo>@<ref>
pi list
pi config
pi update --extensions
```

这些命令会改变用户或项目设置；本 reference 不自动执行安装、卸载、更新、发布或 npm publish。默认安装写用户设置，`-l` 写项目设置；项目包可能在被信任后启动时自动安装缺失依赖。

## 重复加载和隔离

umbrella package 与其包含的独立 package 可能注册同一 extension 两次。安装前检查 `settings.json`、`package.json#pi` 和显式 `-e`，避免重复命令、hook 或 tool。

诊断顺序：

1. `pi --no-extensions` 确认问题是否由 extension 层引入。
2. 只用一个 `-e` 显式加载目标 extension。
3. 检查 extension 的注册点和事件顺序。
4. 再逐个恢复全局、项目和 package 资源。

Extension 能力不等于 Pi core 内置能力。subagent、SAFE/YOLO、MCP adapter 等必须在对应 package/extension 的 manifest、README 或源码中确认后再描述，见 [subagents.md](subagents.md)、[mcp.md](mcp.md) 和 [permissions.md](permissions.md)。

## 配置命令与持久 TUI 菜单

为扩展添加可动态配置的显示项目时，优先把“显示哪些内容”作为一个独立配置对象，并保持配置、渲染和持久化三者分离：

```ts
interface DisplayConfig {
  tokens: boolean;
  thinking: boolean;
  context: boolean;
}

pi.registerCommand("status", {
  description: "配置状态栏显示项目",
  handler: async (_args, ctx) => {
    // TUI 中用 ctx.ui.custom() 打开一次持久组件
  },
});
```

关键约束：

- `ctx.ui.select()` 是单选对话框。通过循环 `select` 模拟多选会反复销毁/创建界面，勾选后容易闪屏；需要同时编辑多个开关时，应使用一次 `ctx.ui.custom()` 挂载自定义组件。
- 自定义多选组件在构造时接收 `tui`、`theme`、`keybindings` 和 `done`，内部维护当前索引、勾选集合和 dirty 状态；方向键只更新组件，随后调用 `tui.requestRender()`。
- 勾选/取消只刷新菜单本身；按明确的保存键（例如 `app.models.save` 对应的 Ctrl+S）时才调用保存回调并刷新 footer；Esc/Ctrl+C 取消时不保存未提交修改。
- 使用 `Container`、`Text`、`Spacer` 等已有 `pi-tui` 组件，并保证自定义组件实现 `render(width)`、`handleInput(data)` 和 `invalidate()`。每行必须遵守宽度限制；主题颜色在 render 或 invalidate 后重新计算。
- 配置若属于当前会话，可用 `pi.appendEntry("<private-config-type>", config)` 持久化，在 `session_start` 中从 `ctx.sessionManager.getBranch()` 恢复最后一条合法配置。只读当前分支，避免把其他分支的配置带入。
- 统一通过 `normalizeConfig()` 补齐缺失字段并过滤非法值；默认配置应是不可变的基准副本，恢复和保存时复制对象，避免组件直接修改共享默认值。

状态栏项目必须与实际渲染内容一一对应。`model`、`cwd`、`git` 和 `extensions` 不是天然存在的独立功能，只有 footer 明确渲染时才应出现在配置菜单中。特别是“扩展状态”通常表示 `footerData.getExtensionStatuses()` 返回的 `setStatus()` 状态，不是已安装扩展列表。

上下文信息应优先使用 `ctx.getContextUsage()`：其 `contextWindow` 是当前模型的上下文窗口 Token 数，`percent` 可能为 `null`。显示占比和窗口时应分别处理缺失值，例如 `--/128k`，不要把未知值当作 0。

