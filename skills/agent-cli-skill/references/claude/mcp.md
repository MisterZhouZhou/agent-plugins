# Claude Code MCP

Claude Code can connect to external tools, databases, APIs, resources, and
event channels through the Model Context Protocol (MCP).

Before researching version-sensitive Claude Code behavior, fetch the official
documentation index and discover the relevant page from it:

```text
https://code.claude.com/docs/llms.txt
```

Treat server code and external content as untrusted. MCP servers can expose
prompt-injection risks and powerful side effects.

## Select The Transport

| Transport | Use when | Support notes |
|---|---|---|
| HTTP | Remote cloud server | Recommended; supports OAuth |
| SSE | Legacy remote server | Deprecated; prefer HTTP |
| stdio | Local process or custom script | Direct machine/project access |
| WebSocket | Remote server pushes unsolicited events | Persistent bidirectional; header auth only, no OAuth |

### Remote HTTP

```bash
claude mcp add --transport http notion https://mcp.notion.com/mcp

claude mcp add --transport http secure-api https://api.example.com/mcp \
  --header "Authorization: Bearer your-token"
```

In JSON config, `streamable-http` is accepted as an alias for `http`. A remote
entry with `url` but no `type` is invalid because it is interpreted as stdio.

### Remote SSE (deprecated)

```bash
claude mcp add --transport sse asana https://mcp.asana.com/sse
```

### Local stdio

```bash
claude mcp add --env AIRTABLE_API_KEY=YOUR_KEY \
  --transport stdio airtable -- npx -y airtable-mcp-server
```

The `--` separator is required: options before it belong to Claude; everything
after it is the server command and arguments.

Claude sets `CLAUDE_PROJECT_DIR` in the spawned server environment. It is the
stable launch project root. Servers that need the full granted directory set
should implement MCP `roots/list`; Claude also sends
`notifications/roots/list_changed` when that set changes.

For non-plugin JSON entries, use a fallback if expanding the project variable:

```text
${CLAUDE_PROJECT_DIR:-.}
```

Plugin-provided MCP config can substitute `${CLAUDE_PROJECT_DIR}` directly.

### Remote WebSocket

```bash
claude mcp add-json events-server \
  '{"type":"ws","url":"wss://mcp.example.com/socket","headers":{"Authorization":"Bearer YOUR_TOKEN"}}'
```

WebSocket supports `url`, `headers`, `headersHelper`, `timeout`, and
`alwaysLoad`. Use HTTP if the server does not need to push events.

## Manage Servers

```bash
claude mcp list
claude mcp get <name>
claude mcp remove <name>
claude mcp login <name>
claude mcp logout <name>
```

Inside Claude Code:

```text
/mcp
```

`/mcp` shows connection state, auth state, tool counts, plugin origin, and
servers that expose a tools capability but no tools.

Reserved built-in server names include `workspace`, `claude-in-chrome`,
`computer-use`, `Claude Preview`, and `Claude Browser`. Rename custom servers
that collide with them.

## Installation Scopes

| Scope | Loads in | Shared | Stored in |
|---|---|---|---|
| `local` (default) | Current project | No | Project entry inside `~/.claude.json` |
| `project` | Current project | Yes | Project-root `.mcp.json` |
| `user` | All projects | No | `~/.claude.json` |

Examples:

```bash
claude mcp add --transport http stripe --scope local https://mcp.stripe.com
claude mcp add --transport http paypal --scope project https://mcp.paypal.com/mcp
claude mcp add --transport http hubspot --scope user https://mcp.hubspot.com/anthropic
```

Project `.mcp.json` servers require interactive workspace trust and approval.
A cloned repository cannot approve its own MCP servers using checked-in
settings before the workspace is trusted.

### Precedence

When duplicate names/endpoints exist, Claude uses one complete definition;
fields are not merged. Precedence:

1. Local scope
2. Project scope
3. User scope
4. Plugin-provided servers
5. claude.ai connectors

## `.mcp.json` Environment Expansion

Supported syntax:

- `${VAR}`
- `${VAR:-default}`

Expansion applies to `command`, `args`, `env`, `url`, and `headers`.

```json
{
  "mcpServers": {
    "api-server": {
      "type": "http",
      "url": "${API_BASE_URL:-https://api.example.com}/mcp",
      "headers": {
        "Authorization": "Bearer ${API_KEY}"
      }
    }
  }
}
```

An unset variable without a default produces a warning and remains unexpanded.

### Team-safe project stdio example

