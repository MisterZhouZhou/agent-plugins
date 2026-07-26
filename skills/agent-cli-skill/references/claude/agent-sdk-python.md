# Claude Agent SDK Python Reference

Use this file for the Python API exported by `claude_agent_sdk`: one-shot queries, continuous conversations, options, custom tools, sessions, messages, hooks, permissions, MCP, built-in tool schemas, transport customization, and sandboxing.

Before relying on version-sensitive behavior, fetch the current documentation index:

```text
https://code.claude.com/docs/llms.txt
```

The canonical page discovered through that index is `/docs/en/agent-sdk/python.md`.

## Installation

Use a virtual environment. System Python installations on recent Debian, Ubuntu, and Homebrew environments commonly reject direct package installation with `externally-managed-environment`.

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install claude-agent-sdk
```

The package launches and communicates with Claude Code. Use `ClaudeAgentOptions.cli_path` when the executable must come from a custom location.

## API map

| Need | API |
|---|---|
| One-off task or independent exchange | `query()` |
| Stateful multi-turn conversation | `ClaudeSDKClient` |
| Type-safe in-process custom tool | `@tool(...)` |
| Bundle custom tools as an MCP server | `create_sdk_mcp_server()` |
| List or inspect persisted sessions | `list_sessions()`, `get_session_messages()`, `get_session_info()` |
| Rename or tag persisted sessions | `rename_session()`, `tag_session()` |
| Replace the local subprocess transport | `Transport` |

Unlike the TypeScript SDK, the Python reference does not expose `startup()`/`WarmQuery` or `resolveSettings()` as top-level APIs. Use `ClaudeSDKClient` for an explicitly managed long-lived connection and inspect settings through normal session behavior.

## `query()` versus `ClaudeSDKClient`

| Feature | `query()` | `ClaudeSDKClient` |
|---|---|---|
| Default session behavior | New session per call | Reuses one connected session |
| Conversation shape | One exchange | Multiple exchanges |
| Connection lifecycle | Automatic | Explicit/context-managed |
| Streaming input | Yes | Yes |
| Interrupt | No | Yes |
| Hooks and custom tools | Yes | Yes |
| Continue previous context | `continue_conversation` or `resume` | Automatic while connected |

Choose `query()` for isolated automation and `ClaudeSDKClient` for chat interfaces, follow-up questions, response-driven logic, interrupts, or runtime controls.

Signature-only and bare `async for` fragments must run inside `async def`; call them with `asyncio.run()`.

## Functions

### `query()`

Creates a new session by default and yields messages as an async iterator.

```python
async def query(
    *,
    prompt: str | AsyncIterable[dict[str, Any]],
    options: ClaudeAgentOptions | None = None,
    transport: Transport | None = None,
) -> AsyncIterator[Message]
```

| Parameter | Description |
|---|---|
| `prompt` | String prompt or async iterable of user-message dictionaries |
| `options` | `ClaudeAgentOptions`; defaults to a new default instance |
| `transport` | Optional custom `Transport` implementation |

```python
import asyncio
from claude_agent_sdk import ClaudeAgentOptions, ResultMessage, query

async def main():
    options = ClaudeAgentOptions(
        system_prompt="You are an expert Python developer",
        permission_mode="acceptEdits",
    )
    async for message in query(prompt="Create a Python web server", options=options):
        if isinstance(message, ResultMessage):
            print(message.subtype, message.result)

asyncio.run(main())
```

A single-shot query may first yield an error `ResultMessage` and then raise a process exception. Handle both the message stream and exceptions around the complete iterator.

### `tool()`

Decorator for defining an in-process MCP tool.

```python
def tool(
    name: str,
    description: str,
    input_schema: type | dict[str, Any],
    annotations: ToolAnnotations | None = None,
) -> Callable[[Callable[[Any], Awaitable[dict[str, Any]]]], SdkMcpTool[Any]]
```

Input schemas may be a simple Python type mapping or a complete JSON Schema:

```python
{"text": str, "count": int, "enabled": bool}
```

```python
{
    "type": "object",
    "properties": {
        "text": {"type": "string"},
        "count": {"type": "integer", "minimum": 0},
    },
    "required": ["text"],
}
```

```python
from typing import Any
from claude_agent_sdk import tool

@tool("greet", "Greet a user", {"name": str})
async def greet(args: dict[str, Any]) -> dict[str, Any]:
    return {"content": [{"type": "text", "text": f"Hello, {args['name']}!"}]}
```

#### `ToolAnnotations`

Re-exported from `mcp.types` and from `claude_agent_sdk`. These are behavioral hints, not security controls.

| Field | Default meaning |
|---|---|
| `title` | Optional human-readable title |
| `readOnlyHint` | `False`; `True` means the tool does not modify the environment |
| `destructiveHint` | `True`; meaningful for non-read-only tools |
| `idempotentHint` | `False`; repeated identical calls have no extra effect when true |
| `openWorldHint` | `True`; false indicates a closed domain such as local memory |

### `create_sdk_mcp_server()`

Creates an MCP server that runs in the Python process.

```python
def create_sdk_mcp_server(
    name: str,
    version: str = "1.0.0",
    tools: list[SdkMcpTool[Any]] | None = None,
) -> McpSdkServerConfig
```

```python
from claude_agent_sdk import ClaudeAgentOptions, create_sdk_mcp_server, tool

@tool("add", "Add two numbers", {"a": float, "b": float})
async def add(args):
    return {"content": [{"type": "text", "text": str(args["a"] + args["b"])}]}

calculator = create_sdk_mcp_server("calculator", tools=[add])
options = ClaudeAgentOptions(
    mcp_servers={"calc": calculator},
    allowed_tools=["mcp__calc__add"],
)
```

### Persisted-session functions

These functions are synchronous.

```python
def list_sessions(
    directory: str | None = None,
    limit: int | None = None,
    offset: int = 0,
    include_worktrees: bool = True,
) -> list[SDKSessionInfo]

def get_session_messages(
    session_id: str,
    directory: str | None = None,
    limit: int | None = None,
    offset: int = 0,
) -> list[SessionMessage]

def get_session_info(
    session_id: str,
    directory: str | None = None,
) -> SDKSessionInfo | None

