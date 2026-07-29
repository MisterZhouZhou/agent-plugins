# planning-workflows systematic-debugging 接入设计

- 日期：2026-07-29
- 状态：已批准，待文档复核
- 目标插件：`plugins/planning-workflows`
- 上游来源：`/Users/cheyipai/Downloads/superpowers-main/skills/systematic-debugging`
- 支持环境：Codex、Claude Code

## 1. 背景

`planning-workflows` 当前只暴露 `brainstorming` 与 `writing-plans` 两个 Skill，并通过 `SessionStart` Hook 注入严格的自动路由规则。插件适合从需求构思进入实施计划，但没有覆盖 Bug、测试失败、构建失败、性能异常和集成异常等技术问题的系统化排查流程。

本次将 Superpowers 的 `systematic-debugging` 接入该插件，使其使用方式和核心约束与上游一致：遇到技术异常时，必须先调查并确认根因，再提出和实施修复；不得通过猜测或堆叠多个改动修补症状。

## 2. 目标

1. 新增可由 Codex 和 Claude Code 共同发现的 `planning-workflows:systematic-debugging`。
2. 保留上游四阶段系统化调试流程、强制根因调查规则和三次失败后重新审视架构的约束。
3. 保留实际参与 Skill 使用的辅助知识文档、示例和脚本。
4. 移除对 `superpowers:test-driven-development` 及其他未随本插件提供的 Superpowers Skill 的关联。
5. 扩展 `SessionStart` 路由，让技术问题优先进入 `systematic-debugging`，同时保持原有两个规划 Skill 的职责和衔接关系不变。
6. 同步更新双平台元数据、市场说明、安装文档和自动化测试。

## 3. 非目标

本次不做以下工作：

- 不引入 `test-driven-development`、`verification-before-completion`、执行、Review、Worktree 或子代理 Skill。
- 不让 `systematic-debugging` 自动转入 `brainstorming` 或 `writing-plans`。
- 不修改 `brainstorming` 到 `writing-plans` 的已批准衔接流程。
- 不引入新的生命周期 Hook 或常驻调试程序。
- 不复制上游 Skill 的创建记录、学术测试题或压力测试素材。
- 不改写上游辅助脚本以适配所有测试框架；脚本继续保持其原有、面向 npm 测试文件污染定位的职责。
- 不覆盖或回退当前工作区中 `memory-with-files`、README、marketplace 和其他未提交修改。

## 4. Skill 目录设计

新增目录：

```text
plugins/planning-workflows/skills/systematic-debugging/
├── SKILL.md
├── root-cause-tracing.md
├── defense-in-depth.md
├── condition-based-waiting.md
├── condition-based-waiting-example.ts
├── find-polluter.sh
└── agents/
    └── openai.yaml
```

`agents/openai.yaml` 沿用插件现有 Skill 的 Codex 展示配置模式，为新增 Skill 提供显示名称、简短说明和默认提示，不改变 Skill 本身的执行规则。

## 5. 辅助文件取舍

这些辅助文件不会被 Python 或插件运行时直接导入。它们的作用是：当代理读取 `SKILL.md` 并执行系统化调试流程时，提供被主 Skill 明确引用的深入方法、可复用示例或诊断脚本。

### 5.1 保留文件

| 文件 | 作用 | 保留理由 |
|---|---|---|
| `root-cause-tracing.md` | 沿调用链反向追踪异常数据或错误触发源 | `SKILL.md` Phase 1 明确引用，是“修根因而非症状”的核心展开方法 |
| `defense-in-depth.md` | 在找到根因后，从入口、业务、环境和调试层增加多层校验 | 被根因追踪材料引用，完善根因修复后的防复发方法 |
| `condition-based-waiting.md` | 用条件轮询替代任意固定延时 | `SKILL.md` 的 Supporting Techniques 明确列出，用于异步和不稳定测试问题 |
| `condition-based-waiting-example.ts` | 提供条件等待的完整 TypeScript 示例 | 被 `condition-based-waiting.md` 明确引用，保留与上游一致的可操作示例 |
| `find-polluter.sh` | 逐个运行 npm 测试文件，定位制造文件或目录污染的测试 | 被 `root-cause-tracing.md` 明确调用，是可直接执行的诊断工具 |

`find-polluter.sh` 必须保留可执行权限。

### 5.2 排除文件

| 文件 | 排除理由 |
|---|---|
| `CREATION-LOG.md` | 记录上游 Skill 的提炼和迭代过程，不参与实际调试流程 |
| `test-academic.md` | 用于测试代理是否理解 Skill，不是运行时参考材料 |
| `test-pressure-1.md` | 上游抗时间压力测试素材 |
| `test-pressure-2.md` | 上游抗沉没成本测试素材 |
| `test-pressure-3.md` | 上游抗权威和社会压力测试素材 |

