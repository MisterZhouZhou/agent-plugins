---
name: brainstorming
description: "You MUST use this before creating features, building components, adding functionality, changing product behavior, choosing architecture, or otherwise doing creative implementation work. Explore intent, requirements, constraints, approaches, and design before implementation. Do not use for ordinary explanations, read-only analysis, or a bug fix whose cause and exact correction are already known."
---

# Brainstorm Ideas Into Designs

Turn an idea into an approved design before implementation begins.

<HARD-GATE>
Do not write code, scaffold files, modify behavior, or invoke implementation workflows until the design has been presented and explicitly approved. This applies even when the request appears simple.
</HARD-GATE>

## Required sequence

Create and track one task for each step. Complete them in order:

1. Explore the current project context: relevant files, documentation, conventions, and recent changes.
2. Ask clarifying questions one at a time until purpose, constraints, scope, and success criteria are clear.
3. Propose two or three viable approaches, explain their trade-offs, and recommend one.
4. Present the design in sections appropriate to its complexity.
5. Ask for explicit approval; revise until approved.
6. Write the approved design to `docs/planning/specs/YYYY-MM-DD-<topic>-design.md` unless the user specifies another path.
7. Self-review the written design for placeholders, contradictions, scope gaps, and ambiguous requirements.
8. Ask the user to review the written design and apply requested corrections.
9. After approval, invoke `planning-workflows:writing-plans`. Do not invoke any other workflow skill.

## Clarify the request

- Ask only one question per message.
- Prefer concrete choices when they help the user decide.
- Focus on the problem being solved, intended users, constraints, non-goals, and measurable success.
- If the request contains several independent subsystems, decompose it before designing the first part.
- Treat proposed options as proposals, not adopted decisions, until the user confirms them.

## Explore approaches

- Lead with the recommended approach and explain why it best fits the confirmed constraints.
- Include two or three approaches when meaningful; do not invent alternatives merely to fill a quota.
- Apply YAGNI: remove features and abstractions that do not serve the confirmed goal.
- Follow existing project patterns and avoid unrelated refactoring.

## Present the design

Scale the design to the problem. Cover only the relevant parts of:

- architecture and component boundaries
- interfaces and data flow
- state and error handling
- compatibility and migration
- testing and acceptance criteria

Ask whether each substantial section is correct before moving on. Return to clarification whenever the user identifies a mismatch.

## Design-document gate

After approval:

1. Write the design document.
2. Replace all `TBD`, `TODO`, vague decisions, and contradictory statements.
3. Confirm that every requirement maps to a design decision and acceptance criterion.
4. Ask the user to review the saved document.
5. Wait for approval before invoking `planning-workflows:writing-plans`.

The terminal state of this skill is `planning-workflows:writing-plans`. Do not start implementation from this skill.
