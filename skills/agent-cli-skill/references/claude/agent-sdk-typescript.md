# Claude Agent SDK TypeScript Reference

Use this file for the TypeScript API exported by `@anthropic-ai/claude-agent-sdk`: functions, `Options`, the `Query` control surface, sessions, messages, hooks, permissions, MCP, tool schemas, subprocess configuration, and sandboxing.

For general concepts and Python/TypeScript comparison, read `agent-sdk.md`. For a version-sensitive symbol not covered here, find the current TypeScript page through:

```text
https://code.claude.com/docs/llms.txt
```

## Version contract

- Install with `npm install @anthropic-ai/claude-agent-sdk`.
- The package normally installs a platform-specific native Claude Code binary as an optional dependency.
- SDK and bundled Claude Code versions are patch-aligned. If a feature requires Claude Code `2.1.x`, use an SDK release whose corresponding bundled CLI contains that capability.
- Feature-detect protocol behavior through `SDKSystemMessage.capabilities` when available instead of comparing version strings.
- Treat all fields marked alpha, experimental, deprecated, or minimum-version-gated as version-sensitive and re-check the official TypeScript reference/changelog before shipping.

Do not interpret a version number used in documentation examples as a recommendation to pin that exact version.

## Installation and native binary

```bash
npm install @anthropic-ai/claude-agent-sdk
```

The native package name varies by platform, for example:

```text
@anthropic-ai/claude-agent-sdk-darwin-arm64
@anthropic-ai/claude-agent-sdk-linux-x64
@anthropic-ai/claude-agent-sdk-win32-x64
```

If optional dependencies were skipped, startup can fail with:

```text
Native CLI binary for <platform> not found
```

Fix either by reinstalling optional dependencies or by pointing the SDK at a separately installed executable:

```typescript
import { query } from "@anthropic-ai/claude-agent-sdk";

for await (const message of query({
  prompt: "Hello",
  options: {
    pathToClaudeCodeExecutable: "/absolute/path/to/claude",
  },
})) {
  console.log(message);
}
```

## Bun single-file executables

`bun build --compile` places modules in Bun's virtual `$bunfs` filesystem. The SDK cannot use `require.resolve()` there to execute the bundled binary directly.

Embed the platform binary as a file asset, extract it to a real path, then pass that path to `pathToClaudeCodeExecutable`:

```typescript
import binPath from "@anthropic-ai/claude-agent-sdk-darwin-arm64/claude" with { type: "file" };
import { extractFromBunfs } from "@anthropic-ai/claude-agent-sdk/extract";
import { query } from "@anthropic-ai/claude-agent-sdk";

const cliPath = extractFromBunfs(binPath);

for await (const message of query({
  prompt: "Hello",
  options: { pathToClaudeCodeExecutable: cliPath },
})) {
  console.log(message);
}
```

`extractFromBunfs()` requires an SDK version that includes that helper. Outside a compiled executable it returns the supplied path unchanged.

Each compiled executable embeds one platform binary:

- Match the imported platform package to Bun's `--target`.
- Install a non-host platform package explicitly when cross-compiling.
- Windows package binary subpaths use `claude.exe`.

## API map

| API | Purpose |
|---|---|
| `query()` | Start or resume an agent session and stream `SDKMessage` values |
| `startup()` | Pre-warm the subprocess and initialization handshake |
| `tool()` | Define a type-safe in-process MCP tool with Zod |
| `createSdkMcpServer()` | Build an in-process MCP server from SDK tools |
| `listSessions()` | List persisted sessions |
| `getSessionMessages()` | Read user/assistant transcript messages |
| `getSessionInfo()` | Read one session's metadata |
| `renameSession()` | Set a persisted custom title |
| `tagSession()` | Set or clear a session tag |
| `resolveSettings()` | Inspect effective Claude Code settings without spawning the CLI; alpha |

## `query()`

```typescript
function query({
  prompt,
  options,
}: {
  prompt: string | AsyncIterable<SDKUserMessage>;
  options?: Options;
}): Query;
```

- A string prompt is single-message input mode.
- An `AsyncIterable<SDKUserMessage>` enables streaming input and multi-turn control.
- The returned `Query` is both an async generator and a live control object.
- Always consume the stream through completion or call `close()` during cleanup.
- A single-message query can yield an error result and then throw. Handle both streamed result data and iterator exceptions.

Basic handling:

```typescript
import { query } from "@anthropic-ai/claude-agent-sdk";

try {
  for await (const message of query({
    prompt: "Review this repository",
    options: {
      allowedTools: ["Read", "Glob", "Grep"],
      maxTurns: 8,
    },
  })) {
    if (message.type === "result") {
      if (message.subtype === "success") {
        console.log(message.result);
      } else {
        console.error(message.errors);
      }
    }
  }
} catch (error) {
  console.error("Claude Agent SDK process failed", error);
}
```

## `startup()` and `WarmQuery`

Pre-warm the subprocess when startup latency matters:

```typescript
import { startup } from "@anthropic-ai/claude-agent-sdk";

await using warm = await startup({
  options: { maxTurns: 3 },
  initializeTimeoutMs: 60_000,
});

for await (const message of warm.query("What files are here?")) {
  console.log(message);
}
```

```typescript
interface WarmQuery extends AsyncDisposable {
  query(prompt: string | AsyncIterable<SDKUserMessage>): Query;
  close(): void;
}
```

Rules:

- One `WarmQuery` accepts one prompt.
- Call `close()` if the pre-warmed process is no longer needed.
- `await using` provides automatic cleanup in runtimes supporting async disposal.
- `initializeTimeoutMs` defaults to 60 seconds.

## Custom tools and in-process MCP

### `tool()`

```typescript
function tool<Schema extends AnyZodRawShape>(
  name: string,
  description: string,
  inputSchema: Schema,
  handler: (
    args: InferShape<Schema>,
    extra: unknown,
  ) => Promise<CallToolResult>,
  extras?: {
    annotations?: ToolAnnotations;
    searchHint?: string;
    alwaysLoad?: boolean;
  },
): SdkMcpToolDefinition<Schema>;
```

- Supports Zod 3 and Zod 4 raw shapes.
- `searchHint` describes a deferred tool when tool search is enabled.
- `alwaysLoad: true` keeps the full tool schema in the initial prompt.
- MCP annotations are behavioral hints, not a security boundary.

```typescript
import { tool } from "@anthropic-ai/claude-agent-sdk";
import { z } from "zod";

const searchTool = tool(
  "search",
  "Search the product catalog",
  { query: z.string() },
  async ({ query }) => ({
    content: [{ type: "text", text: `Results for: ${query}` }],
  }),
  {
    annotations: {
      readOnlyHint: true,
      openWorldHint: false,
    },
    searchHint: "Search the internal product catalog",
  },
);
```

### Tool annotations

| Hint | Default | Meaning |
|---|---:|---|
| `title` | undefined | Human-readable title |
| `readOnlyHint` | `false` | Tool does not modify its environment |
| `destructiveHint` | `true` | Tool may perform destructive updates |
| `idempotentHint` | `false` | Repeated calls have no additional effect |
| `openWorldHint` | `true` | Tool interacts with external entities |

### `createSdkMcpServer()`

```typescript
function createSdkMcpServer(options: {
  name: string;
  version?: string;
  instructions?: string;
  tools?: Array<SdkMcpToolDefinition<any>>;
  alwaysLoad?: boolean;
}): McpSdkServerConfigWithInstance;
```

Use the returned value as an `mcpServers` entry:

```typescript
import {
  createSdkMcpServer,
  query,
  tool,
} from "@anthropic-ai/claude-agent-sdk";
import { z } from "zod";

const server = createSdkMcpServer({
  name: "internal",
  instructions: "Use these tools for internal product data.",
  tools: [
    tool("lookup", "Look up a product", { id: z.string() }, async ({ id }) => ({
      content: [{ type: "text", text: `Product ${id}` }],
    })),
  ],
});

const result = query({
  prompt: "Look up product 42",
  options: {
    mcpServers: { internal: server },
    allowedTools: ["mcp__internal__lookup"],
  },
});
```

## Persisted-session APIs

### `listSessions()`

```typescript
const sessions = await listSessions({
  dir: "/path/to/project",
  limit: 10,
  includeWorktrees: true,
});
```

`SDKSessionInfo` includes:

- `sessionId`
- `summary`
- `lastModified`
- optional `fileSize`
- optional `customTitle`
- optional `firstPrompt`
- optional `gitBranch`
- optional `cwd`
- optional `tag`
- optional `createdAt`

Results are ordered newest-first by `lastModified`. Omitting `dir` searches across projects. When `dir` is inside a Git repository, `includeWorktrees` defaults to true.

### Read session content

```typescript
const messages = await getSessionMessages(sessionId, {
  dir: "/path/to/project",
  limit: 20,
  offset: 0,
});
```

`SessionMessage` contains role, UUID, session ID, raw message payload, and optional subagent provenance through `parent_tool_use_id` and `parent_agent_id`.

Use `getSessionInfo(sessionId, { dir })` when only metadata is needed.

### Mutate metadata

```typescript
await renameSession(sessionId, "PR 142 review", { dir });
await tagSession(sessionId, "security", { dir });
await tagSession(sessionId, null, { dir }); // clear tag
```

Renaming and tagging append metadata entries; the latest value wins.

## `resolveSettings()`

`resolveSettings()` uses the CLI merge engine without spawning Claude Code:

```typescript
import { resolveSettings } from "@anthropic-ai/claude-agent-sdk";

const { effective, provenance, sources } = await resolveSettings({
  cwd: "/path/to/project",
  settingSources: ["user", "project", "local"],
});

console.log(effective);
console.log(provenance.permissions);
console.log(sources);
```

This API is alpha. Important differences from a live trusted session include:

- It reads MDM-managed sources for parity.
- It does not execute a configured `policyHelper` subprocess.
- It can return `permissions.defaultMode` without applying the CLI's trust filter.
- Endpoint-managed policy still loads even when filesystem setting sources are empty.
- Server-managed settings come from the provided payload or local cache; the snapshot does not fetch them from the network.

