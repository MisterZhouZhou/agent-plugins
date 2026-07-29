---
name: writing-plans
description: "Use after a design or specification has been explicitly approved, or when the user explicitly asks for a detailed implementation plan from settled requirements. Produce an exact, executable plan with file paths, interfaces, tests, commands, expected results, and small reviewable tasks. Do not use while product or architecture decisions remain unresolved."
---

# Write Implementation Plans

Create a detailed implementation plan for an engineer who is unfamiliar with the codebase.

Begin by saying: `I'm using the writing-plans skill to create the implementation plan.`

## Preconditions

- Read the approved design or settled requirements.
- Inspect the current project structure and relevant implementation patterns.
- Stop and return to `brainstorming` if a product, architecture, interface, or scope decision is still unresolved.
- Do not implement the plan while using this skill.

Save plans to `docs/planning/plans/YYYY-MM-DD-<feature-name>.md` unless the user specifies another path.

## Plan requirements

Every plan must include:

- a one-sentence goal
- the chosen architecture and key constraints
- exact files to create, modify, and test
- interfaces consumed and produced by each task
- small, independently reviewable tasks
- test-first steps where behavior can be tested
- exact commands and expected outcomes
- commits or checkpoints appropriate to the repository

Do not write placeholders such as `TBD`, `TODO`, "add validation", "handle errors", or "write tests" without the concrete implementation and test details.

## Task sizing

Make each task the smallest unit that produces an independently testable result. Fold setup, configuration, documentation, and scaffolding into the task whose deliverable needs them.

Within each task, prefer steps that take roughly two to five minutes:

1. Add or update the focused test.
2. Run it and state the expected failure.
3. Implement the minimum change.
4. Run the focused verification and state the expected success.
5. Run the relevant broader checks.
6. Commit or create a clear checkpoint when appropriate.

## Required plan header

```markdown
# [Feature Name] Implementation Plan

**Goal:** [One sentence]

**Architecture:** [Two or three sentences]

**Tech Stack:** [Relevant technologies]

## Global Constraints

- [Exact project-wide constraint]

---
```

## Required task shape

````markdown
### Task N: [Deliverable]

**Files:**
- Create: `exact/path`
- Modify: `exact/path:line`
- Test: `exact/test/path`

**Interfaces:**
- Consumes: `[exact names and signatures]`
- Produces: `[exact names and signatures]`

- [ ] **Step 1: Add the focused failing test**

```language
[complete test code]
```

Run: `[exact command]`
Expected: `[exact failure]`

- [ ] **Step 2: Implement the minimum change**

```language
[complete implementation code or exact edit]
```

- [ ] **Step 3: Verify the task**

Run: `[exact command]`
Expected: `[exact successful result]`
````

## Memory handoff

计划保存并完成自检后，如果 `memory-with-files:memory-with-files` 可用，必须调用它完成规划交接：

1. 以当前项目根目录和本计划主题初始化或复用任务记忆；
2. 在任务 `memory.md` 中记录 `- Implementation plan: <saved-plan-path>`；
3. 若计划来自已批准的设计文档，同时记录其 `Design` 路径；
4. 将当前阶段刷新为“计划完成，等待用户确认是否实施”。

不得复制计划清单、步骤、复选框或验收状态到 `.memory/`。如果该 Skill 不可用或 `MEMORY_WITH_FILES_DISABLED=1`，计划流程仍正常结束，只需在交付摘要中简短说明未创建项目记忆。

## Self-review

Before handing off the plan:

1. Confirm every approved requirement appears in at least one task.
2. Remove placeholders and ambiguous instructions.
3. Check that paths, function names, types, and interfaces stay consistent across tasks.
4. Confirm tasks do not introduce unapproved scope.
5. Confirm the verification commands are runnable in the current repository.

End after saving and summarizing the plan. Ask the user whether they want to proceed with implementation, but do not invoke execution, TDD, review, worktree, or subagent skills automatically.
