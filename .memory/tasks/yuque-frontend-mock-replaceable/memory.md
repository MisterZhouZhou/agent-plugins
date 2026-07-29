# Memory: yuque frontend mock replaceable

- Slug: `yuque-frontend-mock-replaceable`
- Status: `completed`
- Task source: `docs/planning/plans/2026-07-29-yuque-frontend-mock-replaceable.md`

The task source is authoritative for task steps and acceptance status. Do not copy its checklist here.

## Scope

- 更新 `yuque-develop-requirements` 在前端接口文档缺失时的可替换 Mock 策略。
- 仅修改 Skill、前端模板和使用说明；后端模板不在范围内。

## Stable Constraints

- Mock 位于独立 API 层，页面和组件不得直接写死 Mock 业务数据。
- 真实接口接入时原则上仅替换 API 实现、请求参数和响应字段映射。
- 未确认的接口契约继续使用占位标签，不新增阻塞式追问。

## Decisions

| Decision | Rationale | Evidence |
|---|---|---|
| 接口缺失时默认生成可替换 Mock 约束 | 允许前端先开发，同时避免真实接口接入时重写页面逻辑 | 用户批准的设计 |

## Task Sources

- Primary: `docs/planning/plans/2026-07-29-yuque-frontend-mock-replaceable.md`
- Design: `docs/planning/specs/2026-07-29-yuque-frontend-mock-replaceable-design.md`
- Implementation plan: `docs/planning/plans/2026-07-29-yuque-frontend-mock-replaceable.md`

## Invariants

- 三个目标文档必须保持 Mock 策略一致。
- 后端模板保持不变。
