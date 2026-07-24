# Codex Skills In Plugins And Agents

## Plugin-shipped skills

Codex plugins can ship skills under the plugin tree using the standard skill layout:

```text
plugins/<name>/
└── skills/
    └── <skill-name>/
        └── SKILL.md
```

Keep skill packages self-contained. Prefer progressive disclosure with skill-local `references/`.

## Agent-attached skills

Custom Codex agents may enable skills through agent config, for example `skills.config` entries pointing at `SKILL.md` paths.

Use skills for reusable workflows, templates, and checklists.
Use `developer_instructions` for short role/policy text.

## Guidance

- Stable invariants → agent instructions or AGENTS.md
- Multi-step methods → Skill
- Dynamic external tools → MCP
- Do not dump large changing docs into every agent file

For full subagent memory/tool design, read `references/codex/subagents.md`.
