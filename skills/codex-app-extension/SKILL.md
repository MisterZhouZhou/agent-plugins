---
name: codex-app-extension
description: >-
  设计、实现和排查 Codex App 扩展：包括 Chromium CDP 调试端点发现、页面
  userscript 注入、postMessage 与 Runtime.addBinding bridge、Codex App Server
  RPC、composer/automation 触发，以及 Taskboard/taskctl 集成。适用于需要从
  Codex App 页面调用受限宿主能力、把任务同步到 Codex thread、或解释“写入任务
  后为何没有执行”的请求；不用于修改 Codex 官方 app.asar 或暴露任意 RPC。
---

# Codex App 扩展开发

## 目标

把 Codex App 扩展拆成可审查的页面层、CDP 注入器、Local Helper HTTP、App Server 客户端和 Codex Skill/CLI 执行层。优先复用本 Skill 的 reference 与模板，不把页面直连 App Server，也不把 Taskboard 写库误判成任务触发。先判断需求属于 CDP binding 宿主能力、Local Helper 本地业务接口，还是 Codex App Server 的 thread/turn/composer/automation；不要因为页面有一个动作按钮就默认调用 App Server。

## 工作流

1. **确认触发模型**：先问清楚是用户提交 composer、cron automation，还是仅同步任务数据。明确“Taskboard API 写入不会自动启动 Codex”。
2. **画消息边界**：定义页面请求、宿主响应的 `type/requestId/method/params`；页面只调用业务动作，宿主维护 RPC 白名单。
3. **核对运行时身份**：验证 loopback 调试地址、端口、PID（可得时）、Browser ID、page target ID 和 WebSocket URL。
4. **实现注入生命周期**：安装 early script 和当前页面脚本，处理 reload、重复注入、socket 断开、pending 超时和退避恢复。
5. **实现 App Server 调用**：参数 schema、超时、错误分类、thread/workspace、composer、automation 分层处理；App 更新后重新发现协议。
6. **验证闭环**：确认 thread/turn 是否真正启动，Skill 是否加载，taskctl 是否只做 Taskboard API 读写，并将状态/错误回写。

## 按需读取参考资料

- 架构、职责边界、触发链：`references/architecture.md`
- CDP 发现、注入、重载、断线：`references/injection-lifecycle.md`
- App Server RPC、composer、automation、版本兼容：`references/app-server-rpc.md`
- Taskboard/taskctl 的端到端案例：`references/taskboard-case-study.md`
- CodexPlusPlus 的 Python CDP Bridge、Local Helper Server、多页面注入、userscript inventory 和内部 Bundle API 风险：`references/codexplusplus-case-study.md`

不要默认加载全部参考文件；根据当前问题只读取相关主题。

## 可复用模板

- `templates/codex-userscript.js`：页面侧 `window.codexAppExtension.request()` 与 `dispose()`。
- `templates/codex-injector.mjs`：CDP discovery、pending map、注入和 watcher 骨架。
- `templates/app-server-client.mjs`：白名单 RPC、超时、参数校验和 thread/automation 包装。

模板是可审查的起点，不是生产 SDK。接入时必须替换 transport、真实协议字段、认证和项目特定 schema，并补充针对当前 Codex App 版本的集成验证。

## 安全与兼容性底线

- 调试端点和 Local Helper 默认只绑定 `127.0.0.1`，禁止把任一服务暴露到 `0.0.0.0`。
- `debug_port` 与 `helper_port` 是独立端口、身份和生命周期，不能混用；健康检查成功不等于服务身份已确认。
- 不根据端口可访问、页面标题或单一 DOM 特征判断目标；至少组合 PID/Browser ID/target ID/页面探针中的可用证据。
- 页面不能传任意 RPC 方法名；未知方法立即拒绝。Local Helper mutation endpoint 也必须逐 endpoint 做认证和 schema 校验。
- `Access-Control-Allow-Origin: *` 不能代替认证；私有 Bundle import 必须能力探测、失败降级并记录版本风险。
- 所有 HTTP、WebSocket、CDP 和 RPC 请求都有有限超时；socket 关闭时拒绝所有 pending。
- 注入必须幂等，旧 payload、监听器、样式、timer 和 observer 要可清理；多页面 registry 还必须处理 target 消失、socket 关闭和版本重新注入。
- 不写入真实凭据、固定用户绝对路径或未经确认的 Codex 端口。
- 不修改 `app.asar`，不绕过权限、认证或用户确认。

## 输出要求

分析时按“当前事实 → 触发链 → 组件边界 → 风险 → 最小改动”组织。若协议或 DOM 可能随 Codex App 版本变化，明确标注需要重新发现；若只找到 API 写库证据，不要声称它会触发 Codex。
