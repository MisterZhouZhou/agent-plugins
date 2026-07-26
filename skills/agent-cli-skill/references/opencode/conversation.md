# OpenCode Conversation Content

## Choose the interface first

OpenCode exposes several different interfaces. They are not interchangeable:

| Need | Correct interface |
|---|---|
| React to a live session event | Plugin `event` hook |
| Read the current session's messages | SDK client, if the installed version exposes the message endpoint |
| Retrieve an old session or message history | SDK client / OpenCode server API |
| Add a callable capability for the model | Custom tool or MCP server |
| Embed OpenCode in an editor | ACP |

The plugin event payload is primarily an event envelope. It is not a transcript
and should not be treated as a message-history API.

## Live plugin events

Use the event hook for notification, logging, and other fire-and-forget actions.
Inspect the actual payload before depending on message fields:

```js
export const InspectOpenCode = async ({ client }) => ({
  event: async ({ event }) => {
    console.log(JSON.stringify({ type: event?.type, properties: event?.properties }))
  },
})
```

For a completion notifier, `session.idle` tells you that the session became idle;
it does not guarantee that the full assistant response is embedded in the event.
If the notification needs response text, use the session id from the event to
query messages through the SDK/API when available, or keep the response in a
separate stream-aware integration.

## SDK/API history access

Before writing code, check the installed OpenCode version and SDK types. Endpoint
names and response shapes are version-sensitive. Prefer the typed client over
hard-coded HTTP requests when it provides the required operation:

```js
const sessions = await client.session.list()
const messages = await client.session.messages({ path: { id: sessionId } })
```

The exact method may differ by release. Do not assume that a method exists just
because a similar endpoint exists in another OpenCode integration. Confirm with
the installed package's type declarations or `opencode debug info`.

When querying after `session.idle`:

1. Extract and validate the session id from the event.
2. Query the message history using the installed client's documented shape.
3. Select the latest assistant message rather than assuming array order or a
   fixed event field.
4. Handle an empty result, request failure, and a session that changed again.
5. Keep notification code best-effort so a history lookup cannot break the main
   session.

Do not scrape the TUI, read internal SQLite files, or depend on undocumented
   cache files as a substitute for the SDK/API. Those approaches are brittle and
   can expose unrelated sessions.

## Reliable completion-notification content

`session.idle` is a completion signal, not a response payload. A notification
adapter that needs the current turn's assistant text should use the idle event's
`sessionID` to query the session, then keep streamed events only as a fallback:

```js
const result = await client.session.messages({
  path: { id: sessionID },
  query: { directory },
})
const messages = Array.isArray(result) ? result : result?.data
```

Use this precedence order for the notification body:

1. The newest assistant message returned by `client.session.messages(...)`.
2. Text or error state cached from live events for that same session/message.
3. An explicit no-content message such as
   `OpenCode 未获取到本回合回复内容`.

For the newest assistant message, join its text parts. If it has no text but its
`info.error` is populated, report that error. Do **not** walk backwards to an
older successful assistant message: after a model failure that would make the
notification display the previous turn's reply as though it were current.

History can briefly be empty when `session.idle` arrives before persistence is
visible. Treat an empty result and a request failure alike: wait a short bounded
delay (for example, 80 ms), retry once, and then use the event cache. Keep this
best-effort; notification failure must not interrupt the OpenCode session.

Build the fallback cache from all relevant event shapes:

| Event | Cache action |
|---|---|
| `message.updated` | Record assistant `info` and associate its `messageID` with its `sessionID` |
| `message.part.updated` | Store the complete text part by `messageID` |
| `message.part.delta` | Append text deltas by `messageID` when `field === "text"` |
| `session.error` | Store the session-level model error when no assistant text is available |

Do not require `message.updated` to arrive before `message.part.updated`. Store a
text part immediately by `messageID`; when the assistant metadata arrives, link
that existing text to its session. Bound all maps so a long-running OpenCode
process cannot grow the cache indefinitely, and clear stale session errors when
new message activity proves the session has continued.

A compact control flow is:

```text
session.idle(sessionID)
  -> query session messages
  -> retry once if empty or failed
  -> inspect newest assistant only: text, otherwise its error
  -> fall back to cached text/message error/session.error for this session
  -> otherwise emit an explicit no-content notification
```

OpenCode plugins are not hot-reloaded. After editing an installed or symlinked
adapter, fully quit and restart the OpenCode process before judging the result.

## Custom tools are not transcript readers

An OpenCode custom tool is a capability invoked by the model. It is useful for
fetching application data or sending a result to an external service, but it is
not automatically given the entire conversation. Pass only the required input
explicitly and avoid logging raw prompts or responses unless the user has opted
in.

## Troubleshooting checklist

- Identify whether the requirement is live observation, history retrieval, a
  model-callable tool, or editor embedding.
- Log one real event payload with sensitive content removed.
- Verify the installed OpenCode version and SDK/API types.
- Confirm the event contains a session id before attempting a history query.
- Test both a successful short reply and an empty/error response path.
- Treat transcript retrieval as best-effort in notification plugins.
