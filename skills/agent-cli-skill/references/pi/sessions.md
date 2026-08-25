# Pi Sessions, JSON, and RPC

适用基线：Pi `0.84.1`。Session 文件、活动配置和 API 日志是不同证据源；不要把其中任意一个当成完整运行结果。

## 创建和恢复

交互式 Pi 默认把 session 保存到 `~/.pi/agent/sessions/`，按工作目录组织。常用入口：

```bash
pi -c                    # 继续最近 session
pi -r                    # 浏览并选择 session
pi --session <path-or-id>
pi --fork <path-or-id>
pi --no-session           # 临时运行，不持久化
```

交互命令 `/resume`、`/new`、`/session`、`/tree`、`/fork`、`/clone`、`/export` 和 `/import` 的含义以当前 `pi --help`/usage 文档为准。`/trust` 写入 project trust 决策，但当前 session 不会自动重新加载，通常需要重启 Pi 才能观察资源变化。

`PI_CODING_AGENT_SESSION_DIR` 和 `--session-dir` 可改变存储目录；后者优先级更高。`--no-session` 适合 provider、extension、subagent 和敏感请求的隔离测试。

## JSON 与 RPC

- `--mode json`：将 agent 事件作为 JSON Lines 输出，适合记录和机器解析。
- `--mode rpc`：stdin 接受一行一个 JSON command，stdout 输出 response/event JSONL；协议分隔符是 LF。
- SDK 场景应使用当前 `@earendil-works/pi-coding-agent` 的 `AgentSession`/`SessionManager` API，不能混用其他 CLI 的 JSON-RPC 字段。

RPC 子进程必须把 stdout 保持为协议流；诊断日志写 stderr 或由调用方单独收集。解析器应按当前 rpc 文档处理严格 JSONL，不要将 TUI 文本拼入 stdout。

## 诊断证据

每次失败至少保留以下脱敏信息：

```text
pi version:
cwd:
mode:
session: persistent | no-session | rpc/json
provider/model:
extension/resource isolation:
exit code:
stderr tail:
key event or response status:
```

子 Agent 还要记录父任务标识、child argv、cwd、provider/model、退出码和 JSON 最终事件。仅有 session 创建成功、HTTP 404、用户中止或旧日志，不能证明完整生成稳定成功。

## 脱敏与存储边界

Session JSONL 可能包含 prompt、工具参数、扩展 entry、模型变更和 usage；API/extension 日志可能包含 header、路径、文件内容或个人信息。分享前删除 API key、Authorization、cookie、私有地址、完整 prompt/session 和原始 tool payload，仅保留必要摘要。

关联：恢复和隔离验证见 [testing.md](testing.md)，provider contract 见 [providers.md](providers.md)，Pi SDK 边界见 [cli.md](cli.md)。

