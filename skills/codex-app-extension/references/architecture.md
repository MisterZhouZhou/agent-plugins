# Codex App 扩展架构

仅在需要决定组件边界、触发链、权限模型或排查“任务为什么没有执行”时读取本文件。

## 总体分层

Codex App 外部扩展不只有一条通信链。根据能力来源和生命周期，通常需要区分三条通道：

```text
Renderer userscript
  ├─ CDP binding → 注入器/宿主 handler → 本地文件、数据库或系统能力
  ├─ fetch(loopback helper) → Local Helper HTTP Server → 本地业务服务
  └─ 宿主代理 → Codex App Server RPC → thread/turn/composer/automation
```

三条通道可以并存，但 transport、权限边界、失败模式和生命周期不同。

### 通道选择表

| 通道 | 适用动作 | 主要边界 | 不应做的事 |
| --- | --- | --- | --- |
| CDP binding | 宿主受控能力、低延迟请求返回 | binding 白名单、请求 ID、socket 生命周期 | 页面传任意宿主函数 |
| Local Helper HTTP | Renderer 可 `fetch()` 的本地业务接口 | loopback、token、endpoint 权限、CORS | 把 HTTP 服务当 App Server |
| Codex App Server RPC | thread、turn、composer、automation | 当前协议、schema、用户确认 | 从 API 写库推断自动执行 |

其中：

- **CDP binding** 是注入器和 Python/Node 宿主之间的受控桥，适合需要宿主权限的动作；它本身不是 Codex App Server。
- **Local Helper HTTP** 是扩展自行启动的 loopback HTTP 服务，Renderer 可以通过 `fetch()` 调用；它的端口、认证和关闭由扩展管理。
- **Codex App Server RPC** 是 Codex 领域操作的协议边界，具体方法、事件和参数必须按当前 App 版本重新发现。

### 端口边界

```text
debug_port：Chromium CDP discovery / WebSocket
helper_port：扩展自己的本地 HTTP Helper
```

debug port 和 helper port 是两套独立端口、独立身份和独立生命周期，不能因为其中一个端口可访问就推断另一个服务可用。两个服务默认都应绑定 `127.0.0.1`；`/health` 返回成功也不等于已经确认服务身份，生产实现应额外校验协议版本、实例标识或随机 token。

## 页面 / UI

负责按钮、表单、状态展示和用户意图。它可以调用 `window.codexAppExtension.request()`，但不应知道 CDP WebSocket、App Server 端口、Helper Server token 或任意 RPC 方法名。

## Userscript

负责把页面事件编码成版本化消息，并把宿主响应还原为 Promise。通用模板使用 `window.postMessage`，必须校验消息来源、请求 ID 和超时；直接使用 CDP binding 时也必须保留固定命名空间、请求 ID、白名单和清理逻辑。重复注入时先清理旧监听器、pending、样式、timer 和 observer。

## CDP 注入器

负责发现并验证 Codex App 的调试端点、连接 page target、安装早期脚本、注入当前页面、监听 binding 调用和转发白名单请求。它是权限边界，不是业务任务执行器。

CDP 注入必须同时考虑：

- `Page.addScriptToEvaluateOnNewDocument` 只影响后续 document；
- 当前页面仍需通过 `Runtime.evaluate` 立即注入；
- 多个 page target 需要独立保存 socket、注入版本和清理状态；
- target 消失、socket 关闭或 App 更新时要移除旧 registry 并重新发现。

## Local Helper HTTP Server

Local Helper Server 由扩展自行启动，常见实现是 loopback `ThreadingHTTPServer` 或等价 HTTP 服务。它可以承载 Renderer 需要调用的本地业务接口，例如本地数据库、文件导出或状态查询。

Helper Server 必须单独设计：

- 只监听 loopback，避免暴露到 `0.0.0.0`；
- 通过 `/health`、协议版本和实例标识区分“自己的服务”和“其他进程占用的端口”；
- 对每个 endpoint 建立读/写权限矩阵；
- mutation endpoint 使用 token 或其他认证，并校验 JSON schema；
- CORS 和 Private Network Access 只解决浏览器访问策略，不能代替认证；
- App 退出、扩展停止或 attach 失败时关闭 server socket；
- 不把 Helper endpoint 当作 Codex App Server RPC，也不从 Helper 写库成功推断 Codex 已启动。

## Codex App Server

负责 thread、turn、workspace/project、composer、automation 等 Codex 领域操作。具体 RPC 方法和事件应以当前 App 版本的协议发现结果为准，不要把旧版本方法名硬编码成永久契约。

## thread / Skill / CLI

thread 是执行上下文，turn 是一次模型回合；Skill 是会话内被加载的工作流/知识，CLI 是可被 Skill 或用户调用的命令行工具。它们不等于页面 API，也不会因为页面写入数据库就自动运行。

## 两条触发链

### 手动触发

```text
页面填写任务
  → Taskboard API 写入或更新任务
  → 用户在 Codex composer 中确认并提交
  → App Server 创建/续接 thread 并启动 turn
  → thread 加载 Skill 执行任务
  → Skill 按约定调用 taskctl
  → taskctl 调 Taskboard API 回写状态
```

### 定时触发

```text
创建或更新 automation
  → App Server 保存 cron / 时区 / prompt / workspace
  → 到达下一次计划时间
  → App Server 自动创建会话并启动 turn
  → Skill 执行并由 taskctl 回写 Taskboard
```

## 关键边界

- **Taskboard API 写库不等于触发 Codex。** 数据库写入只是状态持久化；除非另有 worker 明确监听并调用 App Server，否则不会启动 thread。
- **taskctl 不启动 Codex。** 它只读取、创建、更新、归档或标记 Taskboard 任务；触发由 composer 提交或 automation 到期完成。
- **页面不能任意调用 RPC。** 宿主侧应维护显式白名单，并对参数做 schema 校验。
- **扩展不是 App 修改。** 优先使用 CDP、userscript、Helper Server、App Server 合同和 Skill；不要修改 `app.asar`。

## 推荐决策顺序

1. 先确认目标是手动执行、定时执行，还是只做任务同步。
2. 再判断需求属于 CDP binding 宿主能力、Local Helper HTTP 本地业务接口，还是 Codex App Server thread/turn/composer/automation。
3. 需要宿主能力时，画出页面请求 → CDP binding → 宿主 handler 的消息契约；需要 Renderer fetch 时，单独画出 Helper endpoint、认证和关闭链。
4. 最后补充 target 身份校验、端口身份、超时、断线恢复、target 清理和版本探测。
