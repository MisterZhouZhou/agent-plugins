# Pi Agent Reference Implementation Plan

**Goal:** 在 `agent-cli-skill` 中增加基于 Pi 0.84.1 证据的模块化 Pi Agent reference，使 Pi 配置、扩展、skills、subagent、安全和验证问题可以按最小文档集路由，并沉淀 OpenRouter 协议错配的排障经验。

**Architecture:** 新增 `skills/agent-cli-skill/references/pi/` 目录，按 CLI、provider、extension、skill、subagent、MCP、session、permission、testing 九个专题拆分；只在 `SKILL.md` 增加 Pi 触发词、Pi Router 和 Pi 专属 subagent 路由。Pi 核心能力与第三方 extension/package 能力分开记录，版本敏感项以 Pi 0.84.1 文档、类型/源码和本地项目实现为证据。

**Tech Stack:** Markdown、JSON 示例、Pi 0.84.1 本地 npm 文档/类型声明、`pi-extensions` 项目源码、POSIX shell、`git diff --check`。

## Global Constraints

- 只修改 `/Users/cheyipai/Desktop/ai/agent-plugins` 内的 skill 文档和本计划列出的文件。
- 不修改用户的 `~/.pi/agent/models.json`、`settings.json`、auth 文件或 session。
- 不安装、卸载、发布 Pi Package，不执行 npm publish、release、tag 或 push。
- 不写入真实 API Key、私有内网地址、当前用户模型清单、完整 session 或通知 payload。
- 保留 Claude、Codex、OpenCode 现有路由；未指定 CLI 的通用 subagent 仍只加载原有三方 reference。
- 不把 Pi 核心未提供的 MCP、subagent、权限弹窗、plan mode 或后台 Bash 描述成内置能力；如由 extension/package 提供，必须标明来源。
- 所有版本敏感行为标注 Pi 0.84.1 基线和重新核对要求。
- 每个任务完成后运行该任务的局部检查；最终运行全量文档检查和 `git diff --check`。

---

### Task 1: 固化 Pi 0.84.1 证据索引和文档边界

**Files:**
- Modify: none（只读证据门禁）
- Read-only sources: `node_modules/@earendil-works/pi-coding-agent/docs/*.md`, `node_modules/@earendil-works/pi-coding-agent/README.md`, `node_modules/@earendil-works/pi-coding-agent/dist/**/*.d.ts`, `/Users/cheyipai/Desktop/ai/pi-extensions/packages/**/*.ts`, `/Users/cheyipai/Desktop/ai/pi-extensions/packages/**/*.md`

**Interfaces:**
- Consumes: Pi 0.84.1 package docs/types, local `pi-extensions` package manifests and implementation.
- Produces: 经命令核对的来源矩阵和事实边界，供后续任务直接引用原始来源；不在仓库新增批准范围外的证据文件。

- [ ] **Step 1: 核对来源矩阵**

  按以下主题核对来源和证据等级：
  - CLI/模式/环境变量：`docs/usage.md`、README、CLI help。
  - provider/model/config：`docs/models.md`、`docs/providers.md`、`docs/settings.md`、`docs/environment-variables.md`。
  - extensions/packages：`docs/extensions.md`、`docs/packages.md`、`docs/security.md`。
  - skills/prompts/context：`docs/skills.md`、`docs/prompt-templates.md`、README。
  - sessions/JSON/RPC/SDK：`docs/sessions.md`、`docs/session-format.md`、`docs/json.md`、`docs/rpc.md`、`docs/sdk.md`。
  - MCP/subagent/permission：核心 README/usage 的“不内置”说明，以及 `pi-extensions` 的 subagent/yolo 实现。

- [ ] **Step 2: 记录明确排除项**

  从 Pi 0.84.1 README/usage 文档确认：Pi 核心未内置 MCP、sub-agent、permission popups、plan mode、to-do 和 background bash；这些只有在具体 extension/package 证据存在时才能进入对应专题。