Use it for diagnostics and previews, not as proof that the live session will honor an escalating permission mode.

## `Options` grouped reference

The upstream `Options` interface changes frequently. Use these groups to locate the relevant control, then verify its exact type in the current API page.

### Process, cancellation, and directories

| Option | Purpose / trap |
|---|---|
| `abortController` | Cancel work; default is a new controller |
| `cwd` | Working directory; defaults to `process.cwd()` |
| `additionalDirectories` | Extra accessible directories |
| `pathToClaudeCodeExecutable` | Override bundled CLI path |
| `spawnClaudeCodeProcess` | Custom process launcher for VM/container/remote execution |
| `executable` | Force `bun`, `deno`, or `node` runtime |
| `executableArgs` | Extra runtime arguments |
| `extraArgs` | Extra Claude Code CLI arguments |
| `env` | **Replaces** the child environment; spread `process.env` to retain `PATH` and credentials |
| `stderr` | Receive subprocess stderr |
| `debug` / `debugFile` | Enable and route debug logging |

Safe environment extension:

```typescript
options: {
  env: {
    ...process.env,
    CLAUDE_AGENT_SDK_CLIENT_APP: "my-service/1.0",
  },
}
```

### Model, thinking, turn, and budget controls

| Option | Purpose |
|---|---|
| `model` | Model alias or full provider-specific ID |
| `fallbackModel` | Fallback when the primary model fails |
| `effort` | `low`, `medium`, `high`, `xhigh`, or `max` where supported |
| `thinking` | Adaptive, enabled with optional budget, or disabled |
| `maxThinkingTokens` | Deprecated; use `thinking` |
| `maxTurns` | Maximum agentic tool-use round trips |
| `maxBudgetUsd` | Stop against client-side estimated cost |
| `taskBudget` | Alpha API-side token task budget |
| `betas` | Enable named beta features |

`ThinkingConfig`:

```typescript
type ThinkingConfig =
  | { type: "adaptive"; display?: "summarized" | "omitted" }
  | {
      type: "enabled";
      budgetTokens?: number;
      display?: "summarized" | "omitted";
    }
  | { type: "disabled" };
```

### Tool, permission, and sandbox controls

| Option | Purpose / trap |
|---|---|
| `tools` | Explicit built-in names or Claude Code preset |
| `allowedTools` | Auto-approve; does not restrict the context to only these tools |
| `disallowedTools` | Remove/deny tools or scoped calls |
| `permissionMode` | Session permission mode |
| `allowDangerouslySkipPermissions` | Required before using `bypassPermissions` |
| `canUseTool` | Handles permission requests that reach the ask path |
| `permissionPromptToolName` | MCP tool used for permission prompting |
| `sandbox` | Programmatic command sandbox settings |
| `toolAliases` | Replace built-in names with MCP implementations |
| `toolConfig` | Built-in tool-specific behavior |

### Prompt and settings controls

| Option | Purpose / trap |
|---|---|
| `systemPrompt` | Custom string or Claude Code preset; default is a minimal prompt |
| `settings` | Inline settings object or settings file path; populates flag-settings layer |
| `settingSources` | Filesystem sources: `user`, `project`, `local`; `[]` skips them |
| `managedSettings` | Host-supplied policy tier, subject to managed-policy rules |
| `planModeInstructions` | Replaces plan-mode workflow body, not the enforcement wrapper |
| `outputStyle` | **Not** an `Options` property; put it inside `settings` or a settings file |

Claude Code preset with appended instructions:

```typescript
options: {
  systemPrompt: {
    type: "preset",
    preset: "claude_code",
    append: "Follow the repository release checklist.",
  },
}
```

### Sessions and persistence

| Option | Purpose |
|---|---|
| `resume` | Resume a session by ID |
| `continue` | Continue the most recent conversation |
| `forkSession` | Resume into a new session ID |
| `resumeSessionAt` | Resume at a message UUID |
| `sessionId` | Supply a specific UUID |
| `title` | Initial display title; persisted resumed title wins |
| `persistSession` | Disable local disk persistence when false |
| `sessionStore` | Mirror transcripts to external storage |
| `sessionStoreFlush` | Alpha batched/eager external-store flushing |
| `loadTimeoutMs` | Alpha timeout for external session-store loads |

### Streaming, output, and observability

| Option | Purpose |
|---|---|
| `includePartialMessages` | Emit raw partial assistant stream events |
| `includeHookEvents` | Emit hook lifecycle messages; startup hook events may always appear |
| `outputFormat` | JSON Schema structured result |
| `promptSuggestions` | Emit predicted next prompt messages |
| `agentProgressSummaries` | Add one-line summaries to task progress events |
| `forwardSubagentText` | Forward subagent text/thinking as complete messages with parent ID |
| `onElicitation` | Handle MCP elicitation requests; unhandled requests are declined |

Structured output:

