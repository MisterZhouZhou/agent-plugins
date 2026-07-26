# OpenCode Agents / Subagents

Official docs: https://opencode.ai/docs/agents/  
Schema: https://opencode.ai/config.json

OpenCode has **primary agents** (main conversation you Tab-switch) and
**subagents** (specialized workers primary agents invoke, or you `@` mention).

## Built-ins

| Agent | Mode | Notes |
|---|---|---|
| build | primary | Default; full tools |
| plan | primary | Restricted; edit/bash default `ask` |
| general | subagent | Multi-step tasks; full tools except todo |
| explore | subagent | Fast read-only codebase search |
| scout | subagent | Read-only external docs / dependency research |
| compaction | primary (hidden) | Context compaction |
| title | primary (hidden) | Session titles |
| summary | primary (hidden) | Session summaries |

## Configure

Two ways. Prefer markdown files for non-trivial agents.

### Markdown

- Global: `~/.config/opencode/agent(s)/<name>.md`
- Project: `.opencode/agent(s)/<name>.md`

Filename becomes the agent name (`review.md` → `review`).

```markdown
---
description: Reviews code for quality and best practices
mode: subagent
model: anthropic/claude-sonnet-4-20250514
temperature: 0.1
permission:
  edit: deny
  bash: deny
---

You are in code review mode. Focus on quality, bugs, performance, security.
Provide constructive feedback without making direct changes.
```

Body = system prompt. Do not also put `prompt:` in frontmatter.

### JSON (`opencode.json`)

```json
{
  "$schema": "https://opencode.ai/config.json",
  "agent": {
    "code-reviewer": {
      "description": "Reviews code for best practices and potential issues",
      "mode": "subagent",
      "model": "anthropic/claude-sonnet-4-20250514",
      "prompt": "You are a code reviewer. Focus on security, performance, maintainability.",
      "permission": { "edit": "deny" }
    }
  }
}
```

`agent` is an object keyed by name, not an array. Project config deep-merges over global.

## Key options

| Field | Notes |
|---|---|
| `description` | Required. When to use this agent |
| `mode` | `primary` \| `subagent` \| `all` (default `all`) |
| `model` | `provider/model-id`; primary falls back to global model; subagent falls back to invoking primary. For providers, model options, and variants, read `models.md` |
| `prompt` | System prompt (JSON) or markdown body (file form) |
| `permission` | Per-tool `allow` / `ask` / `deny`; overrides top-level |
| `temperature` / `top_p` | Sampling controls |
| `steps` | Max agentic iterations (`maxSteps` deprecated) |
| `hidden` | Hide subagent from `@` autocomplete (still Task-invokable) |
| `color` | UI color (hex or theme token) |
| `disable` | `true` to disable |

`tools` is **deprecated**; use `permission` instead. For granular matching, auto mode, external directories, defaults, and approval behavior, read `permissions.md`.

### Task permissions

Control which subagents an agent may spawn via Task:

```json
{
  "agent": {
    "orchestrator": {
      "mode": "primary",
      "permission": {
        "task": {
          "*": "deny",
          "orchestrator-*": "allow",
          "code-reviewer": "ask"
        }
      }
    }
  }
}
```

Last matching rule wins. Users can still `@` invoke any subagent manually.

## Usage

1. **Primary:** Tab (or `switch_agent` keybind) to cycle.
2. **Subagents:** auto-delegated by description, or `@general help me search…`
3. Child sessions: `session_child_*` keybinds to navigate parent/child.

## Create interactively

```bash
opencode agent create
```

Asks scope (global/project), description, generates prompt + permissions, writes markdown.

## Apply changes

Config loads at process start (not hot-reloaded for all surfaces). After editing
`opencode.json` or agent files, **quit and restart OpenCode**.

## Examples

### Docs writer

```markdown
---
description: Writes and maintains project documentation
mode: subagent
permission:
  bash: deny
---

You are a technical writer. Create clear, comprehensive documentation.
```

### Security auditor

```markdown
---
description: Performs security audits and identifies vulnerabilities
mode: subagent
permission:
  edit: deny
---

You are a security expert. Focus on input validation, authz, data exposure,
dependency and configuration risks.
```
