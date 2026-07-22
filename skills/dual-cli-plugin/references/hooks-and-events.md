# Hooks and Event Mapping

Claude Code and Codex share the JSON-in-stdin model but diverge on event names, matchers, and stopping semantics. This is the biggest source of dual-CLI bugs.

## Event name mapping

| Purpose | Claude Code | Codex |
|---|---|---|
| Turn ended | `Stop` | `Stop` |
| Permission needed | `Notification` with matcher `permission_prompt` | `PermissionRequest` with tool matcher |
| Session begins | `SessionStart` | `SessionStart` |
| Pre-tool | `PreToolUse` | `PreToolUse` |
| Post-tool | `PostToolUse` | `PostToolUse` |
| Before compaction | `PreCompact` | `PreCompact` |
| After compaction | (n/a) | `PostCompact` |
| User submitted prompt | `UserPromptSubmit` | `UserPromptSubmit` |
| Subagent begins/ends | `SubagentStart` / `SubagentStop` | `SubagentStart` / `SubagentStop` |

Where the names match, matcher semantics and available fields can still differ. Always re-read the current docs before shipping.

## Splitting hook files

Do not put both CLIs' hook definitions in a single file. Codex warns loudly on unknown events, and Claude Code silently drops unknown events. Concrete layout:

```
plugins/<name>/hooks/
├── hooks.json          # Claude default location; only Claude events
└── codex-hooks.json    # Referenced from .codex-plugin/plugin.json; only Codex events
```

Codex manifest points at the second file with `"hooks": "./hooks/codex-hooks.json"`.

## Plugin root variable

Same purpose, different variable name:

| CLI | Variable |
|---|---|
| Claude Code | `${CLAUDE_PLUGIN_ROOT}` |
| Codex | `${PLUGIN_ROOT}` (also sets `${CLAUDE_PLUGIN_ROOT}` for compat) |

The safe rule: in `hooks/hooks.json` use `CLAUDE_PLUGIN_ROOT`; in `hooks/codex-hooks.json` use `PLUGIN_ROOT`. Do not cross-wire.

## Command shape

Every hook command should:

1. Resolve executables through `${*_PLUGIN_ROOT}` so it works from any cwd.
2. Inject env vars inline rather than assuming the user's shell config.
3. Quote the command string; hook definitions run through a shell.

Good:

```json
{
  "type": "command",
  "command": "AGENT_NOTIFY_ICON_DIR=\"${CLAUDE_PLUGIN_ROOT}/assets\" python3 \"${CLAUDE_PLUGIN_ROOT}/bin/agent-notify\" claude stop",
  "timeout": 10
}
```

Bad:

- `command: "agent-notify claude stop"` — depends on installed PATH state
- `command: "./bin/agent-notify claude stop"` — depends on session cwd
- Using `~` — some CLIs do not expand `~` inside JSON command strings

## Codex hook trust

Codex refuses to run non-managed hooks until the user reviews them via `/hooks`. Ship the plugin knowing:

- First install: user must open `/hooks` and trust `Stop`, `PermissionRequest`, etc.
- Every content change to a trusted hook: Codex re-hashes and marks it "changed" — user must re-trust.
- New Codex session (`/exit` then restart) is required after trust changes.

Document this in the plugin README. `--dangerously-bypass-hook-trust` exists for one-off scripting; do not tell users to run that.

Claude Code has no equivalent trust review — hooks in an installed plugin run once installed.

## Stopping vs. blocking semantics

Both CLIs parse `continue: false`, `decision: "block"`, and `hookSpecificOutput`. Support is uneven:

- **Claude Code `Stop`** — supports `decision: "block"` to keep the loop going.
- **Codex `Stop`** — supports the same, and the `reason` field becomes the next user-visible prompt.
- **PreToolUse** — Codex supports `permissionDecision: "allow" | "deny"` with optional `updatedInput`; Claude Code has a narrower set. Test both before relying on either.

Notification-only hooks (like a completion-toast plugin) should exit 0 with no output. Everything else is fair game to unintentionally interfere with the turn.

## Local install semantics

| Method | Claude Code | Codex |
|---|---|---|
| Load from disk without install | `claude --plugin-dir <path>` | Not supported |
| Local marketplace | `/plugin marketplace add <path>` + `/plugin install ...` | `codex plugin marketplace add <path>` + `codex plugin add ...` |
| Live reload after edit | `/reload-plugins` | Restart Codex |

`--plugin-dir` is the fastest development loop. Codex requires the marketplace round-trip even for local paths.

## Payload validation

Regardless of CLI, hook commands should:

1. Read stdin as JSON with an outer `try` — payload may be empty on some events.
2. Ignore unknown fields; both CLIs add new fields over time.
3. Never rely on stdin key order.
4. Cap message content before rendering (macOS truncates around 180 chars; keep short).
5. Not echo `tool_input` verbatim to system UI — that surface can appear on the lock screen.
