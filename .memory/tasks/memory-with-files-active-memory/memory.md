# Memory: memory-with-files active memory

- Slug: `memory-with-files-active-memory`
- Status: `active`
- Task source: `docs/planning/plans/2026-07-28-memory-with-files-active-memory.md`

The task source is authoritative for task steps and acceptance status. Do not copy its checklist here.

## Scope

- 优化 `memory-with-files` 的主动项目记忆，并与 `planning-workflows` 建立计划落盘交接。

## Stable Constraints

- 规划文档是任务步骤和验收状态的权威来源；项目记忆只保存路径、稳定决策、关键发现和恢复状态。
- 记忆仅写入当前仓库 `.memory/`，不得写入全局记忆。

## Decisions

| Decision | Rationale | Evidence |
|---|---|---|
| 计划保存并自检后由 `writing-plans` 显式调用记忆 Skill | Skill 调用是可测试的确定节点，生命周期 Hook 不应猜测文件变化 | 用户案例显示仅靠主动描述不会触发初始化 |
| 不注册 `Stop` Hook；两个 `SessionStart` 仅输出必要摘要 | 结束提醒和完整 Markdown 注入会制造可见噪音及上下文浪费 | 用户明确要求去掉没有必要的输出 |

## Task Sources

- Primary: `docs/planning/plans/2026-07-28-memory-with-files-active-memory.md`
- Design: `docs/planning/specs/2026-07-28-memory-with-files-active-memory-design.md`
- Implementation plan: `docs/planning/plans/2026-07-28-memory-with-files-active-memory.md`

## Invariants

- `memory-with-files SessionStart` 必须保留项目规则、任务来源、当前阶段、阻塞、最近验证、下一步和详细文件路径。
- `planning-workflows SessionStart` 必须保留两个 Skill 的强制路由边界，但控制在 12 行以内。
