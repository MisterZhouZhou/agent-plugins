import path from "node:path"
import { fileURLToPath } from "node:url"

const pluginDirectory = path.dirname(fileURLToPath(import.meta.url))
const pluginRoot = process.env.AGENT_NOTIFY_ROOT || path.resolve(pluginDirectory, "..")
const assetsDir = path.join(pluginRoot, "assets")
const notifyScript = path.join(pluginRoot, "bin", "agent-notify")
const messageCacheLimit = 40
const sessionQueryRetryDelayMs = 80
const assistantInfoByMessageId = new Map()
const textByMessageId = new Map()
const lastAssistantMessageBySession = new Map()
const sessionErrorBySession = new Map()

function trimMap(map) {
  while (map.size > messageCacheLimit) {
    map.delete(map.keys().next().value)
  }
}

function usableProjectPath(value) {
  if (typeof value !== "string") return ""
  const candidate = value.trim()
  if (!candidate || candidate === path.parse(candidate).root) return ""
  return candidate
}

function resolveCwd(directory, worktree, project) {
  return (
    usableProjectPath(worktree) ||
    usableProjectPath(project && project.worktree) ||
    usableProjectPath(directory) ||
    worktree ||
    directory ||
    (project && project.worktree) ||
    process.cwd()
  )
}

function errorText(error) {
  if (!error) return ""
  const message =
    (error.data && typeof error.data.message === "string" && error.data.message.trim()) ||
    (typeof error.message === "string" && error.message.trim()) ||
    (typeof error.name === "string" && error.name.trim())
  return message ? `OpenCode 回复失败：${message}` : "OpenCode 回复失败"
}

function rememberMessage(info) {
  if (!info || typeof info.sessionID !== "string") return
  sessionErrorBySession.delete(info.sessionID)
  if (info.role !== "assistant" || typeof info.id !== "string") return
  assistantInfoByMessageId.set(info.id, info)
  lastAssistantMessageBySession.set(info.sessionID, info.id)
  trimMap(assistantInfoByMessageId)
}

function rememberTextPart(part) {
  if (!part || part.type !== "text" || typeof part.messageID !== "string") return
  if (typeof part.text === "string") {
    textByMessageId.set(part.messageID, part.text)
    trimMap(textByMessageId)
  }
}

function rememberTextDelta(properties) {
  if (
    !properties ||
    properties.field !== "text" ||
    typeof properties.messageID !== "string" ||
    typeof properties.delta !== "string"
  ) return
  const text = textByMessageId.get(properties.messageID) || ""
  textByMessageId.set(properties.messageID, text + properties.delta)
  trimMap(textByMessageId)
}

function rememberSessionError(properties) {
  if (!properties || typeof properties.sessionID !== "string" || !properties.error) return
  sessionErrorBySession.set(properties.sessionID, properties.error)
  trimMap(sessionErrorBySession)
}

function messageText(message) {
  const parts = message && Array.isArray(message.parts) ? message.parts : []
  return parts
    .filter((part) => part && part.type === "text" && typeof part.text === "string")
    .map((part) => part.text)
    .join("\n")
    .trim()
}

function latestAssistantText(messages) {
  if (!Array.isArray(messages)) return ""
  const message = [...messages]
    .reverse()
    .find((item) => item && item.info && item.info.role === "assistant")
  if (!message) return ""
  return messageText(message) || errorText(message.info.error)
}

function cachedAssistantText(event) {
  const sessionID = event && event.properties && event.properties.sessionID
  const messageID = lastAssistantMessageBySession.get(sessionID)
  const text = textByMessageId.get(messageID)
  if (typeof text === "string" && text.trim()) return text
  const info = assistantInfoByMessageId.get(messageID)
  return errorText(info && info.error) || errorText(sessionErrorBySession.get(sessionID))
}

function wait(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds))
}

async function assistantText(client, event, directory) {
  const sessionID = event && event.properties && event.properties.sessionID
  if (client && sessionID) {
    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        const result = await client.session.messages({
          path: { id: sessionID },
          query: { directory },
        })
        const messages = Array.isArray(result) ? result : result && result.data
        const text = latestAssistantText(messages)
        if (text) return text
      } catch {
        // Retry once, then fall back to the event cache.
      }
      if (attempt === 0) await wait(sessionQueryRetryDelayMs)
    }
  }
  return cachedAssistantText(event) || "OpenCode 未获取到本回合回复内容"
}

async function notify($, kind, event, directory, worktree, project, client) {
  const payload = {
    cwd: resolveCwd(directory, worktree, project),
    last_assistant_message:
      kind === "stop" ? await assistantText(client, event, directory) : undefined,
    message: kind === "permission" ? "OpenCode 正在等待你的确认" : undefined,
    source_event_type: event && event.type,
  }

  // Bun Shell 的 stdin 是 WritableStream，不能当函数调用。
  // 用环境变量传 payload，避免管道兼容问题。
  await $`python3 ${notifyScript} opencode ${kind}`
    .env({
      ...process.env,
      AGENT_NOTIFY_ICON_DIR: assetsDir,
      AGENT_NOTIFY_PAYLOAD: JSON.stringify(payload),
    })
    .quiet()
    .nothrow()
}

export const AgentNotifyOpenCode = async ({ $, directory, worktree, project, client }) => {
  return {
    event: async ({ event }) => {
      if (!event || !event.type) return

      try {
        if (event.type === "message.updated") {
          rememberMessage(event.properties && event.properties.info)
          return
        }

        if (event.type === "message.part.updated") {
          rememberTextPart(event.properties && event.properties.part)
          return
        }

        if (event.type === "message.part.delta") {
          rememberTextDelta(event.properties)
          return
        }

        if (event.type === "session.error") {
          rememberSessionError(event.properties)
          return
        }

        if (event.type === "session.idle") {
          await notify($, "stop", event, directory, worktree, project, client)
          return
        }

        // OpenCode 1.18.x 使用 permission.updated；文档示例里的 permission.asked 做兼容。
        if (event.type === "permission.updated" || event.type === "permission.asked") {
          await notify($, "permission", event, directory, worktree, project, client)
        }
      } catch {
        // 通知失败不阻断主会话
      }
    },
  }
}
