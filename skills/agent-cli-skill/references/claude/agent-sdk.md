# Claude Agent SDK

Use the Claude Agent SDK to run Claude Code's agent loop, built-in tools, context management, hooks, permissions, subagents, and MCP integrations from a Python or TypeScript application.

Before researching a detailed SDK feature, fetch the current documentation index:

```text
https://code.claude.com/docs/llms.txt
```

Use that index to locate the current overview, quickstart, language API, sessions, permissions, hooks, MCP, subagents, skills, plugins, custom tools, deployment, hosting, and migration pages. SDK APIs evolve; check the language-specific API page and changelog before depending on a newly introduced option.

## Choose the right Claude integration

| Need | Prefer |
|---|---|
| Autonomous file, shell, web, and coding work from Python/TypeScript | Claude Agent SDK |
| Direct Messages API access with an application-owned tool loop | Anthropic Client SDK |
| Interactive development | Claude Code CLI |
| One-shot automation in another language | Claude Code CLI with `-p` and `--output-format json` |
| Anthropic-hosted agent runtime and sandbox | Managed Agents |
| Claude Code plugin packaging | `plugins.md` |
| Claude Code CLI hooks/configuration | `hooks.md` |

The Agent SDK runs the agent loop inside your process and works on files and services available to your infrastructure. It is not merely an HTTP client: built-in tool execution and session handling are part of the harness.

## Install

### TypeScript

```bash
npm init -y
npm pkg set type=module
npm install @anthropic-ai/claude-agent-sdk
npm install --save-dev tsx
```

Use an ESM project for top-level `await`. In an existing CommonJS project, keep the project configuration and name the entry point `agent.mts`.

### Python with uv

```bash
uv init
uv add claude-agent-sdk
```

### Python with pip

Use Python 3.10 or newer and install inside a virtual environment.

macOS/Linux:

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install claude-agent-sdk
```

Windows PowerShell:

```powershell
py -m venv .venv
.venv\Scripts\Activate.ps1
pip install claude-agent-sdk
```

If PowerShell blocks activation:

```powershell
Set-ExecutionPolicy -Scope Process RemoteSigned
```

Both packages bundle a native Claude Code binary for the supported platform; a separate Claude Code installation is not required.

## Authentication

Default API-key authentication:

macOS/Linux:

```bash
export ANTHROPIC_API_KEY=sk-ant-xxxxx
```

Windows PowerShell:

```powershell
$env:ANTHROPIC_API_KEY = "sk-ant-xxxxx"
```

Supported provider switches include:

| Provider | Environment |
|---|---|
| Amazon Bedrock | `CLAUDE_CODE_USE_BEDROCK=1` plus AWS credentials |
| Claude Platform on AWS | `CLAUDE_CODE_USE_ANTHROPIC_AWS=1`, `ANTHROPIC_AWS_WORKSPACE_ID`, plus AWS credentials |
| Google Cloud Agent Platform / Vertex | `CLAUDE_CODE_USE_VERTEX=1` plus Google Cloud credentials |
| Microsoft Foundry | `CLAUDE_CODE_USE_FOUNDRY=1` plus Azure credentials |

Do not build third-party products around `claude.ai` login or consumer rate limits unless Anthropic has explicitly approved that arrangement. Use the documented API-key or cloud-provider authentication flows.

## Minimal query

### Python

```python
import asyncio
from claude_agent_sdk import query, ClaudeAgentOptions


async def main():
    async for message in query(
        prompt="Find and fix the bug in auth.py",
        options=ClaudeAgentOptions(
            allowed_tools=["Read", "Edit", "Bash"],
        ),
    ):
        print(message)


asyncio.run(main())
```

Run it with:

```bash
uv run agent.py
# or, inside the activated venv:
python3 agent.py
```

### TypeScript

```typescript
import { query } from "@anthropic-ai/claude-agent-sdk";

