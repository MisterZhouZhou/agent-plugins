# Pi Permissions and Trust

适用基线：Pi `0.84.1`；SAFE/YOLO 细节来自本地 `@misterzhou/pi-yolo` 和 `@misterzhou/pi-subagent`，不是 Pi core 的 OS sandbox 或统一权限系统。

## 四层边界

1. **Project trust**：决定是否加载 `.pi/settings.json`、项目 extensions、packages、项目 skills/agents 等资源。
2. **Extension policy**：某个 extension 是否对 tool call、文件写入或 Bash 请求确认/阻断。
3. **OS process permission**：Pi 进程实际拥有的文件、进程、网络权限。
4. **Provider/network**：外部 API、代理、DNS/TLS 和认证权限。

这些层彼此独立。project trust 不等于允许写文件；provider 认证成功不等于 tool call 被批准；extension 的确认策略不等于操作系统 sandbox。

## Project trust

交互式启动可能询问是否信任项目。非交互 `-p`、JSON、RPC 不显示提示，而按 `defaultProjectTrust` 和 `--approve`/`--no-approve` 处理一次性覆盖。`--approve` 表示允许本次加载项目资源，不表示批准模型执行文件写入或 Bash。

若要诊断项目资源是否干扰问题，可先用 `--no-extensions --no-skills --no-context-files --no-session`，再明确加入一项资源；不要在不了解来源时直接信任整个项目。

## SAFE/YOLO 扩展边界

本地 `@misterzhou/pi-yolo` 的行为边界：

- SAFE 下文件写入和有副作用 Bash 请求确认；无 UI 时拒绝。
- 只读工具可以直接执行，灾难级 Bash 始终阻断。
- YOLO 可跳过该扩展及 subagent 的普通确认，但仍不放行灾难级 Bash。
- `user_bash` 或其他第三方 extension 不会自动被该策略控制。
- 子 Agent 的 parent approval/child guard 仍是扩展实现，不是 Pi core 保证。

因此，看到 `SAFE`、`YOLO` 或 `--approve` 时，先指出它们属于不同门禁；不能把“已启用 YOLO”写成“Pi 在 sandbox 中运行”。

## 无 UI 和失败闭合

在 `--mode json`、`--mode rpc`、print 模式或 child 进程中，确认 UI 可能不存在。对需要确认的写入、Bash、项目 Agent 或外部工具调用，安全实现应拒绝并返回明确原因，而不是静默放行。验证时分别覆盖有 UI、无 UI、SAFE、YOLO 和灾难命令阻断。

## 操作建议

- 首次加载第三方 extension/package 使用隔离命令和最小权限 cwd。
- 用 `--no-tools` 或工具 allowlist 缩小模型可操作面。
- 仅为已审查的项目资源设置 trust；定期检查 `~/.pi/agent/settings.json`、`.pi/settings.json` 和 package 来源。
- 把 API key 放在环境变量/认证存储中，日志只保留脱敏摘要。

关联：扩展权限来源见 [extensions.md](extensions.md)，subagent 的父子审批见 [subagents.md](subagents.md)，分层验证见 [testing.md](testing.md)。

