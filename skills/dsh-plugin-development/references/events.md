# Event 系统

事件适合插件间松耦合通信；需要强类型请求/响应、结果校验或稳定错误码时，使用 Service 或 Tool，不要把事件当作隐藏 RPC。

## 注册与类型

```ts
import type { Context } from '@deepseek-ai/cordis'

export const name = 'event-consumer'

export function apply(ctx: Context) {
  ctx.on('my-plugin/completed', (payload) => {
    console.log(payload.id)
  })
}
```

事件名使用稳定的 `namespace/action`，例如 `my-plugin/completed`。通过声明合并为事件补类型：

```ts
import '@deepseek-ai/cordis'

declare module '@deepseek-ai/cordis' {
  interface Events {
    'my-plugin/ready': (payload: { id: string }) => void
    'my-plugin/check': (input: string) => boolean | undefined
    'my-plugin/transform': (
      input: string,
      next: () => Promise<string>,
    ) => Promise<string>
  }
}
```

payload 要有 TypeScript 类型；跨进程、持久化或来自外部输入时还要有运行时 schema。禁止传递 Context、Service 实例、文件句柄、DOM 节点、密钥或 Host 绝对路径。

## 四种触发模式

### `emit`：同步广播

所有监听器同步执行，返回值被忽略：

```ts
ctx.emit('my-plugin/ready', { id: 'worker-1' })
```

适合通知；不要依赖监听器返回值或把异步完成误认为已被等待。

### `bail`：同步短路

监听器按顺序执行，第一个不是 `null`、`false` 或 `undefined` 的返回值成为结果：

```ts
const result = ctx.bail('my-plugin/check', input)
```

适合同步校验、拦截或选择；协议要写明哪些返回值表示“继续”。

### `serial`：异步串行与短路

监听器按注册顺序依次执行并等待异步结果；第一个不是 `null`、`false` 或 `undefined` 的结果会终止后续执行：

```ts
const result = await ctx.serial('my-plugin/setup', context)
```

适合需要确定顺序的异步阶段。监听器超时、失败和部分执行后的回滚策略必须明确。

### `waterfall`：可包装的流水线

每个监听器包装下游返回值；监听器必须调用 `next()` 才会继续：

```ts
const output = await ctx.waterfall(
  'my-plugin/transform',
  input,
  async () => input,
)

ctx.on('my-plugin/transform', async (_input, next) => {
  const downstream = await next()
  return downstream.trim()
})
```

不调用 `next()` 会故意短路整个流水线，可用于网关/拦截器；不要因为遗漏 `next()` 造成意外截断。

## Cordis 事件与持久化会话事件

Harness 的 Cordis 事件常用 `namespace/action`，例如 `agent/pre-step`、`tools/result`、`session/event`。`turn/*`、`step/*`、`tool/call`、`tool/result`、`compaction/*` 是持久化会话事件类型，不是同名 Cordis 事件。观察这些记录时监听 `session/event`，再检查 `event.type`；不要直接假设存在同名 `ctx.on('tool/result')` 事件。

## 生命周期与测试

`ctx.on()` 注册的监听器属于当前 Fiber，插件卸载时自动移除。外部 emitter 必须通过 `ctx.effect` 清理：

```ts
export function apply(ctx: Context) {
  ctx.effect(() => {
    const unsubscribe = externalEmitter.subscribe((event) => {
      ctx.emit('my-plugin/received', { id: event.id })
    })
    return () => unsubscribe()
  })
}
```

至少测试：事件类型/payload 校验、四种触发模式的短路语义、waterfall 的 `next()`、监听器失败、重复事件、会话事件路由、插件卸载后不再响应，以及 HMR 后不会出现双重监听。
