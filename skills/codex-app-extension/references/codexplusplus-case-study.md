# CodexPlusPlus 案例

本案例用于说明一种真实的 Codex App 外部扩展实现。源码路径为：

```text
/Users/cheyipai/Downloads/CodexPlusPlus
```

它不修改 Codex 官方 `app.asar`，而是通过启动器、Chromium CDP、Renderer 注入脚本和本地 Helper Server 增强 Codex App。以下内容分为“源码事实”和“通用建议”；CodexPlusPlus 的实现细节不能直接当作 Codex App Server 的公开标准。

## 1. 项目定位与源码入口

主要入口如下：

```text
codex_session_delete/cdp.py
codex_session_delete/launcher.py
codex_session_delete/helper_server.py
codex_session_delete/watcher.py
codex_session_delete/user_scripts.py
codex_session_delete/inject/renderer-inject.js
```

可以将它抽象为：

```text
Codex++ CLI
  → 启动或接管 Codex App
  → 暴露 Chromium CDP
  → 注入 Renderer script
  → 建立 Runtime binding Bridge
  → 启动/接管 Local Helper HTTP Server
  → 通过 watcher/watchdog 维持页面和 Bridge
```

它不是一个 Codex App Server 实现，也不因为能修改本地线程数据库就自动创建或启动 Codex thread。

## 2. 启动链与两个端口

### 2.1 debug port

`launcher.py` 构造 Codex 启动参数：

```text
--remote-debugging-port=<debug_port>
--remote-allow-origins=http://127.0.0.1:<debug_port>
```

启动器会检查 loopback 端口是否可用；Windows 下如果请求端口被占用，会选择新的 loopback 端口。启动后，`cdp.py` 通过：

```text
GET http://127.0.0.1:<debug_port>/json
```

发现 page targets，并优先选择 title 或 URL 含 `codex`、或 URL 以 `app://` 开头的页面。

### 2.2 helper port

Helper Server 使用独立的 `helper_port`，默认实现绑定 `127.0.0.1`。启动器会先请求：

```text
GET http://127.0.0.1:<helper_port>/health
```

如果已有服务返回健康状态，就尝试 attach；否则创建 `ThreadingHTTPServer` 并在 daemon thread 中运行。Codex 进程退出后，自己创建的 Helper Server 执行 `shutdown()` 和 `server_close()`，而 attach 到的外部服务不会被误关闭。

### 2.3 两个端口不能混用

```text
debug_port  = CDP discovery / page WebSocket
helper_port = Renderer fetch / 本地业务 HTTP
```

前者用于控制 Chromium renderer，后者用于访问扩展自己的业务服务。它们的健康检查、认证、关闭和重启都必须独立处理。

## 3. CDP binding Bridge

### 3.1 Bridge 请求链

CodexPlusPlus 的页面侧 Bridge 不强制经过通用模板中的 `window.postMessage`，而是直接调用固定 binding：

```text
window.__codexSessionDeleteBridge(path, payload)
  → window.codexSessionDeleteV2(JSON.stringify({id, path, payload}))
  → Runtime.bindingCalled
  → Python handle_bridge_request()
  → Runtime.evaluate
  → window.__codexSessionDeleteResolve(id, result)
```

页面侧为每个请求分配 ID，并将 Promise resolver 保存到 Map。宿主收到 `Runtime.bindingCalled` 后解析 JSON、读取 `id/path/payload`、调用白名单 handler，再将结果通过 `Runtime.evaluate` 注入页面。异常通过对应 reject 函数返回，而不是让页面永久等待。

### 3.2 安装顺序

`install_bridge()` 的主要顺序是：

1. 建立 page WebSocket；
2. `Runtime.enable`；
3. `Runtime.removeBinding` 清理同名旧 binding；
4. `Runtime.addBinding` 注册 `codexSessionDeleteV2`；
5. `Page.addScriptToEvaluateOnNewDocument` 安装 Bridge early script；
6. `Runtime.evaluate` 立即安装到当前页面；
7. 对额外 userscript 重复安装 new-document script；
8. 启动 Python bridge loop，处理 `Runtime.bindingCalled`。

