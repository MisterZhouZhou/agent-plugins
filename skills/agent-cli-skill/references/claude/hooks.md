# Claude Code Hooks

## File

Default path: `plugins/<name>/hooks/hooks.json`

Claude loads this automatically. Keep **only** Claude events here.

## Important events

| Purpose | Event |
|---|---|
| Turn ended | `Stop` |
| Permission needed | `Notification` with matcher `permission_prompt` |
| Session start | `SessionStart` |
| Pre/post tool | `PreToolUse` / `PostToolUse` |
| Before compact | `PreCompact` |
| User prompt | `UserPromptSubmit` |
| Subagent start/stop | `SubagentStart` / `SubagentStop` |

Do not put Codex-only `PermissionRequest` in this file.

## Root variable

Use `${CLAUDE_PLUGIN_ROOT}` in Claude hook commands.

```json
{
  "type": "command",
  "command": "AGENT_NOTIFY_ICON_DIR=\"${CLAUDE_PLUGIN_ROOT}/assets\" python3 \"${CLAUDE_PLUGIN_ROOT}/bin/agent-notify\" claude stop",
  "timeout": 10
}
```

Bad patterns:

- bare `agent-notify` relying on PATH
- `./bin/...` relying on cwd
- unexpanded `~` inside JSON commands

## Semantics

- Notification-only hooks should exit 0 with no stdout.
- `Stop` may support `decision: "block"`; test before relying on it.
- No Claude-side hook-trust UI equivalent to Codex: installed plugin hooks run when the plugin is enabled.

## Local reload

- Dev: `claude --plugin-dir <path>`
- After edits: `/reload-plugins`
- Debug: `claude --plugin-dir <path> --debug`

## Payload hygiene

- Parse stdin JSON defensively; empty payload is possible.
- Ignore unknown fields.
- Cap message length for UI.
- Never surface secrets/`tool_input` on desktop notifications.