for await (const message of query({
  prompt: "Find and fix the bug in auth.ts",
  options: {
    allowedTools: ["Read", "Edit", "Bash"],
  },
})) {
  console.log(message);
}
```

Run it with:

```bash
npx tsx agent.ts
```

`query()` returns an async stream. Consume the stream to observe initialization, assistant/tool activity, result messages, and errors instead of assuming a single response object.

## Python and TypeScript option naming

Most concepts map directly but use language conventions:

| Python | TypeScript |
|---|---|
| `ClaudeAgentOptions` | `options` object |
| `allowed_tools` | `allowedTools` |
| `disallowed_tools` | `disallowedTools` |
| `permission_mode` | `permissionMode` |
| `mcp_servers` | `mcpServers` |
| `setting_sources` | `settingSources` |
| `parent_tool_use_id` | `parent_tool_use_id` in streamed message data |

Do not copy TypeScript camelCase options into Python or Python snake_case options into TypeScript.

## Built-in tools

Common built-ins include:

| Tool | Purpose |
|---|---|
| `Read` | Read files |
| `Write` | Create files |
| `Edit` | Modify existing files precisely |
| `Bash` | Run commands, scripts, and Git operations |
| `Monitor` | Watch background script output as events |
| `Glob` | Find paths by pattern |
| `Grep` | Search file contents |
| `WebSearch` | Search for current information |
| `WebFetch` | Fetch and parse web content |
| `AskUserQuestion` | Request structured clarifying input |
| `Agent` | Invoke a configured subagent |

Use the current tools reference for the complete list, including scheduling and worktree tools.

## Permissions

`allowed_tools` / `allowedTools` pre-approves matching tools so they run without a prompt. It does **not** necessarily remove every other tool from the agent. Use `disallowed_tools` / `disallowedTools` when a tool must be blocked entirely, and configure the permission mode or permission callback for remaining cases.

Read-oriented example:

```python
options=ClaudeAgentOptions(
    allowed_tools=["Read", "Glob", "Grep"],
)
```

```typescript
options: {
  allowedTools: ["Read", "Glob", "Grep"]
}
```

For a true non-modifying boundary, combine the allow list with explicit disallow rules or the documented permission mechanism. Do not call an agent "read-only" merely because write tools were omitted from `allowedTools`.

For interactive approvals and `AskUserQuestion`, use the SDK user-input/permissions APIs rather than blocking the async iterator without a response channel.

## Hooks

SDK hooks are in-process callbacks. They can validate, log, block, or transform behavior at lifecycle points such as `PreToolUse`, `PostToolUse`, `Stop`, `SessionStart`, `SessionEnd`, and `UserPromptSubmit`.

Python audit hook:

```python
from datetime import datetime
from claude_agent_sdk import ClaudeAgentOptions, HookMatcher


async def log_file_change(input_data, tool_use_id, context):
    file_path = input_data.get("tool_input", {}).get("file_path", "unknown")
    with open("./audit.log", "a") as file:
        file.write(f"{datetime.now()}: modified {file_path}\n")
    return {}


options = ClaudeAgentOptions(
    allowed_tools=["Read", "Edit"],
    permission_mode="acceptEdits",
    hooks={
        "PostToolUse": [
            HookMatcher(matcher="Edit|Write", hooks=[log_file_change])
        ]
    },
)
```

TypeScript audit hook:

```typescript
import type { HookCallback } from "@anthropic-ai/claude-agent-sdk";
import { appendFile } from "fs/promises";

const logFileChange: HookCallback = async (input) => {
  const filePath = (input as any).tool_input?.file_path ?? "unknown";
  await appendFile("./audit.log", `${new Date().toISOString()}: modified ${filePath}\n`);
  return {};
};

