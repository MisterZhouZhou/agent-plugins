# OpenCode Plugins

OpenCode does **not** use Claude/Codex `plugin.json` + hooks JSON.
It loads JavaScript/TypeScript modules that return hook objects.

Treat paths and APIs as version-sensitive; verify on the installed OpenCode.

## Mental model

| Layer | OpenCode |
|---|---|
| Packaging | JS/TS module (+ optional npm package) |
| Hook definition | Function returns hooks object |
| First install | Place file or add `plugin[]` / `opencode plugin` |
| Reload | Full process restart only |

Once loaded, the module registers events. Users do not edit hooks JSON.

## Load paths

| Path | Scope | Notes |
|---|---|---|
| `~/.opencode/plugins/*.{js,ts}` | Global | Auto-loaded on OpenCode 1.18.x in practice |
| `~/.config/opencode/plugins/*.{js,ts}` | Global | Documented XDG plugin dir |
| `<project>/.opencode/plugins/*.{js,ts}` | Project | Current project only |
| `opencode.json` → `plugin: ["file:///..."]` | Config | Prefer absolute `file://` |
| `opencode.json` → `plugin: ["npm-pkg"]` | Config | Bun cache under `~/.cache/opencode/node_modules/` |
| `opencode plugin <module> [--global]` | CLI | Install npm plugin + update config |

Debug:

```bash
opencode debug paths
opencode debug config
opencode debug info
```

Do not install the same adapter into both `~/.opencode/plugins/` and `~/.config/opencode/plugins/`.

## Module shape

```js
export const MyPlugin = async ({ project, client, $, directory, worktree }) => {
  return {
    event: async ({ event }) => {
      // handle events
    },
  }
}
```

Context:

- `directory` — cwd
- `worktree` — git worktree; prefer for project label
- `$` — Bun Shell
- `client` — SDK client
- `project` — project metadata

TypeScript may import `Plugin` from `@opencode-ai/plugin`.
Local plugins needing npm deps require a scope `package.json` (`~/.opencode/package.json` or `.opencode/package.json`). Prefer zero-dep adapters when wrapping an existing binary.

## Repo layout for multi-CLI plugins

```text
plugins/<name>/
├── opencode/<name>.js
├── bin/<shared>
└── assets/

scripts/install-opencode.sh
```

Keep installers at repository `scripts/` (shallow path).

## Path resolution

```js
import path from "node:path"
import { fileURLToPath } from "node:url"

const pluginDirectory = path.dirname(fileURLToPath(import.meta.url))
const pluginRoot = process.env.AGENT_NOTIFY_ROOT || path.resolve(pluginDirectory, "..")
```

Symlink installs resolve to the real source file, so `../bin` and `../assets` work.
Copy installs need `AGENT_NOTIFY_ROOT`.

For events and Bun Shell details, read `events.md`.
For installer contract, read `install.md`.
