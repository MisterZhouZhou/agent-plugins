# Claude Code Skills In Plugins

## Layout

```text
plugins/<name>/
├── .claude-plugin/plugin.json
└── skills/
    └── <skill-name>/
        └── SKILL.md
```

Skill names are namespaced by plugin manifest `name`:

```text
/<plugin-name>:<skill-name>
```

If manifest `name` and folder name diverge, discovery/namespace confusion follows. Keep them aligned.

## SKILL.md essentials

```markdown
---
name: my-skill
description: What it does AND when to trigger it. Include concrete keywords.
---

# My Skill
```

- `description` is the primary trigger surface.
- Keep the body focused; put large references under the skill’s own `references/`.
- Skills-only plugins (no hooks) do not need dual-CLI packaging complexity.

## When skills are enough

Use a plain skill (or skills-only plugin) when there is no lifecycle hook requirement.

Use hooks/plugins when the work must run on CLI events (Stop, permission prompts, etc.).
