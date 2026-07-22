---
name: dual-cli-plugin
description: Use when authoring, packaging, or maintaining a single plugin that must load in both Claude Code (`.claude-plugin`) and Codex (`.codex-plugin`) from the same directory, including hook-event mapping, shared binaries via `${CLAUDE_PLUGIN_ROOT}`/`${PLUGIN_ROOT}`, marketplace registration for both sides, and layered verification without duplicate hooks.
---

# Dual-CLI Plugin (Claude Code + Codex)

## Overview

Package one plugin folder that both Claude Code and Codex load natively, without duplicating logic or assets. The two CLIs share event semantics (Stop, permission) but differ in event names, manifest schemas, hook-file discovery, and marketplace formats. This skill locks down the differences so a single directory works on both.

**Core principle:** one plugin root, two manifests, two hooks files, two marketplace entries — never one hooks file trying to serve both. If a plugin only targets one CLI, skip this skill and use [[codex-plugin-marketplaces]] (Codex) or Claude's plugin docs directly.

## When To Use

- The plugin's behavior is CLI-agnostic (notifications, telemetry, formatters, wrappers around a shared script).
- Users are expected to install from a marketplace, not run `curl | sh`.
- The plugin ships an executable or asset (`bin/`, `assets/`) that should not be duplicated per CLI.
- You are migrating an existing `install.sh`-style tool that writes to `~/.claude/settings.json` and `~/.codex/hooks.json`.

Do not use for:

- Plugins that only ship skills or commands (no hooks): a plain single-manifest plugin is enough.
- CLI-specific behavior that has no counterpart on the other side (e.g., Codex `SubagentStart` with no Claude Code analog): keep it in a single-CLI plugin.

## Safety Boundary

May proceed without extra confirmation:

- Read plugin sources, manifests, marketplace files, and installed caches.
- Create or edit files inside the user-selected plugin repository.
- Run static validators (`claude plugin validate`, `python3 -m json.tool`).
- Run script dry-run (`AGENT_NOTIFY_DRY_RUN`-style) and unit tests.
- Print exact global commands for user review.

Must show exact commands and get explicit confirmation before:

- `/plugin marketplace add|remove` or `codex plugin marketplace add|upgrade|remove`.
- `/plugin install|remove` or `codex plugin add|remove`.
- Any change to `~/.claude/settings.json`, `~/.claude-plugin/`, `~/.codex/config.toml`, `~/.codex/hooks.json`, or plugin cache.

Never hand-edit installed plugin caches or hook trust records. Never merge Claude Code and Codex hooks into a single file.

## Start With Source Identity

Before editing, state these five values:

```text
Plugin root:                <repo>/plugins/<name>
Plugin name:                <normalized-name>
Claude marketplace file:    <repo>/.claude-plugin/marketplace.json
Codex marketplace file:     <repo>/.agents/plugins/marketplace.json
Distribution:               local | Git <repository/ref>
```

If the user has an existing single-CLI plugin or a legacy `install.sh`, decide whether the new dual plugin coexists or replaces it. Coexistence means every user must uninstall the legacy hooks first, or they will get duplicate notifications. Record which one wins.

## Choose The Workflow

| Situation | Workflow |
|---|---|
| New dual plugin | Scaffold both manifests -> shared `bin`/`assets` -> two hooks files -> two marketplace entries |
| Migrating from `install.sh` | Copy script + assets into plugin root -> author two manifests -> keep legacy installer as fallback -> document conflict |
| Adding second CLI to an existing single-CLI plugin | Add the missing `.{claude,codex}-plugin/plugin.json` and `hooks/*.json`; do not rename the first |
| Users see duplicate notifications | Legacy hooks still present -> run legacy uninstaller before verifying plugin |

Read [[manifest-shapes.md]] before authoring manifests. Read [[hook-events.md]] before writing hooks. Read [[verification.md]] before claiming the plugin works.

## Repository Phase

Directory shape (target):

```text
plugins/<name>/
├── .claude-plugin/plugin.json      # Claude Code manifest
├── .codex-plugin/plugin.json       # Codex manifest (points hooks -> ./hooks/codex-hooks.json)
├── hooks/
│   ├── hooks.json                  # Claude events (Stop, Notification, ...)
│   └── codex-hooks.json            # Codex events (Stop, PermissionRequest, ...)
├── bin/<executable>                # Shared, addressed via ${*_PLUGIN_ROOT}/bin/...
├── assets/                         # Shared, addressed via env var injected in hook command
├── README.md                       # Plugin-level (required for marketplace discovery)
└── skills/ agents/ commands/       # Optional, standard Claude/Codex layout
```

Rules:

1. **Never share the hooks file.** Claude ignores `PermissionRequest`; Codex ignores `Notification`. A shared file emits "unknown event" warnings at startup.
2. **Two manifests, one plugin.** Same `name`, same `version`. Different `interface` blocks are fine (Codex uses `interface.displayName` etc.).
3. **Address `bin/` and `assets/` through env vars in the hook command**, not the script:
   - Claude hooks: `"command": "AGENT_X=\"${CLAUDE_PLUGIN_ROOT}/assets\" ${CLAUDE_PLUGIN_ROOT}/bin/foo claude stop"`
   - Codex hooks: `"command": "AGENT_X=\"${PLUGIN_ROOT}/assets\" ${PLUGIN_ROOT}/bin/foo codex stop"`
   - Codex also sets `CLAUDE_PLUGIN_ROOT` for portability, but prefer the native variable for each side.
4. **Codex `plugin.json` must reference the Codex hooks file explicitly** via `"hooks": "./hooks/codex-hooks.json"`. Without this, Codex falls back to the default `hooks/hooks.json` and warns on Claude-only events.
5. **`bin/*` needs `chmod +x`.** Both CLIs invoke via `python3 <path>` in the recommended pattern, so the exec bit is nominal, but keep it set for direct-run testing.
6. **Register in both marketplaces.** Two separate files, two separate schemas — see [[manifest-shapes.md]].
7. **Preserve legacy installer.** Users on older CLI versions still need `install.sh`. Do not delete it when adding the plugin form.

Use structured JSON edits or `apply_patch`; never assemble JSON with string replacement.

## Validation Phase

Run in this order; stop on first failure:

```bash
# 1. Manifest schemas
claude plugin validate <plugin-root>
python3 -m json.tool <plugin-root>/.codex-plugin/plugin.json >/dev/null
python3 -m json.tool <plugin-root>/hooks/hooks.json >/dev/null
python3 -m json.tool <plugin-root>/hooks/codex-hooks.json >/dev/null

# 2. Marketplace schemas
python3 -m json.tool <repo>/.claude-plugin/marketplace.json >/dev/null
python3 -m json.tool <repo>/.agents/plugins/marketplace.json >/dev/null

# 3. Consistency
python3 scripts/verify_plugin.py <plugin-root>

# 4. Script-level dry run (if the plugin wraps a script)
<plugin-root>/bin/<exec> --help  # or the tool's dry-run mode
```

Then run any plugin-specific unit tests. `claude plugin validate` only validates the Claude side; the `verify_plugin.py` helper covers the cross-CLI invariants (name/version parity, hooks-file reference, exec bit, marketplace registration).

## Global-State Gate

Repository validation must pass before touching global state. Then:

1. Read [[verification.md]] and pick the layers appropriate for the change (usually L1–L4 for Claude, L5–L6 for Codex).
2. If users had a legacy `install.sh`, run the legacy uninstaller first to avoid duplicate hooks.
3. Show every command that will run, its effect on global state, and ask for confirmation in a single message.
4. Run approved commands, capture JSON output when available.
5. Verify: `/plugin` shows the plugin, `/hooks` shows exactly one hook per event, no residual `~/.local/bin/*` or legacy paths.
6. For Codex: instruct the user to `/hooks` → trust → **new session**. Trust does not apply retroactively.
7. Run one end-to-end trigger per CLI (a Stop event and a permission event) and confirm exactly one notification per event.

Never bundle repository edits and marketplace install into a single silent action.

## Completion Report

Report:

- Plugin root path and name.
- Files created or modified (both manifests, both hooks files, both marketplaces, README).
- Legacy installer status (kept as fallback, removed, deprecated).
- Validation results per layer.
- Global commands executed, if any.
- Whether Codex hook trust was completed and a new session was opened.
- Remaining manual steps.

## Common Failure Modes

| Symptom | Cause | Correction |
|---|---|---|
| Duplicate notifications on Claude side | Legacy `~/.claude/settings.json` hook still installed | Run legacy uninstaller, `/reload-plugins` |
| Claude warns "unknown event PermissionRequest" | Codex hooks file loaded by Claude | Codex-only events must live in `codex-hooks.json`, referenced only by Codex manifest |
| Codex warns "unknown event Notification" | Codex loaded the default `hooks/hooks.json` | Set `"hooks": "./hooks/codex-hooks.json"` in Codex manifest |
| Codex hook installed but silent | Missing `/hooks` trust or reused old session | Trust in `/hooks`, `/exit`, new session |
| `${CLAUDE_PLUGIN_ROOT}` empty in Codex | Used env var before Codex sets both aliases | Prefer `${PLUGIN_ROOT}` in Codex hooks file |
| `claude plugin validate` fails on unknown field | Manifest includes non-schema fields (e.g. `keywords`) | Restrict to `name`, `version`, `description`, `author`, `homepage`, `repository`, `license` |
| Plugin visible in marketplace but skills not namespaced | Manifest `name` differs from folder name | Rename to match; both CLIs use manifest `name` for skill namespace |
| Icons/assets not found at runtime | Hook command hardcodes an absolute path | Inject via env var `X_DIR="${*_PLUGIN_ROOT}/assets"` in the hook command |
| Update pushed but users still see old behavior | Codex cachebuster not bumped, or Claude plugin not reinstalled | Bump `version`, `/plugin update`, or `codex plugin upgrade` |
