# Codex as an MCP Server

Run Codex itself as a Model Context Protocol (MCP) server so other MCP clients
(for example OpenAI Agents SDK agents) can invoke it.

This is **Codex exposed as MCP**, not “configure third-party MCP servers inside
Codex.” For OpenCode’s MCP client config, see `../opencode/mcp.md`.

## Start the server

```bash
codex mcp-server
```

Inspect with MCP Inspector:

```bash
npx @modelcontextprotocol/inspector codex mcp-server
```

Requires Node.js 18+ for the inspector. The server process stays alive so
clients can make multiple turns.

## Tools

`tools/list` exposes two tools:

### `codex` — start a session

| Property | Type | Description |
|---|---|---|
| `prompt` (required) | string | Initial user prompt |
| `approval-policy` | string | Shell approval: `untrusted`, `on-request`, `never` |
| `base-instructions` | string | Replace default instructions |
| `compact-prompt` | string | Prompt used when compacting |
| `config` | object | Overrides for `$CODEX_HOME/config.toml` |
| `cwd` | string | Working directory; relative paths resolve against the server process cwd |
| `developer-instructions` | string | Injected as a developer-role message |
| `model` | string | Model override (for example `gpt-5.4`) |
| `sandbox` | string | `read-only`, `workspace-write`, or `danger-full-access` |

### `codex-reply` — continue a session

| Property | Type | Description |
|---|---|---|
| `prompt` (required) | string | Next user prompt |
| `threadId` (required) | string | Thread to continue |
| `conversationId` | string | **Deprecated** alias for `threadId` |

Use `threadId` from `structuredContent.threadId` in the previous `tools/call`
response. Approval prompts (exec/patch) also include `threadId` in params.

### Example response

```json
{
  "structuredContent": {
    "threadId": "019bbb20-bff6-7130-83aa-bf45ab33250e",
    "content": "`ls -lah` — long listing, includes dotfiles, human-readable sizes."
  },
  "content": [
    {
      "type": "text",
      "text": "`ls -lah` — long listing, includes dotfiles, human-readable sizes."
    }
  ]
}
```

Modern MCP clients typically use `structuredContent` when present. Codex also
returns `content` for older clients.

## Multi-agent workflows (Agents SDK)

Codex MCP + the OpenAI Agents SDK can drive deterministic, reviewable multi-agent
pipelines (single agent or full delivery team).

### Prerequisites

- Codex CLI installed (`codex` on PATH)
- Python 3.10+ with pip
- Node.js 18+ if using MCP Inspector
- OpenAI API key

```bash
mkdir codex-workflows
cd codex-workflows
printf "OPENAI_API_KEY=sk-..." > .env

python -m venv .venv
source .venv/bin/activate
pip install --upgrade openai openai-agents python-dotenv
```

### Minimal MCP server host

```python
import asyncio
from agents import Agent, Runner
from agents.mcp import MCPServerStdio

async def main() -> None:
    async with MCPServerStdio(
        name="Codex CLI",
        params={
            "command": "codex",
            "args": ["mcp-server"],
        },
        client_session_timeout_seconds=360000,
    ) as codex_mcp_server:
        print("Codex MCP server started.")

if __name__ == "__main__":
    asyncio.run(main())
```

### Single-agent pattern

Two Agents SDK agents; only the implementer needs Codex MCP:

- Designer: writes a brief and hands off
- Developer: calls Codex MCP with safe write defaults

Critical instruction for implementers that write files via Codex:

```text
Always call codex with "approval-policy": "never" and "sandbox": "workspace-write".
```

Use `MCPServerStdio` with `args: ["mcp-server"]` and attach
`mcp_servers=[codex_mcp_server]` on agents that must edit the workspace.

### Multi-agent pattern

Typical roles:

- Project Manager — requirements, gating handoffs, verification of deliverable files
- Designer / Frontend / Backend / Tester — scoped folders and hand back to PM

Practices that keep workflows reliable:

1. Write shared truth files first (`REQUIREMENTS.md`, `AGENT_TASKS.md`, `TEST.md`).
2. Gate handoffs on file existence, not status chat.
3. Scope each role to a directory and explicit filenames.
4. Prefer `approval-policy: never` + `sandbox: workspace-write` only in trusted local workspaces.
5. Cap turns (`max_turns`) on the top-level runner.
6. Use Agents SDK handoffs (`handoffs=[...]`) and recommended handoff prompt prefixes when available.

### Traces

Agents SDK / platform traces capture prompts, tool calls, and handoffs. After a
run, inspect the Traces dashboard for timeline, Codex MCP calls, and durations.

## Safety notes

- `danger-full-access` and `approval-policy: never` are powerful; use only in
  isolated, trusted workspaces.
- Prefer `workspace-write` over full access for demo workflows.
- Keep long-running MCP server timeouts high enough for multi-turn coding
  (`client_session_timeout_seconds` in the SDK example is intentionally large).
- Do not embed API keys in agent instructions; use env / `.env`.

## Checklist

1. `codex` is installed and authenticated for the intended model access path.
2. Start or host `codex mcp-server` (CLI, Inspector, or `MCPServerStdio`).
3. Call `codex` with a clear prompt + sandbox/approval overrides as needed.
4. Continue with `codex-reply` using `structuredContent.threadId`.
5. For multi-agent: gate handoffs on artifacts; keep role scopes tight.
6. Review traces after complex runs.

## Related

- Codex subagents (in-CLI parallel agents): `subagents.md`
- Codex plugin packaging: `plugins.md`
- OpenCode as MCP **client**: `../opencode/mcp.md`
