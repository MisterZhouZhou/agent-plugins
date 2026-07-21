# agent-notify

macOS 桌面通知插件，同时支持 Claude Code 和 Codex。回复完成或权限申请时通过系统通知中心提醒，点击通知激活发起任务的终端应用。

## 效果

- **Stop**：当前回合结束，通知正文显示 `last_assistant_message` 摘要
- **权限申请**：CLI 等待用户授权时立刻提醒（Claude 使用 `Notification` + matcher `permission_prompt`，Codex 使用 `PermissionRequest`）
- 通知按项目路径分组，新通知替换旧通知
- 优先使用 `terminal-notifier`，未安装时降级到 `osascript`

仅支持 macOS。

## 前置依赖

```bash
brew install terminal-notifier
```

未安装 `terminal-notifier` 时脚本会降级到 AppleScript，但没有 `-activate` 能力，点击通知不会激活终端。

## 安装

### Claude Code

```bash
/plugin marketplace add ~/Desktop/ai/agent-plugins
/plugin install agent-notify@claude-agent-plugins
```

启用后新会话即生效。

### Codex

```bash
codex plugin marketplace add ~/Desktop/ai/agent-plugins
codex plugin add agent-notify@codex-agent-plugins
```

安装后在 CLI 中打开 `/hooks`，审核并信任 `Stop` 与 `PermissionRequest` 两个 Hook，然后重新打开一个 Codex 会话。

## 目录结构

```text
plugins/agent-notify/
├── .claude-plugin/plugin.json     # Claude Code manifest
├── .codex-plugin/plugin.json      # Codex manifest
├── hooks/
│   ├── hooks.json                # Claude Code：Stop + Notification(permission_prompt)
│   └── codex-hooks.json           # Codex：Stop + PermissionRequest
├── bin/agent-notify               # 共用 Python 脚本
└── assets/
    ├── claude.png
    └── codex.png
```

Hook 命令通过 `${CLAUDE_PLUGIN_ROOT}` / `${PLUGIN_ROOT}` 定位插件根目录，图标以 `AGENT_NOTIFY_ICON_DIR` 传入，无需额外安装步骤。

## 手动测试

在 Claude Code 或 Codex 的 Bash 会话中直接执行（插件启用后 `bin/agent-notify` 会加入 Bash tool 的 PATH）：

```bash
printf '%s' '{"cwd":"/tmp/demo","last_assistant_message":"Claude 通知验证"}' \
  | agent-notify claude stop

printf '%s' '{"cwd":"/tmp/demo","tool_name":"Bash"}' \
  | agent-notify codex permission
```

或者只 dry-run 检查参数拼装：

```bash
AGENT_NOTIFY_DRY_RUN=1 agent-notify codex stop \
  <<< '{"cwd":"/tmp/demo","last_assistant_message":"test"}'
```

## 环境变量

| 变量 | 用途 |
|---|---|
| `AGENT_NOTIFY_BIN` | 指定 `terminal-notifier` 绝对路径 |
| `AGENT_NOTIFY_ACTIVATE` | 覆盖点击时激活的 bundle ID；`none` 禁用 |
| `AGENT_NOTIFY_ICON` | 覆盖图标路径，可传文件路径或 `file://` URL |
| `AGENT_NOTIFY_ICON_DIR` | 覆盖图标目录，目录内需有 `claude.png` 与 `codex.png` |
| `AGENT_NOTIFY_DRY_RUN=1` | 不发送通知，只输出解析后的 JSON 与命令参数 |
| `AGENT_NOTIFY_PERMISSION_REMINDER=0` | 关闭系统通知权限关闭时的 AppleScript 引导弹窗 |

## 权限检查

如果安装后没有看到通知，先检查 macOS 通知权限：

```bash
agent-notify doctor
agent-notify doctor --open-settings
```

`terminal-notifier` 的通知权限被系统关闭时，发送仍会返回成功但无横幅。用 `--open-settings` 打开系统设置手动开启。

## 故障排查

- **没有通知弹出**：先跑 `agent-notify doctor` 确认权限；再确认 `brew list terminal-notifier` 存在
- **点击通知没激活终端**：`-activate` 只识别 Warp、Terminal.app、iTerm2、VS Code、Cursor；其他终端设置 `AGENT_NOTIFY_ACTIVATE=<bundle-id>` 覆盖
- **Codex 首次启用无反应**：打开 `/hooks` 信任本插件的 Hook 后重启会话
- **通知图标空白**：检查 `${CLAUDE_PLUGIN_ROOT}/assets/` 或 `${PLUGIN_ROOT}/assets/` 下 `claude.png` / `codex.png` 是否存在

## 上游

原独立仓库：[MisterZhouZhou/agent-notification](https://github.com/MisterZhouZhou/agent-notification)。该仓库继续维护 `install.sh` 脚本安装方式，服务不使用插件市场的用户。
