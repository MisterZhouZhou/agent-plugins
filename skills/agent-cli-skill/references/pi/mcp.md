# Pi MCP Boundary

适用基线：Pi `0.84.1`。Pi core/SDK 的默认能力清单不包含 MCP client/server；Pi 的 extension API 可以注册 custom tools，但 custom tool 与 MCP transport 不是同一件事。若某个 Pi Package 提供 MCP adapter，必须以该 package 的 README、manifest、类型或源码为证据。

## 不要直接套用其他 CLI 配置

不能仅凭 Claude 的 `.mcp.json`、Codex 的 `config.toml` 或其他 harness 的 MCP 文档，断言 Pi 存在同名原生入口。针对一个具体 Pi MCP package，先确认：

- 配置文件位置和 schema；
- stdio、HTTP、SSE 或其他 transport 的实际支持情况；
- server 启动命令、cwd、环境变量和超时；
- token/header/OAuth 的来源与脱敏方式；
- tool 列表、名称冲突、输出大小和错误映射；
- package 是否在 global/project trust 或 extension allowlist 下才加载。

没有这些证据时，结论应写成“需要检查该扩展的配置入口”，而不是提供看似可用的 Pi 原生配置。

## 分离两条连接

MCP server 可达不等于 provider 可达。分别记录：

1. MCP 进程是否启动、transport 握手是否成功、工具是否列出。
2. Pi provider 的 DNS/TLS、API path、认证、模型和最小生成是否成功。

一个 tool call 失败可能来自 MCP server、extension bridge、模型 provider 或权限 gate；不要用单一 `404`/`connection error` 覆盖所有层。

## 安全核对

MCP server/adapter 通常会获得 Pi 进程可用的文件、进程或网络能力。安装或启用前审查依赖和源码，限制 server 的 cwd、环境变量、网络目标与输出体积，并在没有 UI 的模式下确认需要人工批准的操作是否 fail closed。SAFE/YOLO 若来自第三方 extension，只约束该扩展明确接管的调用，不自动保护其他 MCP server。

## 验证模板

```text
package/version: <package>@<version>
config source: <documented path or explicit CLI input>
transport: <stdio/http/...>
server startup: <exit code and stderr tail, secrets redacted>
tool discovery: <names/count>
provider check: <separate status>
minimal tool call: <result or exact failing layer>
```

如果只是成功启动 server 或列出 tools，只报告 MCP 层完成；只有实际用户路径中的 tool call 和 provider 响应都完成，才能报告集成端到端可用。故障验证规则见 [testing.md](testing.md)。

