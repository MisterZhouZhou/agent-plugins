# CDP 实现模式参考

仅在需要具体协议结构、实现骨架、bridge 或案例映射时读取本文件。

## 目录

1. 协议和发现接口
2. 会话实现骨架
3. 脚本注入模式
4. 双向 bridge 模式
5. 身份和 URL 校验
6. Watcher 与恢复
7. Codex++ 案例
8. Codex Dream Skin 案例
9. 故障定位顺序

## 1. 协议和发现接口

CDP 通过 HTTP discovery 和 WebSocket JSON 消息协作：

```text
GET http://127.0.0.1:<port>/json/version
GET http://127.0.0.1:<port>/json/list
```

典型 page target：

```json
{
  "id": "page-id",
  "type": "page",
  "title": "Application",
  "url": "app://-/index.html",
  "webSocketDebuggerUrl": "ws://127.0.0.1:9341/devtools/page/page-id"
}
```

命令：

```json
{
  "id": 7,
  "method": "Runtime.evaluate",
  "params": {
    "expression": "document.title",
    "awaitPromise": true,
    "returnByValue": true
  }
}
```

成功响应：

```json
{
  "id": 7,
  "result": {
    "result": {
      "type": "string",
      "value": "Application"
    }
  }
}
```

事件没有命令 `id`：

```json
{
  "method": "Page.loadEventFired",
  "params": { "timestamp": 123.45 }
}
```

不要假设消息到达顺序等同于命令发送顺序，始终按 `id` 匹配响应。

## 2. 会话实现骨架

可靠会话至少维护：

```text
nextId
pending: Map<id, {resolve, reject, timeout}>
listeners: Map<method, callbacks[]>
closed
```

发送流程：

1. 分配 ID；
2. 注册 pending 和 timeout；
3. 发送 `{id, method, params}`；
4. 收到同 ID 响应时清理 timeout；
5. `message.error` 转为异常；
6. socket 关闭时拒绝所有 pending。

事件流程：

1. JSON 解析；
2. 有 `id` 则走响应映射；
3. 无 `id` 且有 `method` 则分发事件；
4. 畸形消息应关闭或拒绝，不要让 watcher 永久卡住。

HTTP discovery 也应设置 1-3 秒超时、禁用代理并拒绝 redirect。CDP 是本机通道，不应因为 `HTTP_PROXY` 被送往代理服务器。

## 3. 脚本注入模式

### 立即注入

使用 `Runtime.evaluate` 处理当前文档：

```javascript
await session.send("Runtime.evaluate", {
  expression: payload,
  awaitPromise: true,
  returnByValue: true,
});
```

检查 `exceptionDetails`，否则命令层成功可能掩盖 renderer JavaScript 异常。

### 新文档注入

```javascript
const result = await session.send("Page.addScriptToEvaluateOnNewDocument", {
  source: payload,
});
const identifier = result.identifier;
```

退出或更换 payload 时：

```javascript
await session.send("Page.removeScriptToEvaluateOnNewDocument", {
  identifier,
});
```

`addScriptToEvaluateOnNewDocument` 只影响后续新文档，通常还要对当前页面执行一次 `Runtime.evaluate`。

### Early payload

页面骨架尚未出现时，用短生命周期 `MutationObserver` 等待关键 DOM。加入 generation 标记，旧 payload 发现 generation 变化后立即停止，避免主题热切换竞态。

### 幂等 cleanup

推荐把状态存放在唯一全局键：

```javascript
window.__MY_INJECTED_STATE__?.cleanup?.();
window.__MY_INJECTED_STATE__ = {
  version: "1.0.0",
  cleanup() {
    // 移除样式、DOM、observer、timer 和事件监听器
  },
};
```

重复注入前先调用旧 cleanup。不要只判断 style 是否存在就直接 return，因为配置或版本可能已经变化。

## 4. 双向 bridge 模式

需要 renderer 调用本地宿主时，可使用：

```text
Runtime.enable
Runtime.addBinding
Page.addScriptToEvaluateOnNewDocument
Runtime.evaluate
```

renderer 包装 Promise，并调用 CDP binding：

```javascript
window.__bridgeCall = (path, payload) => new Promise((resolve) => {
  const id = String(++window.__bridgeSeq);
  window.__bridgeCallbacks.set(id, resolve);
  window.hostBinding(JSON.stringify({ id, path, payload }));
});
```

宿主监听：

```text
Runtime.bindingCalled
```

解析 `{id, path, payload}`，执行白名单 handler，然后通过 `Runtime.evaluate` 调用页面中的 resolve/reject 函数。

Bridge 的安全要求：

