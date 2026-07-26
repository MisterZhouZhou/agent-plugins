# OpenCode Agent Skills

Agent skills are reusable instruction packages that OpenCode discovers from the
project tree or the user's home directory. OpenCode exposes discovered skills in
the native `skill` tool and loads the full `SKILL.md` only when an agent selects
one.

## Discovery locations

Create one directory per skill and place an uppercase `SKILL.md` inside it.
OpenCode searches these locations:

| Scope | Native OpenCode | Claude-compatible | Agent-compatible |
|---|---|---|---|
| Project | `.opencode/skills/<name>/SKILL.md` | `.claude/skills/<name>/SKILL.md` | `.agents/skills/<name>/SKILL.md` |
| Global | `~/.config/opencode/skills/<name>/SKILL.md` | `~/.claude/skills/<name>/SKILL.md` | `~/.agents/skills/<name>/SKILL.md` |

For project-local skills, OpenCode walks upward from the current working
directory to the Git worktree root. It discovers matching skill directories in
`.opencode/skills/`, `.claude/skills/`, and `.agents/skills/` along that path.
Global definitions are loaded in addition to project-local definitions.

Keep skill names unique across all discovery locations. A duplicate name can
make discovery ambiguous or prevent the intended definition from appearing.

## Required frontmatter

Every `SKILL.md` starts with YAML frontmatter. OpenCode recognizes only these
fields:

| Field | Required | Constraint |
|---|---:|---|
| `name` | Yes | 1-64 characters; must match the containing directory |
| `description` | Yes | 1-1024 characters; describe the trigger precisely |
| `license` | No | Skill license identifier or text |
| `compatibility` | No | Compatibility hint, such as `opencode` |
| `metadata` | No | String-to-string map |

Unknown frontmatter fields are ignored.

### Name validation

A skill name must:

- contain only lowercase letters, digits, and single hyphen separators;
- not start or end with `-`;
- not contain consecutive `--`;
- match the directory that contains `SKILL.md`.

Equivalent regex:

```regex
^[a-z0-9]+(-[a-z0-9]+)*$
```

Use a specific `description`. It is the information OpenCode shows before the
skill body is loaded, so it must give the agent enough context to choose the
skill correctly.

## Minimal example

Create `.opencode/skills/git-release/SKILL.md`:

```markdown
---
name: git-release
description: Create consistent releases and changelogs
license: MIT
compatibility: opencode
metadata:
  audience: maintainers
  workflow: github
---

## What I do

- Draft release notes from merged PRs
- Propose a version bump
- Provide a copy-pasteable `gh release create` command

## When to use me

Use this when you are preparing a tagged release.
Ask clarifying questions if the target versioning scheme is unclear.
```

## Runtime discovery and loading

OpenCode lists available skills in the `skill` tool description. Each entry
contains the skill name and description:

```xml
<available_skills>
  <skill>
    <name>git-release</name>
    <description>Create consistent releases and changelogs</description>
  </skill>
</available_skills>
```

The agent loads the complete definition on demand:

```js
skill({ name: "git-release" })
```

Do not assume that listing a skill loads its body. The name and description are
the discovery surface; `SKILL.md` is read only after the tool call succeeds.

## Skill permissions

Control skill access through the `skill` key in `opencode.json` permissions:

```json
{
  "permission": {
    "skill": {
      "*": "allow",
      "pr-review": "allow",
      "internal-*": "deny",
      "experimental-*": "ask"
    }
  }
}
```

| Outcome | Behavior |
|---|---|
| `allow` | Load immediately |
| `deny` | Hide the skill and reject access |
| `ask` | Prompt the user before loading |

Patterns support wildcards, so `internal-*` matches names such as
`internal-docs` and `internal-tools`. As with other OpenCode permissions, put
broad patterns before more specific overrides because the last matching rule
wins. For general permission matching and approval behavior, read
`permissions.md`.

## Per-agent overrides

Custom agent frontmatter can override global skill permissions:

```markdown
---
permission:
  skill:
    "documents-*": "allow"
---
```

Built-in agents can be overridden in `opencode.json`:

```json
{
  "agent": {
    "plan": {
      "permission": {
        "skill": {
          "internal-*": "allow"
        }
      }
    }
  }
}
```

Use per-agent rules when a skill is appropriate for one role but should remain
restricted globally.

## Disable the skill tool

For agents that must not use skills, disable the tool completely.

Custom agent frontmatter:

```markdown
---
tools:
  skill: false
---
```

Built-in agent configuration:

```json
{
  "agent": {
    "plan": {
      "tools": {
        "skill": false
      }
    }
  }
}
```

When the tool is disabled, OpenCode omits the `<available_skills>` section for
that agent.

## Troubleshooting checklist

If a skill does not appear or load:

1. Confirm the filename is exactly `SKILL.md` in uppercase.
2. Confirm the file begins with valid YAML frontmatter.
3. Confirm both `name` and `description` are present and within their length
   limits.
4. Confirm `name` matches both the naming regex and its containing directory.
5. Search all project and global discovery locations for duplicate names.
6. Check global and per-agent `permission.skill` rules; `deny` hides the skill.
7. Check whether the target agent has `tools.skill: false`.
8. Confirm OpenCode was started inside the expected Git worktree so project-local
   upward discovery reaches the skill directory.