`Page.addScriptToEvaluateOnNewDocument` 不能替代当前页面的 `Runtime.evaluate`；两者必须根据页面是否已经加载分别处理。

### 3.3 宿主 handler 白名单

`handle_bridge_request()` 将页面 path 映射到固定的本地动作，例如：

```text
/settings/get
/settings/set
/user-scripts/list
/user-scripts/reload
/devtools/open
/backend/status
/delete
/undo
/export-markdown
/move-thread-workspace
/thread-sort-key
```

页面传入的是业务 path，不应该传任意 Python 函数名、任意模块路径或任意 App Server RPC 方法名。

### 3.4 与 postMessage 模式的关系

两种模式都可以使用：

- 直接 binding：结构简单、宿主控制更直接，适合单一注入器与固定页面环境；
- `postMessage` 适配层：更适合页面内多个模块、消息隔离和统一的浏览器事件协议。

无论使用哪种模式，都必须保留固定命名空间、版本号、请求 ID、超时、错误返回和重复注入清理。

## 4. Local Helper HTTP Server

### 4.1 服务职责

`helper_server.py` 使用 `ThreadingHTTPServer`，提供 Renderer 可 `fetch()` 的本地接口。注入脚本通过前缀变量获得地址：

```text
window.__CODEX_SESSION_DELETE_HELPER__ = 'http://127.0.0.1:<helper_port>'
```

代表性接口包括：

```text
GET  /health
GET  /ads
GET  /assets/<name>
POST /delete
POST /undo
POST /archived-thread
POST /export-markdown
POST /move-thread-workspace
POST /thread-sort-key
POST /thread-sort-keys
```

这些接口服务的是 Codex++ 自己的本地能力，不是 Codex App Server RPC。

### 4.2 认证和 CORS

源码支持：

```http
X-Codex-Session-Delete-Token: <token>
Access-Control-Allow-Origin: *
Access-Control-Allow-Headers: Content-Type, X-Codex-Session-Delete-Token
Access-Control-Allow-Methods: GET, POST, OPTIONS
Access-Control-Allow-Private-Network: true
```

但当前实现对 mutation endpoint 的授权覆盖并不完全一致：删除、撤销、归档查询和 Markdown 导出经过 token 判断，工作区移动和排序接口需要单独审查。生产扩展不能只按 HTTP method 判断权限，应为每个 endpoint 建立读/写、认证、参数 schema 和副作用矩阵。

`Access-Control-Allow-Origin: *` 只解决浏览器跨源访问策略，不能代替 token、实例身份或用户确认。

### 4.3 attach 和关闭

Helper Server 的生命周期应独立于 CDP：

```text
探测 /health
  → 确认实例身份/协议版本
  → 创建或 attach
  → 将 helper_port 注入 Renderer
  → Codex/扩展退出时只关闭自己创建的 server
```

生产实现还应避免“任何返回 `{ok:true}` 的进程都被当成自己的 Helper”，建议增加协议版本、实例 ID、随机 nonce 或 capability handshake。

## 5. 双通道如何选择

| 需求 | 推荐通道 | 原因 |
| --- | --- | --- |
| 页面请求本地数据库、文件导出或系统能力 | CDP binding 或受保护 Helper endpoint | 根据是否需要长连接和多客户端访问选择 |
| 页面读取扩展状态、脚本 inventory | CDP binding 或 Helper GET | 读操作可以走低权限接口，但仍需 schema 和 origin 约束 |
| 创建 thread、启动 turn、提交 composer、创建 automation | 宿主侧 App Server RPC | 这是 Codex 领域动作，不能由本地写库替代 |
| Taskboard 状态回写 | Skill/taskctl → Taskboard API | 这是任务执行层职责，不是 CDP 调度器职责 |

不要把“页面有一个按钮”作为调用 App Server 的理由。先确认动作属于本地扩展能力、Codex 领域操作，还是任务执行层回写。

