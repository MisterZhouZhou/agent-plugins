# OpenCode ACP Support

OpenCode supports the **Agent Client Protocol (ACP)**: an open protocol that
standardizes communication between code editors/IDEs and AI coding agents.

Use this when embedding OpenCode inside an ACP-compatible editor instead of
(or in addition to) the terminal TUI.

List of ACP-capable editors: see the public ACP progress report.

## How it works

Editors start OpenCode as an ACP-compatible subprocess:

```bash
opencode acp
```

Communication is **JSON-RPC over stdio**.

OpenCode over ACP behaves like the terminal product for most capabilities.
Some built-in slash commands (for example `/undo` and `/redo`) may be unsupported.

## Supported through ACP

- Built-in tools (files, terminal, etc.)
- Custom tools and slash commands
- MCP servers from OpenCode config
- Project rules from `AGENTS.md`
- Custom formatters and linters
- Agents and permission system

## Editor configs

### Zed

`~/.config/zed/settings.json`:

```json
{
  "agent_servers": {
    "OpenCode": {
      "command": "opencode",
      "args": ["acp"]
    }
  }
}
```

Open via command palette: `agent: new thread`.

Optional keymap (`keymap.json`):

```json
[
  {
    "bindings": {
      "cmd-alt-o": [
        "agent::NewExternalAgentThread",
        {
          "agent": {
            "custom": {
              "name": "OpenCode",
              "command": {
                "command": "opencode",
                "args": ["acp"]
              }
            }
          }
        }
      ]
    }
  }
]
```

### JetBrains IDEs

`acp.json` (use an absolute path to the binary if needed):

```json
{
  "agent_servers": {
    "OpenCode": {
      "command": "/absolute/path/bin/opencode",
      "args": ["acp"]
    }
  }
}
```

Select the `OpenCode` agent in AI Chat’s agent picker.

### Avante.nvim

```lua
{
  acp_providers = {
    ["opencode"] = {
      command = "opencode",
      args = { "acp" },
    },
  },
}
```

With env:

```lua
{
  acp_providers = {
    ["opencode"] = {
      command = "opencode",
      args = { "acp" },
      env = {
        OPENCODE_API_KEY = os.getenv("OPENCODE_API_KEY"),
      },
    },
  },
}
```

### CodeCompanion.nvim

```lua
require("codecompanion").setup({
  interactions = {
    chat = {
      adapter = {
        name = "opencode",
        model = "claude-sonnet-4",
      },
    },
  },
})
```

For adapter env vars (for example `OPENCODE_API_KEY`), follow CodeCompanion’s
adapter environment-variable docs.

## Checklist

1. Ensure `opencode` is on PATH (or use absolute binary path in the editor).
2. Register `opencode acp` as the ACP agent server in the editor config.
3. Restart the editor after config changes.
4. Start a new ACP agent thread and verify tools/permissions still work.
5. Prefer project OpenCode config (tools, MCP, AGENTS.md) over editor-specific forks.

## Related

- Custom tools: `tools.md`
- Plugins / lifecycle: `plugins.md`, `events.md`
- Install paths / debug: `plugins.md`, `install.md`
