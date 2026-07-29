# Planning Workflows

一个同时支持 Codex 和 Claude Code、提供严格需求规划与系统化调试流程的插件。

## 工作流

插件包含两个规划 Skill 和一个独立调试 Skill：

1. 新功能、行为修改、架构或方案设计自动进入 `brainstorming`。
2. 设计文档经过用户明确确认后自动进入 `writing-plans`。
3. Bug、测试失败、构建失败、性能异常、集成异常或其他意外技术行为，在提出修复前进入 `systematic-debugging`，先调查并确认根因。

`brainstorming` 只在设计文档获批准后衔接 `writing-plans`。`systematic-debugging` 独立运行，不自动进入规划流程，也不依赖 `test-driven-development`。

插件通过 `SessionStart` Hook 在 `startup`、`resume`、`clear` 和 `compact` 时重新注入三个 Skill 的职责路由，保持与 Superpowers 类似的严格触发体验。计划或调试完成后停止，不自动进入执行、TDD、Review、Worktree 或子代理流程。

## Codex 安装

```bash
codex plugin marketplace add ~/Desktop/ai/agent-plugins
codex plugin add planning-workflows@codex-agent-plugins
```

安装或更新后请新建会话，使 Skill 清单和 SessionStart Hook 生效。

## Claude Code 安装

```bash
/plugin marketplace add ~/Desktop/ai/agent-plugins
/plugin install planning-workflows@claude-agent-plugins
```

安装后审核并信任 `SessionStart` Hook，然后重新启动会话。

不要与完整的 Superpowers 插件同时启用。两个插件会注册同名 Skill 并注入 Bootstrap，同时启用会造成重复或冲突触发。

## 验证

```bash
python3 -m unittest discover -s plugins/planning-workflows/tests -v
python3 skills/codex-plugin-marketplaces/scripts/audit_marketplace.py .
```

## 来源与许可

`brainstorming`、`writing-plans` 和 `systematic-debugging` 工作流及其必要辅助材料基于 Jesse Vincent 的 Superpowers 项目改编，并按 MIT License 分发。当前版本移除了其他 Superpowers 工作流依赖；`systematic-debugging` 只保留自包含的根因调查、模式分析、假设验证和修复验证流程。