- [ ] **Step 3: 验证关键证据存在**

  Run: `for f in usage.md models.md providers.md settings.md extensions.md packages.md skills.md prompt-templates.md sessions.md session-format.md json.md rpc.md sdk.md security.md; do test -f "/Users/cheyipai/Desktop/ai/pi-extensions/node_modules/@earendil-works/pi-coding-agent/docs/$f" || exit 1; done; rg -n 'No MCP|does not include built-in MCP' /Users/cheyipai/Desktop/ai/pi-extensions/node_modules/@earendil-works/pi-coding-agent/{README.md,docs/usage.md}`
  Expected: 所有源文件存在，并输出 Pi 核心不内置 MCP/sub-agent/permission popups 等能力的证据行。

---

### Task 2: 更新 `SKILL.md` 的 Pi 识别和最小路由

**Files:**
- Modify: `skills/agent-cli-skill/SKILL.md:3`（frontmatter description）
- Modify: `skills/agent-cli-skill/SKILL.md:8-31`（Hard rule 和 subagent routing）
- Modify: `skills/agent-cli-skill/SKILL.md:33-71`（Router）
- Modify: `skills/agent-cli-skill/SKILL.md:126-153`（ambiguous keywords）

**Interfaces:**
- Consumes: Task 1 的 Pi 术语和 reference 文件名。
- Produces: Pi 关键词到 `references/pi/*.md` 的最小读取规则；不改变三方通用 subagent 默认路由。

- [ ] **Step 1: 扩展 frontmatter 触发描述**

  加入 `Pi Agent`、`pi.dev`、`pi install`、`pi -e`、`~/.pi/agent`、`.pi/agents`、`.pi/extensions`、provider/model 配置和四种 `api` 类型；保留现有三 CLI 描述和跨 CLI 规则。

- [ ] **Step 2: 扩展 Hard rule**

  将目标 CLI 分类从 Claude/Codex/OpenCode 扩展为包含 Pi；明确用户出现 Pi 专属路径或命令时只读 Pi reference。

- [ ] **Step 3: 添加 Pi Router 表**

  精确映射九个专题：`cli.md`、`providers.md`、`extensions.md`、`skills.md`、`subagents.md`、`mcp.md`、`sessions.md`、`permissions.md`、`testing.md`。总体 Pi Agent 问题先读 `cli.md`，再按意图追加 1–2 个专题。

- [ ] **Step 4: 添加 Pi 专属 ambiguous keyword 条目**

  覆盖 `models.json`、`settings.json`、`openai-completions`、`openai-responses`、`anthropic-messages`、`google-generative-ai`、`pi install`、`.pi/agents` 和 `Pi SDK` 等信号。明确裸 `subagent` 仍按原三 CLI 规则，只有明确 Pi 才读 Pi subagent reference。

- [ ] **Step 5: 做路由静态检查**

  Run: `python3 - <<'PY'\nfrom pathlib import Path\np = Path('skills/agent-cli-skill/SKILL.md').read_text()\nfor name in ['references/pi/cli.md','references/pi/providers.md','references/pi/extensions.md','references/pi/skills.md','references/pi/subagents.md','references/pi/mcp.md','references/pi/sessions.md','references/pi/permissions.md','references/pi/testing.md']:\n    assert name in p, name\nassert 'all three' in p and 'Claude' in p and 'Codex' in p and 'OpenCode' in p\nprint('route assertions passed')\nPY`
  Expected: 输出 `route assertions passed`；此时目标文件尚未创建时只作为 Task 2 完成后的检查，若提前执行应按预期失败。

---

### Task 3: 创建 CLI、provider 和扩展/资源 reference

**Files:**
- Create: `skills/agent-cli-skill/references/pi/cli.md`
- Create: `skills/agent-cli-skill/references/pi/providers.md`
- Create: `skills/agent-cli-skill/references/pi/extensions.md`
- Create: `skills/agent-cli-skill/references/pi/skills.md`

**Interfaces:**
- Consumes: Task 1 证据索引；Pi 0.84.1 `docs/usage.md`、`models.md`、`providers.md`、`settings.md`、`extensions.md`、`packages.md`、`skills.md`、`prompt-templates.md`。
- Produces: 面向使用者的 Pi CLI/configuration/extension/resource reference；各文档通过 `Related` 或相对路径链接到其他 Pi 专题。

