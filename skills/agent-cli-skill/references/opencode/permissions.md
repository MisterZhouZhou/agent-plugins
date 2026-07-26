# OpenCode Permissions

Use `permission` in `opencode.json` to decide whether an action runs directly,
requests approval, or is blocked.

> Since OpenCode v1.1.1, the legacy boolean `tools` config is deprecated and
> merged into `permission`. It remains supported for compatibility. This does
> not deprecate custom tools under `.opencode/tools/`.

## Outcomes

Every matching rule resolves to one action:

| Action | Behavior |
|---|---|
| `allow` | Run without approval |
| `ask` | Prompt the user |
| `deny` | Block the action |

## Auto mode

Start OpenCode with `--auto` to approve requests that would otherwise resolve
to `ask`:

```bash
opencode --auto
opencode run --auto "Refactor this module"
```

Explicit `deny` rules still win. Auto mode never bypasses them.

In the TUI, use the command palette actions **Enable auto-approve permissions**
or **Disable auto-approve permissions**. An `auto` indicator appears beside the
current agent while enabled.

## Basic configuration

Set a global fallback with `*`, then override individual tools:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "permission": {
    "*": "ask",
    "bash": "allow",
    "edit": "deny"
  }
}
```

Set every permission at once with a string:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "permission": "allow"
}
```

## Granular rules

Most permissions accept an object whose keys match tool input:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "permission": {
    "bash": {
      "*": "ask",
      "git *": "allow",
      "npm *": "allow",
      "rm *": "deny",
      "grep *": "allow"
    },
    "edit": {
      "*": "deny",
      "packages/web/src/content/docs/*.mdx": "allow"
    }
  }
}
```

Rules are evaluated by pattern match; **the last matching rule wins**. Put the
catch-all first and increasingly specific rules later.

### Wildcards

Permission patterns use simple wildcard matching:

- `*` matches zero or more characters.
- `?` matches exactly one character.
- All other characters are literal.

For `bash`, rules match parsed commands. Include argument wildcards when needed:
`grep *` permits `grep pattern file.txt`; `grep` alone does not match that
invocation. Apply the same principle to commands such as `git status *` when
arguments may follow.

## Home paths and external directories

At the **start** of a pattern, `~` and `$HOME` expand to the user's home
directory:

```text
~/projects/*
$HOME/projects/*
~
```

Expansion only rewrites the pattern. It does not make the path part of the
workspace.

Use `external_directory` for paths outside the directory where OpenCode was
started. It applies to path-taking tools such as `read`, `edit`, `glob`, `grep`,
and many `bash` commands:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "permission": {
    "external_directory": {
      "~/projects/personal/**": "allow"
    }
  }
}
```

An allowed external directory inherits the workspace defaults. Layer explicit
tool rules to narrow access—for example, permit reads but deny edits:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "permission": {
    "external_directory": {
      "~/projects/personal/**": "allow"
    },
    "edit": {
      "~/projects/personal/**": "deny"
    }
  }
}
```

Keep external allowlists limited to trusted paths. Add separate `bash`, `edit`,
or other restrictions where needed.

## Permission keys

Permissions use tool names plus two safety guards:

| Key | Matches |
|---|---|
| `read` | File path being read |
| `edit` | All modifications: edit, write, and patch |
| `glob` | Glob pattern |
| `grep` | Search regex |
| `bash` | Parsed shell command |
| `task` | Subagent type being launched |
| `skill` | Skill name being loaded |
| `lsp` | LSP queries; currently non-granular |
| `question` | Asking the user a question during execution |
| `webfetch` | URL |
| `websearch` | Search query |
| `external_directory` | Access outside the project working directory |
| `doom_loop` | Third identical repeated tool call |

## Defaults

When no permission config is supplied:

- Most permissions default to `allow`.
- `doom_loop` and `external_directory` default to `ask`.
- `read` defaults to `allow`, except environment files are protected as if by:

```json
{
  "permission": {
    "read": {
      "*": "allow",
      "*.env": "deny",
      "*.env.*": "deny",
      "*.env.example": "allow"
    }
  }
}
```

Because the last match wins, `.env.example` remains readable.

## Approval prompt behavior

When a rule resolves to `ask`, the UI offers:

- `once` — approve only this request.
- `always` — approve suggested matching patterns for the current OpenCode
  session.
- `reject` — deny the request.

The tool supplies the suggested `always` patterns. Bash approvals commonly
suggest a safe command prefix such as `git status*`.

## Per-agent permissions

Agent permissions merge with global permissions and take precedence. This lets
a globally restricted command become askable for one agent while remaining
denied elsewhere:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "permission": {
    "bash": {
      "*": "ask",
      "git *": "allow",
      "git commit *": "deny",
      "git push *": "deny",
      "grep *": "allow"
    }
  },
  "agent": {
    "build": {
      "permission": {
        "bash": {
          "*": "ask",
          "git *": "allow",
          "git commit *": "ask",
          "git push *": "deny",
          "grep *": "allow"
        }
      }
    }
  }
}
```

Agent markdown supports the same concept in frontmatter:

```markdown
---
description: Code review without edits
mode: subagent
permission:
  edit: deny
  bash: ask
  webfetch: deny
---

Only analyze code and suggest changes.
```

For agent locations, modes, and task delegation rules, also read
`subagents.md`.

## Recommended policy shape

Prefer a deny-by-default policy for high-impact tools, followed by narrow
allowlists:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "permission": {
    "*": "ask",
    "read": "allow",
    "glob": "allow",
    "grep": "allow",
    "bash": {
      "*": "ask",
      "git status*": "allow",
      "git diff*": "allow",
      "git push*": "deny",
      "rm *": "deny"
    },
    "edit": "ask",
    "external_directory": {
      "*": "ask"
    }
  }
}
```

Treat this as a starting point, not a universal preset. Match the policy to the
agent's role and the repository's trust boundary.

## Checklist

1. Put broad rules first and specific overrides later.
2. Remember that `--auto` converts only `ask`; it never overrides `deny`.
3. Include argument wildcards for command families.
4. Allow external paths explicitly; home expansion alone is insufficient.
5. Add tool-specific restrictions inside allowed external directories.
6. Keep `.env` protections unless the task has a deliberate, narrow exception.
7. Use per-agent overrides for role-specific access.
8. Restart or reload OpenCode as required after changing configuration, then
   verify both an allowed and a denied case.
