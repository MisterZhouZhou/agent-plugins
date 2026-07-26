# OpenCode JavaScript/TypeScript SDK

Use `@opencode-ai/sdk` to start or connect to an OpenCode server from
JavaScript/TypeScript. The package provides a type-safe client generated from
the server's OpenAPI specification.

## Install

```bash
npm install @opencode-ai/sdk
```

## Choose the client mode

| Need | API |
|---|---|
| Start an OpenCode server and create a client for it | `createOpencode()` |
| Connect to an already-running OpenCode server | `createOpencodeClient()` |

### Start server and client together

```ts
import { createOpencode } from "@opencode-ai/sdk"

const opencode = await createOpencode()
const { client } = opencode

try {
  const health = await client.global.health()
  console.log(health.data.version)
} finally {
  opencode.server.close()
}
```

`createOpencode()` starts both components. Its options are:

| Option | Type | Default | Purpose |
|---|---|---:|---|
| `hostname` | `string` | `127.0.0.1` | Server hostname |
| `port` | `number` | `4096` | Server port |
| `signal` | `AbortSignal` | `undefined` | Cancel server startup or operation |
| `timeout` | `number` | `5000` | Server startup timeout in milliseconds |
| `config` | `Config` | `{}` | Inline OpenCode configuration |

Inline configuration is combined with the discovered `opencode.json`; use it to
override or add values for this instance:

```ts
import { createOpencode } from "@opencode-ai/sdk"

const opencode = await createOpencode({
  hostname: "127.0.0.1",
  port: 4096,
  config: {
    model: "anthropic/claude-3-5-sonnet-20241022",
  },
})

console.log(`Server running at ${opencode.server.url}`)
opencode.server.close()
```

Always close an SDK-started server when the integration exits. Prefer
`try/finally` when work between startup and shutdown can throw.

### Connect to an existing server

```ts
import { createOpencodeClient } from "@opencode-ai/sdk"

const client = createOpencodeClient({
  baseUrl: "http://localhost:4096",
})
```

Client-only options:

| Option | Type | Default | Purpose |
|---|---|---|---|
| `baseUrl` | `string` | `http://localhost:4096` | Existing server URL |
| `fetch` | function | `globalThis.fetch` | Custom fetch implementation |
| `parseAs` | `string` | `auto` | Response parsing strategy |
| `responseStyle` | `string` | `fields` | Return `data` or field-style responses |
| `throwOnError` | `boolean` | `false` | Throw request errors instead of returning them |

Choose error-handling code that matches `throwOnError`. With the default
`false`, inspect the returned result; set `throwOnError: true` when callers are
written around `try/catch`.

## Types and version compatibility

Import API types directly from the package:

```ts
import type { Session, Message, Part } from "@opencode-ai/sdk"
```

The definitions are generated from the server OpenAPI specification and are the
best source of truth for the installed package. Before depending on a method,
field, or response wrapper, inspect the installed SDK types and keep the SDK and
server versions compatible.

This matters especially for response access (`result.data` versus direct
fields), method argument shapes, and structured-output field naming.

## Error handling

When using `throwOnError: true`, catch SDK errors normally:

```ts
import { createOpencodeClient } from "@opencode-ai/sdk"

const client = createOpencodeClient({
  baseUrl: "http://localhost:4096",
  throwOnError: true,
})

try {
  await client.session.get({ path: { id: "invalid-id" } })
} catch (error) {
  console.error("Failed to get session:", (error as Error).message)
}
```

For long-running requests, also supply cancellation through an `AbortSignal`
where the installed SDK method supports it.

## Structured output

A session prompt can request validated JSON by providing a JSON Schema format:

```ts
const result = await client.session.prompt({
  path: { id: sessionId },
  body: {
    parts: [
      {
        type: "text",
        text: "Research Anthropic and provide company info",
      },
    ],
    format: {
      type: "json_schema",
      schema: {
        type: "object",
        properties: {
          company: { type: "string", description: "Company name" },
          founded: { type: "number", description: "Year founded" },
          products: {
            type: "array",
            items: { type: "string" },
            description: "Main products",
          },
        },
        required: ["company", "founded"],
      },
    },
  },
})

console.log(result.data.info.structured_output)
```

