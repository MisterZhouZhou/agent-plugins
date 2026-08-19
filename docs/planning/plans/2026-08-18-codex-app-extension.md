# Codex App Extension Skill Implementation Plan

**Goal:** 在 `agent-plugins` 仓库中新增一个文档加模板型 `codex-app-extension` Skill，沉淀 Codex App 启动、CDP 注入、页面桥接、App Server 调用、automation 和 Taskboard/taskctl 集成模式。

**Architecture:** Skill 入口负责路由和工作流，四个 reference 文件分别承载架构、注入生命周期、App Server RPC 和 Taskboard 案例；三个 JavaScript 模板提供页面侧、注入器侧和 App Server 客户端侧的最小骨架。Skill 不直接依赖 Taskboard 数据库，不修改 Codex `app.asar`，不把模板包装成生产级通用 SDK。

**Tech Stack:** Markdown、YAML、Node.js ESM JavaScript、Chromium DevTools Protocol、Codex App Server JSON-RPC、Python 静态验证脚本。

## Global Constraints

- 所有新 Skill 文件必须位于 `skills/codex-app-extension/`。
- `SKILL.md` 使用合法 YAML frontmatter，Skill 名称固定为 `codex-app-extension`。
- 页面层、注入器、App Server 和 Codex Skill/CLI 的职责必须分开描述。
- 示例只使用 loopback、占位配置和白名单方法；不得写入真实凭据、用户机器路径或秘密。
- 不修改 Codex 官方应用包，不调用未知 target，不把任意 RPC 暴露给页面层。
- 更新 `.claude-plugin/marketplace.json` 和 `README.md`；不修改 `.agents/plugins/marketplace.json`。
- 本次只做 Skill 文档、模板和索引验证，不启动真实 Codex App，不连接真实 CDP 端口，不执行完整产品构建。

---

### Task 1: 初始化 Skill 目录和 Codex 元数据

**Files:**
- Create: `skills/codex-app-extension/SKILL.md`
- Create: `skills/codex-app-extension/agents/openai.yaml`
- Create: `skills/codex-app-extension/references/`
- Create: `skills/codex-app-extension/templates/`
- Test: `skills/codex-app-extension/SKILL.md`

**Interfaces:**
- Consumes: Skill Creator 的 `init_skill.py` 目录约定、现有 `skills/cdp-skill/agents/openai.yaml` 元数据格式。
- Produces: `name: codex-app-extension`、Codex UI 展示名称、默认触发 Prompt 和四个 reference/三个 template 的目标路径。

- [ ] **Step 1: 用 Skill Creator 初始化目录**

运行：

```bash
python3 ~/.codex/skills/.system/skill-creator/scripts/init_skill.py \
  codex-app-extension \
  --path skills \
  --resources references \
  --interface 'display_name=Codex App 扩展开发' \
  --interface 'short_description=设计 Codex App 注入与 App Server 扩展' \
  --interface 'default_prompt=使用 $codex-app-extension 设计或排查 Codex App 扩展的启动、注入、桥接与 App Server 调用。'
```

预期：创建 `skills/codex-app-extension/SKILL.md`、`references/` 和 `agents/openai.yaml` 基础结构。

- [ ] **Step 2: 补齐目录并写入 `agents/openai.yaml`**

创建 `templates/`，将元数据固定为：

```yaml
interface:
  display_name: "Codex App 扩展开发"
  short_description: "设计 Codex App 注入与 App Server 扩展"
  default_prompt: "使用 $codex-app-extension 设计或排查 Codex App 扩展的启动、注入、桥接与 App Server 调用。"

policy:
  allow_implicit_invocation: true
```

- [ ] **Step 3: 验证初始化结果**

运行：

```bash
test -f skills/codex-app-extension/SKILL.md
test -f skills/codex-app-extension/agents/openai.yaml
test -d skills/codex-app-extension/references
test -d skills/codex-app-extension/templates
```

预期：四个断言全部成功。

Checkpoint：只检查新增目录，不修改现有索引。

### Task 2: 编写四个主题参考文档

**Files:**
- Create: `skills/codex-app-extension/references/architecture.md`
- Create: `skills/codex-app-extension/references/injection-lifecycle.md`
- Create: `skills/codex-app-extension/references/app-server-rpc.md`
- Create: `skills/codex-app-extension/references/taskboard-case-study.md`
- Test: 四个 Markdown 文件的链接和关键词扫描

**Interfaces:**
- Consumes: `docs/planning/specs/2026-08-18-codex-app-extension-design.md`、`skills/cdp-skill/references/cdp-patterns.md` 的 CDP 安全边界。
- Produces: `SKILL.md` 可按任务类型直接引用的四个独立主题文档。

- [ ] **Step 1: 编写 `architecture.md`**

必须包含：页面层、userscript、注入器/CDP bridge、Codex App Server、Codex thread/Skill/CLI 的职责图；手动 composer 和 cron automation 两条触发链；“写入 Taskboard 数据库不等于触发 Codex”的边界。

