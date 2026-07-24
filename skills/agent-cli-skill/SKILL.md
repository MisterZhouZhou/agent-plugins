---
name: agent-cli-skill
description: Use when authoring or debugging Claude Code, Codex, or OpenCode CLI integrations—plugins, hooks/events, marketplace packaging, Claude Code MCP clients/servers (HTTP/SSE/stdio/WebSocket, scopes, OAuth, plugin MCP, Tool Search), OpenCode JS plugins (session.idle, permission.updated/asked, Bun Shell), OpenCode custom tools, MCP, LSP, and ACP, Codex MCP server, SDK, app-server, subagents, skills packaging, agent-notify, or multi-CLI verification. Prefer this skill whenever the user mentions any of those CLI agent runtimes, even if they only name one of them.
---

# Agent CLI Skill

Route first. Load only the reference docs for the CLI the user is asking about.

## Hard rule

1. Classify the target CLI(s).
2. Read **only** the matching files under `references/`.
3. Do **not** open every reference by default.
4. Read `shared/*` only for cross-CLI comparison, shared `bin/assets`, or multi-CLI packaging.

## Router

| User intent | Read only |
|---|---|
| Claude plugin / marketplace / manifest | `references/claude/plugins.md` |
| Claude hooks / Stop / Notification | `references/claude/hooks.md` |
| Claude skills packaging inside a plugin | `references/claude/skills.md` |
| Claude MCP client/server (`claude mcp`, `.mcp.json`, OAuth, Tool Search) | `references/claude/mcp.md` |
| Codex plugin / marketplace / manifest | `references/codex/plugins.md` |
| Codex hooks / PermissionRequest / trust | `references/codex/hooks.md` |
| Codex skills packaging | `references/codex/skills.md` |
| Codex subagents / `.codex/agents` | `references/codex/subagents.md` |
| Codex as MCP server (`codex mcp-server`, Agents SDK) | `references/codex/mcp-server.md` |
| Codex SDK (`@openai/codex-sdk`, `openai-codex`) | `references/codex/sdk.md` |
| Codex app-server (JSON-RPC, VS Code, remote TUI) | `references/codex/app-server.md` |
| OpenCode plugin load paths / install | `references/opencode/plugins.md` |
| OpenCode events / Bun Shell / adapter | `references/opencode/events.md` |
| OpenCode installer script | `references/opencode/install.md` |
| OpenCode custom tools (`.opencode/tools`) | `references/opencode/tools.md` |
| OpenCode ACP / editor embed (`opencode acp`, Zed, JetBrains, nvim) | `references/opencode/acp.md` |
| OpenCode MCP servers (local/remote, OAuth, tools globs) | `references/opencode/mcp.md` |
| OpenCode LSP servers (diagnostics, enable/disable, custom LSP) | `references/opencode/lsp.md` |
| Event mapping across CLIs / shared assets / agent-notify multi-CLI | `references/shared/lifecycle.md` |
| How to verify / test | `references/shared/testing.md` (+ the target CLI file if needed) |

If intent is ambiguous, ask one clarifying question **or** read only `shared/lifecycle.md`. Do not preload all three CLI trees.

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
| session.idle / permission.updated / Bun | OpenCode events |
| `.opencode/tools` / custom tool / `tool()` | OpenCode tools |
| ACP / `opencode acp` / Zed agent_servers | OpenCode ACP |
| MCP / `opencode mcp` / context7 / remote MCP | OpenCode MCP |
| LSP / language server / pyright / gopls | OpenCode LSP |
| marketplace / plugin.json | Claude or Codex plugins |
| agents.toml / subagent / developer_instructions | Codex subagents |
| `codex mcp-server` / codex-reply / Agents SDK MCP | Codex MCP server |
| `@openai/codex-sdk` / `openai-codex` / resumeThread | Codex SDK |
| `codex app-server` / thread/start / turn/start | Codex app-server |
| agent-notify | shared lifecycle + each targeted CLI |
