# Codex Hooks

## File

Path: `plugins/<name>/hooks/codex-hooks.json`

Referenced explicitly from `.codex-plugin/plugin.json`:

```json
"hooks": "./hooks/codex-hooks.json"
```

Keep **only** Codex events in this file. Do not reuse Claude’s `hooks/hooks.json`.

## Important events

| Purpose | Event |
|---|---|
| Turn ended | `Stop` |
| Permission needed | `PermissionRequest` |
| Session start | `SessionStart` |
| Pre/post tool | `PreToolUse` / `PostToolUse` |
| Compact | `PreCompact` / `PostCompact` |
| User prompt | `UserPromptSubmit` |
| Subagent start/stop | `SubagentStart` / `SubagentStop` |

Claude-only `Notification` does not belong here.

## Root variable

Prefer `${PLUGIN_ROOT}` in Codex hook commands.

```json
{
  "type": "command",
  "command": "AGENT_NOTIFY_ICON_DIR=\"${PLUGIN_ROOT}/assets\" python3 \"${PLUGIN_ROOT}/bin/agent-notify\" codex stop",
  "timeout": 10
}
```

Codex may also set `CLAUDE_PLUGIN_ROOT` for compatibility, but write Codex hooks with the native variable.

## Hook trust

Codex will not run unmanaged/new hooks until reviewed:

- First install: `/hooks` → trust each definition
- Hook content change: re-hash → user must re-trust
- New session required after trust changes

Do not tell end users to use `--dangerously-bypass-hook-trust` as the normal path.

## Semantics

- Notification-only hooks: exit 0, no stdout.
- `Stop` can use `decision: "block"`; `reason` may surface as the next prompt.
- `PreToolUse` may support richer permission decisions than Claude; verify on the installed Codex version.

## Payload hygiene

Same as Claude: defensive JSON parse, ignore unknown fields, cap UI text, never leak secrets to notifications.
