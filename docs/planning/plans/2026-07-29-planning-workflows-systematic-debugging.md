# planning-workflows systematic-debugging 实施计划

**Goal:** 将 Superpowers 的系统化调试流程以不依赖其他 Superpowers Skill 的形式接入 `planning-workflows`，并同步 Codex/Claude Code 路由、元数据、市场说明、文档和回归测试。

**Architecture:** 在现有 `plugins/planning-workflows/skills/` 下新增一个自包含的 `systematic-debugging` Skill。复制上游 `SKILL.md` 的四阶段调试规则及 5 个被主文档引用的辅助文件；只删除 `test-driven-development`、`verification-before-completion` 和其他 `superpowers:` 外部引用，并将这些位置改为本 Skill 自身的复现、修复和验证要求。现有 `brainstorming` → `writing-plans` 规划链保持不变，`systematic-debugging` 作为独立技术问题流程由同一 `SessionStart` Bootstrap 路由。

**Tech Stack:** Markdown Skill 文档、TypeScript 示例、Bash 诊断脚本、Python `unittest`、JSON manifest/marketplace、YAML Codex Skill 展示配置。

## 全局约束

- 只实现已批准设计文档中的范围，不引入执行、TDD、Review、Worktree、子代理或新的生命周期 Hook。
- 上游只读来源为 `/Users/cheyipai/Downloads/superpowers-main/skills/systematic-debugging`，不得向该目录写入。
- 新增发布 Skill 只包含 `SKILL.md`、`agents/openai.yaml` 和以下 5 个运行时辅助文件：`root-cause-tracing.md`、`defense-in-depth.md`、`condition-based-waiting.md`、`condition-based-waiting-example.ts`、`find-polluter.sh`。
- 不复制 `CREATION-LOG.md`、`test-academic.md`、`test-pressure-1.md`、`test-pressure-2.md`、`test-pressure-3.md`。
- `systematic-debugging/SKILL.md` 不得出现 `test-driven-development`、`verification-before-completion` 或任何 `superpowers:` 引用。
- 保留现有工作区中与本任务无关的未提交修改，尤其是 `memory-with-files`、`README.md`、两个 marketplace 文件和已有 `docs/` 内容；最终只检查本任务新增或修改的目标差异是否正确，不执行全局回退。
- 版本采用 Claude `0.2.0`，Codex `0.2.0+codex.20260729000000`；该时间戳在实施开始前可替换为实际生成的合法小写时间戳，但必须在 Codex manifest 和 Codex marketplace 条目中保持一致，Claude manifest 和 Claude marketplace 条目保持 `0.2.0` 一致。
- 设计文档 `docs/planning/specs/2026-07-29-planning-workflows-systematic-debugging-design.md` 和本实施计划是任务步骤与验收状态的权威来源，`.memory/` 只记录这两个路径、稳定决策和恢复状态。

---

### Task 1: 扩展回归测试，锁定三个 Skill 和无外部依赖边界

**Files:**
- Modify: `plugins/planning-workflows/tests/test_plugin.py:15-110`
- Test: `plugins/planning-workflows/tests/test_plugin.py`

**Interfaces:**
- Consumes: `PLUGIN_ROOT / skills` 目录、`hooks/session_start.py` 输出、`systematic-debugging/SKILL.md`、双平台 manifest/marketplace JSON。
- Produces: 可执行的插件结构、路由、内容边界、文件权限和版本一致性回归断言。

- [x] **Step 1: 替换过期的两个 Skill 断言并增加失败测试**

将 `test_exposes_exactly_two_skills` 改为断言排序后的 Skill 名称严格等于：

```python
["brainstorming", "systematic-debugging", "writing-plans"]
```

在同一测试类增加以下断言方法：

