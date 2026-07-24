# Codex App Server

Codex **app-server** is the interface used by rich clients (for example the
Codex VS Code extension). Use it for deep product integrations: auth,
conversation history, approvals, and streamed agent events.

Open source: [openai/codex `codex-rs/app-server`](https://github.com/openai/codex/tree/main/codex-rs/app-server).

## When to use what

| Goal | Prefer |
|---|---|
| Deep IDE/product integration, history, approvals, event stream | **App server** (this file) |
| Programmatic coding threads from TS/Python | **SDK** → `sdk.md` |
| Expose Codex as MCP tools to other agents | **MCP server** → `mcp-server.md` |
| CI one-shot jobs | SDK or non-interactive CLI, not a full app-server client |

## Start and connect

Default (stdio):

```bash
codex app-server
```

TCP WebSocket (experimental and unsupported as a stable public transport):

```bash
codex app-server --listen ws://127.0.0.1:4500
```

Unix socket:

```bash
codex app-server --listen unix://
# or custom path
codex app-server --listen unix://PATH
```

Disable local transport:

```bash
codex app-server --listen off
```

### Remote terminal UI

Run app-server on one machine and attach the CLI TUI from another:

```bash
codex app-server --listen ws://127.0.0.1:4500
codex --remote ws://127.0.0.1:4500
```

For non-local links, put TLS in front and pass a bearer token via env name
(not the raw token on the command line):

```bash
export CODEX_REMOTE_TOKEN="$(cat "$HOME/.codex/app-server-token")"
codex --remote wss://remote-host:4500 \
  --remote-auth-token-env CODEX_REMOTE_TOKEN
```

`--remote` accepts `ws://`, `wss://`, `unix://`, and `unix://PATH`. Prefer plain
WebSockets only for localhost or SSH port-forwards.

Remote TUI support demonstrates the transport, but does not make WebSocket a
stable production integration contract. For custom products, prefer stdio or a
local/SSH-forwarded socket while WebSocket remains experimental. If remote WS is
unavoidable, require TLS, authentication, origin/network controls, overload
retry handling, and version-pinned generated schemas.

### WebSocket auth (when exposing beyond loopback)

Non-loopback WS may allow unauthenticated connections by default during rollout.
Configure auth before remote exposure:

```text
--ws-auth capability-token --ws-token-file /absolute/path
--ws-auth capability-token --ws-token-sha256 HEX
--ws-auth signed-bearer-token --ws-shared-secret-file /absolute/path
```

Optional for signed tokens: `--ws-issuer`, `--ws-audience`,
`--ws-max-clock-skew-seconds`. Client presents `Authorization: Bearer <token>`
before JSON-RPC `initialize`. Prefer token files over CLI raw secrets.

### Health probes (WS listen mode)

Same listener serves:

- `GET /readyz` → `200` when accepting connections
- `GET /healthz` → `200` when no `Origin` header
- requests with `Origin` → `403`

When ingress queues are full, new requests get JSON-RPC `-32001`
`"Server overloaded; retry later."` — retry with exponential backoff + jitter.

## Protocol

Bidirectional **JSON-RPC 2.0** with `"jsonrpc":"2.0"` omitted on the wire
(MCP-like).

Transports:

| Transport | Flag | Framing |
|---|---|---|
| stdio | `--listen stdio://` (default) | JSONL (newline-delimited) |
| WebSocket | `--listen ws://IP:PORT` | one JSON-RPC message per text frame (experimental) |
| Unix | `--listen unix://` or `unix://PATH` | WebSocket over Unix socket |
| off | `--listen off` | no local transport |

### Message shapes

Request:

```json
{ "method": "thread/start", "id": 10, "params": { "model": "gpt-5.4" } }
```

Response success / error:

```json
{ "id": 10, "result": { "thread": { "id": "thr_123" } } }
{ "id": 10, "error": { "code": 123, "message": "Something went wrong" } }
```

Notification (no `id`):

```json
{ "method": "turn/started", "params": { "turn": { "id": "turn_456" } } }
```

Generate version-matched schemas:

```bash
codex app-server generate-ts --out ./schemas
codex app-server generate-json-schema --out ./schemas
```

## Minimal client flow

1. Start `codex app-server` (or WS/Unix listen).
2. Connect → send `initialize` → send `initialized`.
3. `thread/start` (or `thread/resume` / `thread/fork`).
4. `turn/start` with input; keep reading notifications.
5. Handle approvals; finish on `turn/completed`.

### Initialize

Must be first method per connection. Then emit `initialized`.  
Before handshake → `Not initialized`. Second `initialize` → `Already initialized`.

```json
{
  "method": "initialize",
  "id": 0,
  "params": {
    "clientInfo": {
      "name": "my_product",
      "title": "My Product",
      "version": "0.1.0"
    }
  }
}
```

Use a stable `clientInfo.name` for compliance logs. Enterprise integrations may
need OpenAI to register the client name.

Optional capabilities:

| Capability | Purpose |
|---|---|
| `experimentalApi` | Enable experimental methods/fields |
| `optOutNotificationMethods` | Exact notification method names to suppress |
| `requestAttestation` | Server-initiated `attestation/generate` |
| `mcpServerOpenaiFormElicitation` | OpenAI form variant of MCP elicitation |

Without opt-in, experimental use is rejected:
`<descriptor> requires experimentalApi capability`.

## Core primitives

| Primitive | Meaning |
|---|---|
| **Thread** | Conversation; contains turns |
| **Turn** | One user request + agent work; streams items |
| **Item** | Message, command, file change, tool call, review, etc. |

## Lifecycle

1. **Initialize** once per connection.
2. **Start/resume/fork** a thread.
3. **`turn/start`** with `threadId` + input (text/image/localImage).
4. Optionally **`turn/steer`** to append to the in-flight turn.
5. **Stream** `item/*`, `turn/*`, approvals.
6. **`turn/completed`** or **`turn/interrupt`**.

## API map (high level)

### Threads

| Method | Role |
|---|---|
| `thread/start` | New conversation; emits `thread/started` |
| `thread/resume` | Continue by id |
| `thread/fork` | Branch history; optional `lastTurnId` |
| `thread/read` | Read stored thread without resume; `includeTurns` |
| `thread/list` | Paginate history (cursor, filters, sort) |
| `thread/turns/list` | Experimental turn pagination |
| `thread/items/list` | Experimental item pagination |
| `thread/loaded/list` | In-memory thread ids |
| `thread/name/set` | User-facing title |
| `thread/goal/set\|get\|clear` | Persisted goal (like TUI `/goal`) |
| `thread/metadata/update` | e.g. `gitInfo` |
| `thread/archive` / `unarchive` / `delete` | Lifecycle of rollouts |
| `thread/unsubscribe` | Drop subscription; may emit `thread/closed` after idle |
| `thread/compact/start` | History compaction |
| `thread/shellCommand` | User shell **outside** sandbox (full access) |
| `thread/inject_items` | Append Responses items without a user turn |
| `thread/rollback` | Deprecated; drop last N turns |
| `thread/backgroundTerminals/*` | Experimental background process control |

Common start params: `model`, `cwd`, `approvalPolicy`, `sandbox` / experimental
`permissions`, `personality`, `serviceName`, experimental `historyMode`,
experimental `dynamicTools`.

Required MCP servers that fail to init can fail `thread/start` / `resume`.

### Turns

| Method | Role |
|---|---|
| `turn/start` | User input + generation; stream events |
| `turn/steer` | Append input to active turn (`expectedTurnId`) |
| `turn/interrupt` | Cancel in-flight turn → `status: interrupted` |

Input item types: `text`, `image`, `localImage`, plus `skill` / `mention` for
skills and apps.

Per-turn overrides (model, effort, personality, cwd, sandbox, summary) become
defaults for later turns; `outputSchema` is turn-scoped only.

Sandbox types include `readOnly`, `workspaceWrite`, `dangerFullAccess`,
`externalSandbox` with optional read-access roots / network flags.

### Skills, apps, plugins, MCP (via app-server)

| Method | Role |
|---|---|
| `skills/list`, `skills/config/write`, `skills/extraRoots/set` | Discover/enable skills |
| `skills/changed` | Notify when skill files change |
| `hooks/list` | Lifecycle hooks for cwds |
| `app/list`, `app/list/updated` | Connectors/apps |
| `marketplace/*`, `plugin/*` | Marketplaces/plugins (some under development) |
| `mcpServer/oauth/login`, `mcpServerStatus/list`, … | MCP auth and tools |
| `config/read`, `config/value/write`, `config/batchWrite` | Config on disk |
| `configRequirements/read` | Admin requirements |
| `externalAgentConfig/detect\|import` | Migrate Claude/other agent artifacts |

Invoke skills on a turn: include `$skill-name` text **and** a `skill` input item
with path when possible. Invoke apps with `$app-slug` + `mention` (`app://id`).

### Models and features

- `model/list` — models, efforts, modalities, personality support, hidden flag
- `experimentalFeature/list` / `enablement/set`
- `permissionProfile/list` (beta profiles vs legacy sandbox)
- `collaborationMode/list` (experimental)
- `environment/info` (experimental remote env)

### Commands / process / filesystem

- `command/exec` (+ write/resize/terminate/outputDelta) — sandboxed one-shot
- `process/*` — experimental unsandboxed process control (`experimentalApi`)
- `fs/*` — absolute-path filesystem API + watch notifications

### Auth / account

- `account/read`, `login/start`, `login/cancel`, `logout`
- Modes: API key, ChatGPT OAuth, device code, experimental external tokens, Bedrock
- Rate limits, usage, workspace messages, earned reset credits
- Notifications: `account/updated`, `account/login/completed`, rate limit updates

## Notifications to handle

| Area | Methods |
|---|---|
| Thread | `thread/started`, `archived`, `unarchived`, `deleted`, `closed`, `status/changed`, `name/updated`, goal events |
| Turn | `turn/started`, `completed`, `diff/updated`, `plan/updated` |
| Items | `item/started`, `item/completed`, deltas (`agentMessage`, reasoning, command output, …) |
| Approvals | `item/commandExecution/requestApproval`, `item/fileChange/requestApproval`, `tool/requestUserInput`, `item/permissions/requestApproval`, `mcpServer/elicitation/request` |
| MCP | oauth login completed, startup status |
| Config/import | external agent import progress/completed |
| FS | `fs/changed` |

Opt out exact methods via `optOutNotificationMethods` (no wildcards).

## Approvals (client must answer)

Server-initiated requests; respond with decisions then expect
`serverRequest/resolved` and `item/completed`.

**Commands:** `accept` | `acceptForSession` | `decline` | `cancel` |
`acceptWithExecpolicyAmendment`.

**File changes:** `accept` | `acceptForSession` | `decline` | `cancel`.

**Permissions tool:** return granted subset; `scope: "session"` vs turn.

**Network approvals:** when `networkApprovalContext` is set, treat as managed
network access (host/protocol/port), not a normal shell preview.

## Errors

Failed turns emit error payload then `status: "failed"`.  
`codexErrorInfo` may include `ContextWindowExceeded`, `UsageLimitExceeded`,
HTTP/stream failures, `Unauthorized`, `SandboxError`, etc.

## Minimal stdio sketch

```ts
// spawn: codex app-server  (stdio JSONL)
// 1) initialize + initialized
// 2) thread/start → capture result.thread.id
// 3) turn/start { threadId, input: [{ type: "text", text: "..." }] }
// 4) on line: parse notifications until turn/completed
// 5) answer approval requests when received
```

## Safety notes

- Do not expose unauthenticated non-loopback WebSocket.
- Prefer token files / env for secrets.
- `thread/shellCommand` is full access — only for explicit user actions.
- Experimental APIs require `experimentalApi: true` and may change.
- For CI-only automation, prefer SDK over implementing a full app-server client.

## Checklist

1. Confirm integration depth needs app-server (not just SDK).
2. Pick transport: stdio (default) vs localhost WS vs Unix.
3. Generate schemas for your Codex version.
4. Handshake `initialize` / `initialized` with proper `clientInfo`.
5. Implement thread + turn loop + notification reader.
6. Implement approval UI for command/file/network/MCP.
7. Wire auth if the product owns login.
8. Opt into experimental APIs only intentionally.

## Related

- Codex SDK: `sdk.md`
- Codex MCP server: `mcp-server.md`
- Codex hooks/plugins (CLI packaging): `hooks.md`, `plugins.md`
- Codex subagents: `subagents.md`
