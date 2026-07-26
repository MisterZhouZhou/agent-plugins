# OpenCode HTTP Server

`opencode serve` runs OpenCode as a headless HTTP server. Clients can use the
HTTP API directly or connect through `@opencode-ai/sdk`.

OpenCode itself follows the same architecture: the normal TUI is a client that
talks to an OpenCode server. The server publishes an OpenAPI 3.1 specification,
which is also used to generate the JavaScript/TypeScript SDK.

## Start a standalone server

```bash
opencode serve [--port <number>] [--hostname <string>] [--cors <origin>]
```

Options:

| Flag | Default | Meaning |
|---|---|---|
| `--port` | `4096` | TCP port to listen on |
| `--hostname` | `127.0.0.1` | Hostname or address to bind |
| `--mdns` | `false` | Advertise the server with mDNS |
| `--mdns-domain` | `opencode.local` | Custom mDNS service domain |
| `--cors` | `[]` | Additional browser origin to allow |

Pass `--cors` more than once to allow multiple browser origins:

```bash
opencode serve \
  --cors http://localhost:5173 \
  --cors https://app.example.com
```

A standalone `opencode serve` process is separate from the server behind an
already-running TUI.

## Authentication and exposure

Set `OPENCODE_SERVER_PASSWORD` to enable HTTP Basic authentication. The default
username is `opencode`; override it with `OPENCODE_SERVER_USERNAME`.

```bash
OPENCODE_SERVER_PASSWORD='your-password' opencode serve
```

```bash
OPENCODE_SERVER_USERNAME='automation' \
OPENCODE_SERVER_PASSWORD='your-password' \
opencode serve --hostname 127.0.0.1 --port 4096
```

Security rules:

- Keep the default loopback bind unless remote access is intentional.
- Set a password before binding to a non-loopback interface.
- Treat `--cors` as browser-origin control, not authentication.
- Allow only the browser origins that need access; do not add broad origins by
  default.
- Keep credentials out of source control, logs, command history, and URLs.
- The same username/password environment variables apply to `opencode serve`
  and `opencode web`.

## Connect to the TUI server

The normal TUI starts its own server. Without explicit flags, its hostname and
port may be assigned dynamically. Pass stable values when another client must
connect:

```bash
opencode --hostname 127.0.0.1 --port 4096
```

Then connect an SDK or HTTP client to that address. The `/tui` endpoints can
drive the running TUI—for example, append or submit a prompt. OpenCode IDE
plugins use this client/server pattern.

If a TUI is already running and you execute `opencode serve`, the serve command
starts another server; it does not attach to the existing TUI server.

## OpenAPI specification

The server exposes its OpenAPI 3.1 documentation at:

```text
http://<hostname>:<port>/doc
```

For the defaults:

```text
http://localhost:4096/doc
```

Use `/doc` to inspect the exact request/response shapes for the installed server,
open the API in a Swagger-style explorer, or generate a client. Prefer the live
spec and installed SDK types over copied endpoint assumptions when versions may
differ.

## API inventory

### Global

| Method | Path | Purpose | Response |
|---|---|---|---|
| `GET` | `/global/health` | Get server health and version | `{ healthy: true, version: string }` |
| `GET` | `/global/event` | Subscribe to global events | SSE stream |

### Project

| Method | Path | Purpose | Response |
|---|---|---|---|
| `GET` | `/project` | List all projects | `Project[]` |
| `GET` | `/project/current` | Get the current project | `Project` |

### Path and VCS

| Method | Path | Purpose | Response |
|---|---|---|---|
| `GET` | `/path` | Get current path information | `Path` |
| `GET` | `/vcs` | Get VCS information for the current project | `VcsInfo` |

### Instance

| Method | Path | Purpose | Response |
|---|---|---|---|
| `POST` | `/instance/dispose` | Dispose the current instance | `boolean` |

### Configuration

| Method | Path | Purpose | Response |
|---|---|---|---|
| `GET` | `/config` | Get effective configuration | `Config` |
| `PATCH` | `/config` | Update configuration | `Config` |
| `GET` | `/config/providers` | List providers and default models | `{ providers: Provider[], default: Record<string, string> }` |

### Providers

