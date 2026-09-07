# LLM Adapter 开发规范

只有确实要接入新模型提供方时才使用本章节。Adapter 通过公开 `@deepseek-ai/dsh-llm` 契约接入，不直接让 Agent loop 猜测第三方响应。

## 最小注册形态

```ts
import type { Context } from '@deepseek-ai/cordis'
import Schema from '@deepseek-ai/schemastery'
import {
  LlmAdapter,
  type GenerateOptions,
  type StreamChunk,
} from '@deepseek-ai/dsh-llm'

export interface Config {
  apiKey: string
  providers: string[]
}

export const Config: Schema<Config> = Schema.object({
  apiKey: Schema.string().required(),
  providers: Schema.array(Schema.string()).default(['my-provider']),
})

class MyAdapter extends LlmAdapter {
  async *stream(_options: GenerateOptions): AsyncIterable<StreamChunk> {
    // 按官方 StreamChunk 顺序生成完整流。
    yield { type: 'finish', reason: { kind: 'stop' } }
  }
}

export const name = 'my-llm'
export const inject = ['llm']

export function apply(ctx: Context, config: Config) {
  ctx.llm.registerAdapter(config.providers, new MyAdapter())
}
```

## StreamChunk 规则

真实适配器要正确处理：

- `block-start` / `block-end` 成对出现；
- `text-delta` 文本增量；
- `tool-call-delta` 的 JSON 参数增量；
- `usage` 在 `finish` 之前；
- `finish` 是最后一个分片；
- tool-call、stop 等 finish reason；
- 上游取消信号和连接关闭。

不要把供应商原始响应直接转发给核心服务。无法支持 `GenerateOptions` 字段时，抛出带稳定 code 的 `LlmError`，不要静默丢弃。

## 模型解析与错误

- `resolveModel(provider, model, signal?)` 返回确切的 provider/model 身份及可选 reasoning 元数据。
- 能提供动态模型列表时实现 `listModels()`；不要把上游动态能力硬编码成核心枚举。
- HTTP 请求合并 `attributionHeaders()`，并传递 `options.signal`。
- 网络、认证、限流、协议解析错误都使用稳定错误码。
- API key 只来自运行时配置或受控 secret，不写日志、Client payload 或 README。

## 测试

至少覆盖：模型解析、普通文本流、tool-call 流、usage/finish 顺序、取消、非 2xx、畸形响应、未知 reasoning、限流重试以及完整 agent-loop 组合。
