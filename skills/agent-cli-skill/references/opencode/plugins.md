# OpenCode Plugins

OpenCode plugins are JavaScript/TypeScript modules that return hook objects.
They do **not** use Claude/Codex `plugin.json` manifests or hooks JSON files.

Treat hook names and payload types as version-sensitive. Verify against the
installed `@opencode-ai/plugin` types and OpenCode version.

## Load plugins

### Local files

Place plugin files in one of the documented directories:

| Path | Scope |
|---|---|
| `.opencode/plugins/*.{js,ts}` | Current project |
| `~/.config/opencode/plugins/*.{js,ts}` | Global |

Files in these directories load automatically at startup.

Some OpenCode versions have also loaded `~/.opencode/plugins/*.{js,ts}` in
practice. Treat that as version-specific compatibility behavior, not the primary
XDG path. Do not install the same adapter in multiple global plugin directories.

### npm packages

List regular or scoped packages in `opencode.json`:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "plugin": [
    "opencode-helicone-session",
    "opencode-wakatime",
    "@my-org/custom-plugin"
  ]
}
```

OpenCode installs npm plugins and their dependencies with Bun during startup and
caches them under:

```text
~/.cache/opencode/node_modules/
```

A config entry may also point to a local module, commonly with an absolute
`file://` URL. Prefer one installation source per plugin identity.

## Load order and duplicates

Plugins are collected from all sources and their hooks run in sequence. The load
order is:

1. Global config: `~/.config/opencode/opencode.json`
2. Project config: `opencode.json`
3. Global plugin directory: `~/.config/opencode/plugins/`
4. Project plugin directory: `.opencode/plugins/`

Duplicate npm packages with the same package name and version load once. A local
plugin and an npm plugin with similar names are separate sources and can both
load, which can cause duplicated hooks or notifications.

Fully restart OpenCode after changing plugin files, dependency manifests, or
plugin configuration. Do not assume hot reload.

Debug discovery and effective configuration with:

```bash
opencode debug paths
opencode debug config
opencode debug info
```

## Local dependencies

Local plugins and custom tools can import external packages. Add dependencies to
a `package.json` in the corresponding config directory:

```json
{
  "dependencies": {
    "shescape": "^2.1.0"
  }
}
```

Project example:

```text
.opencode/
├── package.json
└── plugins/
    └── my-plugin.ts
```

OpenCode runs `bun install` at startup. Keep the dependency manifest scoped to
the config directory that owns the plugin. Prefer zero-dependency adapters when
a plugin only wraps an existing repository binary.

```ts
import { escape } from "shescape"

export const MyPlugin = async () => ({
  "tool.execute.before": async (input, output) => {
    if (input.tool === "bash") {
      output.args.command = escape(output.args.command)
    }
  },
})
```

## Plugin module shape

A module exports one or more async plugin functions. Each receives a context and
returns hooks:

```js
export const MyPlugin = async ({
  project,
  client,
  $,
  directory,
  worktree,
}) => {
  console.log("Plugin initialized!")

  return {
    // Hook implementations go here
  }
}
```

Context fields:

| Field | Meaning |
|---|---|
| `project` | Current project information |
| `directory` | Current working directory |
| `worktree` | Git worktree path; prefer it for project identity |
| `client` | OpenCode SDK client |
| `$` | Bun Shell API |

For TypeScript, import the `Plugin` type:

```ts
import type { Plugin } from "@opencode-ai/plugin"

export const MyPlugin: Plugin = async ({
  project,
  client,
  $,
  directory,
  worktree,
}) => {
  return {
    // Type-safe hook implementations
  }
}
```

## Event hooks

Subscribe to all bus events through the `event` hook:

```js
export const InspectEvents = async () => ({
  event: async ({ event }) => {
    console.log(event.type, event.properties)
  },
})
```

Common direct hooks such as `tool.execute.before`, `tool.execute.after`, and
`shell.env` receive hook-specific input/output objects rather than the generic
event envelope.

For the complete event catalog, compatibility event names, Bun Shell behavior,
and notification idempotency, read `events.md`.

### Completion notification

```js
export const NotificationPlugin = async ({ $ }) => ({
  event: async ({ event }) => {
    if (event.type === "session.idle") {
      await $`osascript -e 'display notification "Session completed!" with title "opencode"'`
    }
  },
})
```

The OpenCode desktop app can send system notifications itself when a response is
ready or a session errors. Avoid installing a plugin that duplicates built-in
notifications unless duplicate behavior is intentional.

## Guard sensitive files

A plugin can reject sensitive reads before tool execution:

```js
export const EnvProtection = async () => ({
  "tool.execute.before": async (input, output) => {
    if (
      input.tool === "read" &&
      output.args.filePath.includes(".env")
    ) {
      throw new Error("Do not read .env files")
    }
  },
})
```