```python
def test_session_start_routes_debugging_without_old_two_skill_claim(self) -> None:
    context = self._session_context()
    self.assertIn("`planning-workflows:systematic-debugging`", context)
    self.assertIn("Bug", context)
    self.assertIn("test failure", context)
    self.assertNotIn("exactly two", context)
    self.assertNotIn("using-superpowers", context)


def test_systematic_debugging_is_self_contained(self) -> None:
    skill_dir = PLUGIN_ROOT / "skills" / "systematic-debugging"
    content = (skill_dir / "SKILL.md").read_text(encoding="utf-8")
    self.assertIn("name: systematic-debugging", content)
    self.assertIn("Root Cause Investigation", content)
    self.assertIn("Pattern Analysis", content)
    self.assertIn("Hypothesis and Testing", content)
    self.assertIn("Implementation", content)
    self.assertIn("NO FIXES WITHOUT ROOT CAUSE INVESTIGATION FIRST", content)
    self.assertIn("If 3+ fixes failed", content)
    for forbidden in (
        "test-driven-development",
        "verification-before-completion",
        "superpowers:",
    ):
        self.assertNotIn(forbidden, content)


def test_systematic_debugging_keeps_required_supporting_files_only(self) -> None:
    skill_dir = PLUGIN_ROOT / "skills" / "systematic-debugging"
    required = {
        "SKILL.md",
        "root-cause-tracing.md",
        "defense-in-depth.md",
        "condition-based-waiting.md",
        "condition-based-waiting-example.ts",
        "find-polluter.sh",
        "agents/openai.yaml",
    }
    actual = {
        path.relative_to(skill_dir).as_posix()
        for path in skill_dir.rglob("*")
        if path.is_file()
    }
    self.assertEqual(actual, required)
    self.assertTrue((skill_dir / "find-polluter.sh").stat().st_mode & 0o111)
    for referenced in (
        "root-cause-tracing.md",
        "defense-in-depth.md",
        "condition-based-waiting.md",
    ):
        self.assertTrue((skill_dir / referenced).is_file())


def test_manifests_and_marketplaces_use_matching_versions(self) -> None:
    codex = json.loads((PLUGIN_ROOT / ".codex-plugin/plugin.json").read_text())
    claude = json.loads((PLUGIN_ROOT / ".claude-plugin/plugin.json").read_text())
    codex_market = json.loads(
        (PLUGIN_ROOT.parents[1] / ".agents/plugins/marketplace.json").read_text()
    )
    claude_market = json.loads(
        (PLUGIN_ROOT.parents[1] / ".claude-plugin/marketplace.json").read_text()
    )
    codex_entry = next(item for item in codex_market["plugins"] if item["name"] == "planning-workflows")
    claude_entry = next(item for item in claude_market["plugins"] if item["name"] == "planning-workflows")
    self.assertEqual(codex["version"], "0.2.0+codex.20260729000000")
    self.assertEqual(claude["version"], "0.2.0")
    self.assertEqual(codex_entry["version"], codex["version"])
    self.assertEqual(claude_entry["version"], claude["version"])
```

为避免重复执行 Hook，提取 `_session_context()` 私有辅助方法，复用现有 JSON 解析逻辑。若先运行当前测试，预期 `test_exposes_exactly_two_skills` 因新目录尚不存在而失败，且版本/路由新断言失败；这是预期的 RED 状态。

运行：

```bash
python3 -m unittest plugins/planning-workflows/tests/test_plugin.py -v
```

预期：新增断言在实现前失败，旧的两个 Skill 回归断言仍能显示当前基线行为。

- [x] **Step 2: 实现最小测试辅助和其余内容边界断言**

在测试类内添加 `_session_context()`，执行现有命令：

```python
result = subprocess.run(
    [sys.executable, str(PLUGIN_ROOT / "hooks" / "session_start.py")],
    input="{}",
    text=True,
    capture_output=True,
    check=True,
)
return json.loads(result.stdout)["hookSpecificOutput"]["additionalContext"]
```

保留现有 Hook 根目录、manifest、`writing-plans`、`brainstorming` 和 memory handoff 测试，不删除既有保护边界。

- [x] **Step 3: 验证测试契约进入可执行状态**

运行：

```bash
python3 -m unittest plugins/planning-workflows/tests/test_plugin.py -v
```

预期：新增测试仍只因尚未实现的 Skill、Hook、版本和文档内容失败；测试代码本身无语法错误。实现后本任务全部通过。

---