def rename_session(
    session_id: str,
    title: str,
    directory: str | None = None,
) -> None

def tag_session(
    session_id: str,
    tag: str | None,
    directory: str | None = None,
) -> None
```

`list_sessions()` sorts by `last_modified` descending. `offset` and `limit` provide pagination. When `directory` is omitted, lookup spans all known project directories. `include_worktrees=True` includes sessions from related worktree paths when the directory is in a git repository.

`rename_session()` rejects invalid UUIDs and blank titles. `tag_session()` accepts `None` to clear a tag and rejects a non-`None` tag that is empty after sanitization. Mutation functions raise `FileNotFoundError` when the session cannot be located.

#### `SDKSessionInfo`

| Field | Type |
|---|---|
| `session_id` | `str` |
| `summary` | `str` |
| `last_modified` | `int` milliseconds since epoch |
| `file_size` | `int | None` |
| `custom_title` | `str | None` |
| `first_prompt` | `str | None` |
| `git_branch` | `str | None` |
| `cwd` | `str | None` |
| `tag` | `str | None` |
| `created_at` | `int | None` milliseconds since epoch |

#### `SessionMessage`

| Field | Type | Note |
|---|---|---|
| `type` | `Literal["user", "assistant"]` | Transcript role |
| `uuid` | `str` | Message ID |
| `session_id` | `str` | Owning session |
| `message` | `Any` | Raw transcript payload |
| `parent_tool_use_id` | `None` | Reserved for future use in Python |

## `ClaudeSDKClient`

Maintains one conversation and supports interrupts plus runtime controls.

```python
class ClaudeSDKClient:
    def __init__(
        self,
        options: ClaudeAgentOptions | None = None,
        transport: Transport | None = None,
    )
    async def connect(self, prompt: str | AsyncIterable[dict] | None = None) -> None
    async def query(self, prompt: str | AsyncIterable[dict], session_id: str = "default") -> None
    async def receive_messages(self) -> AsyncIterator[Message]
    async def receive_response(self) -> AsyncIterator[Message]
    async def interrupt(self) -> None
    async def set_permission_mode(self, mode: str) -> None
    async def set_model(self, model: str | None = None) -> None
    async def rewind_files(self, user_message_id: str) -> None
    async def get_mcp_status(self) -> McpStatusResponse
    async def reconnect_mcp_server(self, server_name: str) -> None
    async def toggle_mcp_server(self, server_name: str, enabled: bool) -> None
    async def stop_task(self, task_id: str) -> None
    async def get_server_info(self) -> dict[str, Any] | None
    async def disconnect(self) -> None
```

| Method | Behavior |
|---|---|
| `connect()` | Opens the connection and optionally supplies the initial prompt/stream |
| `query()` | Sends a new turn on the current conversation |
| `receive_messages()` | Receives the unbounded message stream |
| `receive_response()` | Receives through the next `ResultMessage` |
| `interrupt()` | Stops current work; streaming mode only |
| `set_permission_mode()` | Changes permission mode for the live session |
| `set_model()` | Changes the model; `None` restores the default |
| `rewind_files()` | Restores checkpointed files at a user message |
| `get_mcp_status()` | Returns status for configured MCP servers |
| `reconnect_mcp_server()` | Retries a failed/disconnected MCP server |
| `toggle_mcp_server()` | Enables or disables a server and its tools |
| `stop_task()` | Stops a live background task |
| `get_server_info()` | Returns session/capability metadata |
| `disconnect()` | Closes the connection |

Use the async context manager when possible:

```python
import asyncio
from claude_agent_sdk import ClaudeSDKClient

async def main():
    async with ClaudeSDKClient() as client:
        await client.query("What files are here?")
        async for message in client.receive_response():
            print(message)

asyncio.run(main())
```

Do not `break` out of the iterator merely because the desired text arrived; early exit can leave asyncio cleanup incomplete. Consume through `ResultMessage` or explicitly manage shutdown.

### Interrupt buffer behavior

`interrupt()` sends a stop signal but does not clear messages already produced. Drain the interrupted response, including its `ResultMessage` (normally `error_during_execution`), before sending and reading the next turn. Otherwise the next `receive_response()` may return the interrupted task's buffered messages.

## Runtime type model

The SDK mixes dataclasses and `TypedDict` types:

- Dataclasses such as `ResultMessage`, `AgentDefinition`, and `TextBlock` are objects with attribute access.
- `TypedDict` declarations such as `ThinkingConfigEnabled`, MCP configs, and hook output dictionaries are plain dictionaries at runtime and require key access.

Constructor-like `TypedDictName(field=value)` syntax still returns a `dict`; it does not create attribute access.

## `SdkMcpTool`

```python
@dataclass
class SdkMcpTool(Generic[T]):
    name: str
    description: str
    input_schema: type[T] | dict[str, Any]
    handler: Callable[[T], Awaitable[dict[str, Any]]]
    annotations: ToolAnnotations | None = None
```

The handler returns an MCP tool result dictionary, normally with `content` and optionally `is_error` or structured fields supported by MCP.

## `Transport`

Low-level abstract interface for replacing local subprocess communication. This internal API may change between SDK releases.

```python
class Transport(ABC):
    @abstractmethod
    async def connect(self) -> None: ...

    @abstractmethod
    async def write(self, data: str) -> None: ...

    @abstractmethod
    def read_messages(self) -> AsyncIterator[dict[str, Any]]: ...

    @abstractmethod
    async def close(self) -> None: ...

    @abstractmethod
    def is_ready(self) -> bool: ...

    @abstractmethod
    async def end_input(self) -> None: ...
