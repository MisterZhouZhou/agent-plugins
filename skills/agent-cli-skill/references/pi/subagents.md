# Pi Subagents

适用基线：Pi `0.84.1`。Pi core/SDK 本身不默认提供通用 subagent 编排工具；本文涉及的 `subagent` 工具、Agent markdown 和 SAFE/YOLO 联动，来源是本地 `@misterzhou/pi-subagent` / `@misterzhou/pi-yolo` 扩展实现。其他 Pi 安装必须重新核对 package 版本和源码。

## Agent 来源和优先级

本地 `@misterzhou/pi-subagent` 的发现范围是：

- builtin：扩展包内置的 `agents/*.md`；
- user：`~/.pi/agent/agents/*.md`；
- project：从当前 cwd 向祖先查找最近的 `.pi/agents/*.md`。

同名 Agent 的优先级为 `project > user > builtin`。工具参数中的 `agentScope` 可限制为项目、用户、内置或组合范围。项目 Agent 不是因为位于父目录就自动继承父级业务描述、session 或权限；它只是被发现的资源。

Agent markdown 的字段和可用工具以扩展实现为准。先读取 package README/源码，再根据实际 schema 写配置；不要把 `.claude/agents` 或 `.codex/agents` 的字段直接复制到 `.pi/agents`。

## 三种执行形状

`@misterzhou/pi-subagent` 的工具输入约定：

```text
agent + task       -> single
tasks: [...]       -> parallel
chain: [...]       -> chain
```

chain 会把前一步的文本结果替换到后一步任务中的 `{previous}`。parallel 适合只读分析或互不冲突的文件；多个 child 同时写同一个文件时，结果和权限审计都不可靠，应改为串行 worker/reviewer 流程。

子 Pi 进程的当前实现会：

- 继承父请求的 cwd 和当前 provider/model；
- 使用 `--mode json -p --no-session`，避免把临时 child 写成独立持久会话；
- 使用 `--no-extensions`，只显式加载必要的 child guard；
- 通过环境变量传递父批准状态，并禁止递归注册 `subagent` 工具。

这些是该扩展的实现细节，不是 Pi CLI 的通用保证。诊断 child 时记录 cwd、provider/model、完整 argv（脱敏）、退出码、stderr 尾部和父任务标识。

## 信任与审批

项目 Agent 可能要求父进程信任项目资源；SAFE 下包含 `write`/`edit` 的任务需要父进程确认。没有 UI 时，当前扩展对需要确认的操作 fail closed，并可能回退到 user/builtin Agent。YOLO 只改变该扩展及其 child guard 的普通确认路径，不能替代操作系统权限，也不代表其他扩展被批准。

建议用阶段化角色降低冲突：

1. `explore`：只读定位、列出证据和风险。
2. `planner`：根据证据形成小范围方案。
3. `worker`：在明确批准范围内实施。
4. `reviewer`：只读检查 diff、测试和回归。

## 最小隔离验证

```bash
pi --no-extensions -e <subagent-extension-path> --no-session
```

首次验证先用只读 single，再验证 parallel 和 `{previous}` chain，最后验证写入任务、无 UI 和灾难 Bash guard。必须确认实际 package 版本；不能因为 Pi 支持 extensions 就推断 Pi 已内置 subagents。

关联：扩展加载见 [extensions.md](extensions.md)，权限层次见 [permissions.md](permissions.md)，事件/session 证据见 [sessions.md](sessions.md)。

