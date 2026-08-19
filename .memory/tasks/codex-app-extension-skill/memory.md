# Memory: codex app extension skill

- Slug: `codex-app-extension-skill`
- Status: `completed`
- Task source: `docs/planning/specs/2026-08-18-codex-app-extension-design.md`

The task source is authoritative for task steps and acceptance status. Do not copy its checklist here.

## Scope

- 在 `skills/codex-app-extension/` 创建文档加模板型 Skill，并同步仓库文档与 Claude Skill 索引。

## Stable Constraints

- 不修改 Codex `app.asar`，不连接未验证 target，不把任意 App Server RPC 暴露给页面层。
- 本次只做 Skill、reference、模板和静态验证，不启动真实 Codex App。

## Decisions

| Decision | Rationale | Evidence |
|---|---|---|
| 使用四个 reference 和三个 JavaScript 模板 | 入口保持精简，同时提供可复用实现骨架 | 已批准设计文档 |

## Task Sources

- Primary: `docs/planning/specs/2026-08-18-codex-app-extension-design.md`
- Design: `docs/planning/specs/2026-08-18-codex-app-extension-design.md`
- Implementation plan: `docs/planning/plans/2026-08-18-codex-app-extension.md`

## Invariants

- 页面层、CDP 注入器、App Server 和 Codex Skill/CLI 的职责保持分离。