```

Import with `from claude_agent_sdk import Transport`.

## `ClaudeAgentOptions`

Configuration dataclass for `query()` and `ClaudeSDKClient`.

```python
@dataclass
class ClaudeAgentOptions:
    tools: list[str] | ToolsPreset | None = None
    allowed_tools: list[str] = field(default_factory=list)
    system_prompt: str | SystemPromptPreset | SystemPromptFile | None = None
    mcp_servers: dict[str, McpServerConfig] | str | Path = field(default_factory=dict)
    strict_mcp_config: bool = False
    permission_mode: PermissionMode | None = None
    continue_conversation: bool = False
    resume: str | None = None
    session_id: str | None = None
    max_turns: int | None = None
    max_budget_usd: float | None = None
    disallowed_tools: list[str] = field(default_factory=list)
    model: str | None = None
    fallback_model: str | None = None
    betas: list[SdkBeta] = field(default_factory=list)
    output_format: dict[str, Any] | None = None
    permission_prompt_tool_name: str | None = None
    cwd: str | Path | None = None
    cli_path: str | Path | None = None
    settings: str | None = None
    add_dirs: list[str | Path] = field(default_factory=list)
    env: dict[str, str] = field(default_factory=dict)
    extra_args: dict[str, str | None] = field(default_factory=dict)
    max_buffer_size: int | None = None
    debug_stderr: Any = sys.stderr
    stderr: Callable[[str], None] | None = None
    can_use_tool: CanUseTool | None = None
    hooks: dict[HookEvent, list[HookMatcher]] | None = None
    user: str | None = None
    include_partial_messages: bool = False
    include_hook_events: bool = False
    fork_session: bool = False
    agents: dict[str, AgentDefinition] | None = None
    setting_sources: list[SettingSource] | None = None
    skills: list[str] | Literal["all"] | None = None
    sandbox: SandboxSettings | None = None
    plugins: list[SdkPluginConfig] = field(default_factory=list)
    max_thinking_tokens: int | None = None
    thinking: ThinkingConfig | None = None
    effort: EffortLevel | None = None
    enable_file_checkpointing: bool = False
    session_store: SessionStore | None = None
    session_store_flush: SessionStoreFlushMode = "batched"
    load_timeout_ms: int = 60_000
    task_budget: TaskBudget | None = None
```

### Tool and permission fields

| Field | Behavior |
|---|---|
| `tools` | Tool context; use `{"type": "preset", "preset": "claude_code"}` for defaults |
| `allowed_tools` | Auto-approves matching calls; does not by itself remove unlisted tools |
| `disallowed_tools` | Removes or denies tools/rules; scoped rules apply even in bypass mode |
| `permission_mode` | Default permission behavior |
| `can_use_tool` | Callback only when evaluation reaches a prompt |
| `permission_prompt_tool_name` | MCP tool used for permission prompts |
| `hooks` | Programmatic hook callbacks |
| `sandbox` | Programmatic Bash sandbox controls |

A bare denied name such as `Bash` removes that tool from context. A scoped rule such as `Bash(rm *)` keeps Bash available but denies matching calls.

### Prompt, model, and budget fields

| Field | Behavior |
|---|---|
| `system_prompt` | String, Claude Code preset, or file-backed prompt |
| `model` | Model alias or full provider-compatible model ID |
| `fallback_model` | Model used if the primary fails |
| `thinking` | Adaptive, fixed-budget, or disabled thinking configuration |
| `max_thinking_tokens` | Deprecated; use `thinking` |
| `effort` | `low`, `medium`, `high`, `xhigh`, or `max` |
| `max_turns` | Maximum agentic tool-use round trips |
| `max_budget_usd` | Stops at the client-side USD cost estimate |
| `task_budget` | API-side total token budget using the task-budgets beta |
| `betas` | SDK beta header literals |
| `output_format` | Structured output JSON Schema configuration |

### Process and environment fields

| Field | Behavior |
|---|---|
| `cwd` | Working directory |
| `cli_path` | Explicit Claude Code executable path |
| `add_dirs` | Additional accessible directories |
| `env` | Environment merged over inherited process environment |
| `extra_args` | Raw additional CLI arguments |
| `max_buffer_size` | Maximum buffered CLI stdout bytes |
| `stderr` | Callback for CLI stderr |
| `debug_stderr` | Deprecated file-like debug sink |
| `user` | Application-defined user identifier |

Unlike TypeScript `Options.env`, Python `env` is documented as merging on top of the inherited process environment.

### Settings, extensions, and sessions

| Field | Behavior |
|---|---|
| `mcp_servers` | Server mapping or config-file path |
| `strict_mcp_config` | Ignore project/user/plugin/connector MCP sources |
| `setting_sources` | Filesystem setting tiers to load |
| `settings` | Explicit settings-file path |
| `agents` | Programmatic subagent definitions |
| `skills` | Skill names or `"all"`; adds Skill to `allowed_tools` |
| `plugins` | Local plugin paths |
| `continue_conversation` | Continue the newest conversation |
| `resume` | Resume a session ID |
| `session_id` | Supply a specific UUID for a new session |
| `fork_session` | Fork when resuming instead of continuing the same ID |
| `enable_file_checkpointing` | Track changes for `rewind_files()` |
| `session_store` | Mirror transcripts to external storage |
| `session_store_flush` | `batched` or `eager` external-store flush |
| `load_timeout_ms` | Per-call timeout for external resume loading |

`session_id` cannot be combined with `continue_conversation` or `resume` unless `fork_session` is set.

### Streaming and observability fields

| Field | Behavior |
|---|---|
| `include_partial_messages` | Yield `StreamEvent` objects |
| `include_hook_events` | Yield hook lifecycle `HookEventMessage` objects |
| `stderr` | Capture diagnostic stderr lines |

## Structured and prompt configuration

### `OutputFormat`

Pass a plain dictionary to `output_format`:

```python
{
    "type": "json_schema",
    "schema": {...},
}
```

### `SystemPromptPreset`

```python
class SystemPromptPreset(TypedDict):
    type: Literal["preset"]
    preset: Literal["claude_code"]
    append: NotRequired[str]
    exclude_dynamic_sections: NotRequired[bool]
```

`exclude_dynamic_sections=True` moves per-session context such as cwd, git-repository state, and auto-memory paths into the first user message to improve prompt-cache reuse.

### `SystemPromptFile`

```python
class SystemPromptFile(TypedDict):
    type: Literal["file"]
    path: str
```

Use a file for large prompts. A string prompt is placed on the subprocess argv and is subject to OS command-line limits before any API request is sent.

### `ToolsPreset`

```python
class ToolsPreset(TypedDict):
    type: Literal["preset"]
    preset: Literal["claude_code"]