```typescript
options: {
  outputFormat: {
    type: "json_schema",
    schema: {
      type: "object",
      properties: {
        summary: { type: "string" },
      },
      required: ["summary"],
      additionalProperties: false,
    },
  },
}
```

Read successful structured data from `SDKResultMessage.structured_output`.

### Agents, plugins, skills, and MCP

| Option | Purpose |
|---|---|
| `agent` | Use a named agent as the main thread |
| `agents` | Programmatically define `AgentDefinition` values |
| `plugins` | Load local SDK plugins |
| `skills` | Enable all discovered skills or selected names |
| `mcpServers` | Configure stdio, SSE, HTTP, SDK, or proxy servers |
| `strictMcpConfig` | Ignore filesystem/plugin/connectors and use only supplied MCP servers |

If `skills` is set, the SDK adds `Skill` to `allowedTools`. If `tools` is also explicitly set, include `Skill` in that list.

## Setting sources and precedence

```typescript
type SettingSource = "user" | "project" | "local";
```

| Source | Location |
|---|---|
| `user` | `~/.claude/settings.json` |
| `project` | `.claude/settings.json` |
| `local` | `.claude/settings.local.json` |

Default behavior loads the same filesystem sources as the CLI. Pass `settingSources: []` to opt out of user/project/local settings.

Filesystem precedence, highest first:

1. Local
2. Project
3. User

Programmatic values such as `agents`, `allowedTools`, and inline `settings` override those filesystem tiers. Managed policy can override programmatic options.

CI example:

```typescript
const q = query({
  prompt: "Run CI checks",
  options: {
    settingSources: ["project"],
    permissionMode: "dontAsk",
    allowedTools: ["Read", "Glob", "Grep", "Bash(npm test)"],
  },
});
```

Use `settingSources: []` for a fully programmatic application, but remember endpoint/server-managed inputs may still apply outside that selector.

## Permission model

```typescript
type PermissionMode =
  | "default"
  | "acceptEdits"
  | "bypassPermissions"
  | "plan"
  | "dontAsk"
  | "auto";
```

| Mode | Meaning |
|---|---|
| `default` | Standard evaluation and prompts |
| `acceptEdits` | Automatically accept file edits |
| `bypassPermissions` | Bypass checks except explicit ask rules; requires explicit opt-in |
| `plan` | Explore and plan without normal editing workflow |
| `dontAsk` | Never prompt; deny calls not already approved |
| `auto` | Model classifier approves or denies permission prompts |

### `allowedTools` and `disallowedTools`

- A bare allowed name pre-approves that tool.
- An unlisted tool can still reach permission mode or `canUseTool`.
- A bare disallowed name removes the tool from model context.
- A scoped deny such as `Bash(rm *)` keeps the tool visible but rejects matching calls, including in bypass mode.

### `canUseTool`

`canUseTool` replaces an interactive permission prompt. It is invoked only if evaluation reaches the ask path. It does not see calls already approved by allow rules or permission mode.

```typescript
type CanUseTool = (
  toolName: string,
  input: Record<string, unknown>,
  options: {
    signal: AbortSignal;
    suggestions?: PermissionUpdate[];
    blockedPath?: string;
    decisionReason?: string;
    toolUseID: string;
    agentID?: string;
    requestId: string;
  },
) => Promise<PermissionResult | null>;
```

```typescript
type PermissionResult =
  | {
      behavior: "allow";
      updatedInput?: Record<string, unknown>;
      updatedPermissions?: PermissionUpdate[];
      toolUseID?: string;
    }
  | {
      behavior: "deny";
      message: string;
      interrupt?: boolean;
      toolUseID?: string;
    };
```

Important rules:

- Use a `PreToolUse` hook to gate every call; `canUseTool` only handles prompts.
- `AskUserQuestion`, interaction-required MCP tools, and organization-controlled connector asks have special handling.
- In `dontAsk`, those interactions are denied rather than sent to the callback.
- Return `null` only when the application has already sent the matching control response through another channel using `requestId`.
- Returning `null` without an external response can block the call indefinitely.
- Treat permission update suggestions as data to review; persisting a suggestion can write settings.

## `Query` control object

```typescript
interface Query extends AsyncGenerator<SDKMessage, void> {
  interrupt(): Promise<SDKControlInterruptResponse | undefined>;
  rewindFiles(
    userMessageId: string,
    options?: { dryRun?: boolean },
  ): Promise<RewindFilesResult>;
  setPermissionMode(mode: PermissionMode): Promise<void>;
  setModel(model?: string): Promise<void>;
  setMaxThinkingTokens(value: number | null): Promise<void>;
  applyFlagSettings(
    settings: { [K in keyof Settings]?: Settings[K] | null },
  ): Promise<void>;
  initializationResult(): Promise<SDKControlInitializeResponse>;
  reinitialize(): Promise<SDKControlInitializeResponse>;
  supportedCommands(): Promise<SlashCommand[]>;
  supportedModels(): Promise<ModelInfo[]>;
  supportedAgents(): Promise<AgentInfo[]>;
  mcpServerStatus(): Promise<McpServerStatus[]>;
  accountInfo(): Promise<AccountInfo>;
  reconnectMcpServer(serverName: string): Promise<void>;
  toggleMcpServer(serverName: string, enabled: boolean): Promise<void>;
  setMcpServers(
    servers: Record<string, McpServerConfig>,
  ): Promise<McpSetServersResult>;
  streamInput(stream: AsyncIterable<SDKUserMessage>): Promise<void>;
  stopTask(taskId: string): Promise<void>;
  close(): void;
}
```