### Task 2: 导入并裁剪 systematic-debugging Skill 及运行时辅助文件

**Files:**
- Create: `plugins/planning-workflows/skills/systematic-debugging/SKILL.md`
- Create: `plugins/planning-workflows/skills/systematic-debugging/agents/openai.yaml`
- Create: `plugins/planning-workflows/skills/systematic-debugging/root-cause-tracing.md`
- Create: `plugins/planning-workflows/skills/systematic-debugging/defense-in-depth.md`
- Create: `plugins/planning-workflows/skills/systematic-debugging/condition-based-waiting.md`
- Create: `plugins/planning-workflows/skills/systematic-debugging/condition-based-waiting-example.ts`
- Create: `plugins/planning-workflows/skills/systematic-debugging/find-polluter.sh`
- Test: `plugins/planning-workflows/tests/test_plugin.py`

**Interfaces:**
- Consumes: `/Users/cheyipai/Downloads/superpowers-main/skills/systematic-debugging/{SKILL.md,root-cause-tracing.md,defense-in-depth.md,condition-based-waiting.md,condition-based-waiting-example.ts,find-polluter.sh}`。
- Produces: 本插件可独立加载的 `planning-workflows:systematic-debugging` 目录；本地相对引用全部可解析；可执行的 `find-polluter.sh`。

- [x] **Step 1: 复制确定保留的上游文件并保留原始内容**

运行：

```bash
mkdir -p plugins/planning-workflows/skills/systematic-debugging/agents
cp /Users/cheyipai/Downloads/superpowers-main/skills/systematic-debugging/{root-cause-tracing.md,defense-in-depth.md,condition-based-waiting.md,condition-based-waiting-example.ts,find-polluter.sh} \
  plugins/planning-workflows/skills/systematic-debugging/
chmod +x plugins/planning-workflows/skills/systematic-debugging/find-polluter.sh
```

不要复制 `CREATION-LOG.md` 和四个 `test-*.md` 文件。复制后用 `shasum` 或 `cmp` 确认 5 个辅助文件与上游来源一致；唯一的预期差异是后续对 `SKILL.md` 的兼容编辑。

- [x] **Step 2: 创建自包含的 SKILL.md**

以 `/Users/cheyipai/Downloads/superpowers-main/skills/systematic-debugging/SKILL.md` 为基线完整复制，然后仅做以下精确编辑：

1. 保留 frontmatter：

```yaml
---
name: systematic-debugging
description: Use when encountering any bug, test failure, or unexpected behavior, before proposing fixes
---
```

2. 删除 Phase 4 第 3 步中 `Use the superpowers:verification-before-completion skill before claiming success` 整句，并保留“运行测试、确认无回归、确认问题实际解决”的本地验证要求。
3. 将 Phase 4 第 1 步中的 `Use the superpowers:test-driven-development skill for writing proper failing tests` 替换为：

```md
   - Create the simplest possible failing test or reproduction before fixing.
   - Use an automated test when the project has a suitable test framework; otherwise use a one-off reproduction script.
```

4. 删除最后的 `superpowers:` 引用后，保留 Supporting Techniques 三个本地辅助文件列表。
5. 执行以下扫描，确保没有残留：

```bash
grep -nE 'test-driven-development|verification-before-completion|superpowers:' \
  plugins/planning-workflows/skills/systematic-debugging/SKILL.md
```

预期：无输出。

- [x] **Step 3: 创建 Codex Skill 展示配置**

创建 `agents/openai.yaml`：

```yaml
interface:
  display_name: "Systematic Debugging"
  short_description: "Find the root cause before proposing a fix."
  default_prompt: "Use $systematic-debugging to investigate this bug systematically before changing code."
```

- [x] **Step 4: 验证 Skill 文件边界和引用**

运行：

```bash
find plugins/planning-workflows/skills/systematic-debugging -type f -print | sort
grep -nE 'root-cause-tracing\.md|defense-in-depth\.md|condition-based-waiting\.md' \
  plugins/planning-workflows/skills/systematic-debugging/SKILL.md
python3 -m unittest plugins/planning-workflows/tests/test_plugin.py -v
```