```

## Setting sources

```python
SettingSource = Literal["user", "project", "local"]
```

| Source | File |
|---|---|
| `user` | `~/.claude/settings.json` |
| `project` | `.claude/settings.json` |
| `local` | `.claude/settings.local.json` |

When `setting_sources` is omitted, the Python SDK follows the CLI and loads all filesystem tiers. Pass `[]` to disable user, project, and local settings. Python SDK 0.1.59 and earlier treated `[]` like omission; upgrade when explicit opt-out is required.

Endpoint-managed policy is loaded regardless. Server-managed settings may be fetched for an eligible organization-authenticated session. Settings precedence among filesystem tiers is local over project over user. Programmatic options override filesystem tiers, while managed policy overrides programmatic options.

```python
options = ClaudeAgentOptions(setting_sources=["project"])
```

Loading project settings also enables project `CLAUDE.md` instructions when the Claude Code system-prompt preset is used.

## Programmatic subagents

### `AgentDefinition`

```python
@dataclass
class AgentDefinition:
    description: str
    prompt: str
    tools: list[str] | None = None
    disallowedTools: list[str] | None = None
    model: str | None = None
    skills: list[str] | None = None
    memory: Literal["user", "project", "local"] | None = None
    mcpServers: list[str | dict[str, Any]] | None = None
    initialPrompt: str | None = None
    maxTurns: int | None = None
    background: bool | None = None
    effort: EffortLevel | int | None = None
    permissionMode: PermissionMode | None = None
```

`description` and `prompt` are required. `tools` constrains the agent's available tools; when omitted it inherits the tools available to subagents. `disallowedTools` can remove a tool, one MCP server (`mcp__server` or `mcp__server__*`), or all MCP tools (`mcp__*`).

Important: `AgentDefinition` is a Python dataclass whose wire-compatible fields intentionally use camelCase (`disallowedTools`, `mcpServers`, `initialPrompt`, `maxTurns`, `permissionMode`). The top-level `ClaudeAgentOptions` equivalents use snake_case. Supplying snake_case names to `AgentDefinition` raises `TypeError`.

```python
from claude_agent_sdk import AgentDefinition, ClaudeAgentOptions

options = ClaudeAgentOptions(
    agents={
        "reviewer": AgentDefinition(
            description="Reviews code changes",
            prompt="Find correctness and security issues.",
            tools=["Read", "Grep", "Glob"],
            maxTurns=8,
        )
    },
    allowed_tools=["Agent"],
)
```

Use `subagents.md` for filesystem-defined `.claude/agents`; use this reference for Python SDK `agents` and `AgentDefinition`.

## Permission types

### `PermissionMode`

```python
PermissionMode = Literal[
    "default",
    "acceptEdits",
    "plan",
    "dontAsk",
    "bypassPermissions",
    "auto",
]
```

`dontAsk` denies unresolved prompts. `bypassPermissions` bypasses ordinary checks, but explicit `ask` rules can still prompt. `auto` uses the model classifier to decide permission prompts.

### `CanUseTool`

```python
CanUseTool = Callable[
    [str, dict[str, Any], ToolPermissionContext],
    Awaitable[PermissionResult],
]
```

The callback runs only when permission evaluation reaches a prompt. It does not run for calls already approved by `allowed_tools`, a settings allow rule, or a permission mode such as `acceptEdits` or `bypassPermissions`. Use a `PreToolUse` hook to inspect every tool call.

`AskUserQuestion`, MCP tools marked `requiresUserInteraction`, and organization connector tools configured to ask still reach the callback even when an allow rule matches. Under `dontAsk`, those calls are denied without invoking the callback.

### `ToolPermissionContext`

```python
@dataclass
class ToolPermissionContext:
    signal: Any | None = None
    suggestions: list[PermissionUpdate] = field(default_factory=list)
    tool_use_id: str | None = None
    agent_id: str | None = None
    blocked_path: str | None = None
    decision_reason: str | None = None
    title: str | None = None
    display_name: str | None = None
    description: str | None = None
```

`suggestions` may contain persistent rule proposals. Returning a Bash suggestion with `localSettings` writes the rule to `.claude/settings.local.json`. `tool_use_id` identifies the exact call, `agent_id` identifies a subagent-originated prompt, and the display fields support host approval UIs.

### Permission results

```python
PermissionResult = PermissionResultAllow | PermissionResultDeny

@dataclass
class PermissionResultAllow:
    behavior: Literal["allow"] = "allow"
    updated_input: dict[str, Any] | None = None
    updated_permissions: list[PermissionUpdate] | None = None

@dataclass
class PermissionResultDeny:
    behavior: Literal["deny"] = "deny"
    message: str = ""
    interrupt: bool = False
```

### Permission updates

```python
@dataclass
class PermissionUpdate:
    type: Literal[
        "addRules",
        "replaceRules",
        "removeRules",
        "setMode",
        "addDirectories",
        "removeDirectories",
    ]
    rules: list[PermissionRuleValue] | None = None
    behavior: Literal["allow", "deny", "ask"] | None = None
    mode: PermissionMode | None = None
    directories: list[str] | None = None
    destination: Literal[
        "userSettings", "projectSettings", "localSettings", "session"
    ] | None = None

@dataclass
class PermissionRuleValue:
    tool_name: str
    rule_content: str | None = None
```

## Thinking and task budgets

### `EffortLevel`

```python
EffortLevel = Literal["low", "medium", "high", "xhigh", "max"]
```

`xhigh` falls back to `high` on models that do not support it.

### `ThinkingConfig`

```python
ThinkingDisplay = Literal["summarized", "omitted"]

class ThinkingConfigAdaptive(TypedDict):
    type: Literal["adaptive"]
    display: NotRequired[ThinkingDisplay]

class ThinkingConfigEnabled(TypedDict):
    type: Literal["enabled"]
    budget_tokens: int
    display: NotRequired[ThinkingDisplay]

class ThinkingConfigDisabled(TypedDict):
    type: Literal["disabled"]

ThinkingConfig = (
    ThinkingConfigAdaptive | ThinkingConfigEnabled | ThinkingConfigDisabled
)
```

These variants are dictionaries at runtime. On Claude Opus 4.7 and later, thinking display defaults to omitted; set `display="summarized"` when summarized thinking blocks are required.

### `TaskBudget`

```python
class TaskBudget(TypedDict):
    total: int
