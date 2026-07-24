# Claude Code Subagents

Official docs: https://code.claude.com/docs/en/sub-agents  
Index: https://code.claude.com/docs/llms.txt

Subagents are specialized assistants with their own context window, system
prompt, tool access, and permissions. Use them when side work would flood the
main conversation with searches, logs, or file dumps; they return a summary.
They run within a single session (not multi-session teams).

Related (separate docs): background agents / agent view, agent teams.

## Built-ins

| Agent | Tools | Notes |
|---|---|---|
| Explore | read-only | Code search/exploration; skips CLAUDE.md + git status |
| Plan | read-only | Used in plan mode research |
| general-purpose | full subagent tool pool | Multi-step explore + act |
| statusline-setup | — | `/statusline` helper (Sonnet) |
| claude-code-guide | — | Claude Code feature Q&A (Haiku) |

As of v2.1.198, Explore inherits the main model (capped at Opus on Claude API).
Override with a user/project agent named `Explore` and `model: haiku` if desired.

Disable:

- One type: `permissions.deny: ["Agent(Explore)"]`
- All delegation: deny the `Agent` tool
- Explore+Plan only: `CLAUDE_CODE_DISABLE_EXPLORE_PLAN_AGENTS=1` (v2.1.198+)
- Headless/SDK built-ins: `CLAUDE_AGENT_SDK_DISABLE_BUILTIN_AGENTS=1`

## Quickstart

Subagents = Markdown + YAML frontmatter under:

- Project: `.claude/agents/<name>.md`
- User: `~/.claude/agents/<name>.md`

As of v2.1.198, `/agents` no longer opens a creation wizard — ask Claude or
edit files directly. Restart only if the `agents` directory was created after
session start (watcher covers existing dirs).

```markdown
---
name: code-improver
description: Scans files and suggests improvements. Use after writing code.
tools: Read, Grep, Glob
model: sonnet
---

You are a code improvement specialist. For each issue explain the problem,
show current code, and provide an improved version.
```

Invoke:

```text
Use the code-improver agent to suggest improvements in this project
```

## Scope and precedence

Highest → lowest when names collide:

1. Managed settings (org)
2. `--agents` CLI JSON (session-only)
3. `.claude/agents/` (project; walk-up from cwd; closest wins since v2.1.178)
4. `~/.claude/agents/` (user / all projects)
5. Plugin `agents/` (lowest)

Recursive scan supported. Identity is frontmatter `name`, not filename path
(except plugin subfolders become scoped ids: `plugin:review:security`).

Keep `name` unique under a tree; `/doctor` reports duplicates (v2.1.205+).

Plugin subagents **ignore** `hooks`, `mcpServers`, `permissionMode`. Copy the
file to project/user scope if you need those fields.

`--add-dir` also scans `.claude/agents/` inside added directories.

## File format

Frontmatter = config; body = system prompt (not the full Claude Code prompt).

Required: `name`, `description`.

| Field | Purpose |
|---|---|
| `name` | lowercase + hyphens; hooks get this as `agent_type` |
| `description` | when Claude should delegate (write clearly; “use proactively”) |
| `tools` | allowlist; omit = inherit subagent pool |
| `disallowedTools` | denylist after inherit/allowlist |
| `model` | `sonnet` / `opus` / `haiku` / `fable` / full id / `inherit` (default) |
| `permissionMode` | `default`, `acceptEdits`, `auto`, `dontAsk`, `bypassPermissions`, `plan`, `manual`(=default) |
| `maxTurns` | cap agentic turns |
| `skills` | preload full skill bodies at startup |
| `mcpServers` | name refs or inline MCP configs |
| `hooks` | subagent-scoped lifecycle hooks |
| `memory` | `user` \| `project` \| `local` persistent memory |
| `background` | `true` = always background |
| `effort` | `low`/`medium`/`high`/`xhigh`/`max` |
| `isolation` | `worktree` = temp git worktree |
| `color` | task list color |
| `initialPrompt` | first turn when run as main agent via `--agent` |

CLI session agents:

```bash
claude --agents '{
  "code-reviewer": {
    "description": "Expert reviewer. Use proactively after code changes.",
    "prompt": "You are a senior code reviewer...",
    "tools": ["Read", "Grep", "Glob", "Bash"],
    "model": "sonnet"
  }
}'
```