const options = {
  allowedTools: ["Read", "Edit"],
  permissionMode: "acceptEdits",
  hooks: {
    PostToolUse: [{ matcher: "Edit|Write", hooks: [logFileChange] }],
  },
};
```

SDK callbacks differ from filesystem-based Claude Code hook commands. Route plugin/CLI hook packaging questions to `hooks.md`; route `HookMatcher` or callback questions here.

## Programmatic subagents

Define focused agents in options and include `Agent` in the parent agent's allowed tools when their invocation should be pre-approved.

### Python

```python
from claude_agent_sdk import AgentDefinition, ClaudeAgentOptions

options = ClaudeAgentOptions(
    allowed_tools=["Read", "Glob", "Grep", "Agent"],
    agents={
        "code-reviewer": AgentDefinition(
            description="Expert code reviewer for quality and security reviews.",
            prompt="Analyze code quality and suggest improvements.",
            tools=["Read", "Glob", "Grep"],
        )
    },
)
```

### TypeScript

```typescript
const options = {
  allowedTools: ["Read", "Glob", "Grep", "Agent"],
  agents: {
    "code-reviewer": {
      description: "Expert code reviewer for quality and security reviews.",
      prompt: "Analyze code quality and suggest improvements.",
      tools: ["Read", "Glob", "Grep"],
    },
  },
};
```

Messages emitted from a subagent context include `parent_tool_use_id`, which can be used to associate nested activity with the parent `Agent` tool invocation.

Use `subagents.md` for Claude Code's filesystem-defined `.claude/agents` format. Use this reference for SDK `agents` / `AgentDefinition` configuration.

## MCP servers

Attach local or remote systems through MCP and allow the generated MCP tool names.

### Python

```python
options=ClaudeAgentOptions(
    mcp_servers={
        "playwright": {
            "command": "npx",
            "args": ["@playwright/mcp@latest"],
        }
    },
    allowed_tools=["mcp__playwright__*"],
)
```

### TypeScript

```typescript
options: {
  mcpServers: {
    playwright: {
      command: "npx",
      args: ["@playwright/mcp@latest"],
    },
  },
  allowedTools: ["mcp__playwright__*"],
}
```

Treat third-party MCP servers as executable dependencies. Pin versions where reproducibility matters and grant only the MCP tool patterns the agent needs.

Use `mcp.md` for Claude Code CLI commands and `.mcp.json`; use this reference for SDK `mcp_servers` / `mcpServers` options.

## Sessions and resume

Capture the session ID from the initialization message, then pass it through `resume` to continue with prior context.

### Python

```python
import asyncio
from claude_agent_sdk import (
    ClaudeAgentOptions,
    ResultMessage,
    SystemMessage,
    query,
)


async def main():
    session_id = None

    try:
        async for message in query(
            prompt="Read the authentication module",
            options=ClaudeAgentOptions(allowed_tools=["Read", "Glob"]),
        ):
            if isinstance(message, SystemMessage) and message.subtype == "init":
                session_id = message.data["session_id"]
    except Exception as error:
        print(f"Session ended with an error: {error}")

    if session_id is None:
        return

    async for message in query(
        prompt="Now find all places that call it",
        options=ClaudeAgentOptions(resume=session_id),
    ):
        if isinstance(message, ResultMessage):
            print(message.result)


asyncio.run(main())
```

### TypeScript

```typescript
import { query } from "@anthropic-ai/claude-agent-sdk";

let sessionId: string | undefined;

try {
  for await (const message of query({
    prompt: "Read the authentication module",
    options: { allowedTools: ["Read", "Glob"] },
  })) {
    if (message.type === "system" && message.subtype === "init") {
      sessionId = message.session_id;
    }
  }
} catch (error) {
  console.error(`Session ended with an error: ${error}`);
}

