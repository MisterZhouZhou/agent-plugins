#!/usr/bin/env bash

if [ -z "${BASH:-}" ] || [ "${BASH##*/}" = "sh" ]; then
  exec /usr/bin/env bash "$0" "$@"
fi

set -euo pipefail

usage() {
  cat <<'EOF'
Usage:
  restore-session.sh SESSION_ID [--project DIR] [--codex-home DIR] [-- extra codex args...]

Restore a session from <project>/.codex-session-archive without moving login
credentials into the project archive. The script creates a system-temporary
CODEX_HOME that links sessions from the archive and auth/config from
the real Codex home.
EOF
}

session_id=""
project_dir="$PWD"
source_codex_home="${CODEX_HOME_SOURCE:-$HOME/.codex}"
extra_args=()

while [[ $# -gt 0 ]]; do
  case "$1" in
    -h|--help)
      usage
      exit 0
      ;;
    --project|--cwd)
      [[ $# -ge 2 ]] || { printf 'missing value for %s\n' "$1" >&2; exit 2; }
      project_dir="$2"
      shift 2
      ;;
    --codex-home)
      [[ $# -ge 2 ]] || { printf 'missing value for %s\n' "$1" >&2; exit 2; }
      source_codex_home="$2"
      shift 2
      ;;
    --)
      shift
      extra_args+=("$@")
      break
      ;;
    -* )
      extra_args+=("$1")
      shift
      ;;
    *)
      if [[ -z "$session_id" ]]; then
        session_id="$1"
      else
        extra_args+=("$1")
      fi
      shift
      ;;
  esac
done

[[ -n "$session_id" ]] || { usage >&2; exit 2; }
[[ "$session_id" =~ ^[[:alnum:]_-]+$ ]] || { printf 'invalid session id: %s\n' "$session_id" >&2; exit 2; }
[[ -d "$project_dir" ]] || { printf 'project dir does not exist: %s\n' "$project_dir" >&2; exit 1; }
[[ -d "$source_codex_home" ]] || { printf 'codex home does not exist: %s\n' "$source_codex_home" >&2; exit 1; }

project_dir="$(cd "$project_dir" && pwd)"
source_codex_home="$(cd "$source_codex_home" && pwd)"
archive_root="$project_dir/.codex-session-archive"
[[ -d "$archive_root/sessions" ]] || { printf 'archive sessions not found: %s\n' "$archive_root/sessions" >&2; exit 1; }

restore_home="$(mktemp -d "${TMPDIR:-/tmp}/codex-session-restore.XXXXXX")"
cleanup() {
  rm -rf "$restore_home"
}
trap cleanup EXIT

link_or_copy() {
  local src="$1"
  local dst="$2"
  rm -rf "$dst"
  if ln -s "$src" "$dst" 2>/dev/null; then
    return 0
  fi
  if [[ -d "$src" ]]; then
    cp -R "$src" "$dst"
  else
    cp "$src" "$dst"
  fi
}

link_if_exists() {
  local name="$1"
  if [[ -e "$source_codex_home/$name" ]]; then
    link_or_copy "$source_codex_home/$name" "$restore_home/$name"
  fi
}

link_or_copy "$archive_root/sessions" "$restore_home/sessions"
if [[ -e "$archive_root/archived_sessions" ]]; then
  link_or_copy "$archive_root/archived_sessions" "$restore_home/archived_sessions"
fi
if [[ -e "$archive_root/session_index.jsonl" ]]; then
  link_or_copy "$archive_root/session_index.jsonl" "$restore_home/session_index.jsonl"
fi

link_if_exists auth.json
link_if_exists config.toml
link_if_exists installation_id

printf 'restore CODEX_HOME: %s\n' "$restore_home" >&2
set +u
env CODEX_HOME="$restore_home" codex resume --all "$session_id" --cd "$project_dir" "${extra_args[@]}"