插件自身会在 `plugins/planning-workflows/tests/` 中添加面向当前发布边界的结构与行为测试，不复制上游提示词测试素材。

## 6. SKILL.md 兼容设计

### 6.1 保留的上游行为

新增 `SKILL.md` 保留以下语义：

- 遇到任何 Bug、测试失败、意外行为、性能问题、构建失败或集成问题时使用。
- 在提出修复前必须完成根因调查。
- 按顺序完成四个阶段：
  1. Root Cause Investigation
  2. Pattern Analysis
  3. Hypothesis and Testing
  4. Implementation
- 先稳定复现、读取完整错误、检查近期变化并收集跨组件边界证据。
- 一次只形成一个明确假设，以最小变化验证一个变量。
- 修复根因，而不是只消除错误出现位置的症状。
- 修复前建立最小失败复现；可以使用自动化测试，也可以在缺少测试框架时使用一次性复现脚本。
- 修复后运行聚焦验证及相关回归检查。
- 同一问题连续三次修复尝试失败后，停止继续叠加补丁，先与用户讨论架构是否存在根本问题。
- 保留红旗、常见借口、快速参考和“没有可定位根因”时的处理规则。

### 6.2 删除的外部 Skill 关联

删除或改写以下内容：

- 删除 `Use the superpowers:test-driven-development skill`。
- 删除 `Use the superpowers:verification-before-completion skill`。
- 不新增任何 `superpowers:` 命名空间引用。
- 不将上述引用替换为 `planning-workflows` 中不存在的同名 Skill。

替代文本直接描述当前 Skill 自身要求：

- 修复前建立最小失败复现。
- 实施单一根因修复。
- 修复后运行该复现、相关测试和必要的回归检查。
- 只有在证据表明问题已解决且没有相关回归后，才可以报告完成。

该调整保留上游调试使用方式，但让 Skill 在当前插件中自包含。

## 7. SessionStart 路由设计

当前 Hook 中的“exactly two planning workflow skills”不再能准确描述插件整体能力。新的 Bootstrap 应区分两个规划 Skill 和一个独立调试 Skill：

- 规划工作流：
  - `planning-workflows:brainstorming`
  - `planning-workflows:writing-plans`
- 调试工作流：
  - `planning-workflows:systematic-debugging`

路由规则如下：

1. 新功能、组件、新行为或架构选择存在至少 1% 适用可能时，先调用 `brainstorming`。
2. 设计已经批准，或用户基于稳定需求明确要求详细实施计划时，调用 `writing-plans`。
3. 遇到 Bug、测试失败、构建失败、性能异常或其他意外技术行为时，在提出修复前调用 `systematic-debugging`。
4. `brainstorming` 只在设计文档获批准后衔接到 `writing-plans`。
5. `systematic-debugging` 是独立流程，不自动衔接任何规划 Skill。
6. 解释、只读分析、摘要和翻译继续跳过规划 Skill；如果只读分析本身是在调查技术异常，则 `systematic-debugging` 仍适用。
7. 不得调用其他 Planning Workflows 或 Superpowers 工作流 Skill。
8. 用户直接指令继续具有最高优先级。

Hook 仍只使用 `SessionStart`，匹配 `startup|resume|clear|compact`，并继续同时支持 `PLUGIN_ROOT` 与 `CLAUDE_PLUGIN_ROOT`。

## 8. 双平台元数据与文档

### 8.1 插件元数据

更新以下文件中的描述、关键词、能力说明和默认提示，使其准确包含系统化调试能力：

- `plugins/planning-workflows/.codex-plugin/plugin.json`
- `plugins/planning-workflows/.claude-plugin/plugin.json`

Codex manifest 的展示信息不再声称插件只负责 idea-to-plan，也不得声称插件暴露 TDD、执行或 Review 工作流。

### 8.2 Marketplace

更新以下 marketplace 中 `planning-workflows` 条目的描述和版本信息：

- `.agents/plugins/marketplace.json`
- `.claude-plugin/marketplace.json`

两个平台继续指向同一个 `plugins/planning-workflows` 插件目录。新增 Skill 通过现有 `skills` 目录自动发现，不新增独立插件条目。

### 8.3 文档

更新：

- `plugins/planning-workflows/README.md`
- 根目录 `README.md`

文档应明确：

