# Lifecycle And Hooks

## New Plugin

1. Resolve repository root and marketplace name.
2. Use `plugin-creator` to scaffold into `<repo>/plugins` with repo marketplace output.
3. Implement only requested components.
4. Validate manifest, Skills, marketplace, and runtime behavior.
5. Enter the global-state confirmation gate.

## Existing Plugin Migration

1. Identify maintainable source and target repository.
2. Read both trees and worktree status.
3. Copy the complete plugin, not only `SKILL.md`.
4. Add or replace one marketplace entry intentionally.
5. Diff source and destination and run all validators.
6. Leave the source installation and global configuration unchanged unless approved.

## Update And Cachebuster

An installed local plugin does not automatically reload source edits.

Repository phase:

```bash
python3 <plugin-creator>/scripts/validate_plugin.py <plugin-root>
python3 <plugin-creator>/scripts/update_plugin_cachebuster.py <plugin-root>
```

For Git distribution, commit and push the updated manifest and source before refreshing the snapshot. Then, after user confirmation, upgrade the Git marketplace and reinstall. For local distribution, reinstall from the configured local marketplace after confirmation.

Start a new thread after reinstall; current threads may retain old Skill/tool context.

## Hook Packaging

Keep Hook definitions in `hooks/hooks.json`. Command Hooks that invoke plugin-bundled files must resolve them through plugin root; standalone executables found through `PATH` do not need that prefix:

```json
{
  "type": "command",
  "command": "python3 ${PLUGIN_ROOT}/hooks/example.py",
  "commandWindows": "python %PLUGIN_ROOT%\\hooks\\example.py"
}
```

Hook scripts should:

- parse stdin JSON defensively;
- emit one valid JSON object to stdout when responding, or emit nothing;
- send diagnostics to stderr, not stdout;
- avoid creating project data during ordinary lifecycle events unless the contract explicitly requires it;
- reject path traversal and resolve project paths deliberately.

## Hook Verification

Test at least:

1. declared event names and matchers;
2. direct execution from a different cwd through `PLUGIN_ROOT`;
3. valid event-specific output shape;
4. silence for missing or invalid applicable state;
5. installed-cache execution after installation;
6. trust review separately from installation.

Examples of common output shapes:

```json
{
  "hookSpecificOutput": {
    "hookEventName": "SessionStart",
    "additionalContext": "..."
  }
}
```

```json
{
  "continue": true,
  "systemMessage": "..."
}
```

Use the schema required by the actual event. Do not assume one Hook event's output applies to another.

## Final Verification Stack

1. plugin validator;
2. every bundled Skill validator;
3. read-only marketplace audit;
4. targeted component and Hook tests;
5. JSON parsing checks;
6. source/destination diff for migrations;
7. approved registration/install command output;
8. installed path/version inspection;
9. installed runtime smoke test;
10. `git diff --check` and `git status --short`.

If full tests expose unrelated failures, report them separately and retain the targeted evidence.