预期：文件集合严格等于 Task 1 中定义的 7 个文件；本地引用存在；除 manifest、Hook、marketplace 和文档尚未实现外，Skill 相关测试通过。

---

### Task 3: 更新 SessionStart 调试路由并保持规划链不变

**Files:**
- Modify: `plugins/planning-workflows/hooks/session_start.py:BOOTSTRAP`
- Modify: `plugins/planning-workflows/tests/test_plugin.py:23-38`
- Test: `plugins/planning-workflows/hooks/hooks.json`

**Interfaces:**
- Consumes: `PLUGIN_ROOT` 或 `CLAUDE_PLUGIN_ROOT`、SessionStart 事件 `startup|resume|clear|compact`。
- Produces: JSON `hookSpecificOutput.additionalContext`，包含两个规划 Skill 和一个独立调试 Skill 的严格路由。

- [x] **Step 1: 更新 Bootstrap 文本**

将当前 `exactly two` 文本替换为精简、明确区分职责的内容，至少包含以下语义和完整命名：

```text
<EXTREMELY-IMPORTANT>
This plugin provides two planning workflow skills and one debugging workflow skill:
- `planning-workflows:brainstorming` for features, components, new behavior, or architecture choices.
- `planning-workflows:writing-plans` only after an approved design or settled requirements explicitly request a detailed plan.
- `planning-workflows:systematic-debugging` for bugs, test failures, build failures, performance problems, integration issues, or unexpected behavior; investigate root cause before proposing fixes.
Before any response or action, if there is even a 1% chance the applicable workflow applies, invoke it first.
- Brainstorming transitions only to writing-plans after written-design approval.
- Systematic-debugging is independent and does not transition to planning workflows.
- Skip planning workflows for explanations, read-only analysis, summaries, translations, and known-cause fixes.
- Never invoke other Planning Workflows or Superpowers workflow skills.
Direct user instructions override these mandatory rules.
</EXTREMELY-IMPORTANT>
```

保持中文或英文均可，但测试应锁定稳定的完整 Skill 名称、`even a 1% chance`、调试场景关键词、独立路由和无 `exactly two`；不要让 Bootstrap 超过现有 12 行限制，若上述内容超出则合并语句而不是删除边界规则。

- [x] **Step 2: 运行 Hook 聚焦测试**

运行：

```bash
python3 -m unittest plugins/planning-workflows/tests/test_plugin.py -v
```

预期：Skill 目录和 Hook 相关测试通过；manifest、marketplace 和 README 相关测试仍因后续任务未完成而失败。

- [x] **Step 3: 验证 Codex/Claude 根目录命令**

分别执行：

```bash
PLUGIN_ROOT="$PWD/plugins/planning-workflows"; \
  python3 "$PLUGIN_ROOT/hooks/session_start.py" <<<'{}'

CLAUDE_PLUGIN_ROOT="$PWD/plugins/planning-workflows"; \
  python3 "$CLAUDE_PLUGIN_ROOT/hooks/session_start.py" <<<'{}'
```

预期：两次都输出合法 JSON，`hookSpecificOutput.hookEventName` 为 `SessionStart`，输出到 stdout 的内容无调试噪音。

---

### Task 4: 同步 manifest、marketplace、插件文档和根 README

**Files:**
- Modify: `plugins/planning-workflows/.codex-plugin/plugin.json`
- Modify: `plugins/planning-workflows/.claude-plugin/plugin.json`
- Modify: `.agents/plugins/marketplace.json`
- Modify: `.claude-plugin/marketplace.json`
- Modify: `plugins/planning-workflows/README.md`
- Modify: `README.md:108-130,247-265`
- Test: `plugins/planning-workflows/tests/test_plugin.py`

**Interfaces:**
- Consumes: 新增 Skill 目录和 Task 3 的路由语义。
- Produces: Codex/Claude 可识别且版本一致的插件元数据、市场条目、安装说明和能力说明。

- [x] **Step 1: 更新两个插件 manifest**

将 Codex manifest 的版本更新为 `0.2.0+codex.20260729000000`，Claude manifest 更新为 `0.2.0`。同步更新：

