# Codex SDK

Programmatically control **local Codex agents** from application code.

Use the SDK when you need to:

- Drive Codex in CI/CD
- Build a custom agent that engages Codex for engineering work
- Embed Codex in internal tools/workflows
- Integrate Codex inside your product

Use the SDK for **coding-focused Codex threads**.  
If Codex is only one specialist inside a broader orchestrated multi-agent system, prefer running **Codex CLI as an MCP server** and orchestrating with the Agents SDK — see `mcp-server.md`.

## Choose the right integration

| Need | Prefer |
|---|---|
| In-process coding threads from TS/Python | Codex SDK (this file) |
| Deep IDE/product integration (history, approvals stream) | App server → `app-server.md` |
| Expose Codex as tools to other agents | `codex mcp-server` → `mcp-server.md` |
| Parallel roles inside one Codex CLI session | `subagents.md` |
| Package Codex plugins/hooks | `plugins.md` / `hooks.md` |

## TypeScript SDK

More comprehensive/flexible than non-interactive CLI mode. **Server-side only.** Requires **Node.js 18+**.

### Install

```bash
npm install @openai/codex-sdk
```

### Usage

Start a thread and run a prompt:

```ts
import { Codex } from "@openai/codex-sdk";

const codex = new Codex();
const thread = codex.startThread();
const result = await thread.run(
  "Make a plan to diagnose and fix the CI failures",
);

console.log(result.finalResponse);
```

Continue the same thread:

```ts
const result = await thread.run("Implement the plan");
console.log(result.finalResponse);
```

Resume a past thread by ID:

```ts
const threadId = "<thread-id>";
const thread2 = codex.resumeThread(threadId);
const result2 = await thread2.run("Pick up where you left off");
console.log(result2.finalResponse);
```

Details: TypeScript SDK repository docs.

## Python SDK

Controls the local Codex **app-server** over JSON-RPC. Requires **Python 3.10+**.  
Published builds pin a Codex CLI runtime dependency.

### Install

```bash
pip install openai-codex
```

Published builds use their pinned runtime. Pass `CodexConfig(codex_bin=...)` only when you intentionally want a specific local Codex executable.

While beta: `pip install openai-codex` installs the latest published beta. After stable exists, use `pip install --pre openai-codex` for newer prereleases.

### Sync usage

```python
from openai_codex import Codex, Sandbox

with Codex() as codex:
    thread = codex.thread_start(
        model="gpt-5.4",
        sandbox=Sandbox.workspace_write,
    )
    result = thread.run("Make a plan to diagnose and fix the CI failures")
    print(result.final_response)
```

### Async usage

```python
import asyncio
from openai_codex import AsyncCodex

async def main() -> None:
    async with AsyncCodex() as codex:
        thread = await codex.thread_start(model="gpt-5.4")
        result = await thread.run("Implement the plan")
        print(result.final_response)

asyncio.run(main())
```

### Sandbox presets (Python)

Set sandbox when creating a thread or for a later turn:

```python
from openai_codex import Codex, Sandbox

with Codex() as codex:
    thread = codex.thread_start(sandbox=Sandbox.workspace_write)
    thread.run("Make the requested change.")
    review = thread.run("Review the diff only.", sandbox=Sandbox.read_only)
```

| Preset | Meaning |
|---|---|
| `Sandbox.read_only` | Read files; no writes |
| `Sandbox.workspace_write` | Read + write inside workspace and configured writable roots |
| `Sandbox.full_access` | No filesystem access restrictions |

If `sandbox=` is omitted, app-server uses its configured default.  
A sandbox passed to `run(...)` / `turn(...)` applies to that turn **and later turns** on the thread.

Details: Python SDK repository docs.

## Patterns

### CI/CD

1. Install CLI/runtime the SDK expects (or use pinned package runtime).
2. Authenticate non-interactively in the pipeline environment.
3. Prefer `workspace_write` or `read_only` over `full_access`.
4. One thread per job; resume only when intentional.

### Application embed

1. Keep SDK calls server-side (TS requires Node; do not ship CLI control to browsers).
2. Store `threadId` if you need multi-turn user sessions.
3. Bound prompts and permissions; never pass secrets in free-form developer text if env injection exists.

### Multi-turn coding

```text
startThread / thread_start
  → run(plan)
  → run(implement)   # same thread
  → run(review, sandbox=read_only)
```

## Safety notes

- Treat `full_access` as dangerous; default to `workspace_write` or `read_only`.
- SDK controls a **local** Codex runtime — ensure the host is trusted and isolated for CI.
- Do not confuse this with OpenCode/Codex **client** MCP configuration.
- Prefer MCP-server + Agents SDK when many specialists must coordinate outside a single Codex thread.

## Checklist

1. Pick TS (`@openai/codex-sdk`) or Python (`openai-codex`).
2. Meet runtime: Node 18+ or Python 3.10+.
3. Start/resume a thread; call `run` with a clear coding task.
4. Set sandbox appropriately; tighten for review turns.
5. Capture `finalResponse` / `final_response` and optional thread id for resume.
6. For multi-agent orchestration beyond one thread, evaluate `mcp-server.md`.

## Related

- Codex as MCP server: `mcp-server.md`
- Codex subagents: `subagents.md`
- Codex hooks/plugins: `hooks.md`, `plugins.md`
