# Memory: pi agent reference

- Slug: `pi-agent-reference`
- Status: `active`
- Task source: `docs/planning/specs/2026-08-24-pi-agent-reference-design.md`

The task source is authoritative for task steps and acceptance status. Do not copy its checklist here.

## Scope

- 在 `skills/agent-cli-skill` 中增加模块化 Pi Agent reference，覆盖 CLI、provider、extension、skill、subagent、MCP、session、permission 和 testing。

## Stable Constraints

- 不修改用户 `~/.pi/agent` 配置、认证文件或 session。
- 不写入真实 API Key、私有内网地址、临时模型清单或完整 session。
- 保留 Claude、Codex、OpenCode 路由；裸 subagent 未指定 CLI 时仍只加载原有三方 reference。
- Pi 核心能力与第三方 extension/package 能力必须分开描述。
- 版本敏感内容以 Pi 0.84.1 为基线并要求重新核对。

## Decisions

| Decision | Rationale | Evidence |
|---|---|---|
| 使用 `references/pi/` 九个专题文件，而不是单一大文件或 shared 文件 | 保持最小路由，避免把 Pi 特有语义误写成跨 CLI 共性 | `docs/planning/specs/2026-08-24-pi-agent-reference-design.md` |
| OpenRouter provider 以 API contract/path 映射说明 | 本次错误来自 `anthropic-messages` 与 OpenRouter Chat Completions endpoint 不匹配 | 已批准设计与 Pi provider 配置排障记录 |
| Pi 核心不默认提供 MCP、subagent、permission popups、plan mode、background bash | 避免把 extension/package 能力误写为核心能力 | Pi 0.84.1 README/usage 与本地 `pi-extensions` 实现 |

## Task Sources

- Primary: `docs/planning/specs/2026-08-24-pi-agent-reference-design.md`
- Design: `docs/planning/specs/2026-08-24-pi-agent-reference-design.md`
- Implementation plan: `docs/planning/plans/2026-08-24-pi-agent-reference.md`

## Invariants

- 设计文档和实施计划负责完整任务清单、步骤、验收标准与状态；本记忆只保存路径、稳定决策和恢复信息。
- 不因 HTTP 连通、404 诊断或被中止请求宣称 Pi provider 已完成端到端验证。