### Streaming-input-only controls

The following require streaming input mode:

- `interrupt()`
- `setPermissionMode()`
- `setModel()`
- `applyFlagSettings()`
- `streamInput()`

### File rewind

`rewindFiles()` requires `enableFileCheckpointing: true`. Use `{ dryRun: true }` before destructive restoration.

### Initialization snapshots

- `initializationResult()` returns commands, agents, models, account, output styles, and fast-mode state.
- `supportedCommands()` and similar convenience methods can be initialization snapshots rather than live-updating views.
- `SDKCommandsChangedMessage` is the live signal for command-set changes.

### Reinitialize and permission delivery

`reinitialize()` refreshes the initialization handshake after a transport gap. Pending permission requests can be redelivered. Make permission handling idempotent by request ID.

### Dynamic MCP

`setMcpServers()` replaces the dynamic server set for the session and reports added, removed, and failed servers. Plugin-provided servers not named by the call can remain. Verify the minimum bundled CLI version before relying on this behavior.

## `applyFlagSettings()`

This method is TypeScript-only and available only in streaming input mode.

```typescript
const q = query({ prompt: messageStream });

await q.applyFlagSettings({ model: "claude-opus-4-6" });
await q.applyFlagSettings({ model: null }); // fall back to lower tiers
```

Behavior:

- Writes to the high-precedence flag-settings layer.
- Successive calls shallow-merge top-level keys.
- Passing an object such as `permissions` replaces the prior object at that key; it is not deep-merged.
- Pass `null` to clear an override. `undefined` is omitted during serialization.
- Model changes can apply during a current turn on sufficiently new CLIs; most other supported keys apply on the next turn.
- System prompt changes do not take effect mid-session; start a new session.

Use dedicated `setModel()` and `setPermissionMode()` for those two controls when possible.

## Programmatic subagents

```typescript
type AgentDefinition = {
  description: string;
  prompt: string;
  tools?: string[];
  disallowedTools?: string[];
  model?: string;
  mcpServers?: AgentMcpServerSpec[];
  skills?: string[];
  initialPrompt?: string;
  maxTurns?: number;
  background?: boolean;
  memory?: "user" | "project" | "local";
  effort?: "low" | "medium" | "high" | "xhigh" | "max" | number;
  permissionMode?: PermissionMode;
  criticalSystemReminder_EXPERIMENTAL?: string;
};
```

Key rules:

- `description` tells the parent when to delegate.
- `prompt` is the subagent system prompt.
- Omitting `tools` inherits tools available to subagents; use `disallowedTools` for explicit removal.
- Use `skills` to preload skills rather than merely listing `Skill` as a tool.
- `mcpServers` can reference a parent server by name or define inline process-transport servers.
- `background` launches a non-blocking agent task.
- `permissionMode` can override inherited behavior except where the parent mode has stronger inheritance rules.
- Experimental fields require explicit version checks.

The built-in tool is named `Agent`; `Task` remains a compatibility alias. Treat the tool input's older `mode` field as deprecated on newer CLIs; prefer `AgentDefinition.permissionMode` and parent session policy.

## MCP server types

`McpServerConfig` includes:

| Type | Required core fields |
|---|---|
| stdio | optional `type: "stdio"`, `command`, optional `args`/`env` |
| SSE | `type: "sse"`, `url`, optional `headers` |
| HTTP | `type: "http"`, `url`, optional `headers` |
| in-process SDK | `type: "sdk"`, `name`, `instance` |
| Claude AI proxy | `type: "claudeai-proxy"`, `url`, `id` |

Runtime methods:

- `mcpServerStatus()`
- `reconnectMcpServer(name)`
- `toggleMcpServer(name, enabled)`
- `setMcpServers(servers)`

Use `strictMcpConfig: true` when the application must ignore project `.mcp.json`, user settings, plugin servers, and connectors.

## SDK plugins

```typescript
type SdkPluginConfig = {
  type: "local";
  path: string;
  skipMcpDiscovery?: boolean;
};
```

Only local plugin paths are supported by this option. `skipMcpDiscovery` loads the plugin's skills, hooks, agents, and commands while leaving its MCP connections under application control.

```typescript
options: {
  plugins: [
    { type: "local", path: "./my-plugin", skipMcpDiscovery: true },
  ],
}
```

## Messages

`SDKMessage` is a large discriminated union. Always narrow using `type` and, for system/result messages, `subtype`. Ignore unknown future variants instead of asserting exhaustiveness across SDK upgrades unless the compiler forces a reviewed update.

### Essential message categories