- [ ] **Step 2: 编写 `injection-lifecycle.md`**

必须包含：启动调试端点、`/json/version`、`/json/list`、目标 PID/Browser ID/target ID 校验、WebSocket pending map、命令超时、`Runtime.evaluate`、`Page.addScriptToEvaluateOnNewDocument`、`Runtime.addBinding`、reload 重注入、断线清理和退避恢复。

- [ ] **Step 3: 编写 `app-server-rpc.md`**

必须包含：宿主侧代理边界、请求 ID、JSON-RPC 方法白名单、参数/结果校验、错误分类、thread/read、project/workspace 切换、composer 提交、automation-create/update 的调用顺序和禁止页面直接调用任意 RPC 的规则。

- [ ] **Step 4: 编写 `taskboard-case-study.md`**

必须包含：Taskboard API、`taskctl`、`manage-taskboard` Skill、Codex thread 和任务状态的关系；手动“在对话中打开”和 cron automation 的差异；明确 `taskctl` 只管理任务数据，不启动 Codex、不修改代码。

- [ ] **Step 5: 验证参考文档**

运行：

```bash
for f in skills/codex-app-extension/references/*.md; do
  test -s "$f"
done
rg -n 'Runtime\.evaluate|Page\.addScriptToEvaluateOnNewDocument|Runtime\.addBinding|automation|taskctl|composer|Browser ID|target ID' \
  skills/codex-app-extension/references
```

预期：所有文件非空，关键协议和任务词汇均有命中。

Checkpoint：参考文档可以独立阅读，未引入模板实现细节。

### Task 3: 编写三个 JavaScript 可复用模板

**Files:**
- Create: `skills/codex-app-extension/templates/codex-injector.mjs`
- Create: `skills/codex-app-extension/templates/codex-userscript.js`
- Create: `skills/codex-app-extension/templates/app-server-client.mjs`
- Test: 三个模板的 Node 语法检查和消息字段一致性扫描

**Interfaces:**
- Consumes: `references/injection-lifecycle.md`、`references/app-server-rpc.md` 定义的消息和 RPC 边界。
- Produces: 页面请求 `{type, requestId, method, params}`、宿主响应 `{type, requestId, ok, result, error}`、注入器到 App Server 的白名单 RPC 客户端。

- [ ] **Step 1: 编写 `app-server-client.mjs`**

实现并导出：

```js
createAppServerClient({ request, allowedMethods, timeoutMs })
client.call(method, params)
client.readThread(threadId)
client.createAutomation(spec)
client.updateAutomation(automationId, patch)
```

要求：方法不在白名单时立即拒绝；请求超时返回可分类错误；不接受页面传入的任意方法名。

- [ ] **Step 2: 编写 `codex-injector.mjs`**

实现并导出：

```js
discoverDebugTarget({ port, expectedPid, expectedBrowserId })
connectCdp(webSocketUrl, { timeoutMs })
installPageBridge(cdp, source)
startWatcher({ discover, reconnect, backoff })
```

要求：校验 loopback、Browser ID 和 target；维护命令 ID 与 pending map；在 socket 关闭时拒绝 pending 请求；支持 early script、当前页面执行和重复注入清理。

- [ ] **Step 3: 编写 `codex-userscript.js`**

实现页面侧：

```js
window.codexAppExtension.request(method, params, options)
window.codexAppExtension.dispose()
```

要求：生成唯一 `requestId`；发送 `postMessage`；只接受匹配来源和 request ID 的响应；处理超时、错误和重复初始化。

- [ ] **Step 4: 执行模板语法检查**

运行：

```bash
node --check skills/codex-app-extension/templates/codex-injector.mjs
node --check skills/codex-app-extension/templates/codex-userscript.js
node --check skills/codex-app-extension/templates/app-server-client.mjs
```

预期：三个命令均退出码 0。

- [ ] **Step 5: 检查协议字段一致性**

运行：

```bash
rg -n 'requestId|postMessage|allowedMethods|timeout|Runtime\.addBinding|automation' \
  skills/codex-app-extension/templates
```

预期：页面和宿主模板均包含 `requestId`、超时和错误路径；宿主模板包含 RPC 白名单；注入器模板包含 binding/重注入路径。

Checkpoint：模板可以作为新扩展的起点，但不连接真实 Codex App。

### Task 4: 编写 Skill 入口和调用路由

**Files:**
- Modify: `skills/codex-app-extension/SKILL.md`
- Test: `quick_validate.py` 和 frontmatter 读取

**Interfaces:**
- Consumes: 四个 reference 文件和三个 template 文件。
- Produces: 根据用户请求选择最小 reference 集的 Skill 工作流。

- [ ] **Step 1: 写入合法 frontmatter**

固定字段：

```yaml
---
name: codex-app-extension
description: Use when designing, implementing, or troubleshooting Codex App extensions involving app-server calls, CDP injection, renderer bridges, composer/thread automation, or Skill and CLI integration.
---
```

