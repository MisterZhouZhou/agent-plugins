#!/usr/bin/env bash

if [ -z "${BASH:-}" ] || [ "${BASH##*/}" = "sh" ]; then
  exec /usr/bin/env bash "$0" "$@"
fi

set -uo pipefail

log() {
  printf '[codex-session-archive] %s\n' "$*" >&2
}

json_input="$(cat)"

if ! command -v jq >/dev/null 2>&1; then
  log "jq not found; skip sync"
  exit 0
fi

session_id="$(printf '%s' "$json_input" | jq -r '.session_id // empty' 2>/dev/null)"
cwd="$(printf '%s' "$json_input" | jq -r '.cwd // empty' 2>/dev/null)"
model="$(printf '%s' "$json_input" | jq -r '.model // empty' 2>/dev/null)"
turn_id="$(printf '%s' "$json_input" | jq -r '.turn_id // empty' 2>/dev/null)"
transcript_path="$(printf '%s' "$json_input" | jq -r '.transcript_path // empty' 2>/dev/null)"
require_rollout="$(printf '%s' "$json_input" | jq -r '.require_rollout // false' 2>/dev/null)"

if [[ -z "$session_id" || -z "$cwd" ]]; then
  log "missing session_id or cwd in hook input; skip sync"
  exit 0
fi

if [[ ! "$session_id" =~ ^[[:alnum:]_-]+$ ]]; then
  log "invalid session_id in hook input; skip sync"
  if [[ "$require_rollout" == "true" ]]; then
    exit 1
  fi
  exit 0
fi

codex_home="${CODEX_HOME:-$HOME/.codex}"
archive_root="$cwd/.codex-session-archive"
session_root="$archive_root/sessions/by-id/$session_id"
mkdir -p "$session_root" "$archive_root/logs"

find_rollout_by_name() {
  find "$codex_home/sessions" "$codex_home/archived_sessions" \
    -type f -name "*$session_id*.jsonl" 2>/dev/null | head -n 1
}

find_rollout_by_content() {
  if command -v rg >/dev/null 2>&1; then
    rg -l "\"id\":\"$session_id\"|\"id\": \"$session_id\"" \
      "$codex_home/sessions" "$codex_home/archived_sessions" 2>/dev/null | head -n 1
  else
    grep -R -l "\"id\":\"$session_id\"" \
      "$codex_home/sessions" "$codex_home/archived_sessions" 2>/dev/null | head -n 1
  fi
}

rollout_path="$(find_rollout_by_name)"
if [[ -z "$rollout_path" ]]; then
  rollout_path="$(find_rollout_by_content)"
fi

synced_at="$(date -u +%Y-%m-%dT%H:%M:%SZ)"

if [[ -z "$rollout_path" || ! -f "$rollout_path" ]]; then
  jq -n \
    --arg synced_at "$synced_at" \
    --arg session_id "$session_id" \
    --arg cwd "$cwd" \
    --arg model "$model" \
    --arg turn_id "$turn_id" \
    '{synced_at:$synced_at,status:"missing_rollout",session_id:$session_id,cwd:$cwd,model:$model,turn_id:$turn_id}' \
    >> "$archive_root/logs/sync.jsonl"
  log "rollout not found for $session_id; wrote sync log only"
  if [[ "$require_rollout" == "true" ]]; then
    exit 1
  fi
  exit 0
fi

cp "$rollout_path" "$session_root/rollout.jsonl"

rollout_file_name="$(basename "$rollout_path")"
native_rollout_rel=""
if [[ "$rollout_file_name" =~ ^rollout-([0-9]{4})-([0-9]{2})-([0-9]{2})T ]]; then
  native_dir="$archive_root/sessions/${BASH_REMATCH[1]}/${BASH_REMATCH[2]}/${BASH_REMATCH[3]}"
  mkdir -p "$native_dir"
  cp "$rollout_path" "$native_dir/$rollout_file_name"
  native_rollout_rel="sessions/${BASH_REMATCH[1]}/${BASH_REMATCH[2]}/${BASH_REMATCH[3]}/$rollout_file_name"
fi

if [[ -n "$transcript_path" && -f "$transcript_path" ]]; then
  cp "$transcript_path" "$session_root/transcript.jsonl" 2>/dev/null || true
fi

thread_name=""
if [[ -f "$codex_home/session_index.jsonl" ]]; then
  thread_name="$(jq -r --arg id "$session_id" 'select(.id == $id) | .thread_name' "$codex_home/session_index.jsonl" 2>/dev/null | tail -n 1)"
fi

rollout_rel="sessions/by-id/$session_id/rollout.jsonl"

jq -n \
  --arg schema_version "1" \
  --arg synced_at "$synced_at" \
  --arg session_id "$session_id" \
  --arg thread_name "$thread_name" \
  --arg cwd "$cwd" \
  --arg model "$model" \
  --arg turn_id "$turn_id" \
  --arg source_codex_home "$codex_home" \
  --arg source_rollout_path "$rollout_path" \
  --arg rollout_path "$rollout_rel" \
  --arg native_rollout_path "$native_rollout_rel" \
  '{schema_version:$schema_version,synced_at:$synced_at,session_id:$session_id,thread_name:$thread_name,cwd:$cwd,model:$model,turn_id:$turn_id,source:{codex_home:$source_codex_home,rollout_path:$source_rollout_path},files:{rollout:$rollout_path,native_rollout:$native_rollout_path}}' \
  > "$session_root/manifest.json"

jq -c . "$session_root/manifest.json" >> "$archive_root/index.jsonl"

if [[ -n "$thread_name" ]]; then
  jq -c -n --arg id "$session_id" --arg thread_name "$thread_name" --arg updated_at "$synced_at" \
    '{id:$id,thread_name:$thread_name,updated_at:$updated_at}' >> "$archive_root/session_index.jsonl"
fi

jq -n \
  --arg synced_at "$synced_at" \
  --arg session_id "$session_id" \
  --arg cwd "$cwd" \
  --arg rollout_path "$rollout_path" \
  '{synced_at:$synced_at,status:"ok",session_id:$session_id,cwd:$cwd,rollout_path:$rollout_path}' \
  >> "$archive_root/logs/sync.jsonl"

log "synced $session_id to $archive_root"
exit 0
