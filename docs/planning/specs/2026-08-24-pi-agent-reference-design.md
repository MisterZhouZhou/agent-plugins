# Pi Agent Reference Design

**日期：** 2026-08-24  
**目标 Skill：** `skills/agent-cli-skill`  
**验证基线：** Pi `0.84.1`

## 背景

`agent-cli-skill` 当前覆盖 Claude Code、Codex 和 OpenCode，但没有 Pi Agent 的专题路由和参考资料。用户在配置 Pi 的 OpenRouter provider 时，因 `api` 类型与 OpenRouter 实际 endpoint 不匹配，触发了返回 OpenRouter HTML 404 页面的错误。现有 skill 无法直接指导以下问题：

- Pi CLI 的运行模式和配置入口。
- `models.json`、`settings.json` 的职责。
- provider 的 API 协议、路径和模型声明。
- Pi Package、extension、skill、prompt 和 Agent 资源。
- 子 Agent 编排、项目资源信任、操作审批和会话证据。
- 从网络连通到完整模型响应的分层验证。

本设计参考 Claude、Codex reference 的信息组织和证据要求，但只记录 Pi 已具备或可验证的机制，不将其他 CLI 的 marketplace、SDK、hook 或 sandbox 语义直接套用到 Pi。

## 目标

1. 让 `agent-cli-skill` 能识别 Pi Agent 请求，并按最小 reference 集路由。
2. 建立完整但模块化的 Pi Agent 参考资料。
3. 沉淀 OpenRouter 404 的可复用诊断方法，而不是只记录一次性修复。
4. 覆盖 CLI、provider、extension、skill、subagent、MCP、session、permission 和 testing。
5. 明确版本敏感性、密钥安全和验证完成边界。
6. 保持现有 Claude、Codex、OpenCode 的默认行为和路由不变。

## 非目标

- 不修改用户的 `~/.pi/agent` 配置。
- 不安装、卸载或发布 Pi Package。
- 不为 Pi 虚构官方 marketplace、插件 manifest、独立 Agent SDK 或 OS sandbox。
- 不把当前用户的 provider 名、模型 ID、内网地址或网络结果写成通用推荐。
- 不写入真实 API Key、session 正文、通知 payload 或其他凭据。
- 不以静态配置、HTTP 连通或被中止的请求代替端到端模型生成验证。

## 方案选择

采用模块化 Pi 专题，新增 `references/pi/`。不采用单一大文件，因为它会导致简单的 provider 问题加载全部 Pi 内容；不并入 `references/shared/`，因为 Pi 的配置、信任和 extension 语义不应被误写为跨 CLI 共性。

目标结构：

```text
skills/agent-cli-skill/references/pi/
├── cli.md
├── providers.md
├── extensions.md
├── skills.md
├── subagents.md
├── mcp.md
├── sessions.md
├── permissions.md
└── testing.md
```

## SKILL.md 路由设计

### Skill 描述

在 frontmatter `description` 中加入 Pi Agent，同时保留原有 Claude、Codex、OpenCode 触发范围。Pi 触发信号包括：

- `Pi Agent`、`pi.dev`、`pi install`、`pi -e`
- `~/.pi/agent`、`.pi/agents`、`.pi/extensions`
- Pi 的 provider、model、extension、skill、prompt、subagent、session、permission
- `openai-completions`、`openai-responses`、`anthropic-messages`、`google-generative-ai`

仅出现通用的 `models.json` 或 API endpoint 时，需要结合 `.pi` 路径、Pi 命令或上下文确认，避免误路由其他工具。

### Hard rule

将目标 CLI 分类扩展为 Claude、Codex、OpenCode、Pi。用户明确说 Pi 或提供清晰的 Pi 路径/命令时，只读取 Pi reference；跨 CLI 对比时才读取多个 CLI 的匹配专题。

### Router

| 用户意图 | 读取 |
|---|---|
| Pi 安装、启动、CLI 参数、运行模式 | `references/pi/cli.md` |
| provider、模型、OpenRouter、API 404 | `references/pi/providers.md` |
| Pi Package、extension 加载和发布边界 | `references/pi/extensions.md` |
| skills、prompts、`AGENTS.md`、项目资源 | `references/pi/skills.md` |
| `.pi/agents`、subagent、single/parallel/chain | `references/pi/subagents.md` |
| Pi MCP、外部工具 | `references/pi/mcp.md` |
| session、恢复、JSON/RPC、日志 | `references/pi/sessions.md` |
| SAFE、YOLO、确认、project trust | `references/pi/permissions.md` |
| Pi 故障排查、验证和回归检查 | `references/pi/testing.md` |

