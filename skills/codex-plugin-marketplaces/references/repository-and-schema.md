# Repository And Schema

## Canonical Repository Layout

```text
<marketplace-root>/
|-- .agents/plugins/marketplace.json
`-- plugins/
    `-- <plugin-name>/
        |-- .codex-plugin/plugin.json
        |-- skills/
        |-- hooks/
        |   |-- hooks.json
        |   `-- <hook-script>
        |-- scripts/
        |-- assets/
        |-- .mcp.json
        `-- .app.json
```

Only create optional files when the plugin uses them. Default discovery finds conventional `hooks/hooks.json`; do not add a manifest `hooks` field when the current validator rejects it.

## Marketplace Shape

```json
{
  "name": "team-marketplace",
  "interface": {
    "displayName": "Team Marketplace"
  },
  "plugins": [
    {
      "name": "sample-plugin",
      "source": {
        "source": "local",
        "path": "./plugins/sample-plugin"
      },
      "policy": {
        "installation": "AVAILABLE",
        "authentication": "ON_INSTALL"
      },
      "category": "Productivity"
    }
  ]
}
```

Rules:

- `source.source` stays `local` for plugins stored in the marketplace repository, including when the repository itself is fetched through Git.
- `source.path` is relative to marketplace repository root and starts with `./`.
- Git URL/ref belongs to `codex plugin marketplace add`, not a plugin entry.
- Include `policy.installation`, `policy.authentication`, and `category`.
- Omit `policy.products` unless the user explicitly requests product gating.
- Append new entries by default; preserve marketplace display metadata and ordering.

## Manifest Alignment

The following must identify the same normalized name:

- `plugins/<plugin-name>/` directory;
- `.codex-plugin/plugin.json` field `name`;
- marketplace plugin entry `name`;
- marketplace `source.path` final directory.

Use strict semver for manifest versions. During local iteration, preserve the base version and replace only the `+codex.<cachebuster>` suffix.

## Migration Checklist

Before copying:

1. Compare source and target trees.
2. Check target Git status and unrelated changes.
3. Confirm source is not merely an installed cache.
4. Inventory manifest-referenced and convention-discovered files.

After copying:

1. Diff source and destination.
2. Confirm executable scripts and line endings where relevant.
3. Validate every Skill under the copied plugin.
4. Audit marketplace-to-manifest paths.
5. Do not silently rewrite author/developer metadata.

## Two Marketplace Formats

Some repositories also contain `.claude-plugin/marketplace.json`. Do not merge its grouped `skills` schema into `.agents/plugins/marketplace.json`. A repository may validly contain both files for different runtimes.

