# Codex App Server RPC 设计

仅在需要设计 App Server 客户端、composer/automation 控制或协议兼容策略时读取本文件。

## 端到端边界

页面请求只能表达扩展定义的业务动作，例如“读取 thread 状态”或“创建自动化”。页面不传任意方法名给 App Server。宿主层把业务动作映射到显式白名单：

```text
页面动作 → 宿主 handler → 允许的 App Server RPC → 结构化结果
```

## 请求模型

每个请求包含唯一 ID、方法和参数；宿主发送到 App Server 时保留关联 ID，并在有限时间内等待结果：

```json
{
  "jsonrpc": "2.0",
  "id": "req-123",
  "method": "thread/read",
  "params": { "threadId": "thread-1" }
}
```

实际字段以当前 App Server 协议为准。客户端必须校验参数类型、字符串长度、枚举值和必填字段，不能把页面原始对象无检查地转发。

## 错误分类

建议至少区分：

- `METHOD_NOT_ALLOWED`：不在宿主白名单；
- `INVALID_PARAMS`：schema 校验失败；
- `TIMEOUT`：App Server 或传输层超时；
- `DISCONNECTED`：连接已关闭；
- `RPC_ERROR`：服务端返回可识别错误；
- `PROTOCOL_ERROR`：响应缺少 ID、结果和错误均不存在，或 JSON 不合法。

错误返回给页面时只暴露安全的 `code` 和 `message`，不要泄露凭据、完整环境变量或本机绝对路径。

## 常见能力映射

### thread / workspace

- `thread/read`：读取现有 thread 的状态或摘要；
- project/workspace 切换：先使用当前版本支持的 project/workspace 方法，再创建或续接 thread；
- thread 相关通知：按事件 ID 更新页面状态，不要用轮询猜测 turn 是否完成。

### composer

composer 填充只是准备输入，**提交动作**才是手动触发 Codex 的关键。扩展应区分“写入文本”和“点击/调用提交”两步，并在页面显示提交结果及 thread ID。

### automation

`automation create/update/pause` 应将 prompt、cron、时区、workspace/project 和启用状态作为结构化字段传递。创建 automation 只保存计划，不会立即执行；到达计划时间后由 App Server 启动会话。更新后应重新读取服务端对象，确认生效配置。

## 协议发现和版本兼容

- 不假设所有 App 版本都支持同一方法名、参数形状或通知名；启动时记录协议版本/能力集合。
- 对不存在的方法返回“当前版本不支持”，不要自动尝试未知方法。
- 版本升级后重新发现 `/json/version`、页面探针和 App Server 能力；必要时停用扩展，而不是继续发送旧请求。
- 事件处理按 request/notification ID 关联，不能依赖消息到达顺序。

## 最小客户端接口

模板 `templates/app-server-client.mjs` 提供：

```js
createAppServerClient({ request, allowedMethods, timeoutMs })
client.call(method, params)
client.readThread(threadId)
client.createAutomation(spec)
client.updateAutomation(automationId, patch)
```

`request` 由宿主注入，可是 HTTP、stdio 或已有 App Server transport；模板不固定端口、认证方式或用户路径。
