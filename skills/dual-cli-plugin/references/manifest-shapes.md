# Manifest and Marketplace Shapes

Reference the current CLI docs; treat this file as a starting scaffold, not the schema of record.

## Claude Code plugin manifest

Path: `plugins/<name>/.claude-plugin/plugin.json`

```json
{
  "name": "<plugin-name>",
  "version": "0.1.0",
  "description": "One-line summary.",
  "author": { "name": "<owner>" },
  "homepage": "https://github.com/<owner>/<repo>",
  "repository": "https://github.com/<owner>/<repo>",
  "license": "MIT"
}
```

Rules:

- Only `name` is required. Prefer including the other six; anything outside the documented schema (e.g. `keywords`) triggers validator errors.
- Skill names in this plugin are namespaced as `/<plugin-name>:<skill-name>`.
- Hooks are auto-loaded from `hooks/hooks.json` — do not add a `hooks` field here.
- Validate with `claude plugin validate <plugin-root>`.

## Codex plugin manifest

Path: `plugins/<name>/.codex-plugin/plugin.json`

```json
{
  "name": "<plugin-name>",
  "version": "0.1.0+codex",
  "description": "One-line summary (Codex side).",
  "author": { "name": "<owner>" },
  "hooks": "./hooks/codex-hooks.json",
  "interface": {
    "displayName": "<display name>",
    "shortDescription": "Shown in Codex plugin list.",
    "longDescription": "Longer description for plugin detail.",
    "developerName": "<owner>",
    "category": "Productivity",
    "capabilities": ["Interactive"]
  }
}
```

Rules:

- `hooks` must be a `./`-prefixed path, an array of paths, an inline hooks object, or an array of hooks objects. Prefer a path so the file is diffable and reviewable.
- Without `hooks`, Codex falls back to `hooks/hooks.json` (Claude's file) and warns on unknown events.
- The `+codex` build metadata in `version` is optional but signals divergence between the two manifests. Both manifests should share the base `MAJOR.MINOR.PATCH`.
- `interface.*` powers Codex's plugin detail UI. None of it affects hook behavior.

## Claude marketplace entry

Path: `<repo>/.claude-plugin/marketplace.json`

```json
{
  "name": "claude-agent-plugins",
  "owner": { "name": "<owner>", "email": "<email>" },
  "metadata": { "description": "<description>", "version": "1.0.0" },
  "plugins": [
    {
      "name": "<plugin-name>",
      "description": "One-line summary.",
      "source": "./plugins/<plugin-name>",
      "strict": false,
      "category": "Productivity"
    }
  ]
}
```

## Codex marketplace entry

Path: `<repo>/.agents/plugins/marketplace.json`

```json
{
  "name": "codex-agent-plugins",
  "interface": { "displayName": "<market display name>" },
  "plugins": [
    {
      "name": "<plugin-name>",
      "source": { "source": "local", "path": "./plugins/<plugin-name>" },
      "policy": { "installation": "AVAILABLE", "authentication": "ON_INSTALL" },
      "category": "Productivity"
    }
  ]
}
```

Rules:

- The two files are independent — keep them in sync manually, or the plugin will appear on only one side.
- `source.source` accepts `local` and `git`. For Git, the URL and ref go in the `codex plugin marketplace add` call, not the manifest.
- Marketplace `name` is what users type after `@` when installing (`plugin-name@codex-agent-plugins`).

## Legacy installer coexistence

If you keep an `install.sh` for users without plugin support, document explicitly in the repo README:

- Which one to run — never both.
- How to uninstall the other before switching.
- That the plugin variant writes hooks under the plugin cache, and the legacy variant writes to `~/.claude/settings.json` / `~/.codex/hooks.json`.
