---
name: agent-cli-skill
description: Use when authoring or debugging Claude Code, Codex, OpenCode, or Pi Agent CLI integrations—plugins, hooks/events, marketplace packaging, MCP, subagents/agents, skills, Claude Agent SDK, Codex SDK/GitHub Action/app-server, OpenCode SDK/server/plugins/tools/LSP/ACP/models/permissions, Pi providers/models/extensions/packages/sessions, agent-notify, or multi-CLI verification. For bare "subagent(s)" / "创建 subagent" with no CLI named, load all three subagent refs (claude+codex+opencode); only narrow to one CLI when the user names Claude/Codex/OpenCode/Pi. Prefer this skill over single-CLI config skills for cross-CLI agent questions.
---

# Agent CLI Skill

Route first. Prefer the smallest reference set that answers the question.
**Exception:** bare “subagents / agents” with no CLI named → load **all three** subagent refs.

## Hard rule

1. Classify the target CLI(s). If the user names Claude / Codex / OpenCode / Pi (or clear path/keyword signals), lock to that CLI.
2. Read **only** the matching files under `references/` — except the subagent multi-load rule below.
3. Do **not** open every reference by default.
4. Read `shared/*` only for cross-CLI comparison, shared `bin/assets`, or multi-CLI packaging.

## Subagents routing (priority)

| User says | Read |
|---|---|
| Claude Agent SDK TypeScript / `@anthropic-ai/claude-agent-sdk` / TypeScript `Options.agents` | **only** `references/claude/agent-sdk-typescript.md` |
| Claude Agent SDK Python / `claude_agent_sdk` / `ClaudeSDKClient` / Python `ClaudeAgentOptions.agents` | **only** `references/claude/agent-sdk-python.md` |
| Claude Agent SDK general / language not specified / programmatic subagents / `parent_tool_use_id` | **only** `references/claude/agent-sdk.md` |
| Claude / Claude Code / `.claude/agents` / Agent tool / `/subtask` | **only** `references/claude/subagents.md` |
| Codex / `.codex/agents` / `agents.toml` / `developer_instructions` | **only** `references/codex/subagents.md` |
| OpenCode / `.opencode/agent` / `opencode agent` / mode:subagent | **only** `references/opencode/subagents.md` |
| Pi / Pi Agent / `.pi/agents` / Pi subagent / package-provided subagent | **only** `references/pi/subagents.md` |
| Two or three CLIs named | the matching subagent files for each named CLI |
| Bare `subagent(s)` / `如何创建 subagent` / no CLI named | **all three**: `claude/subagents.md` + `codex/subagents.md` + `opencode/subagents.md` |

When loading all three, answer with a short comparison (paths, format, mode) then per-CLI details. Do **not** fall back to `customize-opencode` or any single-CLI built-in for bare subagent questions. Do not add Pi to the bare-subagent three-way load unless the user explicitly asks for Pi or a four-CLI comparison.

## Router

