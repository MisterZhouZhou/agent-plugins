# Codex Subagents

Use this reference when designing parallel Subagent workflows or configuring custom Codex agents. Treat exact model names and config keys as version-sensitive; check the installed Codex documentation or configuration reference before relying on newly introduced values.

This file is Codex-only. Do not load Claude/OpenCode plugin docs unless the user is also packaging multi-CLI plugins.

## Mental Model

Codex separates orchestration, agent configuration, and memory:

- The main thread owns requirements, decisions, coordination, and the final response.
- A Subagent runs in its own agent thread with its own model/tool work and short-term context.
- A custom agent TOML is a configuration layer for newly spawned sessions, not a persistent brain.
- Cross-session memory must live outside the thread, usually in reviewed project files or an MCP-backed store.

Subagents reduce main-thread context pollution by returning distilled findings instead of raw searches, logs, stack traces, and test output. They consume more tokens, so delegate only work that is meaningfully independent or noisy.

## When To Delegate

Good parallel tasks:

- Codebase mapping and execution-path tracing.
- Independent security, correctness, race, test-gap, and maintainability reviews.
- Documentation or API verification.
- Test execution across independent suites.
- Log triage and large-document summarization.

Poor parallel tasks:

- Several agents editing the same module or shared configuration.
- A tiny task whose coordination costs more than doing it directly.
- A sequence where each step depends on the previous step's full output.
- Work requiring interactive approvals that cannot surface in the current execution mode.

For write-heavy work, prefer a staged workflow:

1. Spawn read-only agents to map the problem and gather evidence.
2. Wait for all requested findings.
3. Resolve conflicting conclusions in the main thread.
4. Assign one worker as the implementation owner.
5. Run independent verification after the edit.

## Triggering A Workflow

State the division of labor, waiting behavior, and output contract explicitly:

```text
Review this branch against main with parallel subagents.
Spawn one read-only agent for security, one for test gaps, and one for maintainability.
Wait for all three before continuing.
Each agent must return only verified findings with severity, file/line references,
reproduction evidence, and residual uncertainty. Then consolidate duplicate findings.
```

For large tasks, bound each agent's scope. Do not ask every agent to perform a full duplicate review unless independent redundancy is intentional.

Use `/agent` in an interactive Codex client to inspect or switch among agent threads. The parent may steer, stop, or close a running thread.

## Global Configuration

Global Subagent settings live under `[agents]` in Codex configuration:

```toml
[agents]
enabled = true
max_concurrent_threads_per_session = 6
default_subagent_model = "gpt-5.6-terra"
default_subagent_reasoning_effort = "medium"
interrupt_message = true
```

Guidance:

- Keep concurrency bounded; available CPU, memory, API rate limits, and token budget still apply.
- Use a fast model for broad read-heavy scans and a stronger/high-effort model for security or ambiguous multi-step reasoning.
- Higher reasoning effort increases latency and token usage. Set it because the task needs it, not as a universal default.
- `agents.enabled` normally defaults to true. Older configurations may use `agents.max_threads` as a legacy alias.

## Custom Agent Files

Locations:

- Personal: `~/.codex/agents/<agent>.toml`
- Project: `.codex/agents/<agent>.toml`

Prefer project scope for repository-specific architecture, commands, and conventions. Prefer personal scope for reusable roles with no project secrets or assumptions.

Every standalone file defines at least:

```toml
name = "security_reviewer"
description = "Read-only reviewer for concrete application security risks."
developer_instructions = """
Review reachable behavior, not isolated suspicious syntax.
Prioritize authentication, authorization, tenant isolation, injection,
path traversal, SSRF, secret exposure, and unsafe deserialization.
Return severity, evidence, file/line references, impact, and a minimal fix.
Do not edit code.
"""
```

The `name` field is the identity. Matching the filename to `name` is a useful convention. If a custom name matches a built-in agent such as `explorer`, the custom definition takes precedence.

Built-in roles commonly include:

- `default`: general-purpose fallback.
- `worker`: implementation and fixes.
- `explorer`: read-heavy exploration.

## Models And Precedence

An agent may pin model and reasoning settings:

```toml
model = "gpt-5.6"
model_reasoning_effort = "high"
sandbox_mode = "read-only"
```

For `model` and `model_reasoning_effort`, resolve explicit values independently. The documented order is:

1. Value in the selected custom agent file.
2. Explicit value supplied when spawning.
3. Corresponding `[agents]` default.
4. Parent session value, or the selected model's default effort when applicable.

Other omitted session settings, including MCP servers, skills, and sandbox behavior, generally inherit from the parent. Do not assume omission removes a parent tool.

## Memory Design

### Thread Memory

An active agent thread retains its own messages and tool results. Continue or steer that same thread when follow-up work depends on its context. A newly spawned or closed-and-replaced thread should not be assumed to remember prior work.

### Static Memory

Use `developer_instructions` for small, stable facts:

- Role and ownership boundary.
- Review checklist.
- Project invariants that rarely change.
- Expected report format.
- Rules about editing or tool usage.

Avoid embedding large, frequently changing project documentation in every agent file because it consumes context and becomes stale.

### File-Backed Persistent Memory

A transparent project layout is:

```text
.codex/
├── agents/
│   └── backend-reviewer.toml
├── memory/
│   └── backend-reviewer.md
└── config.toml
```

Tell the agent to load the memory explicitly:

```toml
developer_instructions = """
Before reviewing, read AGENTS.md and .codex/memory/backend-reviewer.md.
Treat them as prior decisions, but verify them against current code.
Do not modify memory. Put proposed durable additions under a separate
'Suggested memory updates' heading for the parent to review.
"""
```

File-backed memory is preferable when humans should review changes in Git. Keep it concise and source-aware:

```markdown
# Backend Reviewer Memory

## Invariants
- Tenant-scoped queries include `tenant_id`.
- HTTP handlers do not query PostgreSQL directly.

## Historical Risks
- Payment retries must remain idempotent.

## Sources
- `docs/architecture.md`
- `src/repositories/`
```

Do not persist secrets, credentials, personal information, raw logs, temporary stack traces, or unverified model conclusions.

### MCP-Backed Memory

Use a memory or knowledge MCP when agents need searchable, cross-session, dynamically updated knowledge:

```toml
[mcp_servers.memory]
command = "<memory-mcp-command>"
args = ["--database", "<path-to-memory.sqlite>"]
```

Require provenance and validation for writes. A useful record includes project, agent, fact, source, verification date, and confidence. Enforce data access and write policy in the MCP server; instructions in the prompt are not sufficient authorization controls.

## Giving An Agent Tools

Agents receive tools from the Codex session configuration. Tool sources include:

- Codex built-in tools.
- MCP servers inherited from the parent.
- MCP servers declared or overridden in the custom agent file.
- Enabled skills.
- Commands and filesystem operations permitted by sandbox and approvals.

Documentation specialist example:

```toml
name = "docs_researcher"
description = "Read-only specialist that verifies APIs against official documentation."
model = "gpt-5.6-terra"
model_reasoning_effort = "medium"
sandbox_mode = "read-only"
developer_instructions = """
Use the official documentation MCP before making version-specific claims.
Return exact references or links and state uncertainty when not verified.
Do not edit project files.
"""

[mcp_servers.openaiDeveloperDocs]
url = "https://developers.openai.com/mcp"
```

Skill-enabled agent example:

```toml
name = "docs_editor"
description = "Edits documentation using the repository's documented workflow."
sandbox_mode = "workspace-write"
developer_instructions = """
Load and follow the docs-editor skill before editing.
Only modify documentation files and validate the changed documents.
"""

[[skills.config]]
path = ".codex/skills/docs-editor/SKILL.md"
enabled = true
```

A skill is best for a reusable process, templates, scripts, and detailed checklists. `developer_instructions` should remain the concise role and policy layer.

## Sandbox And Approval Boundaries

Subagents inherit the parent sandbox and live runtime overrides unless their configuration explicitly changes supported settings. Interactive approval requests may appear from inactive threads. In non-interactive runs, an operation requiring fresh approval can fail and return the error to the parent.

Use conservative defaults:

- Reviewers and explorers: `sandbox_mode = "read-only"`.
- Focused implementers: `workspace-write` only when needed.
- External systems: use least-privilege MCP credentials and server-side authorization.
- Sensitive changes: keep approval requirements enabled.

`sandbox_mode = "workspace-write"` grants capability; it does not communicate intent. Also state whether the agent may edit code, write diagnostic artifacts, or only reproduce behavior.

## Recommended Agent Patterns

### Parallel PR Review

- Explorer maps changed code paths and dependencies.
- Security reviewer checks reachable vulnerabilities.
- Test reviewer identifies missing behavioral coverage and flaky assumptions.
- Main thread deduplicates and orders findings by severity.

Keep all reviewers read-only. Findings should lead with concrete bugs and risks, not style preferences.

### Frontend Integration Debugging

- Code mapper traces state, frontend, API, and persistence ownership.
- Browser debugger reproduces the issue and captures console/network evidence without editing source.
- One UI fixer edits only after the failure mode is established.

Do not start all three as concurrent writers. The fixer depends on evidence, so spawn or steer it after mapping and reproduction complete.

## Verification Checklist

Before relying on a custom agent:

1. Confirm Codex discovers the agent by its `name`.
2. Spawn a harmless task and verify the selected model and reasoning effort where the client exposes them.
3. Verify read-only agents cannot write to the workspace.
4. Confirm required MCP tools are visible and callable.
5. Confirm the agent reads specified memory files instead of claiming implicit memory.
6. Test one approval-requiring operation in the intended interactive or non-interactive mode.
7. Run a representative multi-agent prompt and ensure the main thread waits for all requested results.
8. Check that summaries include evidence and do not dump raw intermediate output into the main thread.
9. For write workflows, verify only one agent owns overlapping files.

## Common Failure Modes

| Symptom | Cause | Correction |
|---|---|---|
| New agent does not remember a previous task | Thread context was mistaken for persistent memory | Reuse the active thread or store reviewed knowledge in files/MCP |
| Memory file exists but is ignored | The agent was not instructed to read it | Name the exact path in `developer_instructions` or task prompt |
| Agent sees unexpected tools | Omitted settings inherited from the parent | Audit parent MCP/skill configuration; do not assume omission means isolation |
| Read-only reviewer modifies files | Sandbox was writable or role instructions were ambiguous | Set `sandbox_mode = "read-only"` and explicitly prohibit edits |
| Several agents produce merge conflicts | Parallel write scopes overlap | Parallelize evidence gathering, then give one worker edit ownership |
| Main response contains huge logs | Agent output contract did not require distilled results | Request findings, evidence, and summaries rather than raw output |
| Agent persists incorrect facts | It wrote unverified conclusions directly to memory | Require source validation and parent review before memory writes |
| MCP tool cannot perform an action | Parent sandbox/approval or MCP authorization blocks it | Check all three layers: agent config, live parent policy, MCP permissions |
| Workflow is slower and costlier than one agent | Task was too small or duplicated across agents | Delegate only independent, bounded, noisy work |

## Completion Report

When configuring Subagents, report:

- Files created or modified.
- Personal versus project scope.
- Each agent's role, model, reasoning effort, and sandbox.
- Memory source and who may update it.
- MCP servers and skills enabled or inherited.
- Verification performed.
- Any approval, restart, or new-session step still required.