For a project-shared local server, commit only variable references, never the
real secret:

```json
{
  "mcpServers": {
    "project-tools": {
      "type": "stdio",
      "command": "node",
      "args": ["${CLAUDE_PROJECT_DIR:-.}/tools/mcp-server.js"],
      "env": {
        "PROJECT_API_KEY": "${PROJECT_API_KEY}"
      }
    }
  }
}
```

Store this as project-root `.mcp.json`, commit it, and distribute
`PROJECT_API_KEY` through each developer's shell/keychain/secret manager. Verify
the generated file before committing; do not assume a CLI `--env` argument will
preserve a literal `${...}` through every shell and CLI version.

```bash
export PROJECT_API_KEY="..."
claude mcp get project-tools
claude mcp list
```

If the variable is absent, Claude reports a warning and leaves the placeholder
unexpanded; the child process receives that unintended literal value if it is
still launched, so the server should also reject missing/placeholder credentials.

## OAuth And Dynamic Authentication

HTTP servers support OAuth. Claude marks a server as needing authentication on
401/403 and can refresh/retry stored credentials.

```bash
claude mcp login sentry
claude mcp login sentry --no-browser
claude mcp logout sentry
```

Use `--no-browser` for SSH/headless flows; paste the full redirect URL back into
the interactive prompt. Use `--callback-port` when the provider requires a
pre-registered `http://localhost:PORT/callback` URI.

Preconfigured OAuth example:

```bash
claude mcp add --transport http \
  --client-id your-client-id --client-secret --callback-port 8080 \
  my-server https://mcp.example.com/mcp
```

Client secrets are stored outside config (keychain/credentials store). OAuth
credentials apply only to HTTP/SSE, not stdio.

JSON OAuth options include:

- `clientId`
- `callbackPort`
- `authServerMetadataUrl` (must use HTTPS)
- `scopes` (space-separated pinned scopes)

Pin `oauth.scopes` when security policy requires a reviewed subset.

### Dynamic Headers

For Kerberos, short-lived tokens, or internal SSO, configure `headersHelper`:

```json
{
  "mcpServers": {
    "internal-api": {
      "type": "http",
      "url": "https://mcp.internal.example.com",
      "headersHelper": "/opt/bin/get-mcp-auth-headers.sh"
    }
  }
}
```

The command must emit a JSON string-to-string header object. It runs with a
10-second timeout on every connection/reconnect; dynamic headers override
matching static headers.

Available helper env includes `CLAUDE_CODE_MCP_SERVER_NAME`,
`CLAUDE_CODE_MCP_SERVER_URL`, and plugin-only `CLAUDE_PLUGIN_ROOT`.

`headersHelper` executes arbitrary shell code. Project/local helpers run only
after workspace trust.

## Plugin-Provided MCP Servers

Plugins may bundle servers in root `.mcp.json` or inline `plugin.json`.

```json
{
  "mcpServers": {
    "database-tools": {
      "command": "${CLAUDE_PLUGIN_ROOT}/servers/db-server",
      "args": ["--config", "${CLAUDE_PLUGIN_ROOT}/config.json"],
      "env": { "DB_URL": "${DB_URL}" }
    }
  }
}
```

Plugin placeholders:

- `${CLAUDE_PLUGIN_ROOT}` — installed plugin root
- `${CLAUDE_PLUGIN_DATA}` — persistent plugin state
- `${CLAUDE_PROJECT_DIR}` — stable project root

Plugin servers start with enabled plugins and connect/disconnect after
`/reload-plugins`. Users manage their lifecycle through plugin installation,
not `claude mcp remove`.

Plugin tool callable names are scoped:

```text
mcp__plugin_<plugin-name>_<server-name>__<tool-name>
```

Use the full name in permissions, skill `allowed-tools`, subagent tools, and hook
matchers. The configured server name is:

```text
plugin:<plugin-name>:<server-name>
```

## Reliability And Dynamic Updates

- MCP `list_changed` refreshes tools/prompts/resources without reconnecting.
- Failed refresh preserves the last successful capability list.
- HTTP/SSE reconnect with exponential backoff; stdio does not auto-reconnect.
- Transient startup/discovery failures retry; auth/4xx failures require config or login.
- Failed-server details are visible to Claude when Tool Search is active.

MCP servers may also declare `claude/channel` and push external events into a
session when Claude starts with the required channels opt-in.

## Timeouts And Backgrounding

Key controls:

| Control | Purpose |
|---|---|
| `MCP_TIMEOUT` | Server startup timeout |
| per-server `timeout` | Hard wall-clock tool-call limit in ms |
| `MCP_TOOL_TIMEOUT` | Default tool-call limit |
| `CLAUDE_CODE_MCP_TOOL_IDLE_TIMEOUT` | No-response/progress idle window; `0` disables |
| `CLAUDE_CODE_MCP_AUTO_BACKGROUND_MS` | Main-conversation background threshold; `0` disables |
| `CLAUDE_CODE_DISABLE_BACKGROUND_TASKS=1` | Disable all background tasks |

Per-server timeout is not extended by progress notifications. Main-conversation
MCP calls may move to `/tasks` after two minutes; subagent calls do not.

## Tool Search And Context Cost

Tool Search is enabled by default on supported models. It defers MCP schemas and
loads only relevant tools, reducing context usage.

```bash
ENABLE_TOOL_SEARCH=true claude
ENABLE_TOOL_SEARCH=auto:5 claude
ENABLE_TOOL_SEARCH=false claude
```

| Value | Behavior |
|---|---|
| unset | Defer tools where supported; platform/proxy fallbacks may load upfront |
| `true` | Force all MCP tools deferred |
| `auto` / `auto:N` | Load upfront below threshold, defer overflow |
| `false` | Load all schemas upfront |

Set server `alwaysLoad: true` only for small tool sets needed every turn. A tool
may set `_meta["anthropic/alwaysLoad"]: true` individually.

Server instructions and tool descriptions are truncated around 2 KB each; put
critical discovery guidance first.

## Output Limits And Tool Metadata

- Warning above 10,000 output tokens
- Default max around 25,000 tokens
- Raise globally with `MAX_MCP_OUTPUT_TOKENS`
- A server tool may set `_meta["anthropic/maxResultSizeChars"]` (up to 500,000
  chars for text) to raise its persist-to-disk threshold

For tools that require a human on every invocation:

```json
{
  "name": "grant_access",
  "_meta": {
    "anthropic/requiresUserInteraction": true
  }
}
```

This forces a full permission prompt even in permissive modes; `dontAsk` denies
instead. Use for consent/access-grant flows, not ordinary tools.

Claude Code can flatten root-level `anyOf`/`oneOf`/`allOf` tool input schemas
for API compatibility, but servers must still validate argument combinations.

## Resources, Prompts, And Elicitation

Resources are referenced with `@`:

```text
@github:issue://123
@docs:file://api/authentication
```

MCP prompts become slash commands:

```text
/mcp__github__list_prs
/mcp__github__pr_review 456
```

Servers can request structured user input through elicitation:

- Form mode — interactive fields
- URL mode — browser auth/approval flow

Use the `Elicitation` hook only when intentionally automating responses.

## claude.ai Connectors

With a claude.ai subscription login, configured connectors can appear
automatically in `/mcp`. They do not load when API-key/third-party auth is the
active method.

Disable local connector loading:

```json
{ "disableClaudeAiConnectors": true }
```

or:

```bash
ENABLE_CLAUDEAI_MCP_SERVERS=false claude
```

Organization per-tool `ask`/`blocked` policies override ordinary local allow
rules. Manage cloud-session connector availability through organization settings.

## Claude Code As An MCP Server

Expose Claude Code tools to another MCP client:

```bash
claude mcp serve
```

Client config:

```json
{
  "mcpServers": {
    "claude-code": {
      "type": "stdio",
      "command": "claude",
      "args": ["mcp", "serve"],
      "env": {}
    }
  }
}
```

If `claude` is not on PATH, use `which claude` and configure the absolute path.
The MCP client remains responsible for per-tool confirmation UX.

## Security Checklist

1. Trust the server and review its data sources before connecting.
2. Prefer project scope only for team-safe, credential-free config.
3. Keep credentials in env/keychain, not committed `.mcp.json`.
4. Approve project MCP servers interactively after workspace trust.
5. Use least-privilege OAuth scopes and read-only database credentials.
6. Avoid `alwaysLoad` and oversized outputs unless necessary.
7. Review `headersHelper` as executable code.
8. Use `/mcp`, `claude mcp list`, and `claude mcp get` to verify real state.

## Related

- Claude plugin packaging: `plugins.md`
- Claude hooks, including MCP tool matchers: `hooks.md`
- Claude skills and allowed-tools: `skills.md`
- Codex as an MCP server: `../codex/mcp-server.md`
- OpenCode as an MCP client: `../opencode/mcp.md`