- path 使用显式白名单，不执行任意方法名；
- payload 做类型、长度和路径边界校验；
- 文件操作限制在允许目录；
- 敏感动作不能同时暴露为任何本机网页都能调用的无认证 HTTP route；
- renderer 重载后重新安装 binding wrapper；
- handler 异常转换为结构化失败结果。

## 5. 身份和 URL 校验

WebSocket URL 建议逐项验证：

```text
protocol == ws:
hostname in {127.0.0.1, localhost, ::1}
port == selectedPort
username/password/query/fragment 均为空
pathname == /devtools/page/<target-id>
```

不要只用 `startsWith("ws://127.0.0.1")`，它无法正确处理凭据、端口和畸形 URL。

端点身份至少由以下证据组合确认：

- TCP listener PID；
- 可执行文件真实路径；
- 官方签名、包身份或 Team ID（适用时）；
- `/json/version` Browser ID；
- page target URL 和 ID；
- renderer DOM/global probe。

对于长期 watcher，保持 `/devtools/browser/<browser-id>` WebSocket 可作为身份锚。锚点关闭后停止 watcher，防止端口复用误连。

## 6. Watcher 与恢复

Watcher 循环应：

1. 重新读取并验证 target 列表；
2. 清理消失或关闭的 session；
3. 连接尚未处理的新 target；
4. probe 后才注入；
5. 对失败 target 做指数退避；
6. 对 discovery 失败限制日志频率；
7. Browser ID 变化时退出。

恢复顺序应尽量可验证：

```text
live remove and verify
  -> remove early scripts
  -> stop verified injector
  -> close debug-launched app when required
  -> wait until port closes
  -> restore owned config keys
  -> optionally relaunch normally
```

无法确认进程身份时不要 kill；无法确认 live remove 成功时保留状态文件供诊断。

## 7. Codex++ 案例

Codex++ 的 CDP 使用重点是“功能注入 + renderer 到 Python 的 bridge”：

```text
launcher.py
  -> 用 --remote-debugging-port 启动 Codex
  -> cdp.py 请求 /json
  -> 连接 page WebSocket
  -> Runtime.addBinding 建立宿主 binding
  -> Page.addScriptToEvaluateOnNewDocument 注册 bridge 和 renderer-inject.js
  -> Runtime.evaluate 立即注入当前页面
  -> Runtime.bindingCalled 把 /delete、/undo、/export 等请求交给 Python
```

它还会轮询新页面，并通过探测 `window.__codexSessionDeleteBridge` 做缺失重注入。

审查这类实现时，重点检查：

- 是否显式绑定 `127.0.0.1`；
- target 筛选是否会回退到任意 page；
- 是否验证 listener PID 和 WebSocket URL；
- bridge path 和 payload 是否有严格边界；
- 多页面、reload 和 bridge socket 生命周期是否正确。

## 8. Codex Dream Skin 案例

Dream Skin 的 CDP 使用重点是“安全验证的主题渲染生命周期”：

```text
start script
  -> 选择空闲 loopback 端口
  -> 用 remote-debugging-address/port 启动官方 Codex
  -> 验证 listener PID、应用身份、/json/version、Browser ID
  -> injector 过滤 app:// page target 并 probe Codex DOM
  -> Runtime.evaluate 注入 CSS、图片 Data URL 和 DOM payload
  -> Page.addScriptToEvaluateOnNewDocument 提前注册
  -> Page.loadEventFired 作为兼容性兜底
  -> Page.captureScreenshot 和 DOM verifier 验证
  -> Restore 删除 live skin、early script，并关闭 CDP 会话
```

Windows 版本固定 Browser ID 并保持 Browser WebSocket 身份锚，属于长期 watcher 的推荐模式。

## 9. 故障定位顺序

按以下顺序定位，不要直接猜 renderer 脚本：

1. **启动参数**：目标进程命令行是否真的包含调试参数；
2. **监听端口**：地址、端口、PID 和进程身份是否正确；
3. **HTTP discovery**：`/json/version`、`/json/list` 是否可访问且未走代理；
4. **目标筛选**：是否存在合法 page，ID/URL 是否一致；
5. **WebSocket**：握手、origin、超时、close 原因；
6. **命令层**：response error、命令 timeout、domain 是否 enable；
7. **JavaScript 层**：`exceptionDetails`、CSP、DOM 尚未出现；
8. **生命周期**：reload 后 early script 是否仍在，旧 identifier 是否移除；
9. **业务层**：bridge handler、文件/数据库操作、结构化返回；
10. **恢复层**：cleanup 是否真实生效、端口是否关闭。

每一层都保留精确错误、端口、target ID 和命令 method，确认本层后再进入下一层。
