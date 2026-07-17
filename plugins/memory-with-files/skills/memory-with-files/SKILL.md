---
name: memory-with-files
description: "Use when the user asks to remember, save, persist, restore, or hand off the current project or repository context, or when durable project facts must survive compaction or a new session without creating a task plan. Also use when Superpowers or OpenSpec owns task status and needs a project-local memory layer."
---

# Memory With Files

Persist durable context without becoming a task manager. Superpowers or OpenSpec owns tasks; this skill only records what future sessions need to know.

## Non-Negotiable Scope

This skill is project-local. Resolve the current project root from the Hook `cwd` or the active workspace root and write only under `<project-root>/.memory/`.

Never write project context to `~/.codex/memories`, `$CODEX_HOME/memories`, `extensions/ad_hoc/notes`, or any other global memory store. If the user says “记忆当前上下文”, “记住这个项目”, “保存项目记忆”, or equivalent while working in a repository, treat it as an explicit request for this project-local skill.

Before writing, state or verify the exact destination project root. If the current directory is not the intended project, use `--root <project-root>` rather than writing to the wrong repository.

## Boundary

Memory answers:

- What facts and constraints are established?
- What decisions were made, and why?
- What was discovered or disproved?
- Where should the next session resume?
- Which external artifact owns the task list?

Memory must not duplicate task lists, phases, status, acceptance criteria, or remaining work from Superpowers or OpenSpec. Store one task-source pointer instead.

Do not create `task_plan.md`, `progress.md`, phase headings, checkboxes, or completion gates. Do not register `UserPromptSubmit`, `PreToolUse`, `PostToolUse`, `PermissionRequest`, or `Stop` hooks. Ordinary conversation must not create memory automatically.

The project may register two minimal lifecycle hooks: `SessionStart` restores an existing active memory, and `PreCompact` reminds the agent to refresh `handoff.md`. These hooks must not create memory or manage tasks.

## Storage Contract

Store each memory under `.memory/<slug>/`:

```text
.memory/
|-- .active_memory
`-- <slug>/
    |-- memory.md
    |-- findings.md
    `-- handoff.md
```

| File | Durable content |
|---|---|
| `memory.md` | Scope, task-source pointer, constraints, decisions, invariants |
| `findings.md` | Evidence, codebase facts, experiments, rejected assumptions, useful references |
| `handoff.md` | Concise current state, last verified evidence, unresolved questions, exact resume point |

Keep memory under the active project's `.memory`; do not reuse an external task manager's storage or Codex global Memories.

## Initialize

Run from the project root:

```bash
python3 <skill-dir>/scripts/init_memory.py "topic name" \
  --task-source "openspec/changes/topic"
```

For a Superpowers-managed task:

```bash
python3 <skill-dir>/scripts/init_memory.py "topic name" \
  --task-source "docs/superpowers/plans/YYYY-MM-DD-topic.md"
```

The initializer is idempotent. It never overwrites existing memory files.

## Workflow

1. Resolve `.memory/.active_memory`; if absent, initialize only when the user explicitly asks for persistent memory or the work clearly spans sessions/context resets.
2. On a new session, let `SessionStart` inject `memory.md` and `handoff.md`; read `findings.md` only when deeper evidence is needed.
3. Write only durable, decision-relevant information. Keep transient narration in the conversation.
4. Update `findings.md` immediately after visual/browser evidence or a non-obvious experiment that cannot be cheaply reconstructed.
5. Update `memory.md` when a constraint, invariant, or decision becomes stable.
6. When `PreCompact` reminds you, or before `/clear`, session end, or handoff, rewrite `handoff.md` into a concise restart packet.
7. If task status changes, update the external task source, not these memory files.

## Write Filter

Write an item only when at least one is true:

- It would change a future technical decision.
- Reconstructing it would require meaningful investigation.
- It records why an approach was selected or rejected.
- It prevents repeating a failed attempt.
- It is required to resume safely after context loss.

Do not store secrets, credentials, full prompts, raw transcripts, routine tool output, or facts already obvious from current source code.

## Handoff Standard

Keep `handoff.md` short enough to read at every resume. It may contain:

- task source and scope reminder;
- current working state, without a task checklist;
- files or areas inspected/changed;
- latest verification commands and outcomes;
- unresolved questions;
- one exact resume point.

The handoff may describe where work stopped, but must not become a second task board.

## Interoperation

| Task authority | Memory behavior |
|---|---|
| Superpowers | Point to its design or implementation plan; never copy its checklist |
| OpenSpec | Point to `openspec/changes/<name>/`; never mirror artifact or task status |
| Neither | Set task source to `conversation`; still do not invent a task plan |

When task sources conflict, ask the user which one is authoritative and record only that pointer.