- 插件现包含两个规划 Skill 和一个调试 Skill。
- `systematic-debugging` 的触发场景和四阶段核心流程。
- 它不依赖或提供 `test-driven-development`。
- 完整 Superpowers 与本插件同时启用仍可能产生同名 Skill 和 Bootstrap 冲突，因此继续不建议同时启用。
- Codex 和 Claude Code 的安装、更新后新建会话以及 Hook 信任说明保持准确。

## 9. 版本策略

本次新增对外可见 Skill，并修改 SessionStart 路由和插件描述，属于向后兼容的功能新增：

- Claude 插件语义版本由 `0.1.0` 升为 `0.2.0`。
- Codex 插件版本使用同一语义版本 `0.2.0`，并按仓库现有格式附加新的 `+codex.<timestamp>` 构建元数据。
- 两个 marketplace 条目的版本必须与各自插件 manifest 一致。

具体 Codex 时间戳在实施时生成并一次性同步到 manifest、marketplace 和测试断言，避免设计阶段写入将过期的固定值。

## 10. 测试设计

扩展 `plugins/planning-workflows/tests/test_plugin.py`，至少覆盖：

1. 插件恰好暴露三个 Skill：
   - `brainstorming`
   - `systematic-debugging`
   - `writing-plans`
2. SessionStart Bootstrap 同时包含三个完整命名空间 Skill 名称。
3. Bootstrap 保留严格的 1% 触发规则，并准确区分规划和调试场景。
4. Bootstrap 不再包含“exactly two”这种过期声明。
5. `systematic-debugging/SKILL.md` frontmatter 名称和描述正确。
6. `SKILL.md` 保留四阶段标题、根因优先规则和三次失败后的架构检查规则。
7. `SKILL.md` 不包含 `test-driven-development`、`verification-before-completion` 或任何 `superpowers:` 引用。
8. 五个保留的辅助文件都存在。
9. 五个排除文件没有被复制到发布 Skill 目录。
10. `find-polluter.sh` 具有可执行权限。
11. `SKILL.md` 引用的本地辅助文件均真实存在。
12. Codex 和 Claude manifest 名称、版本及描述与新增能力一致。
13. 两个平台 marketplace 的 `planning-workflows` 版本与对应 manifest 一致。
14. 原有 `writing-plans` 无移除工作流依赖测试继续通过。
15. Hook 的 Codex/Claude 双根目录执行测试继续通过。

如果仓库中的 quick validator 支持包含辅助文件的 Skill，则对三个 Skill 全部运行；否则至少使用现有 validator 校验三个 `SKILL.md` 的 frontmatter 和基本结构。

## 11. 验证与验收

实施完成后执行：

```bash
python3 -m unittest discover -s plugins/planning-workflows/tests -v
python3 skills/codex-plugin-marketplaces/scripts/audit_marketplace.py .
python3 -m json.tool plugins/planning-workflows/.codex-plugin/plugin.json >/dev/null
python3 -m json.tool plugins/planning-workflows/.claude-plugin/plugin.json >/dev/null
python3 -m json.tool .agents/plugins/marketplace.json >/dev/null
python3 -m json.tool .claude-plugin/marketplace.json >/dev/null
git diff --check
```

若本机可用 Claude Code 插件验证命令，还应执行：

```bash
claude plugin validate plugins/planning-workflows
claude plugin validate .
```

验收标准：

1. Codex 和 Claude Code 均能从同一插件目录发现 `planning-workflows:systematic-debugging`。
2. 技术异常通过 SessionStart 规则优先路由到该 Skill。
3. Skill 在提出修复前强制执行根因调查，并保留上游四阶段流程。
4. 发布目录只包含五个实际使用的辅助文件和 `SKILL.md`，不包含上游开发测试资料。
5. Skill 及文档中不存在 `test-driven-development`、`verification-before-completion` 或其他 `superpowers:` 依赖。
6. 原有 `brainstorming` 到 `writing-plans` 的流程不变。
7. 插件不新增执行、TDD、Review、Worktree 或子代理能力。
8. 双平台 manifest、marketplace、插件 README 和根 README 描述一致。
9. 所有聚焦测试、marketplace 审计、JSON 校验、Claude 验证和 `git diff --check` 通过。
10. 最终差异不覆盖或回退当前工作区的其他未提交修改。

## 12. 实施边界

设计获复核后，下一阶段仅生成详细实施计划。实际复制、改写、版本更新、测试和安装缓存刷新必须在后续实施阶段完成。

源目录 `/Users/cheyipai/Downloads/superpowers-main` 只作为本次导入的只读上游来源，不在其中写入任何文件。
