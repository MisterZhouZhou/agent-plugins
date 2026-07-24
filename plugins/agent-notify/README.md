# agent-notify

macOS 桌面通知插件，同时支持 Claude Code、Codex 和 OpenCode。回复完成或权限申请时通过系统通知中心提醒，点击通知激活发起任务的终端应用。

## 效果

- **回合完成**：Claude/Codex 使用 `Stop`，OpenCode 使用 `session.idle`
- **权限申请**：CLI 等待用户授权时立刻提醒（Claude 使用 `Notification` + matcher `permission_prompt`，Codex 使用 `PermissionRequest`，OpenCode 使用 `permission.updated` / `permission.asked`）
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

### OpenCode

OpenCode 使用 JS 插件机制，不使用 `.opencode-plugin` manifest 或 hooks JSON。在仓库根目录运行安装脚本：

```bash
~/Desktop/ai/agent-plugins/scripts/install-opencode.sh
```

脚本默认将插件软链接到本机 OpenCode 识别的 `~/.opencode/plugins/`。检查状态或卸载：

```bash
~/Desktop/ai/agent-plugins/scripts/install-opencode.sh status
~/Desktop/ai/agent-plugins/scripts/install-opencode.sh uninstall
```

如果已经存在 `~/.opencode/plugins/notification.ts`，它会与本插件重复监听通知事件。安装脚本默认只警告；确认要保留备份并禁用旧插件时运行：

```bash
~/Desktop/ai/agent-plugins/scripts/install-opencode.sh install --disable-legacy
```

旧插件会被改名为 `notification.ts.disabled`，不会删除。安装脚本不会覆盖或删除不由它管理的 `agent-notify.js`。

启用或更新后退出并重启 OpenCode；本地插件不会热加载。

## 目录结构

```text
plugins/agent-notify/
├── .claude-plugin/plugin.json     # Claude Code manifest
├── .codex-plugin/plugin.json      # Codex manifest
├── hooks/
│   ├── hooks.json                # Claude Code：Stop + Notification(permission_prompt)
│   └── codex-hooks.json           # Codex：Stop + PermissionRequest
├── opencode/
│   └── agent-notify.js             # OpenCode：session.idle + permission.updated
├── bin/agent-notify               # 共用 Python 脚本
└── assets/
    ├── claude.png
    ├── codex.png
    └── opencode.png

# 仓库根目录
scripts/install-opencode.sh         # OpenCode 安装、状态检查与卸载
```

Claude/Codex Hook 命令通过 `${CLAUDE_PLUGIN_ROOT}` / `${PLUGIN_ROOT}` 定位插件根目录。OpenCode 插件通过自身路径定位插件根目录；复制安装时可用 `AGENT_NOTIFY_ROOT` 覆盖。图标以 `AGENT_NOTIFY_ICON_DIR` 传入，无需额外安装步骤。

## 手动测试

在 Claude Code 或 Codex 的 Bash 会话中直接执行（插件启用后 `bin/agent-notify` 会加入 Bash tool 的 PATH）：

```bash
printf '%s' '{"cwd":"/tmp/demo","last_assistant_message":"Claude 通知验证"}' \
  | agent-notify claude stop

printf '%s' '{"cwd":"/tmp/demo","tool_name":"Bash"}' \
  | agent-notify codex permission

printf '%s' '{"cwd":"/tmp/demo","last_assistant_message":"OpenCode 通知验证"}' \
  | ~/Desktop/ai/agent-plugins/plugins/agent-notify/bin/agent-notify opencode stop
```

或者只 dry-run 检查参数拼装：

```bash
AGENT_NOTIFY_DRY_RUN=1 agent-notify codex stop \
  <<< '{"cwd":"/tmp/demo","last_assistant_message":"test"}'

AGENT_NOTIFY_DRY_RUN=1 ~/Desktop/ai/agent-plugins/plugins/agent-notify/bin/agent-notify opencode permission \
  <<< '{"cwd":"/tmp/demo","message":"OpenCode 正在等待授权"}'
```

## 环境变量

| 变量 | 用途 |
|---|---|
| `AGENT_NOTIFY_BIN` | 指定 `terminal-notifier` 绝对路径 |
| `AGENT_NOTIFY_ACTIVATE` | 覆盖点击时激活的 bundle ID；`none` 禁用 |
| `AGENT_NOTIFY_ICON` | 覆盖图标路径，可传文件路径或 `file://` URL |
| `AGENT_NOTIFY_ICON_DIR` | 覆盖图标目录，目录内需有 `claude.png`、`codex.png` 与 `opencode.png` |
| `AGENT_NOTIFY_ROOT` | OpenCode 插件复制安装时覆盖 agent-notify 插件根目录 |
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
- **OpenCode 启用无反应**：运行 `scripts/install-opencode.sh status`，确认 `agent-notify.js` 位于 `~/.opencode/plugins/`，然后完整重启 OpenCode
- **OpenCode 收到重复通知**：检查 `~/.opencode/plugins/notification.ts` 等旧通知插件，或运行 `scripts/install-opencode.sh install --disable-legacy`
- **OpenCode 复制安装后找不到脚本**：设置 `AGENT_NOTIFY_ROOT=~/Desktop/ai/agent-plugins/plugins/agent-notify` 后重启 OpenCode，或改用 symlink 安装
- **通知图标空白**：检查 `${CLAUDE_PLUGIN_ROOT}/assets/`、`${PLUGIN_ROOT}/assets/` 或 `AGENT_NOTIFY_ROOT/assets/` 下 `claude.png` / `codex.png` / `opencode.png` 是否存在

## 上游

原独立仓库：[MisterZhouZhou/agent-notification](https://github.com/MisterZhouZhou/agent-notification)。该仓库继续维护 `install.sh` 脚本安装方式，服务不使用插件市场的用户。