```

Pass as `task_budget={"total": 50000}`. It is sent as the API-side task budget with the task-budgets beta.

### `SdkBeta`

```python
SdkBeta = Literal["context-1m-2025-08-07"]
```

The `context-1m-2025-08-07` beta retired on April 30, 2026. It has no effect for Sonnet 4/4.5, and over-200k requests fail. Current 1M-context models do not require this beta header.

## MCP configuration

### Server input types

```python
class McpSdkServerConfig(TypedDict):
    type: Literal["sdk"]
    name: str
    instance: Any

class McpStdioServerConfig(TypedDict):
    type: NotRequired[Literal["stdio"]]
    command: str
    args: NotRequired[list[str]]
    env: NotRequired[dict[str, str]]

class McpSSEServerConfig(TypedDict):
    type: Literal["sse"]
    url: str
    headers: NotRequired[dict[str, str]]

class McpHttpServerConfig(TypedDict):
    type: Literal["http"]
    url: str
    headers: NotRequired[dict[str, str]]

McpServerConfig = (
    McpStdioServerConfig
    | McpSSEServerConfig
    | McpHttpServerConfig
    | McpSdkServerConfig
)
```

### MCP status types

`ClaudeSDKClient.get_mcp_status()` returns:

```python
class McpStatusResponse(TypedDict):
    mcpServers: list[McpServerStatus]
```

Each `McpServerStatus` contains `name`, `status`, and optional `serverInfo`, `error`, `config`, `scope`, and `tools`. Status is one of `connected`, `failed`, `needs-auth`, `pending`, or `disabled`.

`McpServerStatusConfig` is the status-safe union of stdio, SSE, HTTP, SDK, and an output-only `claudeai-proxy` variant. The SDK status form omits the in-process `instance`; the proxy variant contains `type`, `url`, and `id`.

Use `strict_mcp_config=True` when only the explicitly supplied servers should exist.

## Plugins

```python
class SdkPluginConfig(TypedDict):
    type: Literal["local"]
    path: str
```

Only local plugin paths are currently supported:

```python
plugins = [
    {"type": "local", "path": "./my-plugin"},
    {"type": "local", "path": "/absolute/path/to/plugin"},
]
```

## Message types

```python
Message = (
    UserMessage
    | AssistantMessage
    | SystemMessage
    | ResultMessage
    | StreamEvent
    | RateLimitEvent
)
```

Specialized task and hook lifecycle messages subclass or specialize system messages and may also be yielded when enabled by the corresponding options.

### `UserMessage`

```python
@dataclass
class UserMessage:
    content: str | list[ContentBlock]
    uuid: str | None = None
    parent_tool_use_id: str | None = None
    tool_use_result: dict[str, Any] | None = None
```

### `AssistantMessage`

```python
@dataclass
class AssistantMessage:
    content: list[ContentBlock]
    model: str
    parent_tool_use_id: str | None = None
    error: AssistantMessageError | None = None
    usage: dict[str, Any] | None = None
    message_id: str | None = None
    stop_reason: str | None = None
    session_id: str | None = None
    uuid: str | None = None
```

```python
AssistantMessageError = Literal[
    "authentication_failed",
    "billing_error",
    "rate_limit",
    "invalid_request",
    "server_error",
    "max_output_tokens",
    "unknown",
]
```

### `SystemMessage`

```python
@dataclass
class SystemMessage:
    subtype: str
    data: dict[str, Any]
```

Initialization data includes capabilities such as tools, models, commands, agents, account data, permission mode, and MCP state. Narrow on `subtype` before reading subtype-specific data.

### `ResultMessage`

```python
@dataclass
class ResultMessage:
    subtype: str
    duration_ms: int
    duration_api_ms: int
    is_error: bool
    num_turns: int
    session_id: str
    stop_reason: str | None = None
    total_cost_usd: float | None = None
    usage: dict[str, Any] | None = None
    result: str | None = None
    structured_output: Any = None
    model_usage: dict[str, Any] | None = None
    permission_denials: list[Any] | None = None
    deferred_tool_use: DeferredToolUse | None = None
    errors: list[str] | None = None
    api_error_status: int | None = None
    uuid: str | None = None
```

`subtype` is `success`, `error_during_execution`, `error_max_turns`, `error_max_budget_usd`, or `error_max_structured_output_retries`. The dataclass flattens all variants, so non-applicable fields are `None`.

A `success` subtype can still have `is_error=True` if the loop finished but the final model request failed. Inspect `api_error_status`, preceding `AssistantMessage` content, and `errors`; do not equate `subtype == "success"` with a successful API completion without checking `is_error`.

Top-level `usage` excludes subagent tokens. Use `model_usage` for whole-tree accounting. Inner `model_usage` keys remain camelCase: `inputTokens`, `outputTokens`, `cacheReadInputTokens`, `cacheCreationInputTokens`, `webSearchRequests`, `costUSD`, `contextWindow`, and `maxOutputTokens`.

### `StreamEvent`

Yielded only with `include_partial_messages=True`.

```python
@dataclass
class StreamEvent:
    uuid: str
    session_id: str
    event: dict[str, Any]
    parent_tool_use_id: str | None = None
```

Stream events represent main-session API frames; `parent_tool_use_id` is always `None`. Use complete assistant/user messages for subagent attribution.

### Rate limits

```python
@dataclass
class RateLimitEvent:
    rate_limit_info: RateLimitInfo
    uuid: str
    session_id: str

RateLimitStatus = Literal["allowed", "allowed_warning", "rejected"]
RateLimitType = Literal[
    "five_hour", "seven_day", "seven_day_opus", "seven_day_sonnet", "overage"
]

@dataclass
class RateLimitInfo:
    status: RateLimitStatus
    resets_at: int | None = None
    rate_limit_type: RateLimitType | None = None
    utilization: float | None = None
    overage_status: RateLimitStatus | None = None
    overage_resets_at: int | None = None
    overage_disabled_reason: str | None = None
    raw: dict[str, Any] = field(default_factory=dict)