JSON uses `prompt` instead of the markdown body. Same other fields.

## Model resolution

1. `CLAUDE_CODE_SUBAGENT_MODEL` env
2. Per-invocation `model`
3. Frontmatter `model`
4. Main conversation model

Respects org `availableModels`. Extended thinking inherits from main (v2.1.198+).

## Tools and filters

Always stripped from non-fork subagents (even if listed):
`Agent` (unless nested spawn enabled), `AskUserQuestion`, `EndConversation`,
`EnterPlanMode`, `ExitPlanMode` (unless `permissionMode: plan`),
`ScheduleWakeup`, `TaskOutput`, `WaitForMcpServers`, `Workflow`.

Background subagents (default since v2.1.198) keep MCP tools but only a reduced
built-in set: Read, Grep, Glob, Bash, PowerShell, Edit, Write, NotebookEdit,
WebFetch, WebSearch, TodoWrite, Skill, ToolSearch, EnterWorktree, ExitWorktree,
Monitor, TaskStop, SendMessage, Artifact.

Allowlist:

```yaml
tools: Read, Grep, Glob, Bash
```

Denylist:

```yaml
disallowedTools: Write, Edit
```

MCP patterns: `mcp__github`, `mcp__server__*`, `mcp__*` in disallowedTools.

If `tools` resolves to zero tools → spawn fails.

Main-thread agent (`claude --agent`) can restrict spawn types:

```yaml
tools: Agent(worker, researcher), Read, Bash
```

In a subagent definition, `Agent` enables nested spawn when depth allows;
parenthesized type lists are ignored there.

## MCP on a subagent

```yaml
mcpServers:
  - playwright:
      type: stdio
      command: npx
      args: ["-y", "@playwright/mcp@latest"]
  - github   # already-configured server name
```

Inline servers connect for the subagent lifetime only. Use inline to keep tools
out of main-session context. Enterprise MCP allow/deny still applies.

## Permission modes

| Mode | Behavior |
|---|---|
| `default` | normal prompts |
| `acceptEdits` | auto file edits / common FS cmds in allowed dirs |
| `auto` | classifier reviews |
| `dontAsk` | auto-deny prompts |
| `bypassPermissions` | skip prompts (dangerous) |
| `plan` | read-only plan mode |

Parent `bypassPermissions` / `acceptEdits` / auto mode can override child mode.

## Skills preload

```yaml
skills:
  - api-conventions
```

Injects full skill content. Cannot preload skills with
`disable-model-invocation: true` (includes bundled `/verify`, `/code-review`).

## Persistent memory

```yaml
memory: project   # recommended default
```

| Scope | Path |
|---|---|
| `user` | `~/.claude/agent-memory/<name>/` |
| `project` | `.claude/agent-memory/<name>/` |
| `local` | `.claude/agent-memory-local/<name>/` |

Injects first 200 lines / 25KB of `MEMORY.md`. Requires auto-memory enabled.
Enables Read/Write/Edit for memory curation.

## Hooks

Frontmatter hooks (subagent-active only):

```yaml
hooks:
  PreToolUse:
    - matcher: "Bash"
      hooks:
        - type: command
          command: "./scripts/validate-readonly-query.sh"
  PostToolUse:
    - matcher: "Edit|Write"
      hooks:
        - type: command
          command: "./scripts/run-linter.sh"
```

`Stop` in frontmatter becomes `SubagentStop` when run as subagent.

Project `settings.json`:

```json
{
  "hooks": {
    "SubagentStart": [{ "matcher": "db-agent", "hooks": [{ "type": "command", "command": "./setup.sh" }] }],
    "SubagentStop": [{ "hooks": [{ "type": "command", "command": "./cleanup.sh" }] }]
  }
}
```

Plugin agents: match `^my-plugin:db-agent$`.

## Isolation: worktree

`isolation: worktree` → temp git worktree (default branch base). Bash that
redirects into main checkout is blocked (v2.1.216+). Cleanup if no changes.

## Invocation

