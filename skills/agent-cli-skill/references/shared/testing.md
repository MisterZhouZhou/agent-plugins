# Testing and Verification

Layered testing plan for Claude Code, Codex, and OpenCode plugins. Run from cheapest to most realistic.

When the user only targets one CLI, run that CLI's layers only. Do not require the full multi-CLI matrix for a single-side change.

## Layer 1: Static validation

```bash
claude plugin validate <plugin-root>
python3 -m json.tool <plugin-root>/.claude-plugin/plugin.json > /dev/null
python3 -m json.tool <plugin-root>/.codex-plugin/plugin.json > /dev/null
python3 -m json.tool <plugin-root>/hooks/hooks.json > /dev/null
python3 -m json.tool <plugin-root>/hooks/codex-hooks.json > /dev/null
```

For the marketplace side:

```bash
python3 -m json.tool <repo>/.claude-plugin/marketplace.json > /dev/null
python3 -m json.tool <repo>/.agents/plugins/marketplace.json > /dev/null
```

## Layer 2: Script dry-run

If the plugin invokes a Python or shell binary, exercise it directly with a canned payload. Verify:

- Payload parsing does not crash on empty or minimal input.
- Environment variables like `${*_PLUGIN_ROOT}` resolve correctly when passed in.
- Any external tool (terminal-notifier, jq, etc.) is discovered.

Prefer a `--dry-run` flag on the binary itself so the same test works everywhere.

## Layer 3: Direct execution

Run the hook command exactly as the CLI would, from an unrelated cwd:

```bash
cd /tmp
printf '%s' '{"cwd":"/tmp/demo","last_assistant_message":"hello"}' \
  | AGENT_NOTIFY_ICON_DIR="<plugin-root>/assets" \
    python3 "<plugin-root>/bin/agent-notify" claude stop
```

This catches path resolution bugs that Layer 2 misses.

## Layer 4: Claude Code end-to-end via --plugin-dir

The fastest real-CLI loop:

```bash
mkdir -p /tmp/plugin-test && cd /tmp/plugin-test
claude --plugin-dir <plugin-root>
```

Inside Claude Code, check:

1. `/plugin` — plugin listed and enabled.
2. `/hooks` — expected events registered, commands look right, no leftover entries from prior installs.
3. Trigger the events: a simple greeting to fire `Stop`, a file-write request to fire `Notification.permission_prompt`.
4. After editing plugin files, run `/reload-plugins` — no need to restart.

If nothing fires, restart with `--debug` and check the log:

```bash
claude --plugin-dir <plugin-root> --debug 2>&1 | tee /tmp/claude-debug.log
grep -i "plugin\|hook" /tmp/claude-debug.log
```

## Layer 5: Claude Code end-to-end via marketplace

Simulates the real user path:

```bash
# From a fresh Claude Code session
/plugin marketplace add <repo-path-or-url>
/plugin install <name>@<marketplace-name>
/plugin
/hooks
```

Trigger the same events as Layer 4. Confirm plugin cache location:

```bash
find ~/.claude -type d -name "<name>" 2>/dev/null
```

The path there is what `${CLAUDE_PLUGIN_ROOT}` resolves to at runtime — verify `bin/`, `assets/`, `hooks/` all copied through.

## Layer 6: Codex end-to-end

Codex has no `--plugin-dir` shortcut. Only path:

```bash
codex plugin marketplace add <repo-path-or-url>
codex plugin add <name>@<marketplace-name>
codex plugin list --marketplace <marketplace-name>
codex
```

Inside Codex:

1. `/plugins` — plugin installed.
2. `/hooks` — **must** review and trust each new hook definition. Untrusted hooks are silently skipped.
3. `/exit`, then start a new Codex session. Trust does not apply to the current session.
4. Trigger events.

If a hook content change ships later, users must re-trust — plan release notes accordingly.

## Layer 7: OpenCode adapter + install

OpenCode has no hooks JSON. Verify the JS/TS adapter and installer separately.

