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

