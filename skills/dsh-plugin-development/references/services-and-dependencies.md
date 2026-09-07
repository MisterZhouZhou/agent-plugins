# Service 与依赖

Service 是插件向其他插件公开的能力；`inject` 声明消费方需要的服务。复杂能力优先拆成 Service Definition、Service Provider 和 Consumer 三个角色。

## 消费已有服务

```ts
import type { Context } from '@deepseek-ai/cordis'

export const name = 'metrics-consumer'
export const inject = ['metrics']

export function apply(ctx: Context) {
  ctx.metrics.record('plugin_loaded', 1)
}
```

Cordis 会在 `apply` 运行前准备好 `inject` 中的必需服务。可选服务不要写入必需 `inject`，在使用点查询并明确缺失行为：

```ts
export function apply(ctx: Context) {
  const metrics = ctx.get('metrics')
  if (metrics) metrics.record('optional_feature', 1)
}
```

`inject` 与 `dsh.client.inject` 不是一回事：前者是 Cordis 插件服务依赖，后者是浏览器 ModuleLoader 可提供的 external 模块列表。

## 提供 Service

需要长期状态、公共方法、事件响应或可替换 Provider 时，使用 Cordis `Service`：

```ts
import { Service, type Context } from '@deepseek-ai/cordis'

export default class MetricsService extends Service {
  static inject = ['llm']

  constructor(ctx: Context) {
    super(ctx, 'metrics')
  }

  record(name: string, value: number) {
    // 写入受控的服务状态或指标存储。
  }
}
```

需要把服务加入上下文类型时，使用 TypeScript declaration merging，并让运行时服务名与类型名一致：

```ts
declare module '@deepseek-ai/cordis' {
  interface Context {
    metrics: MetricsService
  }
}
```

服务初始化、监听器、定时器、连接和子进程都必须挂在生命周期 effect 上；`stop`/dispose 要幂等且按创建的相反顺序清理。

## 三角色拆分

```text
dsh-my-capability       Service Definition：Service、Request、Result、错误码
        ↑
dsh-my-capability-local Service Provider：本机或某一后端的实现
        ↑
dsh-tool-my-capability Consumer：Tool、命令或 UI
```

更准确的依赖方向是：

```text
Provider ───────▶ Definition ◀────── Consumer
```

Provider 与 Consumer 不应互相依赖。Definition 只包含稳定协议和类型；Provider 可以替换；Consumer 不应假设某个 Provider 的内部状态。

## 服务消失与组合

- 必需服务不存在：让 Cordis 报告依赖错误，不要悄悄降级成错误实现。
- 服务被卸载：依赖它的插件必须释放资源；重新加载时重新建立注册。
- 可替换 Provider：用 patch/profile 选择 Provider，不要在 Consumer 中硬编码 import。
- 每个服务名和公共方法都要有稳定文档；破坏性协议变更要增加版本或迁移策略。
- 测试要覆盖 Definition 的协议、Provider 的实现和 Consumer 的组合，而不是只测其中一层。
