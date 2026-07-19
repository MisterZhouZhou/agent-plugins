---
name: cdp-skill
description: 分析、设计、实现、审查和排查 Chromium DevTools Protocol（CDP）集成。凡是用户提到 CDP、Chrome DevTools Protocol、Electron/Chromium 远程调试、remote-debugging-port、/json/list、webSocketDebuggerUrl、Runtime.evaluate、Page.addScriptToEvaluateOnNewDocument、运行时脚本或 CSS 注入、renderer bridge、页面重载重注入、CDP 截图，或需要在不修改 app.asar/官方应用文件的情况下增强桌面应用时，都应使用本 skill。
---

# CDP 集成与调试

把 CDP 视为一个本地高权限调试控制面，而不是普通业务 API。先确认授权和目标身份，再连接 renderer、执行命令并建立可恢复的生命周期。

需要协议消息、实现骨架、双向 bridge 或 Codex++ / Dream Skin 案例时，读取 [references/cdp-patterns.md](references/cdp-patterns.md)。

## 任务分类

先判断用户要做什么：

- **解释或架构分析**：只读代码，输出启动、发现、连接、注入、保持、恢复的调用链。
- **实现功能**：沿用仓库语言和现有 CDP 封装，做最小改动并补针对性测试。
- **故障排查**：从端口监听、HTTP discovery、WebSocket、target、命令响应、renderer 结果逐层定位。
- **安全审查**：优先检查监听地址、进程归属、WebSocket URL、Browser ID、目标身份、恢复流程和超时。

## 开始前收集上下文

1. 确认目标是用户拥有或明确授权调试的 Chromium/Electron 应用。
2. 搜索以下信号，先读现有实现再决定改法：

```bash
rg -n -i 'remote-debugging|webSocketDebuggerUrl|/json/(list|version)|Runtime\.evaluate|Page\.addScriptToEvaluateOnNewDocument|Runtime\.addBinding|Page\.captureScreenshot|CDP'
```

3. 确认平台、启动入口、应用可执行文件、默认端口、进程管理和恢复入口。
4. 检查工作区状态，保留用户已有改动。
5. 若操作需要关闭或重启正在运行的应用，先获得用户明确授权。

## 标准生命周期

### 1. 启动调试端点

优先显式绑定回环地址：

```text
--remote-debugging-address=127.0.0.1
--remote-debugging-port=<selected-port>
```

- 不要绑定 `0.0.0.0` 或局域网地址。
- 端口冲突时选择空闲端口并记录到状态文件，不要盲目连接已有监听者。
- 对 Electron/打包应用使用其平台原生启动方式，并验证参数确实传到了目标进程。

### 2. 验证端点身份

连接前至少验证：

- 监听地址是 loopback；
- 监听 PID 属于预期应用或其可信子进程；
- `/json/version` 和 `/json/list` 从同一端口取得；
- HTTP 请求禁用环境代理、拒绝重定向并设置短超时；
- WebSocket URL 使用 `ws:`、同一 loopback 主机和同一端口；
- URL 不含凭据、query、fragment，路径与 target ID 一致。

长期 watcher 应记录并固定启动时的 Browser ID。Browser ID 改变、Browser WebSocket 关闭或端口被复用时，停止连接，不要自动附着到新端点。

### 3. 发现并确认 renderer

从 `/json/list` 选择目标时逐层收窄：

1. `type === "page"`；
2. URL scheme、标题或应用标记符合预期；
3. target ID 与 `/devtools/page/<id>` 一致；
4. 建立会话后用无副作用的 `Runtime.evaluate` 检查 DOM 或全局标记；
5. 不匹配的 target 立即关闭，不要退回注入所有页面。

不要只凭端口可访问、页面标题或 `app://` scheme 判定身份。

### 4. 建立可靠 WebSocket 会话

CDP 消息分为两类：

- 带 `id` 的命令响应；
- 不带 `id`、带 `method` 的异步事件。

会话实现应包含：