- `description` 为包含 brainstorming、writing-plans 和 systematic-debugging 的短描述。
- `keywords` 增加 `debugging`、`root-cause`、`investigation`。
- Codex `interface.shortDescription`、`longDescription`、`capabilities` 和 `defaultPrompt` 明确插件提供两个规划流程和一个独立调试流程。
- `longDescription` 明确插件不提供执行、TDD、Review、Worktree 或子代理流程。

- [x] **Step 2: 更新两个 marketplace 条目**

在两个 marketplace 中只修改名称为 `planning-workflows` 的现有条目，不调整插件顺序和其他插件：

```json
{
  "name": "planning-workflows",
  "version": "0.2.0+codex.20260729000000",
  "description": "Strict brainstorming, implementation planning, and systematic debugging workflows with SessionStart routing."
}
```

Claude 条目使用：

```json
{
  "name": "planning-workflows",
  "version": "0.2.0",
  "description": "Strict brainstorming, implementation planning, and systematic debugging workflows with SessionStart routing."
}
```

保留各平台现有的 source/path、policy、strict、category 字段。若平台验证器拒绝 marketplace 条目中的 `version` 字段，则不改变已批准的版本同步目标，改为在测试中比较 marketplace 条目引用的插件 manifest 版本，并记录验证器允许的等价表达；不能为了通过本地脚本静默删除版本一致性要求。

- [x] **Step 3: 更新插件 README**

将开头和工作流说明改为：

1. 插件同时支持 Codex 和 Claude Code。
2. `brainstorming` 负责新功能/行为/架构设计。
3. `writing-plans` 负责已批准设计的实施计划。
4. `systematic-debugging` 负责 Bug、测试失败、构建失败、性能和集成问题。
5. 调试流程独立运行，不依赖 `test-driven-development`，也不自动进入规划或执行流程。
6. Hook 在 `startup|resume|clear|compact` 重新注入三条路由。

同步修改“不要与完整 Superpowers 同时启用”的原因，说明会产生同名 Skill 和 Bootstrap 冲突；更新来源与许可段落，说明系统化调试 Skill 和辅助材料来自 Superpowers 项目并按现有 MIT 许可分发。

- [x] **Step 4: 更新根 README 的两个 planning-workflows 说明段**

更新 Codex 段 `README.md:108-130` 和 Claude 段 `README.md:247-265`：

- 列出三个 Skill 和各自职责。
- 将“严格触发规则仅作用于这两个 Skill”改为“三个 Skill 各自按职责严格路由”。
- 明确 `systematic-debugging` 不依赖 TDD，且不自动进入执行、Review、Worktree 或子代理流程。
- 保留现有安装命令、Hook 信任说明、新建会话说明和完整 Superpowers 冲突警告。

- [x] **Step 5: 验证元数据和文档语义**

运行：

```bash
python3 -m json.tool plugins/planning-workflows/.codex-plugin/plugin.json >/dev/null
python3 -m json.tool plugins/planning-workflows/.claude-plugin/plugin.json >/dev/null
python3 -m json.tool .agents/plugins/marketplace.json >/dev/null
python3 -m json.tool .claude-plugin/marketplace.json >/dev/null
grep -RniE 'systematic-debugging|test-driven-development|verification-before-completion|exactly two' \
  plugins/planning-workflows README.md .agents/plugins/marketplace.json .claude-plugin/marketplace.json
```

预期：四个 JSON 校验通过；目标文档含新增 Skill 和不依赖 TDD 的说明；不再出现过期 `exactly two`，且 `systematic-debugging` 文档不出现被禁止的外部 Skill 引用。

---

### Task 5: 执行插件验证、市场审计并创建审阅检查点

**Files:**
- Test: `plugins/planning-workflows/tests/test_plugin.py`
- Test: `plugins/planning-workflows/.codex-plugin/plugin.json`
- Test: `plugins/planning-workflows/.claude-plugin/plugin.json`
- Test: `.agents/plugins/marketplace.json`
- Test: `.claude-plugin/marketplace.json`
- Test: `plugins/planning-workflows/skills/systematic-debugging/*`
- Test: `README.md`