if (sessionId) {
  for await (const message of query({
    prompt: "Now find all places that call it",
    options: { resume: sessionId },
  })) {
    if ("result" in message) console.log(message.result);
  }
}
```

A single-shot `query()` can yield an error result and then raise/throw. Capture initialization and result information inside the loop, and still handle process/connection exceptions around it.

Use the sessions documentation for fork, resume, multi-turn clients, and message-type details.

## Filesystem configuration sources

The SDK can load Claude Code filesystem configuration from the working directory and home directory. Relevant assets include:

| Feature | Typical location |
|---|---|
| Skills | `.claude/skills/*/SKILL.md` |
| Legacy commands | `.claude/commands/*.md` |
| Project memory/instructions | `CLAUDE.md` or `.claude/CLAUDE.md` |
| Plugins | supplied programmatically through the SDK `plugins` option |

Control which configuration sources are loaded with:

- Python: `setting_sources`
- TypeScript: `settingSources`

Set these deliberately in production so the process does not unexpectedly inherit user-level configuration from `~/.claude/`.

## Production guidance

1. Run the SDK in a trusted server/worker environment, not directly in an untrusted browser client.
2. Set an explicit working directory and isolate each job or tenant.
3. Apply least privilege to tools, permission callbacks, MCP servers, credentials, and network access.
4. Stream and persist useful message metadata, including session IDs, results, errors, and `parent_tool_use_id` for subagents.
5. Add timeouts, cancellation, concurrency limits, and cleanup for the bundled child process.
6. Treat prompts, repositories, web pages, MCP results, and tool output as untrusted input.
7. Pin SDK/MCP versions when reproducibility matters and review the TypeScript/Python changelog during upgrades.
8. Avoid leaking API keys through prompts, logs, audit hooks, exceptions, or persisted session data.

## Branding and terms

When exposing an SDK-powered agent to users, maintain the product's own branding. Anthropic's documented preferred wording includes "Claude Agent" or "Powered by Claude". Do not present the product as Claude Code or imitate Claude Code branding.

Use of the Agent SDK is subject to Anthropic's applicable commercial terms and any component-specific licenses.

## Troubleshooting

| Symptom | Check |
|---|---|
| `No matching distribution found for claude-agent-sdk` | Confirm Python 3.10+ and the active interpreter/venv |
| `externally-managed-environment` during pip install | Create and activate a virtual environment instead of installing into system Python |
| TypeScript top-level `await` fails | Use ESM (`"type": "module"`) or an `.mts` entry point |
| Agent prompts for tools expected to run automatically | Verify `allowed_tools` / `allowedTools`, exact tool names, and permission mode |
| Agent can still access a tool omitted from the allow list | Use `disallowed_tools` / `disallowedTools`; allow lists pre-approve rather than necessarily remove tools |
| Subagent is not invoked automatically | Include `Agent` in the parent allow list and verify the agent name/description |
| MCP tools are unavailable | Verify server startup and allow `mcp__<server>__*` or narrower generated names |
| Resume loses context | Capture the init message's session ID and pass it through `resume` |
| Error result is followed by an exception | Handle streamed result messages and wrap `query()` iteration in `try`/`except` or `try`/`catch` |
| Unexpected personal/project configuration is loaded | Set `setting_sources` / `settingSources` explicitly |

## Checklist

1. Choose Agent SDK rather than Client SDK, CLI, or Managed Agents for the actual runtime need.
2. Install `@anthropic-ai/claude-agent-sdk` or `claude-agent-sdk` in a supported environment.
3. Configure API-key or supported cloud-provider authentication.
4. Consume the full async message stream.
5. Set tool permissions and explicit deny rules according to risk.
6. Configure hooks, subagents, MCP, sessions, and setting sources only as needed.
7. Add isolation, cancellation, observability, and secret handling before production use.
8. Consult `llms.txt`, the language API page, and the changelog before relying on version-sensitive behavior.

## Related

- Python complete API reference: `agent-sdk-python.md`
- TypeScript complete API reference: `agent-sdk-typescript.md`
- Claude Code CLI hooks: `hooks.md`
- Claude Code filesystem subagents: `subagents.md`
- Claude Code MCP configuration: `mcp.md`
- Claude Code skills packaging: `skills.md`
- Claude Code plugins: `plugins.md`
- Cross-CLI testing: `../shared/testing.md`
