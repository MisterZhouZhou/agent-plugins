# Tool 开发规范

DSH Tool 是被模型调用的能力，不是普通的 HTTP handler。Tool 必须通过公开的 `@deepseek-ai/dsh-tools` API 注册，并明确参数、规范输出和面向模型的渲染结果。

## 最小 Tool

```ts
import type { Context } from '@deepseek-ai/cordis'
import { defineTool } from '@deepseek-ai/dsh-tools'

export const name = 'greet-tool'
export const inject = ['tools']

export function apply(ctx: Context) {
  ctx.tools.register(defineTool({
    name: 'greet',
    description: 'Greet someone by name.',
    parameters: {
      name: {
        type: 'string',
        required: true,
        description: 'The name to greet',
      },
    },
    output: {
      schema: { type: 'string' },
      render: (_args, value) => [{ type: 'text', text: value }],
    },
    async execute(args) {
      return `Hello, ${args.name}!`
    },
  }))
}
```

`inject` 让 Cordis 在 `apply` 执行前等待 `tools` 服务就绪。`defineTool` 根据参数定义校验调用参数；`execute` 的返回值必须符合 `output.schema`；`output.render` 把规范值转换成模型或 UI 可消费的内容。

## 参数与输出

- 工具名在整个组合后的 Harness 中必须稳定且唯一；需要命名空间时使用插件前缀。
- `description` 要说明能力、输入限制和副作用，不能只写“执行操作”。
- 每个参数声明实际类型、是否必填、默认值和范围；不要在 `execute` 中才发现参数错误。
- 输出 schema 应描述稳定的规范值，不要把内部类实例、文件句柄、Response 或错误堆栈直接返回。
- render 负责展示，不应偷偷改变业务结果；需要同时给模型和用户不同视图时，先在 schema 中定义可序列化结果。
- 对路径、命令、网络地址和凭据做白名单与边界校验；不要把模型生成的字符串直接拼接进 shell。

## 依赖 Service

Tool 只依赖 Service Definition 或公开服务，不直接依赖某个 Provider 的内部实现：

```ts
export const inject = ['tools', 'myCapability']

export function apply(ctx: Context) {
  ctx.tools.register(defineTool({
    name: 'my_capability',
    description: 'Execute the capability.',
    parameters: {
      input: { type: 'string', required: true },
    },
    output: {
      schema: { type: 'string' },
      render: (_args, value) => [{ type: 'text', text: value }],
    },
    async execute(args) {
      const result = await ctx.myCapability.execute({ input: args.input })
      return result.output
    },
  }))
}
```

当底层能力可替换时，Tool Consumer 只依赖 Definition 包；具体 Provider 由 `cordis.yml` 或 profile 组合。

## 失败、取消与副作用

- 业务失败转换成稳定的用户可理解错误，不把 Host 堆栈或绝对路径返回给模型。
- 外部请求、子进程和长任务要响应取消信号，并在插件 dispose 时终止。
- Tool 注册属于 Cordis effect；不要在模块 import 阶段注册或启动任务。
- Tool execute 不应修改全局单例；需要缓存、队列或连接时交给 Service 管理。
- 对重试、超时、幂等和重复调用写出明确策略；模型可能重复调用同一个 Tool。

## 测试清单

至少覆盖：

1. 参数缺失、错误类型、越界值被拒绝。
2. 合法参数返回符合 output schema 的值。
3. render 输出可序列化且不泄漏敏感信息。
4. Service 不存在、执行失败、超时和取消都能得到稳定错误。
5. 插件卸载后 Tool 不再可见，后台任务和连接已清理。
6. 在真实 profile 中由模型调用一次，确认工具名、参数和结果链路一致。
7. 重启 DSH Web 后，**在新建会话中验证**工具可见性——旧会话不会自动刷新注册的工具列表。

高级 Tool 能力（嵌套 schema、后台工作、策略钩子、PTC mode、UI 卡片）只有在目标 DSH 版本明确支持并完成集成测试后才使用；不要把实验 API 写入基础模板。