Supported output modes:

| Type | Behavior |
|---|---|
| `text` | Default unstructured text response |
| `json_schema` | Validated JSON matching the supplied schema |

A JSON Schema format contains:

| Field | Required | Meaning |
|---|---:|---|
| `type: "json_schema"` | Yes | Enables schema-constrained output |
| `schema` | Yes | JSON Schema for the result |
| `retryCount` | No | Validation retry count; default `2` |

If validation still fails after all retries, inspect `StructuredOutputError`:

```ts
if (result.data.info.error?.name === "StructuredOutputError") {
  console.error(
    "Failed to produce structured output:",
    result.data.info.error.message,
  )
  console.error("Attempts:", result.data.info.error.retries)
}
```

Some documentation or generated SDK versions may expose this prompt option as
`format` while others refer to `outputFormat`. Do not guess: use the property
accepted by the installed `session.prompt` body type.

Structured-output guidelines:

- Add clear descriptions to schema properties.
- Use `required` for fields that must be present.
- Prefer focused schemas over deeply nested, multi-purpose schemas.
- Increase `retryCount` only when schema complexity justifies the extra model
  attempts; reduce it for simple or latency-sensitive requests.
- Handle `StructuredOutputError` as a normal model-output failure mode.

## API map

The client groups server endpoints by domain.

### Global and application

| Method | Purpose | Response |
|---|---|---|
| `global.health()` | Check server health and version | `{ healthy: true, version: string }` |
| `app.log()` | Write an application log entry | `boolean` |
| `app.agents()` | List available agents | `Agent[]` |

```ts
const health = await client.global.health()
console.log(health.data.version)

await client.app.log({
  body: {
    service: "my-app",
    level: "info",
    message: "Operation completed",
  },
})

const agents = await client.app.agents()
```

### Project, path, and configuration

| Method | Purpose | Response |
|---|---|---|
| `project.list()` | List projects | `Project[]` |
| `project.current()` | Get the current project | `Project` |
| `path.get()` | Get current path information | `Path` |
| `config.get()` | Get effective configuration | `Config` |
| `config.providers()` | List providers and default models | `{ providers: Provider[], default: Record<string, string> }` |

```ts
const projects = await client.project.list()
const currentProject = await client.project.current()
const pathInfo = await client.path.get()
const config = await client.config.get()
const { providers, default: defaults } = await client.config.providers()
```

### Sessions

| Method | Purpose | Response/notes |
|---|---|---|
| `session.list()` | List sessions | `Session[]` |
| `session.get({ path })` | Get a session | `Session` |
| `session.children({ path })` | List child sessions | `Session[]` |
| `session.create({ body })` | Create a session | `Session` |
| `session.delete({ path })` | Delete a session | `boolean` |
| `session.update({ path, body })` | Update session properties | `Session` |
| `session.init({ path, body })` | Analyze the app and create `AGENTS.md` | `boolean` |
| `session.abort({ path })` | Abort a running session | `boolean` |
| `session.share({ path })` | Share a session | `Session` |
| `session.unshare({ path })` | Stop sharing a session | `Session` |
| `session.summarize({ path, body })` | Summarize a session | `boolean` |
| `session.messages({ path })` | List session messages | `{ info: Message, parts: Part[] }[]` |
| `session.message({ path })` | Get message details | `{ info: Message, parts: Part[] }` |
| `session.prompt({ path, body })` | Send a prompt | User message for `noReply`; otherwise assistant response |
| `session.command({ path, body })` | Send a command | Assistant message and parts |
| `session.shell({ path, body })` | Run a shell command | `AssistantMessage` |
| `session.revert({ path, body })` | Revert a message | `Session` |
| `session.unrevert({ path })` | Restore reverted messages | `Session` |
| `postSessionByIdPermissionsByPermissionId({ path, body })` | Respond to a permission request | `boolean` |