1. **Natural language** — “Use the test-runner subagent to fix failing tests”
2. **@-mention** — `@"code-reviewer (agent)"` or `@agent-code-reviewer`; plugins `@agent-my-plugin:code-reviewer`
3. **Whole session** — `claude --agent code-reviewer` or settings `"agent": "code-reviewer"`

Background default (v2.1.198+). Ctrl+B to background a running task.
`CLAUDE_CODE_DISABLE_BACKGROUND_TASKS=1` disables background.

Resume via `SendMessage` to agent id/name (Explore/Plan are one-shot, no resume).
Transcripts: `~/.claude/projects/{project}/{sessionId}/subagents/agent-{id}.jsonl`.

## What loads at startup

Non-fork subagent gets:

- Own system prompt + env details
- Claude’s delegation task message
- CLAUDE.md hierarchy (Explore/Plan skip)
- Git status snapshot (Explore/Plan skip; unless disabled)
- Preloaded skills
- Sibling roster when SendMessage available (v2.1.206+)

Does **not** get: main chat history, main auto memory (unless `memory` field),
output style (except forks), parent tool-call history.

## Limits (env)

| Env | Meaning |
|---|---|
| `CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH` | nesting depth (e.g. `2`) |
| `CLAUDE_CODE_MAX_SUBAGENTS_PER_SESSION` | session total (default 200, v2.1.212+) |
| `CLAUDE_CODE_MAX_CONCURRENT_SUBAGENTS` | concurrent (default 20, v2.1.217+) |
| `CLAUDE_CODE_FORK_SUBAGENT` | `1` enable fork mode / `0` disable |
| `CLAUDE_CODE_SUBAGENT_MODEL` | force subagent model |

Nested spawn is **off by default** (Agent tool withheld). Enable via depth env.

## Fork (`/subtask`)

Fork inherits full conversation (system prompt, tools, history). Result only
returns to main. v2.1.212+ uses `/subtask`; older used `/fork`.
Forks skip tool filters. Optional `isolation: "worktree"` on spawn.

## Patterns

- Isolate noisy tests/docs/logs → summary only
- Parallel research modules → synthesize in main
- Chain: reviewer then fixer
- Prefer main chat for tight back-and-forth / latency-critical edits
- Prefer Skills when you want main-context reusable prompts

## Examples (condensed)

**Read-only reviewer**

```markdown
---
name: code-reviewer
description: Expert reviewer. Use proactively after code changes.
tools: Read, Grep, Glob, Bash
model: inherit
---
Review git diff. Checklist: clarity, naming, duplication, errors, secrets,
validation, tests, performance. Output Critical / Warning / Suggestion.
```

**Debugger (can edit)**

```markdown
---
name: debugger
description: Debugging specialist for errors and test failures.
tools: Read, Edit, Bash, Grep, Glob
---
Capture error → repro → isolate → minimal fix → verify. Report root cause.
```

**DB read-only with hook**

```markdown
---
name: db-reader
description: Execute read-only database queries.
tools: Bash
hooks:
  PreToolUse:
    - matcher: "Bash"
      hooks:
        - type: command
          command: "./scripts/validate-readonly-query.sh"
---
Only SELECT. Refuse write SQL.
```

Hook script: parse JSON stdin `.tool_input.command`; exit `2` to block writes.

## Checklist

1. Choose scope: project vs user vs plugin vs `--agents`.
2. Write clear `description` for auto-delegation.
3. Restrict `tools` / `disallowedTools`.
4. Set `model` if cost/speed matters.
5. Optional: `memory`, `skills`, `mcpServers`, `hooks`, `isolation`.
6. If new agents dir created mid-session → restart once.
7. Test with natural language and @-mention.
8. Deny with `Agent(name)` if needed.

## Contrast with Codex subagents

| | Claude Code | Codex |
|---|---|---|
| Format | Markdown + YAML frontmatter | TOML `name`/`description`/`developer_instructions` |
| Path | `.claude/agents/*.md` | `.codex/agents/*.toml` |
| Tools | frontmatter allow/deny | sandbox + MCP/skills config |
| Memory | `memory:` + agent-memory dirs | files/MCP external memory |
| Invoke | Agent tool, @-mention, `--agent` | `/agent`, spawn workflows |

Do not mix formats. See `references/codex/subagents.md` for Codex.
