# OpenCode MCP Servers

Add external tools through the Model Context Protocol (MCP). OpenCode supports
**local** and **remote** servers. After configuration, MCP tools are available
to the LLM alongside built-ins.

## Context cost warning

Every enabled MCP tool consumes context. Prefer a small set of high-value
servers. Some servers (for example GitHub MCP) can burn tokens quickly and hit
context limits.

## Config surface

Define servers under `mcp` in OpenCode config (`opencode.json` / `opencode.jsonc`).
Each key is a unique server name used in prompts.

```jsonc
{
  "$schema": "https://opencode.ai/config.json",
  "mcp": {
    "name-of-mcp-server": {
      // ...
      "enabled": true
    },
    "name-of-other-mcp-server": {
      // ...
    }
  }
}
```

Set `"enabled": false` to keep a server defined but temporarily off.

### Org remote defaults

Orgs may ship default MCP servers via `.well-known/opencode`. Those may be
disabled by default. Enable locally by re-declaring the server with
`enabled: true`. Local values override remote defaults (see OpenCode config
precedence docs).

## Local servers

```jsonc
{
  "$schema": "https://opencode.ai/config.json",
  "mcp": {
    "my-local-mcp-server": {
      "type": "local",
      "command": ["npx", "-y", "my-mcp-command"],
      // Or ["bun", "x", "my-mcp-command"]
      "enabled": true,
      "environment": {
        "MY_ENV_VAR": "my_env_var_value"
      }
    }
  }
}
```

Example (everything test server):

```jsonc
{
  "$schema": "https://opencode.ai/config.json",
  "mcp": {
    "mcp_everything": {
      "type": "local",
      "command": ["npx", "-y", "@modelcontextprotocol/server-everything"]
    }
  }
}
```

Prompt: `use the mcp_everything tool to add the number 3 and 4`.

### Local options

| Option | Type | Required | Description |
|---|---|---|---|
| `type` | string | yes | Must be `"local"` |
| `command` | array | yes | Command + args to start the server |
| `environment` | object | no | Env vars for the process |
| `enabled` | boolean | no | Enable/disable at startup |
| `timeout` | number | no | Tool fetch timeout ms; default `5000` |

## Remote servers

```json
{
  "$schema": "https://opencode.ai/config.json",
  "mcp": {
    "my-remote-mcp": {
      "type": "remote",
      "url": "https://my-mcp-server.com",
      "enabled": true,
      "headers": {
        "Authorization": "Bearer MY_API_KEY"
      }
    }
  }
}
```

### Remote options

| Option | Type | Required | Description |
|---|---|---|---|
| `type` | string | yes | Must be `"remote"` |
| `url` | string | yes | Server URL |
| `enabled` | boolean | no | Enable/disable at startup |
| `headers` | object | no | HTTP headers |
| `oauth` | object \| false | no | OAuth config or disable auto-OAuth |
| `timeout` | number | no | Tool fetch timeout ms; default `5000` |

## OAuth

OpenCode can auto-handle remote MCP OAuth:

1. Detect 401 and start OAuth
2. Dynamic client registration (RFC 7591) when supported
3. Store tokens for later requests

### Automatic

```json
{
  "$schema": "https://opencode.ai/config.json",
  "mcp": {
    "my-oauth-server": {
      "type": "remote",
      "url": "https://mcp.example.com/mcp"
    }
  }
}
```

First use may prompt auth. Manual trigger:

```bash
opencode mcp auth <server-name>
```

### Pre-registered credentials

```json
{
  "$schema": "https://opencode.ai/config.json",
  "mcp": {
    "my-oauth-server": {
      "type": "remote",
      "url": "https://mcp.example.com/mcp",
      "oauth": {
        "clientId": "{env:MY_MCP_CLIENT_ID}",
        "clientSecret": "{env:MY_MCP_CLIENT_SECRET}",
        "scope": "tools:read tools:execute"
      }
    }
  }
}
```

### Auth management

```bash
opencode mcp auth my-oauth-server
opencode mcp list
opencode mcp logout my-oauth-server
```

`mcp auth` opens a browser. Tokens are stored under:

```text
~/.local/share/opencode/mcp-auth.json
```

### Disable OAuth (API key servers)

```json
{
  "$schema": "https://opencode.ai/config.json",
  "mcp": {
    "my-api-key-server": {
      "type": "remote",
      "url": "https://mcp.example.com/mcp",
      "oauth": false,
      "headers": {
        "Authorization": "Bearer {env:MY_API_KEY}"
      }
    }
  }
}
```

### OAuth options

| Option | Type | Description |
|---|---|---|
| `oauth` | object \| false | Config object, or `false` to disable auto-detect |
| `clientId` | string | Client ID; omit for dynamic registration |
| `clientSecret` | string | Client secret if required |
| `scope` | string | Scopes to request |

### Debug auth

```bash
opencode mcp auth list
opencode mcp debug my-oauth-server
```

`mcp debug` shows auth state, tests HTTP, and runs OAuth discovery.

## Managing MCP as tools

MCP tools are managed like other tools via config.

### Global enable/disable

```json
{
  "$schema": "https://opencode.ai/config.json",
  "mcp": {
    "my-mcp-foo": {
      "type": "local",
      "command": ["bun", "x", "my-mcp-command-foo"]
    },
    "my-mcp-bar": {
      "type": "local",
      "command": ["bun", "x", "my-mcp-command-bar"]
    }
  },
  "tools": {
    "my-mcp-foo": false
  }
}
```

Glob disable:

```json
{
  "tools": {
    "my-mcp*": false
  }
}
```

### Per-agent

Disable globally, enable only on specific agents:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "mcp": {
    "my-mcp": {
      "type": "local",
      "command": ["bun", "x", "my-mcp-command"],
      "enabled": true
    }
  },
  "tools": {
    "my-mcp*": false
  },
  "agent": {
    "my-agent": {
      "tools": {
        "my-mcp*": true
      }
    }
  }
}
```

### Glob rules

- `*` — zero or more characters
- `?` — exactly one character
- other characters match literally

MCP tools are registered with a **server-name prefix**. Disable all tools from a
server with:

```json
"mymcpservername_*": false
```

## Examples

### Sentry

```json
{
  "$schema": "https://opencode.ai/config.json",
  "mcp": {
    "sentry": {
      "type": "remote",
      "url": "https://mcp.sentry.dev/mcp",
      "oauth": {}
    }
  }
}
```

```bash
opencode mcp auth sentry
```

Prompt: `Show me the latest unresolved issues in my project. use sentry`

### Context7

```json
{
  "$schema": "https://opencode.ai/config.json",
  "mcp": {
    "context7": {
      "type": "remote",
      "url": "https://mcp.context7.com/mcp"
    }
  }
}
```

With API key for higher rate limits:

```json
{
  "mcp": {
    "context7": {
      "type": "remote",
      "url": "https://mcp.context7.com/mcp",
      "headers": {
        "CONTEXT7_API_KEY": "{env:CONTEXT7_API_KEY}"
      }
    }
  }
}
```

Prompt: `... use context7`  
Or in `AGENTS.md`: `When you need to search docs, use context7 tools.`

### Grep by Vercel

```json
{
  "$schema": "https://opencode.ai/config.json",
  "mcp": {
    "gh_grep": {
      "type": "remote",
      "url": "https://mcp.grep.app"
    }
  }
}
```

Prompt: `... use the gh_grep tool`  
Or in `AGENTS.md`: prefer `gh_grep` for GitHub code examples when unsure.

## Checklist

1. Prefer few high-value MCP servers (context cost).
2. Choose `local` vs `remote`; set unique server names.
3. For OAuth remotes: `opencode mcp auth <name>` then `opencode mcp list`.
4. For API-key remotes: `oauth: false` + headers/`{env:...}`.
5. Gate noisy servers with `tools` / per-agent globs.
6. Restart OpenCode after config changes.
7. In prompts, name the server/tool when you want it used.

## Related

- Custom tools (non-MCP): `tools.md`
- Plugins / lifecycle: `plugins.md`, `events.md`
- ACP embeds still use the same OpenCode MCP config: `acp.md`