| User intent | Read only |
|---|---|
| Claude plugin / marketplace / manifest | `references/claude/plugins.md` |
| Claude hooks / Stop / Notification | `references/claude/hooks.md` |
| Claude skills packaging inside a plugin | `references/claude/skills.md` |
| Claude MCP client/server (`claude mcp`, `.mcp.json`, OAuth, Tool Search) | `references/claude/mcp.md` |
| Claude subagents (CLI named) | `references/claude/subagents.md` |
| Claude Agent SDK overview/common concepts (language comparison, built-in tools, sessions, hooks, SDK subagents/MCP) | `references/claude/agent-sdk.md` |
| Claude Agent SDK Python API (`ClaudeAgentOptions`, `ClaudeSDKClient`, messages, custom tools, hooks, sandbox) | `references/claude/agent-sdk-python.md` |
| Claude Agent SDK TypeScript API (`Options`, `Query`, messages, custom tools, sessions, sandbox) | `references/claude/agent-sdk-typescript.md` |
| Codex plugin / marketplace / manifest | `references/codex/plugins.md` |
| Codex hooks / PermissionRequest / trust | `references/codex/hooks.md` |
| Codex skills packaging | `references/codex/skills.md` |
| Codex subagents (CLI named) | `references/codex/subagents.md` |
| Codex as MCP server (`codex mcp-server`, Agents SDK) | `references/codex/mcp-server.md` |
| Codex SDK (TypeScript/Python, `@openai/codex-sdk`, `openai-codex`, threads, sandbox) | `references/codex/sdk.md` |
| Codex GitHub Action / CI (`openai/codex-action@v1`, PR review, permission profile, safety strategy) | `references/codex/github-action.md` |
| Codex app-server (JSON-RPC, VS Code, remote TUI) | `references/codex/app-server.md` |
| OpenCode plugin load paths / install | `references/opencode/plugins.md` |
| OpenCode events / Bun Shell / adapter | `references/opencode/events.md` |
| OpenCode conversation content / history / notification text | `references/opencode/conversation.md` |
| OpenCode JS/TS SDK (`@opencode-ai/sdk`, server/client, sessions, structured output) | `references/opencode/sdk.md` |
| OpenCode HTTP server (`opencode serve`, OpenAPI `/doc`, REST/SSE, TUI control) | `references/opencode/server.md` |
| OpenCode installer script | `references/opencode/install.md` |
| OpenCode custom tools (`.opencode/tools`) | `references/opencode/tools.md` |
| OpenCode agent skills / `SKILL.md` discovery / skill permissions | `references/opencode/skills.md` |
| OpenCode providers / models / variants / reasoning options / `/models` / relay 403 / Responses API / User-Agent | `references/opencode/models.md` |
| OpenCode permissions / approvals / `--auto` / `external_directory` / `doom_loop` | `references/opencode/permissions.md` |
| OpenCode subagents / agents (CLI named) | `references/opencode/subagents.md` |
| OpenCode per-agent permissions | `references/opencode/subagents.md` + `references/opencode/permissions.md` |
| OpenCode ACP / editor embed (`opencode acp`, Zed, JetBrains, nvim) | `references/opencode/acp.md` |
| OpenCode MCP servers (local/remote, OAuth, tools globs) | `references/opencode/mcp.md` |
| OpenCode LSP servers (diagnostics, enable/disable, custom LSP) | `references/opencode/lsp.md` |
| Pi CLI / install / startup / run modes / flags | `references/pi/cli.md` |
| Pi provider / model / `models.json` / `settings.json` / OpenRouter / API contract or 404 | `references/pi/providers.md` |
| Pi Package / extension / `package.json#pi` / `pi install` / `pi -e` | `references/pi/extensions.md` |
| Pi skills / prompt templates / `AGENTS.md` / project resources | `references/pi/skills.md` |
| Pi subagents / `.pi/agents` / single / parallel / chain | `references/pi/subagents.md` |
| Pi MCP / external tools / MCP extension boundary | `references/pi/mcp.md` |
| Pi sessions / resume / JSON / RPC / logs | `references/pi/sessions.md` |
| Pi SAFE / YOLO / project trust / approvals / permissions | `references/pi/permissions.md` |
| Pi troubleshooting / verification / endpoint diagnosis / completion criteria | `references/pi/testing.md` |
| Event mapping across CLIs / shared assets / agent-notify multi-CLI | `references/shared/lifecycle.md` |
| How to verify / test | `references/shared/testing.md` (+ the target CLI file if needed) |

If intent is ambiguous **and not a subagent question**, ask one clarifying question **or** read only `shared/lifecycle.md`. Do not preload all three CLI trees for non-subagent topics.

## Core principles

- **Claude + Codex packaging:** one plugin root, two manifests, two hooks JSON files, two marketplace entries. Never one hooks file for both.
- **OpenCode:** JS/TS module returns hooks. No `.opencode-plugin` manifest. First install is path/config registration.
- **Shared logic:** keep behavior in `bin/` + `assets/`; each CLI gets a thin adapter (hooks JSON or OpenCode JS).

## Safety boundary

May proceed without confirmation:

- Read sources, manifests, marketplace files, caches, logs.
- Edit files inside the user-selected plugin repository.
- Static validation and dry-runs.

Require exact commands + confirmation before:

- Claude/Codex marketplace install/remove.
- Writing `~/.opencode/plugins/`, `~/.config/opencode/plugins/`, or user `opencode.json`.
- Disabling legacy OpenCode plugins.
- Editing `~/.claude/settings.json`, `~/.codex/config.toml`, `~/.codex/hooks.json`, or plugin caches.

Never merge Claude and Codex hooks into one file. Never delete user OpenCode plugins without an explicit backup/disable step.

## Multi-CLI plugin scaffold