```

### Background task messages

```python
class TaskUsage(TypedDict):
    total_tokens: int
    tool_uses: int
    duration_ms: int

@dataclass
class TaskStartedMessage(SystemMessage):
    task_id: str
    description: str
    uuid: str
    session_id: str
    tool_use_id: str | None = None
    task_type: str | None = None

@dataclass
class TaskProgressMessage(SystemMessage):
    task_id: str
    description: str
    usage: TaskUsage
    uuid: str
    session_id: str
    tool_use_id: str | None = None
    last_tool_name: str | None = None

@dataclass
class TaskNotificationMessage(SystemMessage):
    task_id: str
    status: Literal["completed", "failed", "stopped"]
    output_file: str
    summary: str
    uuid: str
    session_id: str
    tool_use_id: str | None = None
    usage: TaskUsage | None = None
```

`task_type` distinguishes background Bash/Monitor (`local_bash`), local subagents (`local_agent`), and remote agents (`remote_agent`).

## Content blocks

```python
ContentBlock = TextBlock | ThinkingBlock | ToolUseBlock | ToolResultBlock

@dataclass
class TextBlock:
    text: str

@dataclass
class ThinkingBlock:
    thinking: str
    signature: str

@dataclass
class ToolUseBlock:
    id: str
    name: str
    input: dict[str, Any]

@dataclass
class ToolResultBlock:
    tool_use_id: str
    content: str | list[dict[str, Any]] | None = None
    is_error: bool | None = None
```

## Error classes

| Class | Meaning |
|---|---|
| `ClaudeSDKError` | Base SDK exception |
| `CLIConnectionError` | Failed to connect to Claude Code |
| `CLINotFoundError` | Claude Code executable not found; may include `cli_path` |
| `ProcessError` | CLI process failed; includes optional `exit_code` and `stderr` |
| `CLIJSONDecodeError` | Failed to parse a CLI JSON line; includes line and original exception |

```python
try:
    async for message in query(prompt="Hello"):
        print(message)
except CLINotFoundError:
    print("Reinstall the SDK or set cli_path")
except ProcessError as error:
    print(error.exit_code, error.stderr)
except CLIJSONDecodeError as error:
    print(error.line)
```

## Hooks

Python supports these hook events:

```python
HookEvent = Literal[
    "PreToolUse",
    "PostToolUse",
    "PostToolUseFailure",
    "UserPromptSubmit",
    "Stop",
    "SubagentStop",
    "PreCompact",
    "Notification",
    "SubagentStart",
    "PermissionRequest",
]
```

The TypeScript SDK exposes additional hook events. Check the current hook availability table before assuming parity.

### Callback and matcher

```python
HookCallback = Callable[
    [HookInput, str | None, HookContext],
    Awaitable[HookJSONOutput],
]

class HookContext(TypedDict):
    signal: Any | None

@dataclass
class HookMatcher:
    matcher: str | None = None
    hooks: list[HookCallback] = field(default_factory=list)
    timeout: float | None = None
```

`matcher` is a tool name or pattern such as `Bash` or `Write|Edit`. Omit it for all calls in the event. Timeout is in seconds; omission uses the event default.

### Hook inputs

All inputs include:

```python
class BaseHookInput(TypedDict):
    session_id: str
    transcript_path: str
    cwd: str
    permission_mode: NotRequired[str]
```

| Event | Additional fields |
|---|---|
| `PreToolUse` | `tool_name`, `tool_input`, `tool_use_id`, optional `agent_id`, `agent_type` |
| `PostToolUse` | tool fields plus `tool_response`, optional agent fields |
| `PostToolUseFailure` | tool fields plus `error`, optional `is_interrupt` and agent fields |
| `UserPromptSubmit` | `prompt` |
| `Stop` | `stop_hook_active` |
| `SubagentStop` | `stop_hook_active`, `agent_id`, `agent_transcript_path`, `agent_type` |
| `PreCompact` | `trigger` (`manual`/`auto`), `custom_instructions` |
| `Notification` | `message`, optional `title`, `notification_type` |
| `SubagentStart` | `agent_id`, `agent_type` |
| `PermissionRequest` | `tool_name`, `tool_input`, optional permission suggestions and agent fields |

`HookInput` is the union of the corresponding strongly typed dictionaries. Narrow on `hook_event_name`.

### Hook output

```python
HookJSONOutput = AsyncHookJSONOutput | SyncHookJSONOutput

class SyncHookJSONOutput(TypedDict):
    continue_: NotRequired[bool]
    suppressOutput: NotRequired[bool]
    stopReason: NotRequired[str]
    decision: NotRequired[Literal["block"]]
    systemMessage: NotRequired[str]
    reason: NotRequired[str]
    hookSpecificOutput: NotRequired[HookSpecificOutput]

class AsyncHookJSONOutput(TypedDict):
    async_: Literal[True]
    asyncTimeout: NotRequired[int]
```

Use Python-safe `continue_` and `async_`; the SDK converts them to wire keys `continue` and `async`.

`HookSpecificOutput` is discriminated by `hookEventName`:

| Event | Supported event-specific fields |
|---|---|
| `PreToolUse` | `permissionDecision`, reason, `updatedInput`, `additionalContext` |
| `PostToolUse` | `additionalContext`, `updatedToolOutput`; `updatedMCPToolOutput` deprecated |
| `PostToolUseFailure` | `additionalContext` |
| `UserPromptSubmit` | `additionalContext` |
| `Notification` | `additionalContext` |
| `SubagentStart` | `additionalContext` |
| `PermissionRequest` | `decision` dictionary |

```python
from claude_agent_sdk import ClaudeAgentOptions, HookMatcher

async def validate(input_data, tool_use_id, context):
    command = input_data.get("tool_input", {}).get("command", "")
    if input_data.get("tool_name") == "Bash" and "rm -rf /" in command:
        return {
            "hookSpecificOutput": {
                "hookEventName": "PreToolUse",
                "permissionDecision": "deny",
                "permissionDecisionReason": "Dangerous command blocked",
            }
        }
    return {}