总体设计或跨专题问题先读取 `cli.md`，再按问题增加一到两个专题，不默认加载全部 Pi reference。

### Subagent 路由

用户明确说 Pi、`.pi/agents`、Pi subagent、single/parallel/chain 时，只读取 `references/pi/subagents.md`。用户只说通用 `subagent` 且没有指定 CLI 时，现有 Claude、Codex、OpenCode 三方加载规则保持不变，不把 Pi 自动加入，以避免改变既有约定；只有用户明确要求四 CLI 对比时才加入 Pi。

## Reference 设计

### `cli.md`

作为 Pi 专题入口，覆盖：

- Pi CLI 身份、版本检查和可执行文件发现。
- 交互模式、print/JSON/RPC 等运行模式的用途和边界。
- `--model`、`--tools`、`--no-session`、`--no-extensions`、`-e` 等常见参数。
- 用户级 `~/.pi/agent` 与项目级 `.pi` 的职责。
- 最小诊断顺序和到其他 Pi reference 的链接。
- 当前验证基线及版本敏感提示。

命令示例必须区分“已由本机安装包/项目证据确认”和“需要在目标版本现场执行确认”。

### `providers.md`

覆盖 `models.json`、`settings.json`、认证和模型能力声明。

最小脱敏示例：

```json
{
  "providers": {
    "my-provider": {
      "baseUrl": "https://example.invalid/v1",
      "apiKey": "$MY_API_KEY",
      "api": "openai-completions",
      "models": [
        { "id": "model-id" }
      ]
    }
  }
}
```

协议映射：

| `api` | 请求协议/典型路径 |
|---|---|
| `openai-completions` | OpenAI Chat Completions，`/chat/completions` |
| `openai-responses` | OpenAI Responses，`/responses` |
| `anthropic-messages` | Anthropic Messages，`/messages` |
| `google-generative-ai` | Google Generative AI 原生请求格式，不能套用 OpenAI path |

核心规则：

- `baseUrl` 是 API 根地址，不是供应商网页地址。
- `api` 决定 request contract 和 path，不能只根据模型厂商名称选择。
- provider 名、模型 ID、默认 provider/model 和 API 协议需要分别验证。
- `models.json` 声明 provider/model；`settings.json` 选择默认 provider/model、thinking level、packages 和 UI 设置。
- `contextWindow`、`reasoning`、`thinkingLevelMap` 是能力声明，不能证明服务端支持对应值。
- API Key 使用环境变量引用或 Pi 认证机制，示例中不出现真实密钥。

OpenRouter 案例记录为通用模式：当 `baseUrl` 为 `https://openrouter.ai/api/v1` 时，OpenAI Chat Completions 兼容调用应选 `openai-completions`，使请求落到 `/chat/completions`；选择 `anthropic-messages` 会使 Pi 请求 `/messages`，与该入口的实际 contract 不匹配。

### `extensions.md`

覆盖 Pi Package 和 extension：

- `package.json#pi` 显式声明 extension 资源。
- `pi install npm:<package>` 的安装模型。
- `pi -e <path>` 的临时开发加载。
- `--no-extensions` 的隔离验证用途。
- umbrella package 与独立 package 重复加载风险。
- extension 注册 flag、command、shortcut、tool 和 lifecycle event 的能力边界。
- package 的 `peerDependencies`、资源白名单和打包验证。
- 第三方 package 与 Pi 进程同权限运行的安全含义。

发布仅描述安全边界和验证清单，不执行 npm publish、release commit、tag 或 push。

### `skills.md`

区分以下资源：

- `AGENTS.md`：持久项目/用户指令。
- skills：按需加载的工作流或领域指导。
- prompts：可复用的提示模板。
- extensions：可执行 TypeScript/JavaScript 扩展。
- agents：供 subagent 扩展发现的角色定义。

