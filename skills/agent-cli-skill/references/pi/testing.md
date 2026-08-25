# Pi Testing and Troubleshooting

适用基线：Pi `0.84.1`。验证应从静态配置逐层推进到完整最小生成；每层只报告已测到的边界，不用低层成功替代端到端结论。

## 十层验证矩阵

1. **静态配置**：用 `python3 -m json.tool` 解析配置副本；检查 provider/model/default 一致；扫描 key、cookie、Authorization 和私有地址。
2. **传输层**：分别确认 DNS、TCP、TLS、HTTP status 和 `content-type`。超时只说明传输层未完成。
3. **API contract**：核对 HTTP method、实际 path、认证 header、请求 body 和流式格式；Pi `api` 映射见 [providers.md](providers.md)。
4. **模型层**：确认上游接受的精确 model ID、provider 返回、输入类型、thinking/tool 能力和上下文限制。
5. **最小生成**：关闭工具和持久 session，使用短 prompt，等待完整有效响应。
6. **Extension 隔离**：先 `--no-extensions`，再一次只加入一个显式 `-e`，确认命令、tool 和事件。
7. **Subagent**：在已确认 package 版本下依次验证 single、parallel、chain、失败回传和父子审批。
8. **Session/协议**：验证恢复、`--no-session`、JSON 事件和 RPC response/event framing；不要把 stdout 日志混入 RPC。
9. **安全**：覆盖 SAFE、YOLO、无 UI fail closed、普通写入确认和灾难 Bash 阻断。
10. **完整用户路径**：从实际启动命令、资源发现、provider 选择、模型响应到工具/子 Agent/session 结果全部完成。

## 404 的 HTML/JSON 判别

- 根地址返回 HTML 的 `404 Not Found`：只证明域名和网页路由可达，不证明 API provider contract 正确。
- `/models` 返回 JSON：可作为 control endpoint 证据，但不能单独证明生成 endpoint 可用。
- `/messages` 或 `/chat/completions` 返回 JSON `404`：请求通常已经到达服务端，继续核对 path、API 类型、base URL、模型路由和代理重写。
- HTML 404 与 JSON 404 必须分别记录 `status`、`content-type`、请求 method/path 和 body 摘要。

对 OpenRouter，`anthropic-messages` 会导向 `/messages`，而常见 Chat Completions 兼容入口应按 `openai-completions` 导向 `/chat/completions`；这仍需按当前服务商文档和实际模型响应确认。

## 脱敏静态检查

对配置副本运行：

```bash
python3 -m json.tool /path/to/models.json >/dev/null
rg -n -i 'api[_-]?key|authorization|cookie|token|192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[0-1])\.' /path/to/redacted-artifacts
```

命令输出应只显示字段名或已替换的 `[REDACTED]`，不要把真实 key 作为命令参数或写入本 skill。

## 隔离和最小生成模板

目标环境确认支持相应 flag 后，再执行占位符命令：

```bash
pi --no-extensions --no-session --no-tools \
  --provider <provider> --model <provider>/<model-id> \
  -p "Reply with exactly OK"
```

人工验收必须看到：进程以 0 退出、收到完整 assistant 文本 `OK`（不是仅收到请求已发送/流开始）、没有未处理错误，并且 provider/model/path 与预期一致。用户中止生成、超时、只拿到 HTTP 200、只看到 JSON 事件或只验证了 `/models`，都不能宣称端到端成功。

## 结果陈述模板

```text
已完成：<静态/传输/API contract/模型/最小生成/extension/session/安全/端到端>
证据：status=<...>, content-type=<...>, path=<脱敏>, model=<...>, exit=<...>
未完成：<尚未验证的层>
限制：<用户中止、无 UI、网络不可达或只进行了隔离测试等>
```

关联：Pi CLI 隔离参数见 [cli.md](cli.md)，provider contract 见 [providers.md](providers.md)，权限边界见 [permissions.md](permissions.md)。

