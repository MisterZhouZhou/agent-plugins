# Findings: codex app extension skill

## Root Causes And Established Facts

- Taskboard API 写库只是持久化，不会单独启动 Codex；手动 composer 提交或已保存的 cron automation 到期才是触发点。
- `taskctl` 属于 Skill/CLI 执行层，负责读写任务 API，不是 Codex 调度器，也不直接创建 thread。

## Experiments And Evidence

| Observation | Evidence | Implication |
|---|---|---|
| Skill 结构和索引可被静态工具识别 | `quick_validate.py`、Claude JSON 校验、marketplace audit 均通过 | 可作为后续扩展开发的本地 Skill 入口 |
| 三个模板可被 Node 解析 | 三次 `node --check` 通过 | 模板语法可复制后再按真实 transport 改造 |

## Rejected Assumptions And Failed Attempts

| Assumption Or Attempt | Why It Failed | Avoid Repeating By |
|---|---|---|
| 把 `.agents/plugins/marketplace.json` 当作独立 Skill 索引 | 该文件登记完整 Codex Plugin | 独立 Skill 只同步 Claude marketplace 和 README，完整插件另行登记 |

## References

- `skills/codex-app-extension/SKILL.md`
- `docs/planning/specs/2026-08-18-codex-app-extension-design.md`