| Category | Key fields / use |
|---|---|
| `SDKSystemMessage` init | `session_id`, CLI version, model, tools, agents, skills, plugins, capabilities |
| `SDKAssistantMessage` | Anthropic `BetaMessage`, UUID, parent subagent tool ID, optional error |
| `SDKUserMessage` | user/tool-result payload, optional origin and `shouldQuery` |
| `SDKResultMessage` | terminal success/error, usage, cost estimate, denials, structured output |
| partial assistant | raw stream event when `includePartialMessages` is true |
| task started/progress/updated/notification | background Bash, Monitor, subagent, or workflow lifecycle |
| hook started/progress/response | SDK/CLI hook observability |
| permission denied | real-time auto-denial event |
| compact boundary | context compaction boundary |
| conversation reset | replace cached transcript/title state |
| commands changed | replace cached command list |
| rate limit/auth/retry | operational status and failure handling |

### Initialization and capabilities

```typescript
type SDKSystemMessage = {
  type: "system";
  subtype: "init";
  session_id: string;
  claude_code_version: string;
  cwd: string;
  tools: string[];
  agents?: string[];
  skills: string[];
  plugins: { name: string; path: string }[];
  model: string;
  permissionMode: PermissionMode;
  capabilities?: string[];
  // additional fields omitted
};
```

Capability names form an open set. Ignore unknown values. Check for the exact capability required by a protocol behavior, such as an interrupt receipt.

### Assistant messages

`SDKAssistantMessage.message` is an Anthropic SDK `BetaMessage`. Use its structured content blocks instead of treating the entire assistant response as plain text. `parent_tool_use_id` attributes complete subagent messages.

### Partial messages

Partial stream events represent the main session and do not provide subagent attribution. Use complete messages or `forwardSubagentText` when nested transcript attribution is needed.

### User messages and context injection

Set `shouldQuery: false` to append context without triggering a model turn. That held context is merged into the next user message that does trigger a turn.

Use `origin` to preserve provenance. Explicit human-origin metadata can matter for workflows that require actual human input.

### Result handling

Success results include:

- final `result` text
- `structured_output`
- `num_turns`
- duration and TTFT metrics
- usage and per-model usage
- estimated `total_cost_usd`
- permission denials
- stop/terminal reason
- optional deferred tool use

Error result subtypes include turn, execution, budget, and structured-output retry exhaustion. Do not use only `is_error`; narrow `subtype` and inspect `errors`, `terminal_reason`, and API status where present.

Background follow-up results can carry an origin such as `task-notification`. Use origin to avoid presenting a synthetic follow-up as the direct answer to a user's prompt.

### Subagent results

Prefer structured `tool_use_result` / `AgentOutput` over parsing the text form of an `Agent` tool result. `AgentOutput.status` distinguishes:

- `completed`
- `async_launched`
- `remote_launched`

Completed results can include usage, model history, tool statistics, prompt, and worktree information. Background results include an output file; remote results include a task/session link.

### Background task state

`SDKBackgroundTasksChangedMessage.tasks` is a full snapshot. Replace the cached live-task set on each event rather than trying to pair individual task start/completion events. Reset state when the CLI process restarts.

## Hook API

```typescript
type HookCallback = (
  input: HookInput,
  toolUseID: string | undefined,
  options: { signal: AbortSignal },
) => Promise<HookJSONOutput>;

interface HookCallbackMatcher {
  matcher?: string;
  hooks: HookCallback[];
  timeout?: number;
}
```

Hook events include tool, prompt, session, subagent, compaction, permission, setup, teammate/task, config, worktree, and message-display lifecycle points. Consult the current hook union before assuming an event is available in an older SDK.

Core events include:

```text
PreToolUse
PostToolUse
PostToolUseFailure
PostToolBatch
Notification
UserPromptSubmit
SessionStart
SessionEnd
Stop
SubagentStart
SubagentStop
PreCompact
PermissionRequest
Setup
TeammateIdle
TaskCompleted
ConfigChange
WorktreeCreate
WorktreeRemove
MessageDisplay
```

All hook inputs include session and working-directory context. Newer versions can also include prompt, agent, permission mode, and effort identifiers.

### Synchronous hook output

A sync hook can:

- continue or stop processing
- suppress output
- provide a stop reason or system message
- approve/block at generic level
- return event-specific output

Important event-specific controls:

| Hook | Controls |
|---|---|
| `PreToolUse` | `allow`, `deny`, `ask`, or `defer`; updated input; added context |
| `UserPromptSubmit` | additional context |
| `SessionStart` / `Setup` / `SubagentStart` | additional context |
| `PostToolUse` | additional context and updated tool output |
| `PermissionRequest` | allow/deny result and optional permission updates |

`permissionDecision: "defer"` ends the current result with deferred tool metadata. Persist the request in the application UI and resume the session to continue the round trip.

### Async hook output

```typescript
type AsyncHookJSONOutput = {
  async: true;
  asyncTimeout?: number;
};
```

Use hook lifecycle messages for progress and diagnostics when `includeHookEvents` is enabled. Startup hook events can be emitted regardless so clients can observe initialization.

