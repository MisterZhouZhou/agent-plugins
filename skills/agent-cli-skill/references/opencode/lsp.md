# OpenCode LSP Servers

OpenCode can integrate with Language Server Protocol (LSP) servers and feed
diagnostics back to the agent.

**LSP is off by default.** When enabled, a server starts when a matching file
extension is opened and requirements are met.

Disable auto-download of LSP servers with:

```bash
export OPENCODE_DISABLE_LSP_DOWNLOAD=true
```

## How it works

With LSP enabled, when OpenCode opens a file it:

1. Matches the extension against enabled LSP servers
2. Starts the matching server if it is not already running
3. Surfaces diagnostics as agent feedback

## Best practices

LSP can help find/fix issues via language-server diagnostics, but it is not
always a net win:

- Servers can drift from the project, use significant memory, vary by version
- Can slow the agent loop

Often better: document `lint` / `typecheck` CLI commands in `AGENTS.md` or
skills, and let the agent run those tools directly. Enable LSP only when the
project clearly benefits from live language-server feedback.

## Built-in servers

| LSP server | Extensions | Requirements |
|---|---|---|
| astro | `.astro` | Auto-install for Astro projects |
| bash | `.sh`, `.bash`, `.zsh`, `.ksh` | Auto-install bash-language-server |
| clangd | `.c`, `.cpp`, `.cc`, `.cxx`, `.c++`, `.h`, `.hpp`, `.hh`, `.hxx`, `.h++` | Auto-install for C/C++ projects |
| csharp | `.cs` | .NET SDK installed |
| clojure-lsp | `.clj`, `.cljs`, `.cljc`, `.edn` | `clojure-lsp` on PATH |
| dart | `.dart` | `dart` on PATH |
| deno | `.ts`, `.tsx`, `.js`, `.jsx`, `.mjs` | `deno` on PATH; auto-detect `deno.json` / `deno.jsonc` |
| elixir-ls | `.ex`, `.exs` | `elixir` on PATH |
| eslint | `.ts`, `.tsx`, `.js`, `.jsx`, `.mjs`, `.cjs`, `.mts`, `.cts`, `.vue` | Project `eslint` dependency |
| fsharp | `.fs`, `.fsi`, `.fsx`, `.fsscript` | .NET SDK installed |
| gleam | `.gleam` | `gleam` on PATH |
| gopls | `.go` | `go` on PATH |
| hls | `.hs`, `.lhs` | `haskell-language-server-wrapper` on PATH |
| jdtls | `.java` | Java SDK 21+ |
| julials | `.jl` | Julia + LanguageServer.jl |
| kotlin-ls | `.kt`, `.kts` | Auto-install for Kotlin projects |
| lua-ls | `.lua` | Auto-install for Lua projects |
| nixd | `.nix` | `nixd` on PATH |
| ocaml-lsp | `.ml`, `.mli` | `ocamllsp` on PATH |
| oxlint | `.ts`, `.tsx`, `.js`, `.jsx`, `.mjs`, `.cjs`, `.mts`, `.cts`, `.vue`, `.astro`, `.svelte` | Project `oxlint` dependency |
| php intelephense | `.php` | Auto-install for PHP projects |
| prisma | `.prisma` | `prisma` on PATH |
| pyright | `.py`, `.pyi` | `pyright` installed |
| ruby-lsp (rubocop) | `.rb`, `.rake`, `.gemspec`, `.ru` | `ruby` and `gem` on PATH |
| rust | `.rs` | `rust-analyzer` on PATH |
| sourcekit-lsp | `.swift`, `.objc`, `.objcpp` | Swift (Xcode on macOS) |
| svelte | `.svelte` | Auto-install for Svelte projects |
| terraform | `.tf`, `.tfvars` | Auto-install from GitHub releases |
| tinymist | `.typ`, `.typc` | Auto-install from GitHub releases |
| typescript | `.ts`, `.tsx`, `.js`, `.jsx`, `.mjs`, `.cjs`, `.mts`, `.cts` | Project `typescript` dependency |
| vue | `.vue` | Auto-install for Vue projects |
| yaml-ls | `.yaml`, `.yml` | Auto-install Red Hat yaml-language-server |
| zls | `.zig`, `.zon` | `zig` on PATH |

## Configuration

Configure under `lsp` in OpenCode config.

### Enable all built-ins

```json
{
  "$schema": "https://opencode.ai/config.json",
  "lsp": true
}
```

### Object form (overrides + custom servers)

```json
{
  "$schema": "https://opencode.ai/config.json",
  "lsp": {}
}
```

Empty object keeps built-ins available while allowing per-server overrides.

### Per-server options

| Property | Type | Description |
|---|---|---|
| `disabled` | boolean | Disable this server |
| `command` | string[] | Command to start the server |
| `extensions` | string[] | File extensions handled |
| `env` | object | Env vars when starting the server |
| `initialization` | object | LSP initialize options (server-specific) |

### Environment

```json
{
  "$schema": "https://opencode.ai/config.json",
  "lsp": {
    "rust": {
      "env": {
        "RUST_LOG": "debug"
      }
    }
  }
}
```

### Initialization options

```json
{
  "$schema": "https://opencode.ai/config.json",
  "lsp": {
    "typescript": {
      "initialization": {
        "preferences": {
          "importModuleSpecifierPreference": "relative"
        }
      }
    }
  }
}
```

Options vary by server; check that server’s docs.

### Disable all

If `lsp` is omitted, all LSP servers are disabled. To force-disable when another
config layer enabled them:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "lsp": false
}
```

### Disable one server

```json
{
  "$schema": "https://opencode.ai/config.json",
  "lsp": {
    "typescript": {
      "disabled": true
    }
  }
}
```

### Custom LSP server

```json
{
  "$schema": "https://opencode.ai/config.json",
  "lsp": {
    "custom-lsp": {
      "command": ["custom-lsp-server", "--stdio"],
      "extensions": [".custom"]
    }
  }
}
```

## PHP Intelephense license

Premium features use a license key file (key only, nothing else):

| OS | Path |
|---|---|
| macOS/Linux | `$HOME/intelephense/license.txt` |
| Windows | `%USERPROFILE%/intelephense/license.txt` |

## Checklist

1. Prefer CLI lint/typecheck in `AGENTS.md` unless live LSP feedback is needed.
2. Enable with `"lsp": true` or configure specific servers under `"lsp": { ... }`.
3. Ensure language toolchain / deps from the table are available.
4. Use `OPENCODE_DISABLE_LSP_DOWNLOAD=true` when auto-install is unwanted.
5. Restart OpenCode after config changes.
6. Disable noisy servers with `disabled: true` rather than abandoning all diagnostics.

## Related

- Agent instructions / when to run checks: project `AGENTS.md` and skills
- MCP for external tools (not language diagnostics): `mcp.md`
- Custom tools: `tools.md`