When building a notifier-style plugin for more than one CLI:

```text
plugins/<name>/
├── .claude-plugin/plugin.json
├── .codex-plugin/plugin.json
├── hooks/
│   ├── hooks.json                 # Claude only
│   └── codex-hooks.json           # Codex only
├── opencode/
│   └── <name>.js                  # OpenCode adapter only
├── bin/<shared>
└── assets/

scripts/install-opencode.sh        # shallow path at repo root
```

Then read only the CLI-specific files for the side you are implementing.

## Workflow

1. State target CLI(s) and plugin identity (root, name, distribution).
2. Read the routed reference file(s).
3. Implement the smallest change for that CLI.
4. Validate with `shared/testing.md` layers for that CLI.
5. If touching global install state, show commands and wait for confirmation.
6. Report files changed, validation, and remaining manual steps (restart/trust).

## Ambiguous keywords

| Keyword | Prefer |
|---|---|
| hook / Stop / PermissionRequest | Claude or Codex hooks file (ask if unclear) |
| `claude mcp` / `.mcp.json` / Tool Search / Claude connectors | Claude MCP |
| `.claude/agents` / Agent tool / `/subtask` / Explore agent | Claude subagents only |
| `claude_agent_sdk` / `ClaudeAgentOptions` / `ClaudeSDKClient` / `create_sdk_mcp_server` / `allowed_tools` / `setting_sources` / `strict_mcp_config` | Claude Agent SDK Python |
| `@anthropic-ai/claude-agent-sdk` / `startup()` / `WarmQuery` / `createSdkMcpServer` / `resolveSettings` / `applyFlagSettings` / `SDKMessage` / `SandboxSettings` / `pathToClaudeCodeExecutable` | Claude Agent SDK TypeScript |
| session.idle / permission.updated / Bun | OpenCode events |
| `.opencode/tools` / custom tool / `tool()` | OpenCode tools |
| `@opencode-ai/sdk` / `createOpencode` / `createOpencodeClient` / `session.prompt` / structured output | OpenCode SDK |
| `opencode serve` / `--cors` / `OPENCODE_SERVER_PASSWORD` / `/doc` / REST / SSE / `/tui/control` | OpenCode server |
| `.opencode/skills` / `.agents/skills` / `SKILL.md` / `skill({ name })` / skill permissions | OpenCode skills |
| `/models` / `/connect` / provider/model / variants / `reasoningEffort` / relay / `/responses` / `/chat/completions` / 403 / User-Agent | OpenCode models |
| `permission` / `--auto` / auto-approve / allow-ask-deny / `external_directory` / `doom_loop` | OpenCode permissions |
| `.opencode/agent` / `mode: subagent` / `opencode agent` | OpenCode subagents only |
| ACP / `opencode acp` / Zed agent_servers | OpenCode ACP |
| MCP / `opencode mcp` / context7 / remote MCP | OpenCode MCP |
| LSP / language server / pyright / gopls | OpenCode LSP |
| marketplace / plugin.json | Claude or Codex plugins |
| agents.toml / `.codex/agents` / developer_instructions | Codex subagents only |
| bare `subagent` / `subagents` / 创建 subagent (no CLI named) | **all three** subagent refs (see Subagents routing) |
| `codex mcp-server` / codex-reply / Agents SDK MCP | Codex MCP server |
| `@openai/codex-sdk` / `openai-codex` / `resumeThread` / `AsyncCodex` / `CodexConfig` / `Sandbox.workspace_write` / `final_response` | Codex SDK |
| `openai/codex-action` / `codex-action@v1` / `safety-strategy` / `permission-profile` / `final-message` / `allow-users` / `allow-bots` / `allow-bot-users` | Codex GitHub Action |
| `codex app-server` / thread/start / turn/start | Codex app-server |
| `pi` / `pi install` / `pi -e` / `~/.pi/agent` / `.pi/` | Pi CLI and resources |
| `models.json` / `settings.json` with Pi context | Pi providers/models |
| `openai-completions` / `openai-responses` / `anthropic-messages` / `google-generative-ai` with Pi context | Pi providers/models |
| `.pi/agents` / Pi Agent roles / single / parallel / chain | Pi subagents |
| Pi SDK / `createAgentSession` / `SessionManager` / `ResourceLoader` | Pi CLI and sessions |

| agent-notify | shared lifecycle + each targeted CLI |
