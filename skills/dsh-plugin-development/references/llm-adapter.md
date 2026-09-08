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

## 模型推理（Thinking/Reasoning）配置

DSH 中模型的思考强度由两层配置控制：**provider 级别**的默认值 + **模型级别**的显式声明。两个内置适配器的字段名和取值不同，且 DSH Web GUI 的 Models 设置页面**故意不暴露这些字段**（per `ProviderEditor.d.ts`：reasoning effort 是 per-model 能力，不应在 provider 级别 UI 配置），只能通过 `${DSH_HOME}/settings.yaml` 直接编辑。

### llm-deepseek 适配器 (deepseek-official)

在 `llm-deepseek` 块中配置：

```yaml
llm-deepseek:
  thinking: enabled          # enabled | disabled
  reasoningEffort: high      # off | low | high | max
```

- `thinking: disabled` 时 `reasoningEffort` 只能为 `off`，否则校验报错。
- 支持的 reasoning effort 值直接映射为 DeepSeek API 的 `reasoning_effort` 参数。

### llm-pi-ai 适配器（自定义 provider）

在 `llm-pi-ai.providers.<route>` 中配置。pi-ai 使用自己的 `ModelThinkingLevel` 体系：

```yaml
llm-pi-ai:
  providers:
    my-provider:
      reasoning: high        # off | minimal | low | medium | high | xhigh | max
      models:
        - id: deepseek-v4-pro
          reasoningEfforts:  # 显式声明该模型支持的级别 → API wire 值映射
            high: high
            medium: medium
            low: low
        - id: some-non-reasoning-model
          reasoningEfforts: false   # 标记为非推理模型
```

**关键规则**：

- **pi-ai catalog 中的 provider**（如 `deepseek`）：每个模型的 `reasoningEfforts` 从 catalog 继承，不需要显式声明。
- **自定义 provider**（pi-ai catalog 中不存在的 route）：所有模型 **必须显式声明 `reasoningEfforts`**。否则 `resolveModelReasoning()` 返回 `reasoning: false`，与 provider 级别的 `reasoning: high` 冲突，报错：
  ```
  pi-ai provider "X" model "Y" does not support reasoning effort "high"
  ```
- `reasoningEfforts` 的 key 是 pi-ai 的级别名，value 是发送给 API 的 wire 值。对于 OpenAI-completions 协议，wire 值即 API 接受的 `reasoning_effort` 参数。
- `reasoningEfforts: false` 标记模型不支持推理，provider 级别的 `reasoning` 默认值不会应用到它。

### 常见配置错误排查

| 错误 | 原因 | 修复 |
|------|------|------|
| `model X does not support reasoning effort Y` | 自定义 provider 的模型未声明 `reasoningEfforts` | 为模型添加 `reasoningEfforts` 映射或设为 `false` |
| `only reasoningEffort "off" can be configured when thinking is disabled` | `thinking: disabled` 与 `reasoningEffort: high` 冲突 | 改 `thinking: enabled` 或 `reasoningEffort: off` |
| Web GUI 无推理选项 | 模型元数据中 `reasoning.efforts` 为空 | 检查 settings.yaml 是否正确定义 `reasoningEfforts` |

### 生效方式

编辑 `settings.yaml` 后需**重启 DSH** 让配置生效。若配置校验失败，DSH 会保留上次有效配置并输出错误日志。

## 测试

至少覆盖：模型解析、普通文本流、tool-call 流、usage/finish 顺序、取消、非 2xx、畸形响应、未知 reasoning、限流重试以及完整 agent-loop 组合。
