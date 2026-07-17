# Local And Git Distribution

CLI behavior is drift-prone. Re-run these before constructing commands:

```bash
codex plugin --help
codex plugin marketplace add --help
codex plugin marketplace upgrade --help
codex plugin add --help
```

Read-only discovery:

```bash
codex plugin marketplace list --json
codex plugin list --json
```

## Local Marketplace

For a repository marketplace outside the default personal path:

```bash
codex plugin marketplace add /absolute/path/to/repository --json
codex plugin add <plugin-name>@<marketplace-name> --json
```

The standard personal marketplace at `~/.agents/plugins/marketplace.json` is discovered implicitly; do not register it again unless current CLI behavior proves otherwise.

## Git Marketplace

Accepted source forms in the current CLI include:

```bash
codex plugin marketplace add owner/repo --ref main --json
codex plugin marketplace add owner/repo@v1.2.0 --json
codex plugin marketplace add https://github.com/owner/repo.git --ref main --json
codex plugin marketplace add git@github.com:owner/repo.git --ref main --json
```

Use a pinned tag or commit when reproducibility matters; use a branch when the user expects rolling updates. Do not specify a ref twice through both `owner/repo@ref` and `--ref`.

For large monorepos, `--sparse <path>` may be repeated. Use it only after confirming the resulting snapshot includes `.agents/plugins/marketplace.json` and every referenced plugin path.

Install after registration:

```bash
codex plugin add <plugin-name>@<marketplace-name> --json
```

Refresh a configured Git snapshot after source changes have been committed and pushed:

```bash
codex plugin marketplace upgrade <marketplace-name> --json
codex plugin add <plugin-name>@<marketplace-name> --json
```

`marketplace upgrade` refreshes Git marketplaces, not local ones.

## Confirmation Template

Before executing any command above, show the actual commands and ask for confirmation in the same message. Do not say "confirm first and I will show the commands later." Use:

```text
Repository validation has passed. The next commands will modify global Codex state:
1. <exact command> - <marketplace effect>
2. <exact command> - <plugin cache/config effect>
Hooks may require a separate trust review. Shall I run these commands?
```

Removal follows the same gate:

```bash
codex plugin remove <plugin-name>@<marketplace-name> --json
codex plugin marketplace remove <marketplace-name> --json
```

Do not edit `~/.codex/config.toml` to imitate these commands.