- [ ] **Step 1: 编写 `cli.md`**

  包含版本检查、启动/print/JSON/RPC 模式、常用 `--model`/`--provider`/`--tools`/`--no-session`/`--no-extensions`/`-e` 参数、`PI_CODING_AGENT_DIR` 等环境变量，以及 Pi SDK 的准确边界：SDK 随 `@earendil-works/pi-coding-agent` 提供，不描述成独立于 Pi runtime 的兼容 SDK。

- [ ] **Step 2: 编写 `providers.md`**

  包含脱敏 `models.json` 示例、`settings.json` 默认值职责、环境变量认证、provider/model/default 三层核对、四种 API 映射和模型能力字段。用 OpenRouter 案例解释 `openai-completions -> /chat/completions`、`anthropic-messages -> /messages`，不携带用户真实 provider/model/key。

- [ ] **Step 3: 编写 `extensions.md`**

  包含 `package.json#pi`、`pi install npm:<package>`、`pi -e <path>`、`--no-extensions`、umbrella/独立包重复加载、extension 注册点和第三方 package 同权限风险；明确发布命令只作为说明，不自动执行。

- [ ] **Step 4: 编写 `skills.md`**

  区分 `AGENTS.md`、skills、prompt templates、extensions 和 agents；记录用户级/项目级资源发现必须按版本核对，引用 `enableSkillCommands` 时说明它只是活动设置，不等于所有资源已加载。

- [ ] **Step 5: 做文档内容检查**

  Run: `for f in skills/agent-cli-skill/references/pi/{cli,providers,extensions,skills}.md; do test -s "$f" && rg -q '^# ' "$f" || exit 1; done`
  Expected: 四个文件均非空且有一级标题。

---

### Task 4: 创建 subagent、MCP、session 和 permission reference

**Files:**
- Create: `skills/agent-cli-skill/references/pi/subagents.md`
- Create: `skills/agent-cli-skill/references/pi/mcp.md`
- Create: `skills/agent-cli-skill/references/pi/sessions.md`
- Create: `skills/agent-cli-skill/references/pi/permissions.md`

**Interfaces:**
- Consumes: Task 1 证据索引；Pi 核心“不内置”说明；`/Users/cheyipai/Desktop/ai/pi-extensions/packages/subagent` 和 `packages/yolo` 的 README、manifest、源码。
- Produces: 明确区分 Pi core、Pi SDK、extension/package 的 subagent/MCP/permission/session 文档。

- [ ] **Step 1: 编写 `subagents.md`**

  记录 `.pi/agents` 的来源和 project/user/builtin 优先级、`agentScope`、single/parallel/chain 输入形状、`{previous}`、子 Pi 的 cwd/provider/model 继承、JSON/no-session/no-other-extensions、递归 guard、SAFE 下父确认和 explore/planner/worker/reviewer 阶段化模式。每条 package-specific 行为标注来自 `@misterzhou/pi-subagent`，不是 Pi core 默认能力。

- [ ] **Step 2: 编写 `mcp.md`**

  先写 Pi core 无内置 MCP 的事实；再说明通过 extension/package 或外部工具接入时需要核对 transport、配置入口、认证、进程权限、环境变量和输出限制。禁止直接复制 Claude `.mcp.json` 或 Codex `config.toml` 作为 Pi 原生配置结论；未有证据的入口写成核查步骤。

- [ ] **Step 3: 编写 `sessions.md`**

  记录 session 创建/恢复、`--no-session`、JSON/RPC、`/session`/`/resume` 等实际入口、session 文件/日志/活动配置的区别，以及子 Agent 诊断需要的 cwd、provider/model、退出码、stderr 尾部和父子关联。加入凭据脱敏要求。

- [ ] **Step 4: 编写 `permissions.md`**

  分开 project trust、extension policy、OS process permission、provider/network 四层；用 `packages/yolo` 证据说明 SAFE/YOLO 不是 OS sandbox，`--approve` 不等于工具批准，无 UI 时 fail closed，灾难 Bash 仍阻断，第三方 extension 不自动受控。

