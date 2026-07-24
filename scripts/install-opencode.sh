#!/bin/sh

set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd -P)
REPO_ROOT=$(CDPATH= cd -- "$SCRIPT_DIR/.." && pwd -P)
SOURCE="$REPO_ROOT/plugins/agent-notify/opencode/agent-notify.js"
INSTALL_DIR=${OPENCODE_PLUGIN_DIR:-"$HOME/.opencode/plugins"}
TARGET="$INSTALL_DIR/agent-notify.js"
LEGACY="$INSTALL_DIR/notification.ts"

usage() {
  cat <<'EOF'
Usage: ./scripts/install-opencode.sh [install|status|uninstall] [--disable-legacy]

Commands:
  install          Install or update the OpenCode plugin symlink (default).
  status           Show installation and legacy-plugin status.
  uninstall        Remove only the agent-notify symlink managed by this script.

Options:
  --disable-legacy Rename notification.ts to notification.ts.disabled after install.

Environment:
  OPENCODE_PLUGIN_DIR  Override the plugin directory for testing or custom installs.
EOF
}

is_our_link() {
  [ -L "$TARGET" ] && [ "$(readlink "$TARGET")" = "$SOURCE" ]
}

show_status() {
  if is_our_link; then
    printf 'installed: %s -> %s\n' "$TARGET" "$SOURCE"
  elif [ -e "$TARGET" ] || [ -L "$TARGET" ]; then
    printf 'conflict: %s exists but is not managed by this installer\n' "$TARGET"
  else
    printf 'not installed: %s\n' "$TARGET"
  fi

  if [ -f "$LEGACY" ]; then
    printf 'legacy notification plugin detected: %s\n' "$LEGACY"
  elif [ -f "$LEGACY.disabled" ]; then
    printf 'legacy notification plugin disabled: %s\n' "$LEGACY.disabled"
  fi
}

command=install
disable_legacy=0

for argument in "$@"; do
  case "$argument" in
    install|status|uninstall)
      command=$argument
      ;;
    --disable-legacy)
      disable_legacy=1
      ;;
    -h|--help|-help)
      usage
      exit 0
      ;;
    *)
      printf 'Unknown argument: %s\n' "$argument" >&2
      usage >&2
      exit 2
      ;;
  esac
done

case "$command" in
  status)
    show_status
    ;;
  uninstall)
    if is_our_link; then
      rm "$TARGET"
      printf 'Removed %s\n' "$TARGET"
    elif [ -e "$TARGET" ] || [ -L "$TARGET" ]; then
      printf 'Refusing to remove unmanaged path: %s\n' "$TARGET" >&2
      exit 1
    else
      printf 'Already uninstalled: %s\n' "$TARGET"
    fi
    ;;
  install)
    if [ ! -f "$SOURCE" ]; then
      printf 'Plugin source not found: %s\n' "$SOURCE" >&2
      exit 1
    fi

    if [ "$disable_legacy" -eq 1 ] && [ -f "$LEGACY" ] && [ -e "$LEGACY.disabled" ]; then
      printf 'Cannot disable legacy plugin; backup already exists: %s\n' "$LEGACY.disabled" >&2
      exit 1
    fi

    mkdir -p "$INSTALL_DIR"
    if [ -e "$TARGET" ] || [ -L "$TARGET" ]; then
      if ! is_our_link; then
        # Allow upgrading an old install that pointed at the previous script location.
        if [ -L "$TARGET" ] && [ "$(basename "$(readlink "$TARGET")")" = "agent-notify.js" ]; then
          rm "$TARGET"
        else
          printf 'Refusing to replace unmanaged path: %s\n' "$TARGET" >&2
          exit 1
        fi
      else
        rm "$TARGET"
      fi
    fi
    ln -s "$SOURCE" "$TARGET"
    printf 'Installed %s -> %s\n' "$TARGET" "$SOURCE"

    if [ -f "$LEGACY" ]; then
      if [ "$disable_legacy" -eq 1 ]; then
        mv "$LEGACY" "$LEGACY.disabled"
        printf 'Disabled legacy plugin: %s\n' "$LEGACY.disabled"
      else
        printf 'Warning: %s may cause duplicate notifications.\n' "$LEGACY" >&2
        printf 'Re-run with --disable-legacy to rename it safely.\n' >&2
      fi
    fi

    printf 'Restart OpenCode, then run: opencode debug config\n'
    ;;
esac