| Method | Path | Purpose | Response |
|---|---|---|---|
| `GET` | `/provider` | List providers and connection state | `{ all: Provider[], default: object, connected: string[] }` |
| `GET` | `/provider/auth` | List provider authentication methods | `Record<string, ProviderAuthMethod[]>` |
| `POST` | `/provider/{id}/oauth/authorize` | Start provider OAuth authorization | `ProviderAuthAuthorization` |
| `POST` | `/provider/{id}/oauth/callback` | Complete provider OAuth callback | `boolean` |

Do not log provider authorization payloads or credentials.

### Sessions

| Method | Path | Purpose | Body/query and response |
|---|---|---|---|
| `GET` | `/session` | List sessions | `Session[]` |
| `POST` | `/session` | Create a session | body `{ parentID?, title? }`; returns `Session` |
| `GET` | `/session/status` | Get status for all sessions | `Record<string, SessionStatus>` |
| `GET` | `/session/:id` | Get session details | `Session` |
| `DELETE` | `/session/:id` | Delete a session and its data | `boolean` |
| `PATCH` | `/session/:id` | Update a session | body `{ title? }`; returns `Session` |
| `GET` | `/session/:id/children` | List child sessions | `Session[]` |
| `GET` | `/session/:id/todo` | Get the session todo list | `Todo[]` |
| `POST` | `/session/:id/init` | Analyze app and create `AGENTS.md` | body `{ messageID, providerID, modelID }`; returns `boolean` |
| `POST` | `/session/:id/fork` | Fork at a message | body `{ messageID? }`; returns `Session` |
| `POST` | `/session/:id/abort` | Abort the running session | `boolean` |
| `POST` | `/session/:id/share` | Share a session | `Session` |
| `DELETE` | `/session/:id/share` | Unshare a session | `Session` |
| `GET` | `/session/:id/diff` | Get session diff | query `messageID?`; returns `FileDiff[]` |
| `POST` | `/session/:id/summarize` | Summarize a session | body `{ providerID, modelID }`; returns `boolean` |
| `POST` | `/session/:id/revert` | Revert a message | body `{ messageID, partID? }`; returns `boolean` |
| `POST` | `/session/:id/unrevert` | Restore reverted messages | `boolean` |
| `POST` | `/session/:id/permissions/:permissionID` | Answer a permission request | body `{ response, remember? }`; returns `boolean` |

Deleting, reverting, sharing, and answering permissions are state-changing
operations. Confirm the target session and identifier before sending them from
automation.

### Messages and execution

| Method | Path | Purpose | Body/query and response |
|---|---|---|---|
| `GET` | `/session/:id/message` | List messages | query `limit?`; returns `{ info: Message, parts: Part[] }[]` |
| `POST` | `/session/:id/message` | Send a message and wait | body `{ messageID?, model?, agent?, noReply?, system?, tools?, parts }`; returns message and parts |
| `GET` | `/session/:id/message/:messageID` | Get one message | message and parts |
| `POST` | `/session/:id/prompt_async` | Send a message without waiting | same body as message endpoint; returns `204 No Content` |
| `POST` | `/session/:id/command` | Execute a slash command | body `{ messageID?, agent?, model?, command, arguments }`; returns message and parts |
| `POST` | `/session/:id/shell` | Run a shell command | body `{ agent, model?, command }`; returns message and parts |

Use the asynchronous endpoint when the caller will observe progress through SSE
or query session state later. A `204` confirms acceptance, not model completion.

### Commands

| Method | Path | Purpose | Response |
|---|---|---|---|
| `GET` | `/command` | List available commands | `Command[]` |

### Files and search

| Method | Path | Purpose | Response |
|---|---|---|---|
| `GET` | `/find?pattern=<pat>` | Search text in files | Match objects with paths, lines, offsets, and submatches |
| `GET` | `/find/file?query=<q>` | Find files/directories by name | `string[]` |
| `GET` | `/find/symbol?query=<q>` | Find workspace symbols | `Symbol[]` |
| `GET` | `/file?path=<path>` | List files and directories | `FileNode[]` |
| `GET` | `/file/content?path=<p>` | Read file content | `FileContent` |
| `GET` | `/file/status` | Get tracked-file status | `File[]` |

`/find/file` query parameters:

| Parameter | Required | Meaning |
|---|---:|---|
| `query` | Yes | Fuzzy search string |
| `type` | No | `file` or `directory` |
| `directory` | No | Override the project root |
| `limit` | No | Maximum results, from 1 to 200 |
| `dirs` | No | Legacy flag; `false` returns only files |

Treat any client-supplied path or directory override as untrusted input and keep
it within the intended workspace boundary.

### Experimental tools

| Method | Path | Purpose | Response |
|---|---|---|---|
| `GET` | `/experimental/tool/ids` | List tool IDs | `ToolIDs` |
| `GET` | `/experimental/tool?provider=<p>&model=<m>` | List tools and JSON Schemas for a model | `ToolList` |

Experimental endpoints can change. Confirm them against `/doc` before building a
stable integration.

### LSP, formatters, and MCP

| Method | Path | Purpose | Response |
|---|---|---|---|
| `GET` | `/lsp` | Get LSP server status | `LSPStatus[]` |
| `GET` | `/formatter` | Get formatter status | `FormatterStatus[]` |
| `GET` | `/mcp` | Get MCP server status | `Record<string, MCPStatus>` |
| `POST` | `/mcp` | Add an MCP server dynamically | body `{ name, config }`; returns MCP status |

For persistent MCP configuration and OAuth behavior, read `mcp.md`. For custom
LSP configuration, read `lsp.md`.

### Agents and logging

| Method | Path | Purpose | Response |
|---|---|---|---|
| `GET` | `/agent` | List available agents | `Agent[]` |
| `POST` | `/log` | Write a structured log entry | body `{ service, level, message, extra? }`; returns `boolean` |

### TUI control

| Method | Path | Purpose | Response |
|---|---|---|---|
| `POST` | `/tui/append-prompt` | Append text to the prompt | `boolean` |
| `POST` | `/tui/open-help` | Open help | `boolean` |
| `POST` | `/tui/open-sessions` | Open session selector | `boolean` |
| `POST` | `/tui/open-themes` | Open theme selector | `boolean` |
| `POST` | `/tui/open-models` | Open model selector | `boolean` |
| `POST` | `/tui/submit-prompt` | Submit current prompt | `boolean` |
| `POST` | `/tui/clear-prompt` | Clear current prompt | `boolean` |
| `POST` | `/tui/execute-command` | Execute a command | body `{ command }`; returns `boolean` |
| `POST` | `/tui/show-toast` | Show a toast | body `{ title?, message, variant }`; returns `boolean` |
| `GET` | `/tui/control/next` | Wait for the next control request | Control request object |
| `POST` | `/tui/control/response` | Respond to a control request | body `{ body }`; returns `boolean` |

TUI endpoints affect the interactive client. Do not use them as a substitute for
session APIs when no TUI is attached.

### Authentication

| Method | Path | Purpose | Response |
|---|---|---|---|
| `PUT` | `/auth/:id` | Set provider credentials; body must match provider schema | `boolean` |

Protect this endpoint with server authentication and avoid storing raw request
bodies in logs.

### Events

| Method | Path | Purpose | Response |
|---|---|---|---|
| `GET` | `/event` | Subscribe to instance events; first event is `server.connected` | SSE stream |

Use `/global/event` for global events and `/event` for the current server
instance. Event envelopes are not full conversation transcripts; query session
messages when complete content is required.

### Documentation

| Method | Path | Purpose | Response |
|---|---|---|---|
| `GET` | `/doc` | View OpenAPI 3.1 specification | HTML documentation page |

## HTTP integration checklist

1. Decide whether to connect to a standalone server or the TUI-owned server.
2. Keep the server loopback-only unless remote access is required.
3. Configure Basic authentication before remote exposure.
4. Add only required CORS origins.
5. Check `/global/health` and version compatibility before issuing work.
6. Use `/doc` as the source of truth for the running version.
7. Handle SSE cancellation, disconnects, and reconnection deliberately.
8. Treat `prompt_async` acceptance separately from eventual completion.
9. Confirm identifiers before destructive or state-changing session calls.
10. Prefer `@opencode-ai/sdk` when its generated types cover the integration.

For the type-safe JavaScript/TypeScript client, read `sdk.md`. For event names
and plugin-side handling, read `events.md`.