- [ ] **Step 5: 做来源和边界检查**

  Run: `rg -n '不内置|Pi core|Pi 核心|第三方|extension|package|SAFE|YOLO|project trust' skills/agent-cli-skill/references/pi/{subagents,mcp,sessions,permissions}.md`
  Expected: 每个文件都包含来源边界或安全边界说明；缺少匹配时返回非零，需补齐后再继续。

---

### Task 5: 创建 testing reference 和端到端排障清单

**Files:**
- Create: `skills/agent-cli-skill/references/pi/testing.md`

**Interfaces:**
- Consumes: Task 1 证据索引以及 `references/shared/testing.md` 的分层验证写法。
- Produces: Pi 专属 10 层验证矩阵、OpenRouter 404 判别规则、完成/未完成陈述模板。

- [ ] **Step 1: 编写验证矩阵**

  依次覆盖：JSON/密钥静态检查、DNS/TCP/TLS/HTTP、API method/path/header/body contract、模型 ID/能力声明、无工具最小生成、extension 隔离加载、subagent single/parallel/chain、session 恢复/无 session/JSON 事件、SAFE/YOLO/无 UI、完整用户路径。

- [ ] **Step 2: 编写 404 诊断规则**

  明确 HTML 根页面只证明网页路由可达；`/models` JSON 是 control endpoint；`/messages` 或 `/chat/completions` JSON 404 表示已到服务但协议/path 仍需核对；必须记录 status、content-type 和 body 摘要。加入“用户中止生成只能报告 HTTP/API 层，不能报告端到端成功”的模板。

- [ ] **Step 3: 编写安全/回归检查命令**

  示例必须使用占位符，并给出：
  - `python3 -m json.tool` 检查配置副本。
  - `rg` 检查 secrets/private addresses。
  - `pi --no-extensions -e ... --no-session` 的隔离模式（标注目标环境需确认）。
  - 最小生成请求的人工验收条件。

- [ ] **Step 4: 验证 testing reference**

  Run: `rg -n 'HTML|JSON|/models|/messages|/chat/completions|端到端|中止|密钥|SAFE|YOLO' skills/agent-cli-skill/references/pi/testing.md`
  Expected: 所有关键诊断和验收词都存在。

---

### Task 6: 完成全量文档一致性、安全和 Markdown 检查

**Files:**
- Test: `skills/agent-cli-skill/SKILL.md`
- Test: `skills/agent-cli-skill/references/pi/*.md`
- Test: `docs/planning/specs/2026-08-24-pi-agent-reference-design.md`

**Interfaces:**
- Consumes: Tasks 2–5 的全部文档。
- Produces: 可审查的最终 diff 和验证报告；不产生运行时代码。

- [ ] **Step 1: 检查路由目标完整性**

  Run: `python3 - <<'PY'\nfrom pathlib import Path\nroot = Path('skills/agent-cli-skill')\nskill = (root / 'SKILL.md').read_text()\nfiles = ['cli','providers','extensions','skills','subagents','mcp','sessions','permissions','testing']\nfor stem in files:\n    path = root / 'references' / 'pi' / f'{stem}.md'\n    assert path.is_file() and path.stat().st_size > 0, path\n    assert f'references/pi/{stem}.md' in skill, stem\n    assert (path.read_text().lstrip().startswith('# ')), path\nprint('Pi reference routing passed')\nPY`
  Expected: 输出 `Pi reference routing passed`。

- [ ] **Step 2: 扫描敏感内容和未决标记**

  Run:

  ```bash
  python3 - <<'PY'
  from pathlib import Path
  import re
  import sys

  roots = [
      Path("skills/agent-cli-skill"),
      Path("docs/planning/specs/2026-08-24-pi-agent-reference-design.md"),
      Path("docs/planning/plans/2026-08-24-pi-agent-reference.md"),
  ]
  files = []
  for root in roots:
      files.extend(root.rglob("*.md") if root.is_dir() else [root])

  patterns = {
      "private address": re.compile(r"\b192\.168\.\d{1,3}\.\d{1,3}\b"),
      "literal credential": re.compile(
          r"(?i)\b(?:api[_-]?key|authorization)\b\s*[:=]\s*[\"'](?!\$|<|\[REDACTED\])[^\"']+"
      ),
      "unresolved marker": re.compile(r"\b(?:T" + "BD|T" + "ODO|FIX" + "ME|X" + "XX)\b"),
  }
  findings = []
  for path in files:
      for line_no, line in enumerate(path.read_text().splitlines(), 1):
          for label, pattern in patterns.items():
              if pattern.search(line):
                  findings.append(f"{path}:{line_no}: {label}: {line.strip()}")
  print("\n".join(findings))
  sys.exit(1 if findings else 0)
  PY
  ```

  Expected: 无输出且退出码为 0；字段名、环境变量引用和 `[REDACTED]` 说明不触发。

