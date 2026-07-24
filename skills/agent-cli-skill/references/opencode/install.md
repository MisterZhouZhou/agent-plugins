# OpenCode Installer Contract

## Preferred UX

Repo-root shallow script:

```bash
scripts/install-opencode.sh install [--disable-legacy]
scripts/install-opencode.sh status
scripts/install-opencode.sh uninstall
```

Default target on builds that auto-load it:

```text
~/.opencode/plugins/<adapter>.js  ->  <repo>/plugins/<name>/opencode/<adapter>.js
```

Override for tests:

```bash
OPENCODE_PLUGIN_DIR=/tmp/x/plugins scripts/install-opencode.sh install
```

## Installer requirements

1. Create/update a **symlink** to the adapter source.
2. Support `status` and `uninstall`.
3. Refuse to overwrite unmanaged same-name files.
4. Detect legacy notifiers (for example `notification.ts`).
5. Disable legacy only with an explicit flag; rename to `*.disabled`, do not delete.
6. Remind user to fully quit and restart OpenCode.
7. Keep script path shallow (`scripts/`), not nested deep under the plugin.

## After install

```bash
opencode debug config   # adapter listed once
opencode debug info
```

Then full restart. No hot reload.

## Alternatives

- Config entry: `plugin: ["file:///abs/path/to/adapter.js"]`
- npm: `opencode plugin <package> --global` when published
- Project-only: `<project>/.opencode/plugins/`

## Safety

Require user confirmation before writing into home plugin dirs or renaming legacy plugins.
Uninstall removes only the managed symlink.
