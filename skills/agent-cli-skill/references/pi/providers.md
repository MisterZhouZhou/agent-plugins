# Pi Providers and Models

适用基线：Pi `0.84.1`。本文件讲 Pi 的 provider/model contract，不代表任意代理服务都实现了所选协议的全部字段。

## 三层配置核对

按以下顺序排查：

1. **provider**：`models.json` 中 provider 名、`baseUrl`、`api`、header 和认证来源。
2. **model**：`models[].id` 是否为上游真正接受的模型 ID，以及 `reasoning`、`input`、context/output 限额等能力声明。
3. **default/selection**：`settings.json` 的活动默认 provider/model、CLI `--provider`/`--model` 和当前 `/model` 选择是否一致。

`settings.json` 负责活动设置和资源开关；自定义 provider/model 主要写入 `~/.pi/agent/models.json`。不要只看默认模型字段就认为 provider 已经完成认证和生成验证。

## 脱敏配置形状

```json
{
  "providers": {
    "openrouter": {
      "baseUrl": "https://example.invalid/api/v1",
      "apiKey": "$OPENROUTER_API_KEY",
      "api": "openai-completions",
      "models": [
        {
          "id": "provider/model-id",
          "name": "Model label",
          "reasoning": true,
          "input": ["text"],
          "contextWindow": 128000,
          "maxTokens": 16384
        }
      ]
    }
  }
}
```

示例中的域名、key 和 model ID 都是占位符。认证可以来自环境变量、`auth.json`/`/login`、CLI `--api-key` 或 provider `apiKey`；不要把真实 key 写入 reference、日志或 shell history。

## `api` 到 endpoint 的映射

| Pi `api` | 协议 | 通常的生成 endpoint |
| --- | --- | --- |
| `openai-completions` | OpenAI Chat Completions | `/chat/completions` |
| `openai-responses` | OpenAI Responses API | `/responses` |
| `anthropic-messages` | Anthropic Messages | `/messages` |
| `google-generative-ai` | Google Gemini 原生格式 | Google API 对应 endpoint，不套 OpenAI path |

`api` 可以设在 provider 层，也可以由单个 model 覆盖。`baseUrl` 必须是该 API 类型期望的 API 根地址；不要仅因为服务商首页可访问，就假定 API path 正确。

## OpenRouter 404 的判别

OpenRouter 常见的是 OpenAI Chat Completions 兼容入口。对于 `https://openrouter.ai/api/v1` 这类 API 根地址，若配置 `anthropic-messages`，Pi 会按 Anthropic contract 请求 `/messages`；这不是把请求送到 Chat Completions 的正确方式，可能得到 JSON/HTML 404。OpenRouter 场景应先核对其当前文档，再通常使用：

```json
{
  "baseUrl": "https://openrouter.ai/api/v1",
  "apiKey": "$OPENROUTER_API_KEY",
  "api": "openai-completions",
  "models": [{ "id": "provider/model-id" }]
}
```

这只说明协议/path 方向；实际 model ID、认证、请求 header、工具和 reasoning 支持仍需独立验证。`anthropic-messages` 只有在上游确实暴露 Anthropic `/messages` contract 时才使用。

## 模型能力字段

- `id`：发送给上游的精确模型标识。
- `name`：显示/匹配用的人类可读名称，不替换请求 ID。
- `reasoning` 与 `thinkingLevelMap`：声明 thinking 能力和 level 映射。
- `input`：通常为 `['text']` 或 `['text', 'image']`。
- `contextWindow`、`maxTokens`：Pi 的本地限制/计费估算依据，不会把上游不支持的能力变出来。
- `compat`：如 `supportsDeveloperRole`、`supportsReasoningEffort` 等兼容覆盖。
- `samplingParams`：OpenAI-compatible API 的请求体扩展；只能使用上游认可的字段。

## 配置检查

```bash
python3 -m json.tool /path/to/models.json >/dev/null
pi --provider <provider> --model <model-id> --no-session --no-extensions -p "reply with OK"
# 或使用带 provider 前缀的模型选择：
pi --model <provider>/<model-id> --no-session --no-extensions -p "reply with OK"
```

第二条命令中的 provider/model 仅为占位符，执行前必须替换为当前配置中真实且已授权的值。需要判断 404 是网页路由还是 API contract 时，记录 status、`content-type`、请求 path 和响应 body 摘要，详见 [testing.md](testing.md)。