options = ClaudeAgentOptions(
    hooks={"PreToolUse": [HookMatcher(matcher="Bash", hooks=[validate])]},
)
```

## Built-in tool schema map

The Python package does not export these schemas as Python types, but hosts encounter these shapes in hooks, permissions, and message blocks.

### `Agent`

Former tool name `Task` remains an accepted alias and may still appear in initialization tool lists.

Input fields: `description`, `prompt`, optional `subagent_type`, model (`sonnet`, `opus`, `haiku`, `fable`), `run_in_background`, `name`, deprecated `team_name`, deprecated/ignored `mode`, and `isolation` (`worktree` or `remote`). Agents run in the background by default; use `run_in_background=False` for synchronous execution.

Output is discriminated by `status`:

- `completed`: agent ID/type, content blocks, resolved/used models, tool counts, duration, tokens, usage, tool stats, prompt, and optional worktree path/branch.
- `async_launched`: agent ID, description, model data, prompt, output file, and read capability.
- `remote_launched`: remote task ID, session URL, description, prompt, and output file.

`resolvedModel` requires Claude Code 2.1.174 or later. `modelsUsed` and backgrounding-time model behavior require 2.1.212 or later.

### `AskUserQuestion`

Input contains one to four questions. Each has `question`, a short `header`, two to four options (`label`, `description`, optional `preview`), and `multiSelect`. Permission handling may populate `answers`, annotations, and metadata.

Output returns the questions, normalized string answers, optional freeform `response`, annotations, and optional inactivity timeout. Multi-select answers are comma-separated strings.

### `Bash`

Input: `command`, optional timeout (maximum 600000 ms), description, and `run_in_background`. Output: combined `output`, `exitCode`, optional `killed`, and optional background `shellId`.

### `Monitor`

Runs a command whose stdout lines become events or a WebSocket whose text frames become events. Provide exactly one source. Input also includes description, timeout (default 300000, max 3600000), and `persistent`. Output contains task ID, effective timeout, and persistent state. WebSocket source requires Claude Code 2.1.195 or later.

### File and search tools

| Tool | Key input | Key output |
|---|---|---|
| `Edit` | absolute path, old/new string, optional replace-all | message, replacement count, path |
| `Read` | absolute path, offset, limit | text/line metadata or image/base64 metadata |
| `Write` | absolute path and content | message, bytes written, path |
| `Glob` | pattern and optional path | matches, count, search path |
| `Grep` | regex, path/glob/type, output mode, context flags, limit, multiline | content matches or file list/count |
| `NotebookEdit` | notebook path, cell ID/source/type, replace/insert/delete | edit type, cell ID, total cells |

### Web tools

`WebFetch` accepts URL and prompt, returning bytes, HTTP code/text, processed result, duration, and final URL.

`WebSearch` accepts query plus optional allowed/blocked domains, returning the query, results, and duration.

### Task tracking

`TodoWrite` is disabled by default as of Claude Code 2.1.142. Prefer:

- `TaskCreate`: subject, description, optional active form and metadata; returns assigned task.
- `TaskUpdate`: patch status/content/dependencies/owner/metadata; returns success, updated fields, error, and status transition.
- `TaskGet`: task ID; returns task details or `None`.
- `TaskList`: no input; returns task summaries.

Set `CLAUDE_CODE_ENABLE_TASKS=0` only when compatibility requires `TodoWrite`.

### Background task controls

`TaskOutput` (previous alias `BashOutput`) is deprecated since 2.1.83; prefer `Read` on the output file. Its input accepts task ID, block, and timeout; output reports retrieval status and task details.

`TaskStop` (previous aliases `KillShell`/`KillBash`) accepts `task_id` or deprecated `shell_id`, returning the stopped task ID/type and command/description.

### Plan and MCP resource tools

`ExitPlanMode` accepts a plan string and returns confirmation plus optional approval.

`ListMcpResourcesTool` accepts an optional server filter and returns resources (`uri`, `name`, optional description/MIME type, server) plus total.

`ReadMcpResourceTool` accepts server and URI, returning content entries (`uri`, optional MIME type/text/blob) and server.

## Sandbox configuration

### `SandboxSettings`

```python
class SandboxSettings(TypedDict, total=False):
    enabled: bool
    autoAllowBashIfSandboxed: bool
    excludedCommands: list[str]
    allowUnsandboxedCommands: bool
    network: SandboxNetworkConfig
    ignoreViolations: SandboxIgnoreViolations
    enableWeakerNestedSandbox: bool
```

| Field | Default | Meaning |
|---|---:|---|
| `enabled` | `False` | Enable command sandboxing |
| `autoAllowBashIfSandboxed` | `True` | Auto-approve sandboxed Bash |
| `excludedCommands` | `[]` | Commands that always run unsandboxed |
| `allowUnsandboxedCommands` | `True` | Let the model request sandbox bypass |
| `network` | none | Network controls |
| `ignoreViolations` | none | Ignored file/network violations |
| `enableWeakerNestedSandbox` | `False` | Compatibility-oriented weaker nesting |

Python differs from TypeScript when sandbox startup is unavailable: Python defaults to warning and unsandboxed fallback, while TypeScript defaults to failing. The Python `SandboxSettings` type does not yet declare `failIfUnavailable`, but the SDK forwards that key to Claude Code. Set it to true to stop with an error instead.

A failed single-shot sandbox startup may yield an error result and then raise; handle both.

### `SandboxNetworkConfig`

```python
class SandboxNetworkConfig(TypedDict, total=False):
    allowedDomains: list[str]
    deniedDomains: list[str]
    allowManagedDomainsOnly: bool
    allowUnixSockets: list[str]
    allowAllUnixSockets: bool
    allowLocalBinding: bool
    allowMachLookup: list[str]
    httpProxyPort: int
    socksProxyPort: int
```

Denied domains win over allowed domains. `allowManagedDomainsOnly` only has effect in managed settings, not when supplied through SDK options. `allowMachLookup` is macOS-only and supports trailing wildcards.

The built-in network proxy filters requested hostnames but does not terminate TLS; domain fronting can bypass hostname-only enforcement. Use a TLS-terminating proxy for stronger traffic controls.

Allowing powerful Unix sockets such as `/var/run/docker.sock` effectively grants host control and bypasses sandbox isolation.

### `SandboxIgnoreViolations`

```python
class SandboxIgnoreViolations(TypedDict, total=False):
    file: list[str]
    network: list[str]
