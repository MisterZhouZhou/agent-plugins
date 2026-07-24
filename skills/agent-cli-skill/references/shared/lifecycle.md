# Shared Lifecycle And Multi-CLI Assets

Read this only for cross-CLI comparison, shared `bin/assets`, or multi-CLI plugins such as agent-notify.

## Event mapping

| Purpose | Claude Code | Codex | OpenCode |
|---|---|---|---|
| Turn / session completed | `Stop` | `Stop` | `session.idle` |
| Permission needed | `Notification` + matcher `permission_prompt` | `PermissionRequest` | `permission.updated` (1.18.x) and/or `permission.asked` (docs) |
| Permission answered | (n/a) | (n/a) | `permission.replied` |
| Pre-tool | `PreToolUse` | `PreToolUse` | `tool.execute.before` |
| Post-tool | `PostToolUse` | `PostToolUse` | `tool.execute.after` |
| Session error | (n/a) | (n/a) | `session.error` |

## Shared binary pattern

Keep side-effect logic in one executable:

```text
plugins/<name>/bin/<exec>
plugins/<name>/assets/
```

Adapters only translate CLI events into calls:

- Claude/Codex: hooks JSON command strings
- OpenCode: JS module calling the same binary

Payload sources the binary should accept:

1. stdin JSON (Claude/Codex hooks)
2. env JSON such as `AGENT_NOTIFY_PAYLOAD` (OpenCode Bun Shell)

Ignore unknown fields. Cap UI text. Do not echo secrets/`tool_input` onto lock-screen notifications.

### Shared payload contract

Use one tolerant logical schema across adapters, even though transport differs:

```json
{
  "source": "claude | codex | opencode",
  "event": "stop | permission | error",
  "cwd": "/absolute/project/path",
  "session_id": "optional",
  "request_id": "optional",
  "last_assistant_message": "optional completion text",
  "message": "optional user-safe notification text",
  "tool_name": "optional permission tool"
}
```

Rules:

- `source`, `event`, and `cwd` should be normalized by the adapter when possible.
- `session_id` / `request_id` support grouping and idempotency but remain optional.
- Completion uses `last_assistant_message`; permission uses `message` or
  `tool_name`; binaries must provide safe fallback text.
- Accept unknown fields and missing optional fields so CLI payload evolution does
  not break the shared binary.
- Never include raw tool input, credentials, or full logs in desktop UI.

## Plugin root variables

| CLI | Root variable |
|---|---|
| Claude Code | `${CLAUDE_PLUGIN_ROOT}` |
| Codex | `${PLUGIN_ROOT}` (also sets Claude alias for compat) |
| OpenCode | resolve from adapter file path / `AGENT_NOTIFY_ROOT` |

## Install models

| CLI | Primary install |
|---|---|
| Claude Code | marketplace + `.claude-plugin/plugin.json` |
| Codex | marketplace + `.codex-plugin/plugin.json` + hook trust |
| OpenCode | plugin dir symlink / `plugin[]` / `opencode plugin` |

Reload:

- Claude: `/reload-plugins`
- Codex: restart session after trust
- OpenCode: full process restart

## Dual/triple plugin rules

1. Never one hooks JSON for Claude and Codex.
2. OpenCode is not a third hooks JSON; it is a JS adapter.
3. Shared assets live once under `assets/`.
4. Installers for OpenCode live at repo `scripts/`, not deep under plugin trees.
5. Disable legacy notifiers before claiming “exactly one toast”.

## agent-notify reference mapping

| Side | Adapter |
|---|---|
| Claude | `hooks/hooks.json` → `bin/agent-notify claude ...` |
| Codex | `hooks/codex-hooks.json` → `bin/agent-notify codex ...` |
| OpenCode | `opencode/agent-notify.js` → env payload + `bin/agent-notify opencode ...` |
| Install OpenCode | `scripts/install-opencode.sh` |
