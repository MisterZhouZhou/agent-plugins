# Codex App 注入生命周期

仅在实现或排查 Chromium CDP 注入、重载、断线和目标误连时读取本文件。

## 1. 启动并发现调试端点

让 Codex App 以 loopback 调试地址启动，例如：

```text
--remote-debugging-address=127.0.0.1
--remote-debugging-port=<runtime-port>
```

端口应来自运行时配置或启动器输出，不要把用户机器上的固定端口写进 Skill。注入器先请求：

```text
GET http://127.0.0.1:<port>/json/version
GET http://127.0.0.1:<port>/json/list
```

HTTP discovery 应设置有限超时（建议 1–3 秒）、禁用代理并拒绝重定向。优先使用 `webSocketDebuggerUrl`，不要自行拼接未知路径。

## 2. 目标身份校验

在连接前至少组合以下证据：

- 监听端口对应的 PID 与预期 PID（若启动器可提供）；
- `/json/version` 的 Browser ID 和产品信息；
- `/json/list` 中 `type=page` 的 target ID、页面 URL 和 `webSocketDebuggerUrl`；
- WebSocket URL 的协议、host、port、pathname；
- 页面注入后的全局标记或版本探针。

WebSocket URL 应只允许 `ws:`、`127.0.0.1/localhost/::1`、选定端口、无用户名密码/查询参数/片段，并匹配 `/devtools/page/<target-id>`。不要因为端口能连通或标题相似就附着到目标。

## 3. CDP 会话模型

可靠会话至少维护：

```text
nextId
pending: Map<id, {resolve, reject, timeout}>
listeners: Map<method, callbacks[]>
closed
```

发送命令时分配 ID、注册超时，再发送 `{ id, method, params }`。收到同 ID 响应后清理 pending；带 `error` 的响应转成结构化异常。无 ID 的消息按事件分发。socket 关闭时必须拒绝所有 pending，避免页面 Promise 永久等待。

## 4. 注入顺序

1. 建立 WebSocket 会话并启用 `Runtime`、`Page` 相关域。
2. 通过 `Runtime.addBinding` 注册一个固定 binding 名称。
3. 通过 `Page.addScriptToEvaluateOnNewDocument` 安装 early script，供后续文档使用。
4. 通过 `Runtime.evaluate` 对当前页面立即注入同一 payload。
5. 监听 `Runtime.bindingCalled`，验证页面消息，再转发给 RPC 客户端。
6. 页面 reload 或 target 替换后，重新执行当前页面注入；旧 target 的脚本标识和监听器要清理。

`Page.addScriptToEvaluateOnNewDocument` 只影响后续文档，不能代替当前页面的 `Runtime.evaluate`。`Runtime.evaluate` 必须检查 `exceptionDetails`，否则 renderer 异常可能被误判成注入成功。

## 5. 幂等和清理

payload 使用唯一全局键和版本号：

```js
window.__CODEX_APP_EXTENSION__?.cleanup?.();
window.__CODEX_APP_EXTENSION__ = {
  version: '1.0.0',
  cleanup() {
    // 移除 DOM、样式、observer、timer 和事件监听器
  },
};
```

不要仅因为发现旧 style 就跳过注入；版本或配置可能已经改变。清理时移除 `Page.addScriptToEvaluateOnNewDocument` 返回的 identifier，并释放 binding、socket 和 watcher。

## 6. Watcher 与退避

watcher 只在目标仍然匹配时重连。建议退避序列为 250ms、500ms、1s、2s、4s，上限由调用方配置；收到新 target、App reload 或 Browser ID 变化时重新执行完整 discovery，而不是复用旧 WebSocket URL。连续失败应记录可诊断原因，但不应无限创建连接。

## 7. 故障定位顺序

1. 端口是否监听，是否能访问 `/json/version`；
2. Browser ID、PID、target ID 是否仍匹配；
3. WebSocket URL 是否通过 loopback/端口/path 校验；
4. CDP 命令是否有 response/error/timeout；
5. early script 和当前页面注入是否都执行；
6. `Runtime.bindingCalled` 是否收到合法消息；
7. App Server RPC 是否在白名单、参数和超时范围内。