- [ ] **Step 2: 编写路由表和硬性规则**

入口必须规定：

- 只读解释时读取 `architecture.md`；
- CDP 启动、注入、重连时读取 `injection-lifecycle.md`；
- App Server、thread、workspace、composer、automation 时读取 `app-server-rpc.md`；
- Taskboard、`taskctl` 或任务面板时读取 `taskboard-case-study.md`；
- 不默认读取全部 reference；
- 实现前先检查目标 App、现有 bridge 和权限边界；
- 不修改 `app.asar`，不绕过用户确认，不暴露任意 RPC。

- [ ] **Step 3: 编写标准执行流程和交付清单**

入口必须要求 Codex 输出：目标端点、目标身份、注入位置、协议方法、错误恢复、验证命令和实际生效来源；同时区分源码、安装缓存和当前会话是否已经加载新 Skill。

- [ ] **Step 4: 验证 Skill frontmatter**

运行：

```bash
python3 ~/.codex/skills/.system/skill-creator/scripts/quick_validate.py \
  skills/codex-app-extension
```

预期：输出 `Skill is valid!`。

Checkpoint：Skill 可以独立触发并按主题加载 reference。

### Task 5: 更新仓库文档和 Claude Skill 索引

**Files:**
- Modify: `README.md`
- Modify: `.claude-plugin/marketplace.json`
- Test: JSON 格式、marketplace 审计和路径存在性

**Interfaces:**
- Consumes: 新 Skill 的目录和入口说明。
- Produces: README 入口、目录树、适用示例和 `dev-skills` 索引项 `./skills/codex-app-extension`。

- [ ] **Step 1: 更新 README 目录树**

在 `skills/` 列表中加入 `codex-app-extension/`，并新增独立章节，说明触发场景、覆盖范围、参考文档和模板路径。

- [ ] **Step 2: 更新 `.claude-plugin/marketplace.json`**

在 `dev-skills.skills` 中按现有开发类 Skill 顺序加入：

```json
"./skills/codex-app-extension"
```

不修改 Codex 插件市场配置。

- [ ] **Step 3: 验证索引**

运行：

```bash
python3 -m json.tool .claude-plugin/marketplace.json >/dev/null
python3 skills/codex-plugin-marketplaces/scripts/audit_marketplace.py .
test -d skills/codex-app-extension
rg -n 'codex-app-extension' README.md .claude-plugin/marketplace.json
```

预期：JSON 解析成功、marketplace 审计通过、目录和两个索引文件均能找到新 Skill。

Checkpoint：索引更新独立于 Skill 内容，可单独回滚。

### Task 6: 全量自检并交付

**Files:**
- Test: `skills/codex-app-extension/`、`README.md`、`.claude-plugin/marketplace.json`

**Interfaces:**
- Consumes: Tasks 1–5 的全部文件。
- Produces: 可被仓库发现、可通过静态检查、模板语法正确的 Skill。

- [ ] **Step 1: 执行全量检查**

运行：

```bash
python3 ~/.codex/skills/.system/skill-creator/scripts/quick_validate.py \
  skills/codex-app-extension
node --check skills/codex-app-extension/templates/codex-injector.mjs
node --check skills/codex-app-extension/templates/codex-userscript.js
node --check skills/codex-app-extension/templates/app-server-client.mjs
python3 -m json.tool .claude-plugin/marketplace.json >/dev/null
python3 skills/codex-plugin-marketplaces/scripts/audit_marketplace.py .
git diff --check
```

预期：所有命令退出码为 0；没有 whitespace、frontmatter、JSON、路径或模板语法错误。

- [ ] **Step 2: 做最终范围审查**

运行：

```bash
git status --short
git diff --stat
git diff -- README.md .claude-plugin/marketplace.json
```

确认：只包含设计批准的 Skill、模板、reference、README 和 Claude marketplace 变更；没有真实凭据、无关重构、Codex App 启动或产品构建产物。

- [ ] **Step 3: 创建交付检查点**

在用户确认后提交一个独立 checkpoint，提交信息使用：

```text
feat(skills): add codex app extension development skill
```

若用户不要求提交，则保留工作树改动并在交付摘要中列出所有变更文件和验证结果。

## 依赖和风险

- Codex App Server 的 RPC 方法和页面 DOM 可能随 App 版本变化，因此 reference 和模板必须标注“按当前版本重新发现协议”，不能承诺永久兼容。
- 真实 App 调试端点、Browser ID 和 target ID 只能在用户明确授权的本机进程上验证；本计划不自动启动或附着真实 App。
- Skill 被安装或更新后，必须区分源码、marketplace/cache 和新线程加载状态；必要时提示重新安装并开启新线程。

## 计划完成标准

- 目录结构与设计文档一致；
- `SKILL.md`、四个 reference 和三个模板全部存在；
- README 和 `.claude-plugin/marketplace.json` 已同步；
- 所有静态验证命令通过；
- 没有执行超出本计划范围的 App 启动、真实 CDP 连接或完整构建。
