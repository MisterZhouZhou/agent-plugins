---
name: codex-plugin-marketplaces
description: Use when creating, migrating, syncing, publishing, installing, updating, or troubleshooting Codex plugins and plugin marketplaces, including `.agents/plugins/marketplace.json`, local or Git marketplace sources, cachebuster versions, stale installed plugins, plugin Hooks, and marketplace repository maintenance.
---

# Codex Plugin Marketplaces

## Overview

Manage the complete Codex plugin marketplace lifecycle without confusing source repositories, installed caches, Claude marketplace files, and global Codex state.

**Core principle:** edit and validate the source repository first; treat marketplace registration, upgrades, installation, removal, and Hook trust as a separate global-state phase that requires user confirmation.

**REQUIRED SUB-SKILL:** Use `plugin-creator` for plugin scaffolding, manifest validation, and cachebuster helpers when it is available. Re-read its current files and `codex plugin ... --help`; these interfaces are version-sensitive.

## Safety Boundary

May proceed without an extra confirmation:

- inspect source repositories, marketplaces, manifests, Git state, installed metadata, and caches;
- create or edit files inside the user-selected repository;
- run read-only validation, tests, `codex plugin list`, and `codex plugin marketplace list`;
- generate the exact global commands for review.

Must show the exact commands and get explicit confirmation immediately before running:

- `codex plugin marketplace add|upgrade|remove`;
- `codex plugin add|remove`;
- any direct change under `~/.codex/config.toml` or `~/.codex/plugins/cache`.

Never hand-edit global plugin cache or Hook trust records. Never interpret `[hooks.state]` as an active Hook definition.

## Start With Source Identity

Before editing, state these four values:

```text
Source plugin: <path or new plugin>
Marketplace repository: <path>
Plugin name: <normalized-name>
Distribution: local | Git <repository/ref>
```

Resolve ambiguity from current files and Git remotes. Ask only when two plausible source repositories remain. Installed paths under `~/.codex/plugins/cache/...` are evidence and runtime snapshots, not the default edit target.

## Choose The Workflow

| Situation | Workflow |
|---|---|
| New plugin | Scaffold -> implement -> add repository marketplace entry |
| Existing standalone plugin | Verify source -> copy/sync complete plugin tree -> add entry |
| Existing marketplace plugin | Edit in place -> validate -> cachebuster if reinstalling |
| Local distribution | Register repository path after confirmation |
| Git distribution | Commit/push source, then register or upgrade Git snapshot after confirmation |
| Codex still loads old behavior | Check installed source/version -> cachebuster -> refresh/reinstall -> new thread |

Read [repository-and-schema.md](references/repository-and-schema.md) before creating or migrating files. Read [distribution.md](references/distribution.md) for local/Git commands. Read [lifecycle-and-hooks.md](references/lifecycle-and-hooks.md) for updates, Hooks, and end-to-end verification.

## Repository Phase

1. Inspect the target worktree and preserve unrelated changes.
2. If `.codegraph/` exists and code understanding is needed, use CodeGraph first.
3. Locate the maintainable source. Prefer a normal repository over installed cache.
4. Use `plugins/<name>/` for a complete plugin and `.agents/plugins/marketplace.json` for the Codex marketplace.
5. Preserve `.claude-plugin/marketplace.json`; it is a separate format unless the user explicitly asks to update it.
6. Copy the complete plugin surface when migrating: manifest, skills, Hooks, scripts, templates/assets, MCP, and app files that are actually referenced.
7. Keep folder name, manifest `name`, marketplace entry `name`, and `source.path` aligned.
8. Preserve source metadata unless ownership or branding changes were requested.

Use structured JSON operations or `apply_patch`; do not assemble JSON with fragile text replacement.

## Validation Phase

Run the checks that apply, in this order:

```bash
python3 <plugin-creator>/scripts/validate_plugin.py <plugin-root>
python3 <skill-creator>/scripts/quick_validate.py <plugin-root>/skills/<skill-name>
python3 <this-skill>/scripts/audit_marketplace.py <marketplace-repo-root>
python3 -m json.tool <marketplace-repo-root>/.agents/plugins/marketplace.json >/dev/null
```

Then run plugin-specific tests, Hook protocol tests, `git diff --check`, and final `git status --short`. The audit script is read-only and complements, not replaces, the official plugin validator.

## Global-State Gate

After repository validation succeeds:

1. Determine whether the marketplace is already configured with read-only list commands.
2. Prepare only the commands needed for the selected local or Git path.
3. Explain their effects: marketplace registration/snapshot refresh, plugin cache replacement, and possible Hook review.
4. In the same message, show every exact command and its effect, then ask for confirmation. Never ask the user to confirm commands that are still hidden or deferred.
5. Run the approved commands and capture JSON output when supported.
6. Verify configured marketplace, installed plugin ID/version/path, and cache contents.
7. Tell the user to start a new thread so Codex reloads Skills and tools.

Do not bundle repository edits and global installation into one implicit action.

## Completion Report

Report:

- source and destination paths;
- files or marketplace entries changed;
- local or Git distribution command used, if approved;
- plugin, Skill, marketplace, Hook, and runtime verification results;
- current worktree status;
- any remaining manual Hook trust or new-thread step.

When a repository marketplace entry was created or updated, include Codex app View/Share links only if a concrete local `marketplace.json` path is available.

## Common Failure Modes

| Symptom | Cause | Correction |
|---|---|---|
| Edited code is ignored | Installed snapshot still has the old version | Validate, replace cachebuster, reinstall, start a new thread |
| Git URL appears in a plugin entry | Git distribution was confused with plugin source | Keep entry local-relative; pass Git URL to `marketplace add` |
| Hook works only from one directory | Command uses a relative cwd path | Resolve scripts through `PLUGIN_ROOT` |
| Hook installed but never runs | Hook is untrusted or not enabled | Inspect actual definitions and complete trust review |
| Plugin was edited under cache | Runtime snapshot was mistaken for source | Locate repository source and sync from there |
| Claude marketplace broke | `.claude-plugin` was rewritten as Codex schema | Keep both marketplace formats separate |
| Remote update remains stale | Git snapshot was not upgraded or pushed | Commit/push, upgrade marketplace, reinstall plugin |