```

### Unsandboxed fallback

When `allowUnsandboxedCommands=True`, Bash may request `dangerouslyDisableSandbox=True`. The request falls back to the permission system and can reach `can_use_tool`.

`excludedCommands` is a static host-controlled bypass list. `allowUnsandboxedCommands` lets the model request bypass dynamically. Do not confuse them.

If `permission_mode="bypassPermissions"` is combined with unsandboxed requests, the model may execute outside isolation without an approval prompt unless an explicit ask rule applies.

## Timeouts, retries, and stalls

Pass CLI environment variables through `ClaudeAgentOptions.env`:

```python
options = ClaudeAgentOptions(
    env={
        "API_TIMEOUT_MS": "120000",
        "CLAUDE_CODE_MAX_RETRIES": "2",
        "CLAUDE_ASYNC_AGENT_STALL_TIMEOUT_MS": "120000",
    }
)
```

| Variable | Default/behavior |
|---|---|
| `API_TIMEOUT_MS` | 600000 ms per Anthropic request, including subagents |
| `CLAUDE_CODE_MAX_RETRIES` | 10, normally capped at 15 |
| `CLAUDE_CODE_RETRY_WATCHDOG=1` | Infinite capacity retries; from 2.1.199 raises other transient defaults to 300 and removes cap |
| `CLAUDE_ASYNC_AGENT_STALL_TIMEOUT_MS` | 600000 ms for background subagents; resets on stream events |
| `CLAUDE_ENABLE_STREAM_WATCHDOG` | On by default; set `0` to disable |
| `CLAUDE_STREAM_IDLE_TIMEOUT_MS` | 300000 ms minimum idle-body timeout after headers |

Worst-case retry wall time is roughly `API_TIMEOUT_MS * (retries + 1)` plus backoff. Add an application-level deadline for unattended jobs.

## Practical patterns

### Continuous conversation

```python
import asyncio
from claude_agent_sdk import AssistantMessage, ClaudeSDKClient, TextBlock

async def main():
    async with ClaudeSDKClient() as client:
        for prompt in ["What is in this repo?", "Which file should I edit first?"]:
            await client.query(prompt)
            async for message in client.receive_response():
                if isinstance(message, AssistantMessage):
                    for block in message.content:
                        if isinstance(block, TextBlock):
                            print(block.text)

asyncio.run(main())
```

### Custom permission gate

```python
from claude_agent_sdk import PermissionResultAllow, PermissionResultDeny

async def gate(tool_name, input_data, context):
    path = input_data.get("file_path", "")
    if tool_name in {"Write", "Edit"} and path.startswith("/system/"):
        return PermissionResultDeny(message="System writes are blocked", interrupt=True)
    return PermissionResultAllow(updated_input=input_data)
```

Do not put a gated tool in `allowed_tools`; an allow match approves it before `can_use_tool` runs.

### Custom in-process tools

Return MCP-compatible content arrays and mark failures with `is_error=True`. Avoid unrestricted `eval()` in real tools; examples using restricted `eval` are illustrative, not a robust expression sandbox.

## Troubleshooting

| Symptom | Check |
|---|---|
| `externally-managed-environment` | Create and activate a virtual environment |
| `No matching distribution found` | Python version, active interpreter, index, and virtual environment |
| Claude Code executable not found | Reinstall SDK optional components or set `cli_path` |
| Expected follow-up context is gone | Use one `ClaudeSDKClient`, or set `continue_conversation`/`resume` |
| Interrupt response appears on next turn | Drain interrupted messages through `ResultMessage` first |
| Permission callback never runs | Remove matching `allowed_tools`/allow rules or use `PreToolUse` |
| Python `AgentDefinition` rejects snake_case | Its wire-compatible fields use camelCase |
| Unexpected personal settings affect CI | Set `setting_sources=[]` or `['project']` explicitly |
| Empty setting source list has no effect | Upgrade beyond Python SDK 0.1.59 |
| Unexpected MCP servers appear | Set `strict_mcp_config=True` |
| Skill is unavailable | Configure `skills`; if `tools` is explicit, include `Skill` |
| Partial tokens are missing | Set `include_partial_messages=True` and consume `StreamEvent` |
| Hook lifecycle events are missing | Set `include_hook_events=True` |
| Result says success but request failed | Check `is_error`, `api_error_status`, and preceding assistant messages |
| Total usage omits subagents | Use `model_usage`, not top-level `usage` alone |
| Sandbox silently falls back | Add forwarded `failIfUnavailable=True` when fail-closed behavior is required |
| Command escapes sandbox | Audit excluded commands, bypass requests, permission mode, and explicit ask rules |
| Query error is followed by exception | Handle streamed `ResultMessage` and iterator exception |
| Stream/client cleanup warnings | Consume responses fully rather than breaking early |

## Checklist

1. Use a virtual environment and pin an SDK version appropriate for required CLI behavior.
2. Choose `query()` for isolated work or `ClaudeSDKClient` for a managed conversation.
3. Consume and narrow the entire message stream, including `ResultMessage`.
4. Configure tools, allow/deny rules, settings sources, MCP, skills, and plugins explicitly.
5. Keep Python snake_case options separate from camelCase `AgentDefinition` wire fields.
6. Treat `can_use_tool` as a prompt handler, not an all-tool interceptor.
7. Drain interrupted responses before issuing another client turn.
8. Handle streamed error results and raised process exceptions separately.
9. Apply fail-closed sandbox/network settings for untrusted workloads.
10. Use whole-tree `model_usage` for subagent-inclusive accounting.
11. Add application deadlines around CLI request/retry windows.
12. Revisit the official index, Python reference, hook availability table, and changelog before upgrades.

## Related

- Agent SDK overview and language comparison: `agent-sdk.md`
- TypeScript complete API reference: `agent-sdk-typescript.md`
- Claude Code filesystem hooks: `hooks.md`
- Claude Code filesystem subagents: `subagents.md`
- Claude Code MCP configuration: `mcp.md`
- Claude Code plugins: `plugins.md`
- Cross-CLI testing: `../shared/testing.md`
