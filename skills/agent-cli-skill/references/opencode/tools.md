# OpenCode Custom Tools

Custom tools are functions the LLM can call during a conversation, alongside
built-ins such as `read`, `write`, and `bash`.

TypeScript/JavaScript is only the **definition layer**. The implementation may
call scripts in any language.

## Locations

| Scope | Path |
|---|---|
| Project | `.opencode/tools/` |
| Global | `~/.config/opencode/tools/` |

Filename becomes the tool name for a default export.

## Single tool (default export)

```ts
// .opencode/tools/database.ts
import { tool } from "@opencode-ai/plugin"

export default tool({
  description: "Query the project database",
  args: {
    query: tool.schema.string().describe("SQL query to execute"),
  },
  async execute(args) {
    return `Executed query: ${args.query}`
  },
})
```

Creates tool: `database`.

Prefer `tool()` for typed args validation. `tool.schema` is Zod-backed.

## Multiple tools in one file

Named exports become `<filename>_<exportname>`:

```ts
// .opencode/tools/math.ts
import { tool } from "@opencode-ai/plugin"

export const add = tool({
  description: "Add two numbers",
  args: {
    a: tool.schema.number().describe("First number"),
    b: tool.schema.number().describe("Second number"),
  },
  async execute(args) {
    return args.a + args.b
  },
})

export const multiply = tool({
  description: "Multiply two numbers",
  args: {
    a: tool.schema.number().describe("First number"),
    b: tool.schema.number().describe("Second number"),
  },
  async execute(args) {
    return args.a * args.b
  },
})
```

Creates: `math_add`, `math_multiply`.

## Name collisions with built-ins

Custom tools are indexed by name. A custom tool with the same name as a built-in
**replaces** the built-in.

```ts
// .opencode/tools/bash.ts  — replaces built-in bash
import { tool } from "@opencode-ai/plugin"

export default tool({
  description: "Restricted bash wrapper",
  args: {
    command: tool.schema.string(),
  },
  async execute(args) {
    return `blocked: ${args.command}`
  },
})
```

Unless intentional, use unique names. To disable a built-in without replacing it,
use permissions instead of a same-named tool.

## Args

Via `tool.schema`:

```ts
args: {
  query: tool.schema.string().describe("SQL query to execute"),
}
```

Or plain object + Zod:

```ts
import { z } from "zod"

export default {
  description: "Tool description",
  args: {
    param: z.string().describe("Parameter description"),
  },
  async execute(args, context) {
    return "result"
  },
}
```

## Context

`execute(args, context)` receives session context:

```ts
async execute(args, context) {
  const { agent, sessionID, messageID, directory, worktree } = context
  // directory = session cwd
  // worktree  = git worktree root
  return `Agent: ${agent}, Session: ${sessionID}`
}
```

Prefer `worktree` for repo-rooted scripts; prefer `directory` for the active cwd.

## Calling other languages

Definition stays TS/JS; body may shell out.

```python
# .opencode/tools/add.py
import sys
a = int(sys.argv[1])
b = int(sys.argv[2])
print(a + b)
```

```ts
// .opencode/tools/python-add.ts
import { tool } from "@opencode-ai/plugin"
import path from "path"

export default tool({
  description: "Add two numbers using Python",
  args: {
    a: tool.schema.number().describe("First number"),
    b: tool.schema.number().describe("Second number"),
  },
  async execute(args, context) {
    const script = path.join(context.worktree, ".opencode/tools/add.py")
    const result = await Bun.$`python3 ${script} ${args.a} ${args.b}`.text()
    return result.trim()
  },
})
```

Bun Shell notes (same family as plugins):

- Prefer explicit paths from `context.worktree` / `context.directory`
- Quote/escape user-controlled strings carefully
- Return a string the model can use; keep errors actionable

## Tools vs plugins vs permissions

| Mechanism | Use when |
|---|---|
| Custom tool | LLM should deliberately call a capability by name |
| Plugin event hooks | Side effects on lifecycle events (idle, permission, etc.) |
| Permissions | Allow/deny/ask for existing tools without replacing them |

Do not implement “on session complete notify” as a custom tool; that belongs in a
plugin event handler (`session.idle`). See `events.md` and `plugins.md`.

## Checklist

1. Choose project vs global tools directory.
2. Unique tool name unless intentionally overriding a built-in.
3. Clear `description` and arg `.describe(...)` text for the model.
4. Use `context.worktree` / `directory` for path-sensitive work.
5. Restart OpenCode after adding/changing tools (no hot reload assumed).
6. Verify the tool appears and can be invoked in a short session.
