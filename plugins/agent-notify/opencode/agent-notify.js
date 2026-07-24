import path from "node:path"
import { fileURLToPath } from "node:url"

const pluginDirectory = path.dirname(fileURLToPath(import.meta.url))
const pluginRoot = process.env.AGENT_NOTIFY_ROOT || path.resolve(pluginDirectory, "..")
const assetsDir = path.join(pluginRoot, "assets")
const notifyScript = path.join(pluginRoot, "bin", "agent-notify")

async function notify($, kind, event, directory, worktree) {
  const payload = {
    cwd: worktree || directory,
    last_assistant_message: kind === "stop" ? "OpenCode 当前回合已结束" : undefined,
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

export const AgentNotifyOpenCode = async ({ $, directory, worktree }) => {
  return {
    event: async ({ event }) => {
      if (!event || !event.type) return

      try {
        if (event.type === "session.idle") {
          await notify($, "stop", event, directory, worktree)
          return
        }

        // OpenCode 1.18.x 使用 permission.updated；文档示例里的 permission.asked 做兼容。
        if (event.type === "permission.updated" || event.type === "permission.asked") {
          await notify($, "permission", event, directory, worktree)
        }
      } catch {
        // 通知失败不阻断主会话
      }
    },
  }
}
