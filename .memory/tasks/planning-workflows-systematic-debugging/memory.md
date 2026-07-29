# Memory: planning-workflows systematic-debugging

- Slug: `planning-workflows-systematic-debugging`
- Status: `completed`
- Task source: `docs/planning/plans/2026-07-29-planning-workflows-systematic-debugging.md`

The task source is authoritative for task steps and acceptance status. Do not copy its checklist here.

## Scope

- 为 `planning-workflows` 新增自包含的 `systematic-debugging` Skill，并同步双平台路由、元数据、文档和测试。

## Stable Constraints

- 保留上游四阶段系统化调试流程，但不保留 `test-driven-development`、`verification-before-completion` 或其他 `superpowers:` 依赖。
- 只保留 5 个实际运行时辅助文件，不复制上游创建记录和压力测试素材。
- 保留工作区现有无关修改，不执行安装、缓存刷新或回退。

## Decisions

| Decision | Rationale | Evidence |
|---|---|---|
| 保留 5 个被主 Skill 引用的辅助文件 | 它们提供根因追踪、防御式校验、条件等待和测试污染定位能力 | 已批准设计 |
| `systematic-debugging` 独立路由，不衔接规划 Skill | Bug 调查与产品设计/计划职责不同 | 已批准设计 |

## Task Sources

- Primary: `docs/planning/plans/2026-07-29-planning-workflows-systematic-debugging.md`
- Design: `docs/planning/specs/2026-07-29-planning-workflows-systematic-debugging-design.md`
- Implementation plan: `docs/planning/plans/2026-07-29-planning-workflows-systematic-debugging.md`

## Invariants

- `brainstorming` 只在设计批准后衔接 `writing-plans`；`systematic-debugging` 不自动衔接任何规划 Skill。
- Codex 和 Claude Code 共用同一 Skill 目录和 SessionStart Hook。