- [ ] **Step 3: 检查交叉引用和版本边界**

  Run: `rg -n 'references/pi/' skills/agent-cli-skill; rg -L '0\\.84\\.1|版本|version|版本敏感' skills/agent-cli-skill/references/pi/*.md`
  Expected: 所有 Pi 文档有内部路由/引用；第二条命令不返回文件（或只返回明确声明适用版本的文件，需人工审查）。

- [ ] **Step 4: 检查 Markdown 和 diff**

  Run: `git diff --check && git status --short && git diff --stat`
  Expected: 无 whitespace 错误；只出现本计划允许的设计/计划/skill/reference 文件；diff 统计与预期文件集合一致。

- [ ] **Step 5: 人工审查三 CLI 回归**

  Run: `git diff -- skills/agent-cli-skill/SKILL.md | sed -n '1,260p'`
  Expected: 现有 Claude/Codex/OpenCode Router 行为未删除或改写；只增加 Pi 路由、Pi 术语和明确的四 CLI 对比入口。

---

### Task 7: 建立完成检查点并交付实施前报告

**Files:**
- Modify: none beyond Tasks 2–6
- Review: `skills/agent-cli-skill/SKILL.md`, `skills/agent-cli-skill/references/pi/*.md`, `docs/planning/specs/2026-08-24-pi-agent-reference-design.md`

**Interfaces:**
- Consumes: 全部文档变更和 Task 6 验证结果。
- Produces: 实施前的 review checkpoint，包含文件清单、命令输出摘要、未执行的人工步骤和用户是否批准实施的明确状态。

- [ ] **Step 1: 生成变更摘要**

  Run: `git status --short; git diff --stat; git diff --check`
  Expected: 变更范围仅限 Pi Agent reference、`SKILL.md`、设计文档和实施计划。

- [ ] **Step 2: 明确未执行事项**

  报告不会在文档任务中执行真实 provider 生成、修改 `~/.pi/agent`、安装第三方 package、MCP 登录或发布操作；这些属于用户明确要求后的人工验证/变更边界。

- [ ] **Step 3: 等待实施确认**

  计划完成后停止，不自动调用执行、TDD、review、worktree 或 subagent workflow；等待用户明确要求实施。

## Checkpoints

- **Checkpoint 1:** Task 1 完成后，Pi 0.84.1 事实边界和“不内置”能力已经固定。
- **Checkpoint 2:** Task 2 完成后，`SKILL.md` 能路由到全部 Pi reference，但目标 reference 尚未全部完成。
- **Checkpoint 3:** Tasks 3–5 完成后，九个 reference 内容齐全并通过局部检查。
- **Checkpoint 4:** Task 6 完成后，安全扫描、交叉引用、版本边界和 diff 检查通过。
- **Checkpoint 5:** Task 7 完成后，输出实施前报告并等待用户确认。

## Self-review

- 已覆盖批准设计中的全部九个专题、OpenRouter endpoint 映射、Pi/第三方能力边界、跨 CLI 路由和验证完成标准。
- 所有任务都指定了文件、输入/输出接口、具体编辑内容和可运行命令。
- 文档任务不引入运行时代码、全局配置修改或发布操作。
- “Pi SDK”只作为 Pi package 自带的程序化入口边界记录，不新增独立 SDK reference 或兼容性承诺。
- MCP 的未知配置入口要求通过证据确认，避免复制 Claude/Codex 配置格式。
- 敏感内容扫描、`git diff --check` 和现有三 CLI 路由回归均有独立步骤。
