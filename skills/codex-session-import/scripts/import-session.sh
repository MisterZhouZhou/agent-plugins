#!/usr/bin/env bash

if [ -z "${BASH:-}" ] || [ "${BASH##*/}" = "sh" ]; then
  exec /usr/bin/env bash "$0" "$@"
fi

set -euo pipefail

usage() {
  cat <<'EOF'
Usage:
  import-session.sh [--project DIR] [--codex-home DIR] [--force] [SESSION_ID|--all]

Import sessions from <project>/.codex-session-archive into the real Codex home
so they can be resumed with plain `codex resume`.
With no SESSION_ID or --all, imports all sessions from the project archive.

When --all is used, conflicting sessions are skipped unless --force is set.
EOF
}

project_dir="$PWD"
codex_home="${CODEX_HOME:-$HOME/.codex}"
session_id=""
import_all=0
force=0

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
      codex_home="$2"
      shift 2
      ;;
    --all)
      import_all=1
      shift
      ;;
    --force)
      force=1
      shift
      ;;
    --)
      shift
      break
      ;;
    -* )
      printf 'unknown option: %s\n' "$1" >&2
      usage
      exit 2
      ;;
    *)
      if [[ -z "$session_id" ]]; then
        session_id="$1"
      else
        printf 'multiple session ids provided\n' >&2
        exit 2
      fi
      shift
      ;;
  esac
done

if [[ "$import_all" -eq 0 && -z "$session_id" ]]; then
  import_all=1
fi

if [[ "$import_all" -eq 1 && -n "$session_id" ]]; then
  printf 'choose only one of SESSION_ID or --all\n' >&2
  exit 2
fi

[[ -d "$project_dir" ]] || { printf 'project dir does not exist: %s\n' "$project_dir" >&2; exit 1; }
[[ -d "$codex_home" ]] || { printf 'codex home does not exist: %s\n' "$codex_home" >&2; exit 1; }

project_dir="$(cd "$project_dir" && pwd)"
codex_home="$(cd "$codex_home" && pwd)"
archive_root="$project_dir/.codex-session-archive"
[[ -d "$archive_root/sessions/by-id" ]] || { printf 'project archive not found: %s\n' "$archive_root/sessions/by-id" >&2; exit 1; }

copy_file() {
  local src="$1"
  local dst="$2"
  mkdir -p "$(dirname "$dst")"
  cp "$src" "$dst"
}

same_file_if_exists() {
  local src="$1"
  local dst="$2"
  [[ -e "$dst" ]] || return 1
  cmp -s "$src" "$dst"
}

file_stat_line() {
  local path="$1"
  [[ -e "$path" ]] || { printf 'missing'; return 0; }
  if stat -f '%Sm %z bytes' -t '%Y-%m-%d %H:%M:%S' "$path" >/dev/null 2>&1; then
    stat -f '%Sm %z bytes' -t '%Y-%m-%d %H:%M:%S' "$path"
  else
    stat -c '%y %s bytes' "$path"
  fi
}

summarize_rollout() {
  local label="$1"
  local path="$2"
  local session_meta cwd model thread_name
  session_meta="$(jq -r 'select(.type == "session_meta") | .payload.id // empty' "$path" 2>/dev/null | head -n 1)"
  cwd="$(jq -r 'select(.type == "session_meta") | .payload.cwd // empty' "$path" 2>/dev/null | head -n 1)"
  model="$(jq -r 'select(.type == "turn_context") | .payload.model // empty' "$path" 2>/dev/null | tail -n 1)"
  thread_name="$(jq -r --arg id "$session_meta" 'select(.id == $id) | .thread_name' "$codex_home/session_index.jsonl" 2>/dev/null | tail -n 1)"
  printf '%s\n' "$label"
  printf '  file: %s\n' "$path"
  printf '  stat: %s\n' "$(file_stat_line "$path")"
  printf '  session: %s\n' "${session_meta:-unknown}"
  printf '  cwd: %s\n' "${cwd:-unknown}"
  printf '  model: %s\n' "${model:-unknown}"
  printf '  thread_name: %s\n' "${thread_name:-unknown}"
}

prompt_conflict_choice() {
  local sid="$1"
  local project_rollout="$2"
  local global_rollout="$3"

  printf '\nconflict detected for session %s\n' "$sid" >&2
  summarize_rollout 'project version' "$project_rollout" >&2
  summarize_rollout 'global version' "$global_rollout" >&2

  while true; do
    printf 'choose [p]roject version, [g]lobal version, [d]iff, [s]kip: ' >&2
    IFS= read -r choice || return 1
    case "$(printf '%s' "$choice" | tr '[:upper:]' '[:lower:]')" in
      p|project)
        return 0
        ;;
      g|global)
        return 2
        ;;
      d|diff)
        diff -u --label "project:$project_rollout" --label "global:$global_rollout" "$global_rollout" "$project_rollout" || true
        ;;
      s|skip)
        return 3
        ;;
      *)
        printf 'please enter p, g, d, or s\n' >&2
        ;;
    esac
  done
}

append_unique_line() {
  local line="$1"
  local dst="$2"
  [[ -n "$line" ]] || return 0
  mkdir -p "$(dirname "$dst")"
  touch "$dst"
  if ! grep -Fqx -- "$line" "$dst"; then
    printf '%s\n' "$line" >> "$dst"
  fi
}