Prefer permission rules for broad policy and use a plugin hook when dynamic
inspection is required. String containment alone can over-match or miss path
edge cases; normalize and validate paths for production enforcement.

## Inject shell environment

Use `shell.env` to add environment variables to AI shell tools and user
terminals:

```js
export const InjectEnvPlugin = async () => ({
  "shell.env": async (input, output) => {
    output.env.PROJECT_ROOT = input.cwd
  },
})
```

Do not hard-code secrets such as API keys in a checked-in plugin. Read them from
the runtime secret source and avoid logging the resulting environment.

## Add custom tools

Plugins can return a `tool` map alongside hooks:

```ts
import { type Plugin, tool } from "@opencode-ai/plugin"

export const CustomToolsPlugin: Plugin = async () => ({
  tool: {
    mytool: tool({
      description: "Return a greeting for the current workspace",
      args: {
        foo: tool.schema.string(),
      },
      async execute(args, context) {
        const { directory, worktree } = context
        return `Hello ${args.foo} from ${directory} (worktree: ${worktree})`
      },
    }),
  },
})
```

The `tool(...)` helper defines:

| Field | Meaning |
|---|---|
| `description` | What the tool does and when it is useful |
| `args` | Zod-compatible argument schema |
| `execute` | Tool implementation |

Plugin tools appear alongside built-in tools. If a plugin tool uses a built-in
tool name, the plugin tool takes precedence. Avoid accidental collisions; use a
distinct name unless overriding the built-in behavior is deliberate and tested.

For standalone custom tools under `.opencode/tools/`, read `tools.md`.

## Structured logging

Prefer the SDK logger over `console.log` for operational logs:

```ts
export const MyPlugin = async ({ client }) => {
  await client.app.log({
    body: {
      service: "my-plugin",
      level: "info",
      message: "Plugin initialized",
      extra: { foo: "bar" },
    },
  })

  return {}
}
```

Supported levels are `debug`, `info`, `warn`, and `error`. Do not include API
keys, authorization payloads, full environment objects, or sensitive prompt
content in structured log fields.

For the complete client API, read `sdk.md`.

## Compaction hooks

Use `experimental.session.compacting` to preserve domain-specific context when
OpenCode compacts a long session.

### Append context

```ts
import type { Plugin } from "@opencode-ai/plugin"

export const CompactionPlugin: Plugin = async () => ({
  "experimental.session.compacting": async (input, output) => {
    output.context.push(`
## Custom Context

Include any state that should persist across compaction:
- Current task status
- Important decisions made
- Files being actively worked on
`)
  },
})
```

### Replace the prompt

```ts
import type { Plugin } from "@opencode-ai/plugin"

export const CustomCompactionPlugin: Plugin = async () => ({
  "experimental.session.compacting": async (input, output) => {
    output.prompt = `
Summarize:
1. The current task and status
2. Files being modified
3. Blockers and dependencies
4. The next concrete steps

Format the result as a continuation prompt for a new agent.
`
  },
})
```

When `output.prompt` is set, it replaces the default compaction prompt and
`output.context` is ignored. Choose either context augmentation or prompt
replacement deliberately. Because this hook is experimental, confirm its type
and behavior against the installed plugin package before relying on it.

Do not use compaction hooks to inject secrets or unbounded transcripts.

## Multi-CLI repository layout

For a plugin that shares behavior with Claude Code or Codex adapters:

```text
plugins/<name>/
├── opencode/<name>.js
├── bin/<shared>
└── assets/

scripts/install-opencode.sh
```

Keep OpenCode-specific loading in the JS/TS adapter and shared behavior in
`bin/` and `assets/`. Keep installers at the repository's shallow `scripts/`
path.

## Resolve plugin-relative paths

```js
import path from "node:path"
import { fileURLToPath } from "node:url"

const pluginDirectory = path.dirname(fileURLToPath(import.meta.url))
const pluginRoot =
  process.env.AGENT_NOTIFY_ROOT || path.resolve(pluginDirectory, "..")
```

Symlink installs resolve relative imports and paths from the real source file.
Copy installs may need an explicit root such as `AGENT_NOTIFY_ROOT`.

## Plugin checklist

1. Choose exactly one local or npm installation source per plugin.
2. Confirm load order when multiple hooks affect the same event or output.
3. Add local dependencies to the owning config directory's `package.json`.
4. Import `Plugin` for TypeScript hook validation.
5. Avoid built-in tool name collisions unless intentionally overriding them.
6. Keep secrets out of source files, shell-environment logs, and SDK logs.
7. Treat experimental compaction hooks as version-sensitive.
8. Fully restart OpenCode, then test one successful event and one failure path.

For installer behavior, read `install.md`. For SDK interactions, read `sdk.md`.