覆盖用户级与项目级资源位置、发现原则、优先级验证方法、`enableSkillCommands` 等设置，以及 project trust 对项目 `.pi` 资源的影响。任何具体优先级只有在本机包源码、文档或运行证据支持时才写成确定结论。

### `subagents.md`

采用 Claude/Codex reference 的 mental model、继承、工具、记忆和完成报告结构，但记录 Pi 的实际实现：

- Agent 来源：内置、用户 `~/.pi/agent/agents/*.md`、项目最近的 `.pi/agents/*.md`。
- 同名优先级：`project > user > builtin`。
- `agentScope` 可限制来源。
- `agent + task` 为 single，`tasks[]` 为 parallel，`chain[]` 为 chain。
- chain 使用 `{previous}` 传递前一步文本。
- 子 Pi 继承父会话 cwd 和当前 provider/model。
- 子 Pi 采用无 session 的 JSON 模式，禁用其他 extension，并只加载必要 guard。
- 防止递归注册 subagent。
- SAFE 下可写任务需要父进程确认；无 UI 时 fail closed。
- 并行任务不能让多个 Agent 同时写同一文件。
- 推荐 explore、planner、worker、reviewer 的阶段化使用方式。

这些细节以当前本地 `@misterzhou/pi-subagent` 实现为证据，不能表述为所有 Pi 安装都默认内置该 subagent 能力。

### `mcp.md`

按 transport、发现、认证、生命周期、安全和验证组织：

- 区分 extension 直接注册的工具与 MCP server 提供的工具。
- 记录本地 stdio、远程 HTTP 等 transport 时，仅把当前 Pi 版本或扩展实际支持的格式写成确定结论。
- MCP 配置入口、动态更新和认证字段必须按 Pi 版本核对。
- MCP server 的进程权限、环境变量、网络访问和输出体积属于安全边界。
- MCP server 连通不代表模型 provider 连通，验证结果分开记录。

若当前本地资料无法确认 Pi 的原生 MCP 配置入口，文档应明确给出核查方法，而不是复制 Claude 的 `.mcp.json` 或 Codex 的 `config.toml`。

### `sessions.md`

覆盖：

- session 创建、恢复、无 session 模式和会话存储的职责。
- print、JSON、RPC 等非交互输出的使用场景。
- `settings.json`、session 数据、模型 API 日志和 extension 日志的区分。
- 诊断证据至少包含 cwd、provider/model、模式、退出码、stderr 尾部和关键事件。
- 子 Agent 父子进程的证据关联。
- 请求中止、超时和旧日志不能证明稳定根因。
- 日志、session 和通知正文中的凭据与个人信息必须脱敏。

### `permissions.md`

覆盖以下独立层次：

1. Project trust：是否信任项目 `.pi` 资源。
2. Extension policy：例如 SAFE/YOLO 对工具调用的确认。
3. Pi 进程权限：操作系统赋予进程的真实权限。
4. Provider/network 权限：外部 API、代理和网络访问。

已确认的本地扩展边界：

- SAFE/YOLO 是 extension 策略，不是 OS sandbox。
- project trust 不等于允许写文件或执行 Bash。
- 无 UI 时需要确认的操作应 fail closed。
- 灾难级 Bash 即使在 YOLO 下也应阻断。
- 某个 extension 的策略不能自动约束所有第三方 extension。
- `--approve` 若存在于具体流程，只表示相应项目资源信任，不自动代表工具操作批准。

### `testing.md`

建立由低成本到端到端的验证层：

1. 静态配置：JSON 解析、密钥扫描、provider/model 一致性。
2. 传输层：DNS、TCP、TLS、HTTP。
3. API contract：method、path、header、body schema。
4. 模型层：模型 ID、provider 返回和能力字段。
5. 最小生成：无工具、短 prompt、完整响应。
6. Extension：隔离加载、命令、工具和事件。
7. Subagent：single、parallel、chain、失败回传和权限。
8. Session：恢复、`--no-session`、JSON/RPC 事件。
9. 安全：SAFE、YOLO、无 UI fail-closed、灾难命令阻断。
10. 端到端：真实用户路径和完整响应。

404 诊断规则：

