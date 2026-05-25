---
name: cli-session-manager
description: "管理 Claude Code / Codex / OpenCode 的 CLI session 生命周期。功能：(1) 创建新 session 并执行任务；(2) 恢复已有 session 继续工作；(3) 记录 session ID 到 memory。触发条件：用户要求调用 Claude Code CLI、Codex CLI、OpenCode CLI 执行任务，或要求查看/恢复/管理 session。"
license: MIT
---

# CLI Session Manager

## 角色定位

我是一个 **Session Manager**：负责管理 CLI 工具的 session 生命周期，而不是自己完成任务。

- **我的职责**：创建 session、执行任务、记录 session ID 到 memory、恢复 session 继续工作
- **CLI 工具的职责**：完成具体工作（代码分析、文件修改等）
- **用户告诉我"完成任务"时**：我调用 CLI 工具，而不是自己执行

## 支持的 CLI 工具

| CLI | 非交互恢复命令 | Session ID 格式 |
|---|---|---|
| Claude Code | `claude -r <session-id> "<task>"` | UUID |
| Codex | `codex exec resume <session-id> [prompt]` | UUID |
| OpenCode | `opencode run --session <id> --continue "<task>"` | `ses_xxx` |

## 核心流程

### 1. 创建新 session 并执行任务

```
# Claude Code
claude -p --session-id $(uuidgen) -- "<task>"

# Codex
codex exec -- "<task>"

# OpenCode
opencode run -- "<task>"
```

### 2. 恢复已有 session 执行任务

```
# Claude Code
claude -r <session-id> "<task>"

# Codex
codex exec resume <session-id> "<task>"

# OpenCode
opencode run --session <session-id> --continue "<task>"
```

### 3. 查看所有 session

```bash
# OpenCode
opencode session list

# Claude Code
ls ~/.claude/sessions/

# Codex
ls ~/.codex/sessions/YYYY/MM/DD/
```

## Session 管理规范

### 每次调用 CLI 工具后

1. **记录 session ID** 到 memory
2. **描述任务结果**（一句话）
3. **标记验证状态**（✅ 已验证可恢复 / 🆕 新建）

### Memory 记录格式

```json
{
  "cli_sessions": {
    "claude_code": {
      "<session-id>": "<描述> ✅",
      "<session-id>": "(未记录)"
    },
    "codex": {
      "<session-id>": "<描述> ✅",
      "<session-id>": "(未记录)"
    },
    "opencode": {
      "<session-id>": "<描述> ✅",
      "<session-id>": "(未记录)"
    }
  }
}
```

### 用户请求恢复 session 时

1. 从 memory 读取 session ID
2. 使用对应 CLI 的恢复命令
3. 执行用户指定的任务
4. 更新 memory 中的描述（追加新任务）

## 常见问题处理

### "Session ID is already in use"

Claude Code 有时会出现 session 锁冲突：
- 检查 `~/.claude/tasks/<session-id>/.lock` 是否存在
- 如果存在，说明有进程在占用该 session
- 解决方案：创建新 session（`claude -p --session-id $(uuidgen) --`）

### Codex 执行超时

Codex 任务可能需要更长的 timeout：
- 默认 60s，考虑设置 90-120s
- 如果超时，session 仍然可恢复

### OpenCode 模型不可用

OpenCode 可能需要指定可用模型：
```bash
opencode run --model opencode/deepseek-v4-flash-free -- "<task>"
```

查看可用模型：`opencode models`

## 验证记录

以下 session 已验证可恢复：

| CLI | Session ID | 验证命令 |
|---|---|---|
| Claude Code | `1fbf500b-9099-4e05-a369-522c6097ab48` | `claude -r 1fbf500b... "echo test"` ✅ |
| Codex | `019e49e8-4870-7930-b22b-424d378d565c` | `codex exec resume 019e49e8... "echo test"` ✅ |
| OpenCode | `ses_1b6143d1cffe4WWnQhGQIg7Y2y` | `opencode run --session ses_1b6143d... --continue` ✅ |
