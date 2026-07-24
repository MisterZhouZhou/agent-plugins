# Claude Code Plugins

## Manifest

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

- Only `name` is required; prefer the other six.
- Unknown fields (for example `keywords`) fail `claude plugin validate`.
- Hooks auto-load from `hooks/hooks.json` — do **not** add a `hooks` field.
- Skills are namespaced as `/<plugin-name>:<skill-name>`.
- Validate: `claude plugin validate <plugin-root>`.

## Marketplace entry

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

## Install / dev loop

```bash
# Fast local loop
claude --plugin-dir <plugin-root>

# Marketplace path
/plugin marketplace add <repo-path-or-url>
/plugin install <name>@<marketplace-name>
```

After edits: `/reload-plugins` (no full restart required for many changes).

## Legacy coexistence

If an old installer wrote hooks into `~/.claude/settings.json`, uninstall that path before verifying the plugin form, or users get duplicate side effects.
