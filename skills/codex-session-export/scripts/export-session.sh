#!/usr/bin/env bash

if [ -z "${BASH:-}" ] || [ "${BASH##*/}" = "sh" ]; then
  exec /usr/bin/env bash "$0" "$@"
fi

set -euo pipefail

usage() {
  cat <<'EOF'
Usage:
  export-session.sh [--project DIR] [SESSION_ID|--latest|--all]

Export Codex session(s) from the current Codex home into <project>/.codex-session-archive.
With no SESSION_ID, --latest, or --all, exports all sessions for the project.
EOF
}

project_dir="$PWD"
session_id=""
latest=0
export_all=0

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
    --latest)
      latest=1
      shift
      ;;
    --all)
      export_all=1
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

if [[ "$latest" -eq 0 && "$export_all" -eq 0 && -z "$session_id" ]]; then
  export_all=1
fi

selected_modes=$((latest + export_all))
if [[ -n "$session_id" ]]; then
  selected_modes=$((selected_modes + 1))
fi
if [[ "$selected_modes" -gt 1 ]]; then
  printf 'choose only one of SESSION_ID, --latest, or --all\n' >&2
  exit 2
fi

[[ -d "$project_dir" ]] || { printf 'project dir does not exist: %s\n' "$project_dir" >&2; exit 1; }
project_dir="$(cd "$project_dir" && pwd)"

if [[ -n "$session_id" && ! "$session_id" =~ ^[[:alnum:]_-]+$ ]]; then
  printf 'invalid session id: %s\n' "$session_id" >&2
  exit 2
fi

plugin_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
codex_home="${CODEX_HOME:-$HOME/.codex}"

find_project_session_ids() {
  local rollout rollout_cwd sid tmp
  tmp="$(mktemp "${TMPDIR:-/tmp}/codex-session-ids.XXXXXX")"
  while IFS= read -r rollout; do
    rollout_cwd="$(jq -r 'select(.type == "session_meta") | .payload.cwd // empty' "$rollout" 2>/dev/null | head -n 1)"
    [[ "$rollout_cwd" == "$project_dir" ]] || continue
    sid="$(jq -r 'select(.type == "session_meta") | .payload.id // .payload.session_id // empty' "$rollout" 2>/dev/null | head -n 1)"
    [[ -n "$sid" ]] && printf '%s\n' "$sid" >> "$tmp"
  done < <(find "$codex_home/sessions" "$codex_home/archived_sessions" -type f -name 'rollout-*.jsonl' 2>/dev/null | sort)
  sort -u "$tmp"
  rm -f "$tmp"
}

export_one() {
  local sid="$1"
  local json_input
  json_input="$(jq -n \
    --arg session_id "$sid" \
    --arg cwd "$project_dir" \
    --arg model "manual-script-export" \
    '{session_id:$session_id,turn_id:"manual-script-export",cwd:$cwd,hook_event_name:"Stop",model:$model,permission_mode:"default",stop_hook_active:false,last_assistant_message:null,transcript_path:null,require_rollout:true}')"

  printf '%s\n' "$json_input" | "$plugin_root/scripts/sync-session-to-project.sh"
  [[ -f "$project_dir/.codex-session-archive/sessions/by-id/$sid/manifest.json" ]] || {
    printf 'export did not create a manifest for session: %s\n' "$sid" >&2
    return 1
  }
}

if [[ "$latest" -eq 1 ]]; then
  latest_rollout="$(
    while IFS= read -r rollout; do
      rollout_cwd="$(jq -r 'select(.type == "session_meta") | .payload.cwd // empty' "$rollout" 2>/dev/null | head -n 1)"
      if [[ "$rollout_cwd" == "$project_dir" ]]; then
        printf '%s\n' "$rollout"
        break
      fi
    done < <(find "$codex_home/sessions" "$codex_home/archived_sessions" -type f -name 'rollout-*.jsonl' 2>/dev/null | sort -r)
  )"
  [[ -n "$latest_rollout" ]] || { printf 'no rollout found for project %s under %s\n' "$project_dir" "$codex_home" >&2; exit 1; }
  session_id="$(jq -r 'select(.type == "session_meta") | .payload.id // .payload.session_id // empty' "$latest_rollout" 2>/dev/null | head -n 1)"
  [[ -n "$session_id" ]] || { printf 'could not detect session id from %s\n' "$latest_rollout" >&2; exit 1; }
fi

if [[ "$export_all" -eq 1 ]]; then
  exported=0
  while IFS= read -r sid; do
    [[ -n "$sid" ]] || continue
    export_one "$sid"
    exported=$((exported + 1))
  done < <(find_project_session_ids)
  [[ "$exported" -gt 0 ]] || { printf 'no rollout found for project %s under %s\n' "$project_dir" "$codex_home" >&2; exit 1; }
  printf 'exported sessions for project: %s\n' "$exported"
else
  export_one "$session_id"
fi