- 单调递增命令 ID；
- `id -> resolve/reject/timeout` 映射；
- JSON 解析失败处理；
- 命令级超时；
- socket 关闭时拒绝全部 pending 请求；
- 独立的事件订阅与分发；
- 连接、发送、HTTP discovery 都有限时。

连接后按需启用 domain，常见为：

```text
Runtime.enable
Page.enable
```

### 5. 选择正确的注入方式

- **当前页面立即执行**：`Runtime.evaluate`。
- **刷新/导航前注册**：`Page.addScriptToEvaluateOnNewDocument`。
- **页面加载事件兜底**：监听 `Page.loadEventFired` 后重注入。
- **前端调用宿主后端**：`Runtime.addBinding` + `Runtime.bindingCalled`，再用 `Runtime.evaluate` 返回结果。
- **验证或取证**：`Page.captureScreenshot`、只读 DOM probe。

注入脚本必须幂等：使用版本或 generation 标记，重复执行时更新或清理旧状态，避免重复监听器、重复样式和重复 DOM。

### 6. 管理多页面和变化

- 给当前所有已验证 renderer 注入，而不是只保留第一个页面。
- 定期发现新 target，移除已关闭 session。
- 对失败 target 使用有上限的退避，避免忙轮询和刷日志。
- 热更新时先注册新 early script，再移除旧 identifier，最后立即应用新 payload。
- watcher 退出时移除 `Page.addScriptToEvaluateOnNewDocument` 注册并关闭 socket。

### 7. 验证真实结果

不要把“命令返回成功”当成“功能生效”。至少验证：

- 注入版本或全局状态正确；
- 关键 style/DOM/bridge 标记存在；
- 原生交互仍可用，装饰层不拦截输入；
- 页面 reload 后仍能恢复；
- 新窗口或子 renderer 能被发现；
- remove/restore 后标记消失；
- 如涉及视觉效果，用 CDP 截图或等价的真实 renderer 截图检查。

### 8. 恢复和关闭

提供对称的 cleanup：

1. 通过 renderer cleanup 删除注入的 DOM、CSS、监听器和全局状态；
2. 移除 early-script identifier；
3. 停止经过 PID、路径、命令行和启动时间校验的 injector；
4. 必要时关闭带 CDP 参数的应用并正常重启；
5. 确认调试端口已关闭；
6. 只恢复该工具实际修改的配置项。

恢复失败时保留状态和诊断信息，不要假装已经清理完成。

## 安全红线

- CDP 即使只绑定 `127.0.0.1` 也通常没有同用户认证；同机恶意进程仍可能附着。
- 不要把 CDP 端口暴露到 LAN、公网、容器外部或不可信代理。
- 不要连接身份不明的调试端点，也不要将任意远程 WebSocket URL直接交给客户端。
- 不要为了注入去修改、解包、重打包或重签官方应用，除非用户明确要求且理解后果。
- 不要通过注入读取、传输与任务无关的认证信息、会话内容或用户数据。
- 对会造成重启、数据丢失或关闭应用的动作，先说明影响并取得授权。

## 最低测试集合

实现或修改 CDP 层时，按风险覆盖：

- URL 校验接受合法 loopback，同端口和同 ID 目标；
- URL 校验拒绝远程主机、错端口、`wss:`、凭据、query、fragment、错误路径；
- discovery 拒绝重定向和非数组响应；
- response 与 event 能正确分流，超时和 close 会清理 pending；
- 非目标 renderer 被拒绝；
- 立即注入、reload 重注入和 cleanup 均可验证；
- Browser ID 或端口所有者变化时 watcher 停止；
- 最后执行仓库相关测试、格式检查、`git diff --check` 和 `git status`。

## 输出要求

分析类回答应明确区分：

1. CDP 协议本身提供什么；
2. 当前项目如何封装它；
3. 完整调用链和使用的 domain/method；
4. 身份校验与安全边界；
5. 生命周期缺口和可验证风险。

实现类任务完成后报告：修改文件、关键行为、运行的验证，以及仍未进行的实机检查。