```bash
node --check <plugin-root>/opencode/<adapter>.js
python3 -m py_compile <plugin-root>/bin/<exec>   # if wrapping Python

# Shared binary: stdin path
AGENT_NOTIFY_DRY_RUN=1 AGENT_NOTIFY_ICON_DIR="<plugin-root>/assets" \
  python3 "<plugin-root>/bin/<exec>" opencode stop \
  <<< '{"cwd":"/tmp/demo","last_assistant_message":"dry-run"}'

# Shared binary: env payload path used by Bun Shell adapter
AGENT_NOTIFY_DRY_RUN=1 AGENT_NOTIFY_ICON_DIR="<plugin-root>/assets" \
  AGENT_NOTIFY_PAYLOAD='{"cwd":"/tmp/demo","last_assistant_message":"env"}' \
  python3 "<plugin-root>/bin/<exec>" opencode stop
```

Installer checks (prefer repo-root script):

```bash
scripts/install-opencode.sh status
OPENCODE_PLUGIN_DIR=/tmp/opencode-plugin-test/plugins scripts/install-opencode.sh install
OPENCODE_PLUGIN_DIR=/tmp/opencode-plugin-test/plugins scripts/install-opencode.sh uninstall
```

Confirm the installer:

- creates a symlink to the adapter source
- refuses unmanaged same-name files
- only disables legacy notifiers with an explicit flag

## Layer 8: OpenCode end-to-end

```bash
scripts/install-opencode.sh install --disable-legacy   # after user confirmation
opencode --version
opencode debug config    # plugin list includes the adapter once
opencode debug info
```

Then fully quit and restart OpenCode (no hot reload).

1. Successful short reply → exactly one completion toast (`session.idle`).
2. Permission-ask project config → exactly one permission toast (`permission.updated` / `permission.asked`).
3. Stream/model failures do not count as idle tests.

If listed in debug config but silent:

- re-check Bun Shell payload transport (env, not `.stdin(...)`)
- inspect `~/.local/share/opencode/log/opencode.log`
- ensure legacy `notification.ts` is disabled when testing uniqueness

## Layer 9: Conflict detection

CLIs can have hooks/plugins registered from other sources: user-global settings, project-local configs, prior installers, or leftover OpenCode adapters.

Before shipping, check for duplicates:

- Old `~/.local/bin/<name>` scripts left over from a pre-plugin installer.
- Same plugin installed from two marketplaces with different names.
- Project-local `.claude/settings.json` still injecting the same hook.
- OpenCode: both `~/.opencode/plugins/` and `~/.config/opencode/plugins/` copies of the same adapter.
- OpenCode: legacy `notification.ts` plus the new adapter.

If your plugin previously shipped as a standalone installer, ship an "uninstall old form" instruction in the migration section of the README.

## Regression matrix

Before releasing a multi-CLI plugin, run this matrix by hand or scripted:

| Scenario | Claude Code | Codex | OpenCode |
|---|---|---|---|
| Fresh install | Layer 5 | Layer 6 | Layer 8 |
| Reload after edit | `/reload-plugins` | `codex plugin remove` + `add` | full process restart |
| Empty payload | Layer 2 with `{}` | Same | Same + env payload empty |
| Missing external tool | Layer 3 with `PATH=""` | Same | Same |
| Very long payload | Layer 3 with 5KB message | Same | Same |
| Uninstall | `/plugin uninstall` | `codex plugin remove` | `scripts/install-opencode.sh uninstall` |
| Hook/plugin trust flow | (n/a) | Confirm `/hooks` review path | Confirm debug config lists adapter once |
| Legacy duplicate | legacy settings.json | legacy hooks.json | legacy `notification.ts` |

## Signals of a good release

- `claude plugin validate` passes.
- Claude/Codex `/hooks` shows exactly the expected count of entries — no duplicates from stale installers.
- OpenCode `opencode debug config` lists the adapter once under the intended scope.
- Manual trigger produces a visible, correct effect in every targeted CLI.
- Uninstall removes only the managed install path without residual duplicates.
- README uninstall commands verified against the same fresh state.