## 6. 多页面注入与 watchdog

`inject_file_into_all_pages()` 会：

- 遍历符合条件的 Codex page targets；
- 用 target ID 或 WebSocket URL 作为 registry key；
- 对当前所有尚未注入的页面执行注入；
- 以约 0.75 秒轮询发现新页面；
- 已注入页面不重复处理；
- 某个 target 注入失败时保留其他成功页面；
- 通过 `on_injection` 更新 runtime 的 WebSocket URL 集合。

启动器另外提供注入重试和 bridge watchdog：

```text
注入失败 → 有限次数重试
Bridge 健康检查失败 → 重新发现 target 并重新注入
```

这是增量注入，而不是每次轮询都全量重复安装。

当前实现仍有值得补齐的部分：

- target 消失后应从 registry 删除；
- 对应 WebSocket 应统一关闭；
- reload 后应清除旧 document script identifier；
- watcher 异常不能静默吞掉所有原因；
- target 重新出现时应记录注入版本、失败原因和最后一次成功时间。

## 7. userscript 管理与可观测状态

`user_scripts.py` 支持：

- builtin script 和 user script 两个来源目录；
- 全局启用/禁用；
- 单脚本启用/禁用；
- 将多个脚本包装成 bundle；
- reload 到已连接的 page targets；
- inventory 返回脚本来源、enabled 和运行状态。

Renderer 侧为每个脚本记录：

```text
loading
loaded
failed
disabled
not_loaded
```

失败时保存错误信息和加载时间。成熟扩展应把以下信息展示或记录到诊断日志：

```text
脚本 key / 来源 / 版本 / 目标页面数 / 当前状态 / 失败原因 / 最后加载时间
```

“注入调用成功”不等于每个 userscript 都加载成功，必须区分 transport 成功和脚本运行成功。

## 8. 内部 Bundle API 风险

Renderer 脚本动态 import Codex App 内部 chunk，例如：

```js
import("./assets/vscode-api-Dc9pX2Bc.js")
import("./assets/app-server-manager-signals-C1h8B-R-.js")
```

这些是私有构建产物，不是稳定公开的 App Server API。chunk 文件名、导出函数名、参数结构和调用副作用都可能随 App 版本变化。

如果确实必须使用，应做到：

1. 启动时探测 chunk 是否存在；
2. 校验导出函数和参数能力；
3. 将 import 失败视为可分类的兼容性错误；
4. 让核心功能在该能力缺失时降级；
5. 记录 App 版本、chunk 名称、导出名和失败原因；
6. 优先使用公开或已经验证的 App Server 边界。

不能把内部 `signals.rn(...)` 或混淆导出函数包装成“永久稳定接口”。

## 9. 安全审计与改进建议

### 可借鉴

- CDP 和 Helper 都限制在 loopback；
- binding 名称固定且带版本语义；
- 当前页面与后续 document 都注入；
- helper port 与 debug port 分离；
- userscript 有 inventory 和失败状态；
- 注入有重试、watcher 和 watchdog。

### 不应直接照抄

- 只通过 `/health` 判断已有 Helper 是否属于自己；
- mutation endpoint 授权覆盖不完整；
- target registry 不主动清理消失页面；
- 依赖内部 chunk 文件名和混淆导出；
- 静默忽略 watcher 和 socket 异常。

新扩展应至少补充：实例握手、逐 endpoint 权限表、target/socket cleanup、结构化日志、能力探测和版本兼容矩阵。

## 10. 与现有 Taskboard/App Server 模式的边界

CodexPlusPlus 案例不能改变以下结论：

```text
Taskboard API 写入任务
  ≠ 自动触发 Codex
```

如果需要执行 Codex 任务，仍需明确的 composer 提交、automation 到期或其他已实现的调度器；Helper Server 和 CDP binding 只提供扩展自身的本地能力，不天然创建 thread 或 turn。`taskctl` 仍然是 Skill/CLI 层的任务读写工具，不是 Codex 调度器。