## Built-in tool schema map

The package exports `ToolInputSchemas` and `ToolOutputSchemas` unions for type-safe built-in tool handling.

| Tool | Important input | Important output |
|---|---|---|
| `Agent` | description, prompt, subtype, model, background, isolation | completed/background/remote discriminated result |
| `AskUserQuestion` | question groups and options | questions, answers, optional freeform response |
| `Bash` | command, timeout, background, sandbox bypass request | stdout/stderr, interruption, task ID, timeout metadata |
| `Monitor` | command or WebSocket, description, timeout, persistent | background task ID and timeout |
| `TaskOutput` | task ID, block, timeout | task output |
| `TaskStop` | task ID | stop confirmation |
| `Read` | file path, offset, limit, PDF pages | text/image/notebook/PDF/parts union |
| `Edit` | exact old/new strings, replace-all | structured patch and optional Git diff |
| `Write` | file path and content | create/update result and structured patch |
| `Glob` | pattern and optional path | filenames, truncation, optional totals |
| `Grep` | regex, filters, output mode, pagination | content/files/count-dependent result |
| `NotebookEdit` | notebook/cell/edit operation | original and updated notebook content |
| `WebFetch` | URL and processing prompt | HTTP metadata and result |
| `WebSearch` | query and domain filters | result blocks and duration |
| `Workflow` | inline/name/path script, args, resume run ID | accepted background run metadata or syntax error |
| task list tools | create/get/update/list fields | structured task records |
| MCP resources | server/URI | resources or resource contents |
| `EnterWorktree` | name or existing path | worktree path/branch |
| `ExitPlanMode` | deprecated old prompt field | plan/approval state |

### Tool-version notes

- `Agent` was previously named `Task`; the alias remains accepted.
- Prefer task-list tools over legacy `TodoWrite` in SDK versions where tasks are enabled by default.
- `Workflow` requires a sufficiently recent Agent SDK and returns before background completion.
- A workflow result can contain `error` even when its status says the invocation was accepted; check `error` before treating it as running.
- `EnterWorktree.name` and `.path` are mutually exclusive.
- `Monitor` requires exactly one event source: command or WebSocket.

## Sandbox configuration

```typescript
type SandboxSettings = {
  enabled?: boolean;
  failIfUnavailable?: boolean;
  autoAllowBashIfSandboxed?: boolean;
  excludedCommands?: string[];
  allowUnsandboxedCommands?: boolean;
  network?: SandboxNetworkConfig;
  filesystem?: SandboxFilesystemConfig;
  ignoreViolations?: Record<string, string[]>;
  enableWeakerNestedSandbox?: boolean;
  ripgrep?: { command: string; args?: string[] };
};
```

Defaults with major security impact:

- sandbox disabled unless enabled
- fail startup if enabled but unavailable
- sandboxed Bash can be auto-approved
- the model can request unsandboxed commands when allowed

Example:

```typescript
for await (const message of query({
  prompt: "Build and test my project",
  options: {
    sandbox: {
      enabled: true,
      failIfUnavailable: true,
      autoAllowBashIfSandboxed: true,
      allowUnsandboxedCommands: false,
      network: {
        allowedDomains: ["registry.npmjs.org"],
        allowLocalBinding: false,
      },
      filesystem: {
        allowWrite: ["./dist", "./coverage"],
        denyRead: ["~/.ssh", "~/.aws"],
      },
    },
  },
})) {
  if (message.type === "result") console.log(message);
}
```

### Network controls

`SandboxNetworkConfig` includes allowed/denied domains, local binding, Unix sockets, and proxy ports.

- Denied domains take precedence over allowed domains.
- These controls apply to sandboxed Bash network traffic, not automatically to `WebFetch`.
- The built-in proxy filters requested hostnames and does not terminate TLS; do not treat it as protection against all domain-fronting or application-layer attacks.
- Use a TLS-terminating egress proxy for stronger enforcement.

### Filesystem controls

`SandboxFilesystemConfig` supports:

- `allowWrite`
- `denyWrite`
- `denyRead`

Test patterns against the actual working directory and subprocess behavior. Additional directories and nested runtimes can expand the reachable surface.

### Unix socket warning

Access to sockets such as Docker's socket can effectively grant host-level control. Only allow specifically audited sockets. Avoid `allowAllUnixSockets` in untrusted workloads.

### Unsandboxed commands

`excludedCommands` and `allowUnsandboxedCommands` are different:

| Control | Behavior |
|---|---|
| `excludedCommands` | Static commands always execute outside the sandbox |
| `allowUnsandboxedCommands` | Model may request bypass through `dangerouslyDisableSandbox` |

If unsandboxed requests are enabled, validate them in `canUseTool` or a stronger external authorization layer. Combining them with bypass-permissions mode can allow silent escape from sandbox restrictions.

## Timeouts, retries, and stalls

The `env` option replaces the child environment, so retain inherited variables:

```typescript
const q = query({
  prompt: "Analyze this code",
  options: {
    env: {
      ...process.env,
      API_TIMEOUT_MS: "120000",
      CLAUDE_CODE_MAX_RETRIES: "2",
      CLAUDE_ASYNC_AGENT_STALL_TIMEOUT_MS: "120000",
    },
  },
});
```

Relevant variables include:

| Variable | Purpose |
|---|---|
| `API_TIMEOUT_MS` | Per-request API timeout |
| `CLAUDE_CODE_MAX_RETRIES` | Retry count, subject to implementation caps/version behavior |
| `CLAUDE_CODE_RETRY_WATCHDOG` | Extended retry behavior for unattended workloads |
| `CLAUDE_ASYNC_AGENT_STALL_TIMEOUT_MS` | Background subagent stall watchdog |
| `CLAUDE_ENABLE_STREAM_WATCHDOG` | Enable/disable stalled response-body watchdog |
| `CLAUDE_STREAM_IDLE_TIMEOUT_MS` | Response stream idle threshold |

Worst-case wall time can multiply request timeout by retry count plus backoff. Bound the workflow externally as well as through SDK variables.

## Custom process spawning

Use `spawnClaudeCodeProcess` to run the CLI in a VM, container, remote host, or custom supervisor.

```typescript
interface SpawnedProcess {
  stdin: Writable;
  stdout: Readable;
  readonly killed: boolean;
  readonly exitCode: number | null;
  kill(signal: NodeJS.Signals): boolean;
  on(event: "exit" | "error", listener: (...args: any[]) => void): void;
  once(event: "exit" | "error", listener: (...args: any[]) => void): void;
  off(event: "exit" | "error", listener: (...args: any[]) => void): void;
}
```

`SpawnOptions` supplies command, args, cwd, environment, and a teardown signal. The spawn signal can fire after a short graceful-close window; listen to your own `abortController.signal` when immediate external cancellation is required.

## Version-sensitive and deprecated behavior

- Use `thinking` instead of deprecated `maxThinkingTokens`.
- Use `applyFlagSettings()` only in TypeScript streaming mode.
- Treat `resolveSettings()` and session-store flush/load controls as alpha.
- Treat experimental agent fields as unstable.
- Feature-detect interrupt receipts and other protocol behavior from capabilities.
- Do not use the retired long-context beta header after its retirement date; use a model with native supported context instead.
- Do not assume a message field exists in old persisted transcripts.
- Ignore unknown message/capability values for forward compatibility.
- Re-check minimum-version comments before using new task, workflow, agent-team, channel, or dynamic MCP behavior.

## Troubleshooting

| Symptom | Check |
|---|---|
| Native CLI binary not found | Optional dependencies, platform package, package manager settings, or `pathToClaudeCodeExecutable` |
| Bun compiled executable cannot launch Claude | Embed/extract the platform binary from `$bunfs` |
| Query hangs after permission callback | Ensure `canUseTool` returns a result; return `null` only after sending an external control response |
| Environment variables or `PATH` disappear | `env` replaces rather than merges; spread `process.env` |
| Unexpected personal settings affect CI | Set `settingSources` explicitly, often `[]` or `["project"]` |
| Unexpected MCP servers appear | Use `strictMcpConfig: true` |
| Expected skill cannot run | Configure `skills`; if `tools` is explicit, include `Skill` |
| Mid-session setting did not change | Confirm streaming mode and whether the key applies mid-session; system prompts require restart |
| Command runs outside sandbox | Inspect `excludedCommands`, bypass requests, permissions mode, and `dangerouslyDisableSandbox` |
| Sandbox startup yields error then throws | Handle both streamed error result and iterator exception; decide whether `failIfUnavailable` may be false |
| Subagent transcript text is missing | Use complete tool messages or enable `forwardSubagentText` |
| Cached commands become stale | Handle `SDKCommandsChangedMessage`; initialization helpers can be snapshots |
| Duplicate permission prompt after reconnect | Make callback handling idempotent by request ID |
| Cost total seems incomplete | Review cost-tracking semantics and whole-tree `modelUsage` rather than assuming top-level usage includes every subagent |

## Checklist

1. Pin an SDK version compatible with the required bundled CLI behavior.
2. Confirm native binary installation or configure an explicit executable path.
3. Choose string or streaming input mode intentionally.
4. Consume and narrow the complete `SDKMessage` stream.
5. Set explicit tools, permissions, settings sources, MCP policy, and sandbox controls.
6. Handle results and thrown process errors separately.
7. Close queries/pre-warmed processes and wire cancellation.
8. Store session IDs and transcript metadata only when persistence is intended.
9. Add external job deadlines beyond SDK request/retry timeouts.
10. Revisit the official TypeScript reference and changelog before upgrades.

## Related

- Agent SDK overview and Python/TypeScript comparison: `agent-sdk.md`
- Python complete API reference: `agent-sdk-python.md`
- Claude Code filesystem hooks: `hooks.md`
- Claude Code filesystem subagents: `subagents.md`
- Claude Code MCP configuration: `mcp.md`
- Claude Code plugins: `plugins.md`
- Cross-CLI testing: `../shared/testing.md`
