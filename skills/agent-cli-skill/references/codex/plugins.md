# Codex Plugins

## Manifest

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

- `hooks` should be a `./`-prefixed path to a Codex-only hooks file.
- Without `hooks`, Codex falls back to `hooks/hooks.json` (Claude file) and warns on unknown events.
- Share base `MAJOR.MINOR.PATCH` with the Claude manifest; optional `+codex` build metadata is fine.
- `interface.*` is UI metadata only.

## Marketplace entry

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

- Claude and Codex marketplaces are independent files; keep them in sync manually.
- Users install as `<plugin>@<marketplace-name>`.

## Install

```bash
codex plugin marketplace add <repo-path-or-url>
codex plugin add <name>@<marketplace-name>
codex plugin list --marketplace <marketplace-name>
```

There is no Claude-style `--plugin-dir` shortcut. Local work still goes through marketplace add/install.

After install:

1. Open `/hooks`
2. Trust new hook definitions
3. `/exit` and start a **new** session (trust is not retroactive)

## Version / update

- Bump version when shipping hook content changes; users may need re-trust.
- `codex plugin upgrade` after marketplace updates.
