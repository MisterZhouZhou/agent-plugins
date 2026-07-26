import assert from "node:assert/strict"
import test from "node:test"
import { pathToFileURL } from "node:url"

const pluginUrl = pathToFileURL(
  new URL("./agent-notify.js", import.meta.url).pathname,
).href

function captureShell() {
  const calls = []
  const $ = (strings, ...values) => {
    const call = { strings, values, env: undefined }
    calls.push(call)
    const command = {
      env(value) {
        call.env = value
        return command
      },
      quiet() {
        return command
      },
      nothrow() {
        return Promise.resolve({ exitCode: 0 })
      },
    }
    return command
  }
  return { $, calls }
}

async function createHooks(name, client) {
  const { AgentNotifyOpenCode } = await import(`${pluginUrl}?test=${name}-${Date.now()}`)
  const shell = captureShell()
  const hooks = await AgentNotifyOpenCode({
    $: shell.$,
    directory: "/tmp/project",
    worktree: "/tmp/project",
    project: { worktree: "/tmp/project" },
    client,
  })
  return { hooks, calls: shell.calls }
}

function payload(calls) {
  assert.equal(calls.length, 1)
  return JSON.parse(calls[0].env.AGENT_NOTIFY_PAYLOAD)
}

test("uses the latest assistant text returned by the session query", async () => {
  const client = {
    session: {
      messages: async () => ({
        data: [
          {
            info: { id: "assistant-1", sessionID: "session-1", role: "assistant" },
            parts: [{ type: "text", text: "本回合真实回复" }],
          },
        ],
      }),
    },
  }
  const { hooks, calls } = await createHooks("query-text", client)

  await hooks.event({ event: { type: "session.idle", properties: { sessionID: "session-1" } } })

  assert.equal(payload(calls).last_assistant_message, "本回合真实回复")
})

test("does not show an older reply when the latest assistant failed", async () => {
  const client = {
    session: {
      messages: async () => ({
        data: [
          {
            info: { id: "assistant-old", sessionID: "session-2", role: "assistant" },
            parts: [{ type: "text", text: "旧回复" }],
          },
          {
            info: {
              id: "assistant-new",
              sessionID: "session-2",
              role: "assistant",
              error: { name: "APIError", data: { message: "Forbidden" } },
            },
            parts: [],
          },
        ],
      }),
    },
  }
  const { hooks, calls } = await createHooks("latest-error", client)

  await hooks.event({ event: { type: "session.idle", properties: { sessionID: "session-2" } } })

  assert.equal(payload(calls).last_assistant_message, "OpenCode 回复失败：Forbidden")
})

test("keeps text when message.part.updated arrives before message.updated", async () => {
  const client = { session: { messages: async () => { throw new Error("offline") } } }
  const { hooks, calls } = await createHooks("out-of-order", client)

  await hooks.event({
    event: {
      type: "message.part.updated",
      properties: {
        part: {
          type: "text",
          sessionID: "session-3",
          messageID: "assistant-3",
          text: "乱序事件中的回复",
        },
      },
    },
  })
  await hooks.event({
    event: {
      type: "message.updated",
      properties: {
        info: { id: "assistant-3", sessionID: "session-3", role: "assistant" },
      },
    },
  })
  await hooks.event({ event: { type: "session.idle", properties: { sessionID: "session-3" } } })

  assert.equal(payload(calls).last_assistant_message, "乱序事件中的回复")
})

test("uses message.part.delta as a cache fallback", async () => {
  const client = { session: { messages: async () => { throw new Error("offline") } } }
  const { hooks, calls } = await createHooks("delta", client)

  await hooks.event({
    event: {
      type: "message.updated",
      properties: {
        info: { id: "assistant-4", sessionID: "session-4", role: "assistant" },
      },
    },
  })
  for (const delta of ["增量", "回复"]) {
    await hooks.event({
      event: {
        type: "message.part.delta",
        properties: {
          sessionID: "session-4",
          messageID: "assistant-4",
          partID: "part-4",
          field: "text",
          delta,
        },
      },
    })
  }
  await hooks.event({ event: { type: "session.idle", properties: { sessionID: "session-4" } } })

  assert.equal(payload(calls).last_assistant_message, "增量回复")
})

test("retries the session query once when messages are temporarily empty", async () => {
  let callsToMessages = 0
  const client = {
    session: {
      messages: async () => {
        callsToMessages += 1
        if (callsToMessages === 1) return { data: [] }
        return {
          data: [
            {
              info: { id: "assistant-5", sessionID: "session-5", role: "assistant" },
              parts: [{ type: "text", text: "重试后读取到的回复" }],
            },
          ],
        }
      },
    },
  }
  const { hooks, calls } = await createHooks("retry", client)

  await hooks.event({ event: { type: "session.idle", properties: { sessionID: "session-5" } } })

  assert.equal(callsToMessages, 2)
  assert.equal(payload(calls).last_assistant_message, "重试后读取到的回复")
})

test("uses session.error when no assistant text exists", async () => {
  const client = { session: { messages: async () => ({ data: [] }) } }
  const { hooks, calls } = await createHooks("session-error", client)

  await hooks.event({
    event: {
      type: "session.error",
      properties: {
        sessionID: "session-6",
        error: { name: "APIError", data: { message: "模型服务不可用" } },
      },
    },
  })
  await hooks.event({ event: { type: "session.idle", properties: { sessionID: "session-6" } } })

  assert.equal(payload(calls).last_assistant_message, "OpenCode 回复失败：模型服务不可用")
})

test("uses an explicit missing-content fallback instead of claiming the turn ended", async () => {
  const client = { session: { messages: async () => ({ data: [] }) } }
  const { hooks, calls } = await createHooks("missing-content", client)

  await hooks.event({ event: { type: "session.idle", properties: { sessionID: "session-7" } } })

  assert.equal(payload(calls).last_assistant_message, "OpenCode 未获取到本回合回复内容")
})