- API 根地址返回 HTML 只证明域名/网页路由可达，不证明 API contract 正确。
- `/models` 返回 JSON 可作为 API 根地址的 control endpoint，但不能单独证明生成 endpoint 可用。
- 生成 endpoint 返回 JSON 404 通常说明请求已到服务端，但 path、协议或模型路由需要继续核对。
- HTML 404 与 JSON 404 需要分别记录 status、content-type 和 response body 摘要。
- 用户中止、超时或只完成 HTTP 验证时，只能报告对应验证层完成。
- 只有最小生成请求收到完整有效响应后，才能宣称 provider 配置可用。

## 跨 CLI 概念映射

Pi reference 可以给出概念对照，但不能宣称实现兼容：

| 目标 | Pi | Claude/Codex 对应概念 |
|---|---|---|
| 持久指令 | `AGENTS.md` | Claude/Codex 指令文件 |
| 可复用指导 | skills/prompts | Skills、commands/prompts |
| 可执行扩展 | Pi extensions / Pi Package | plugins、hooks、MCP tools |
| 角色定义 | `.pi/agents/*.md` 配合 subagent extension | `.claude/agents`、`.codex/agents` |
| 模型接入 | `models.json` provider | CLI provider/model 配置 |
| 活动默认值 | `settings.json` | CLI settings/config |
| 项目资源门禁 | project trust | trust/approval 的相近概念 |

映射只帮助定位问题，不表示路径、schema、事件或权限语义可直接互换。

## 证据与版本策略

每篇 Pi reference 都应包含简短的版本说明：

- 当前验证基线是 Pi `0.84.1`。
- CLI 参数、配置字段、package 名称和 extension API 都可能随版本变化。
- `@earendil-works/pi-*` 是当前本地安装包的证据，不写成永久稳定命名。
- 本地源码/类型声明、`--help`、实际配置和可重复运行结果优先于记忆或推断。
- 未运行的示例明确标注需现场验证。
- 一次性网络结果只作为诊断示例，不作为供应商长期可用性结论。

证据等级：

1. 当前版本源码、类型声明或正式本地文档。
2. 当前版本 CLI 帮助和可重复运行结果。
3. 当前用户配置和项目实现。
4. 经验推断，仅可作为排查建议，不能写成已确认行为。

## 安全要求

- 所有 provider 示例使用占位域名、模型 ID 和环境变量。
- 不复制用户当前 `models.json` 的真实 Key、内网地址和临时模型清单。
- 如果凭据曾在聊天、终端输出或配置审查中暴露，建议撤销并重新生成。
- 文档命令默认只读；安装、卸载、发布和全局配置修改明确标出副作用。
- 第三方 extension/package 安装前审查源码、依赖、生命周期脚本和资源声明。

## 实施边界

本次实施只修改：

- `skills/agent-cli-skill/SKILL.md`
- `skills/agent-cli-skill/references/pi/*.md`

除非路由完整性确有需要，不修改现有 Claude、Codex、OpenCode 和 shared reference。不会修改用户全局 Pi 配置或 `pi-extensions` 仓库。

## 验证方案

1. 检查 `SKILL.md` frontmatter 和 Markdown 表格结构。
2. 检查所有 Router 目标文件存在。
3. 检查 Pi reference 内部链接和文件名一致。
4. 搜索真实 API Key、当前内网地址和用户私有模型清单，确保未写入。
5. 搜索未决占位标记和互相矛盾的版本陈述。
6. 抽样验证 Pi 命令、配置字段和 extension API 对应本地 `0.84.1` 证据。
7. 运行 `git diff --check`。
8. 审查 `git diff`，确认没有改变现有三 CLI 的默认路由语义。

## 验收标准

- Pi 请求可由 `SKILL.md` 路由到最小匹配 reference。
- 九个 Pi reference 边界清晰，包含适用版本、常见误区和验证清单。
- 内容覆盖 CLI、provider、extension、skill、subagent、MCP、session、permission 和 testing。
- OpenRouter 案例准确说明 `api` 与 endpoint contract 的关系。
- 不包含真实密钥、私有地址、临时模型清单或 session 正文。
- 不把 Pi extension 策略描述为 OS sandbox。
- 不把本地第三方 subagent extension 描述为 Pi 默认内置能力。
- 不把 HTTP 连通或中止请求描述为端到端成功。
- 现有 Claude、Codex、OpenCode 的默认路由保持不变。
- Markdown 静态检查和 `git diff --check` 通过。
