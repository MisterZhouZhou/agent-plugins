# OpenCode Events And Bun Shell

## Lifecycle events

| Intent | OpenCode event | Notes |
|---|---|---|
| Completion / idle | `session.idle` | Fires after successful idle; stream failures may never idle |
| Permission waiting | `permission.updated` | Observed on 1.18.x SDK/types |
| Permission waiting (docs) | `permission.asked` | Listen to both for compatibility |
| Permission answered | `permission.replied` | Optional follow-up |
| Session error | `session.error` | Optional error toast |
| Tool before/after | `tool.execute.before` / `tool.execute.after` | |

## Minimal event adapter

```js
export const AgentNotifyOpenCode = async ({ $, directory, worktree }) => ({
  event: async ({ event }) => {
    if (!event?.type) return
    try {
      if (event.type === "session.idle") {
        await notify($, "stop", event, directory, worktree)
        return
      }
      if (event.type === "permission.updated" || event.type === "permission.asked") {
        await notify($, "permission", event, directory, worktree)
      }
    } catch {
      // never break the main session for toast failures
    }
  },
})
```

Prefer `worktree || directory` for project context.

### Permission-event idempotency

Listening to both permission event names is a compatibility strategy, not an
invitation to notify twice. If a runtime emits both for the same request:

1. Prefer a stable permission/request id from the event payload as the dedupe key.
2. Include the session id when ids are only session-local.
3. Keep a small in-memory set with bounded expiry; do not persist it across runs.
4. If the installed version exposes only one event, no dedupe work is needed.

Do not dedupe solely by message text; separate permission requests can have the
same description.

## Bun Shell pitfalls

`$` is Bun Shell, not Node `child_process`.

```js
// WRONG — stdin is a WritableStream, not a function
await $`python3 script.py`.stdin(JSON.stringify(payload))

// RIGHT — env payload
await $`python3 ${scriptPath} opencode stop`
  .env({
    ...process.env,
    AGENT_NOTIFY_ICON_DIR: assetsDir,
    AGENT_NOTIFY_PAYLOAD: JSON.stringify(payload),
  })
  .quiet()
  .nothrow()
```

Useful helpers:

- `.env({...})`
- `.quiet()`
- `.nothrow()`
- `.cwd(path)`

Shared binaries should accept env payload **or** stdin JSON for Claude/Codex compatibility.

## Failure modes

| Symptom | Cause | Fix |
|---|---|---|
| Manual binary works; idle silent | Used `.stdin(...)` | Switch to env payload |
| Plugin listed; no toast | Model stream failed/aborted | Test successful short reply |
| Permission silent | Only `permission.asked` | Also handle `permission.updated` |
| Duplicate toasts | Legacy `notification.ts` still loaded | Disable legacy explicitly |
| Wrong project name | Used `directory` only | Prefer `worktree` |