Create a session and prompt it:

```ts
const session = await client.session.create({
  body: { title: "My session" },
})

const result = await client.session.prompt({
  path: { id: session.id },
  body: {
    model: {
      providerID: "anthropic",
      modelID: "claude-3-5-sonnet-20241022",
    },
    parts: [{ type: "text", text: "Hello!" }],
  },
})
```

Inject context without requesting a model response:

```ts
await client.session.prompt({
  path: { id: session.id },
  body: {
    noReply: true,
    parts: [
      {
        type: "text",
        text: "You are a helpful assistant.",
      },
    ],
  },
})
```

`noReply: true` is useful for integrations and plugins that need to add context
without starting another assistant turn.

For choosing the latest assistant content from message history, streamed-event
fallbacks, and completion notifications, read `conversation.md`.

### Files and search

| Method | Purpose | Response |
|---|---|---|
| `find.text({ query })` | Search text in files | Match objects with path, lines, offsets, and submatches |
| `find.files({ query })` | Find files or directories by name | `string[]` |
| `find.symbols({ query })` | Find workspace symbols | `Symbol[]` |
| `file.read({ query })` | Read a file | `{ type: "raw" | "patch", content: string }` |
| `file.status({ query? })` | Get tracked-file status | `File[]` |

`find.files` accepts optional `type`, `directory`, and `limit` fields. `type` is
`"file"` or `"directory"`; `limit` is between 1 and 200.

```ts
const textResults = await client.find.text({
  query: { pattern: "function.*opencode" },
})

const files = await client.find.files({
  query: { query: "*.ts", type: "file" },
})

const directories = await client.find.files({
  query: { query: "packages", type: "directory", limit: 20 },
})

const content = await client.file.read({
  query: { path: "src/index.ts" },
})
```

### TUI control

| Method | Purpose |
|---|---|
| `tui.appendPrompt({ body })` | Append text to the prompt |
| `tui.openHelp()` | Open help |
| `tui.openSessions()` | Open the session selector |
| `tui.openThemes()` | Open the theme selector |
| `tui.openModels()` | Open the model selector |
| `tui.submitPrompt()` | Submit the current prompt |
| `tui.clearPrompt()` | Clear the prompt |
| `tui.executeCommand({ body })` | Execute a TUI command |
| `tui.showToast({ body })` | Show a toast notification |

These methods return `boolean`.

```ts
await client.tui.appendPrompt({
  body: { text: "Add this to prompt" },
})

await client.tui.showToast({
  body: { message: "Task completed", variant: "success" },
})
```

### Authentication

Set provider credentials with `auth.set(...)`:

```ts
await client.auth.set({
  path: { id: "anthropic" },
  body: { type: "api", key: "your-api-key" },
})
```

Do not log credentials or commit them to the repository. Prefer the project's
existing secret-management mechanism when constructing authentication bodies.

### Events

Subscribe to the server-sent event stream with `event.subscribe()`:

```ts
const events = await client.event.subscribe()

for await (const event of events.stream) {
  console.log("Event:", event.type, event.properties)
}
```

Treat the stream as long-lived:

- abort it during shutdown;
- handle disconnects and decide whether reconnection is safe;
- avoid blocking the event loop with slow handlers;
- remember that event envelopes are not a replacement for session history.

For OpenCode plugin event names and lifecycle mapping, read `events.md`. For
message-history lookup and current-turn text selection, read `conversation.md`.

## Integration checklist

1. Decide whether the integration owns the server process or connects to an
   existing one.
2. Verify SDK/server version compatibility from installed types.
3. Set `throwOnError` deliberately and use the matching error-handling style.
4. Close SDK-started servers and cancel long-lived subscriptions on shutdown.
5. Use `noReply: true` only for context injection, not when an assistant response
   is required.
6. Validate structured-output errors rather than assuming the schema always
   succeeds.
7. Keep API keys out of logs and source control.
8. Use session APIs for transcripts; do not treat an event payload as complete
   conversation history.