upsert_jsonl_by_field() {
  local field="$1"
  local value="$2"
  local src="$3"
  local dst="$4"
  local line=""
  local tmp

  line="$(jq -c --arg value "$value" --arg field "$field" 'select((.[$field] // empty) == $value)' "$src" 2>/dev/null | tail -n 1)"
  [[ -n "$line" ]] || return 1

  mkdir -p "$(dirname "$dst")"
  tmp="$(mktemp "${dst}.XXXXXX")"
  if [[ -f "$dst" ]]; then
    jq -c --arg value "$value" --arg field "$field" 'select((.[$field] // empty) != $value)' "$dst" > "$tmp"
  else
    : > "$tmp"
  fi
  printf '%s\n' "$line" >> "$tmp"
  mv "$tmp" "$dst"
}

upsert_jsonl_line_by_field() {
  local field="$1"
  local value="$2"
  local line="$3"
  local dst="$4"
  local tmp

  [[ -n "$line" ]] || return 1

  mkdir -p "$(dirname "$dst")"
  tmp="$(mktemp "${dst}.XXXXXX")"
  if [[ -f "$dst" ]]; then
    jq -c --arg value "$value" --arg field "$field" 'select((.[$field] // empty) != $value)' "$dst" > "$tmp"
  else
    : > "$tmp"
  fi
  printf '%s\n' "$line" >> "$tmp"
  mv "$tmp" "$dst"
}

import_one() {
  local sid="$1"
  if [[ ! "$sid" =~ ^[[:alnum:]_-]+$ ]]; then
    printf 'invalid session id: %s\n' "$sid" >&2
    return 1
  fi
  local manifest="$archive_root/sessions/by-id/$sid/manifest.json"
  local rollout="$archive_root/sessions/by-id/$sid/rollout.jsonl"
  [[ -f "$manifest" ]] || { printf 'missing manifest: %s\n' "$manifest" >&2; return 1; }
  [[ -f "$rollout" ]] || { printf 'missing rollout: %s\n' "$rollout" >&2; return 1; }

  local native_rel
  native_rel="$(jq -r '.files.native_rollout // empty' "$manifest")"
  if [[ -z "$native_rel" ]]; then
    native_rel="$(jq -r '.files.rollout // empty' "$manifest")"
  fi
  [[ -n "$native_rel" ]] || { printf 'manifest missing rollout path: %s\n' "$manifest" >&2; return 1; }
  case "$native_rel" in
    sessions/*|archived_sessions/*)
      ;;
    *)
      printf 'manifest rollout path is outside Codex session directories: %s\n' "$native_rel" >&2
      return 1
      ;;
  esac
  if [[ "$native_rel" =~ (^|/)\.\.(/|$) ]]; then
    printf 'manifest rollout path contains parent traversal: %s\n' "$native_rel" >&2
    return 1
  fi

  local target_rollout="$codex_home/$native_rel"
  if same_file_if_exists "$rollout" "$target_rollout"; then
    printf 'session already present with identical rollout: %s\n' "$sid"
  elif [[ -e "$target_rollout" && "$force" -eq 0 ]]; then
    if [[ "$import_all" -eq 1 ]]; then
      printf 'skipped conflicting session: %s\n' "$sid" >&2
      printf '  existing global rollout: %s\n' "$target_rollout" >&2
      return 0
    elif [[ -t 0 && -t 1 ]]; then
      local conflict_choice
      if prompt_conflict_choice "$sid" "$rollout" "$target_rollout"; then
        conflict_choice=0
      else
        conflict_choice=$?
      fi
      case "$conflict_choice" in
        0)
          copy_file "$rollout" "$target_rollout"
          ;;
        2)
          printf 'kept global version: %s\n' "$target_rollout"
          return 0
          ;;
        3)
          printf 'skipped session: %s\n' "$sid"
          return 0
          ;;
        *)
          return 1
          ;;
      esac
    else
      printf 'conflict: session already exists with different rollout: %s\n' "$sid" >&2
      printf 'run in an interactive terminal to choose the project or global version, or use --force to overwrite\n' >&2
      return 1
    fi
  else
    copy_file "$rollout" "$target_rollout"
  fi

  if [[ -f "$archive_root/session_index.jsonl" ]]; then
    if ! upsert_jsonl_by_field 'id' "$sid" "$archive_root/session_index.jsonl" "$codex_home/session_index.jsonl"; then
      printf 'warning: could not update session_index.jsonl for %s\n' "$sid" >&2
    fi
  else
    local thread_name
    local synced_at
    local index_line
    thread_name="$(jq -r '.thread_name // empty' "$manifest")"
    synced_at="$(jq -r '.synced_at // empty' "$manifest")"
    if [[ -n "$thread_name" ]]; then
      index_line="$(jq -c -n --arg id "$sid" --arg thread_name "$thread_name" --arg updated_at "$synced_at" '{id:$id,thread_name:$thread_name,updated_at:$updated_at}')"
      if ! upsert_jsonl_line_by_field 'id' "$sid" "$index_line" "$codex_home/session_index.jsonl"; then
        printf 'warning: could not synthesize session_index.jsonl for %s\n' "$sid" >&2
      fi
    fi
  fi

  if [[ -f "$archive_root/index.jsonl" ]]; then
    while IFS= read -r archive_line; do
      append_unique_line "$archive_line" "$codex_home/archived_sessions/imported-index.jsonl"
    done < <(jq -c --arg id "$sid" 'select(.session_id == $id)' "$archive_root/index.jsonl" 2>/dev/null)
  fi
  printf 'imported session: %s\n' "$sid"
  printf 'resume with: codex resume --all %s\n' "$sid"
}

if [[ "$import_all" -eq 1 ]]; then
  while IFS= read -r manifest; do
    sid="$(basename "$(dirname "$manifest")")"
    import_one "$sid"
  done < <(find "$archive_root/sessions/by-id" -path '*/manifest.json' | sort)
else
  import_one "$session_id"
fi