**Interfaces:**
- Consumes: Task 1-4 的全部新增和修改内容。
- Produces: 可安装前的跨平台插件验证结果，以及不触碰无关修改的审阅检查点。

- [x] **Step 1: 运行 planning-workflows 全量单元测试**

运行：

```bash
python3 -m unittest discover -s plugins/planning-workflows/tests -v
```

预期：所有测试通过，至少包含原有 7 个测试和新增的 Skill、Hook、文件边界、权限及版本一致性测试。

- [x] **Step 2: 运行 Codex marketplace 审计**

运行：

```bash
python3 skills/codex-plugin-marketplaces/scripts/audit_marketplace.py .
```

预期：输出 `Codex marketplace audit passed`，且插件条目、source、manifest 名称和 Hook 配置均有效。

- [x] **Step 3: 运行 Claude 验证（命令可用时）和本地一致性检查**

运行：

```bash
if command -v claude >/dev/null 2>&1; then
  claude plugin validate plugins/planning-workflows
  claude plugin validate .
fi
python3 -m json.tool plugins/planning-workflows/.codex-plugin/plugin.json >/dev/null
python3 -m json.tool plugins/planning-workflows/.claude-plugin/plugin.json >/dev/null
python3 -m json.tool .agents/plugins/marketplace.json >/dev/null
python3 -m json.tool .claude-plugin/marketplace.json >/dev/null
git diff --check
```

预期：Claude 命令可用时两个验证通过；不可用时条件分支跳过但 JSON 和空白检查仍执行；所有 JSON 和 `git diff --check` 通过。

- [x] **Step 4: 检查最终差异和无关工作区保护**

运行：

```bash
git status --short
git diff --stat -- \
  plugins/planning-workflows \
  .agents/plugins/marketplace.json \
  .claude-plugin/marketplace.json \
  README.md \
  docs/planning/specs/2026-07-29-planning-workflows-systematic-debugging-design.md \
  docs/planning/plans/2026-07-29-planning-workflows-systematic-debugging.md
git diff --check
```

预期：新增和修改内容仅落在批准范围；已有 `memory-with-files`、`yuque-develop-requirements`、`.memory/` 及其他未提交工作保持存在，不执行回退或清理。

- [x] **Step 5: 创建审阅检查点并停止**

记录本次实施前检查点：三个 Skill 的清单、路由、上游辅助文件取舍、双平台元数据和文档均完成验证；不要执行 `codex plugin add`、Claude 安装、缓存刷新或新会话验证，因为当前计划只覆盖实现和静态验证，安装需要后续用户明确要求。

## 验收标准

1. `plugins/planning-workflows/skills` 严格暴露 `brainstorming`、`systematic-debugging`、`writing-plans` 三个 Skill。
2. `systematic-debugging` 保留上游四阶段、根因优先、单一假设、失败后重查和三次失败后架构审视规则。
3. 运行时辅助文件集合严格为 5 个指定文件；上游创建记录和压力测试资料未复制。
4. `find-polluter.sh` 具备执行权限。
5. `SKILL.md` 不包含 `test-driven-development`、`verification-before-completion` 或 `superpowers:` 引用。
6. SessionStart 在 `startup|resume|clear|compact` 输出三个 Skill 的职责路由，并删除过期的 `exactly two` 声明。
7. `brainstorming` → `writing-plans` 仍是唯一规划衔接；`systematic-debugging` 不自动衔接规划 Skill。
8. Codex manifest/marketplace 版本统一为 `0.2.0+codex.20260729000000`，Claude manifest/marketplace 版本统一为 `0.2.0`。
9. 双平台 manifest、marketplace、插件 README 和根 README 对能力边界描述一致。
10. planning-workflows 单元测试、Codex marketplace 审计、JSON 校验、可用时的 Claude 验证和 `git diff --check` 全部通过。
11. 不回退、不覆盖工作区已有的无关修改。

## Checkpoint

Task 5 完成后，创建一个清晰的实现审阅检查点：插件实现和静态验证已完成，但不自动安装、刷新缓存或开始执行其他工作流；随后向用户汇报并询问是否进入实际实施。 
