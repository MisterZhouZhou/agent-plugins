---
name: safari-web-extension
description: Build, modify, and debug Safari Web Extensions and their Xcode host projects. Use when Codex needs to create or update `manifest.json`, popup/content/background scripts, storage/tabs/scripting logic, extension icons, `xcrun safari-web-extension-converter` workflows, Safari enablement steps, or troubleshoot Safari-specific issues such as Web Inspector limitations, `file:///` route mapping, clipboard behavior in popup, and converter overwrite risks.
---

# Safari Web Extension

Follow this workflow to implement Safari Web Extensions with minimal rework and with Safari-specific constraints handled explicitly.

## Workflow

## 1. Identify the real execution surface

Classify the user scenario before writing code:

1. Safari 普通标签页
2. 本机 `file:///` 页面
3. iPhone/iPad 上 Safari 页面
4. Safari Web 检查器窗口
5. iOS App 内嵌 `WKWebView` 的远程调试目标

If the request targets 4 or 5, state the boundary early:

- Safari Web Extension cannot directly control the Web Inspector window.
- Safari Web Extension cannot directly read the remote debugging target URL unless it is actually running inside that page context.

For concrete limitations and recovery patterns, read [pitfalls.md](references/pitfalls.md).

## 2. Treat WebExtensionSource as the source of truth

Implement and review changes in the standard Web extension layer first:

- `manifest.json`
- popup pages
- content/background scripts
- icons

Do not start by editing native Swift/Obj-C shells unless the task is explicitly native.

## 3. Design URL transformation rules by protocol

Handle URLs conservatively:

- For `http://` and `https://`, replace only the protocol/domain part and preserve path, query, and hash unless the user explicitly wants a different rewrite rule.
- For `file:///`, do not assume the local path should be preserved. In Safari debugging scenarios, the correct behavior is often to discard the local file path and keep only the hash route.

If the user says “只替换域名”, verify whether they also expect `file:///...#/route` to become `http://host/#/route`. In most real cases, they do.

See [workflow.md](references/workflow.md) for the full decision sequence.

## 4. Implement Safari-friendly popup interactions

When popup actions involve copying or other privileged actions:

- Separate “生成结果” from “复制”
- Prefer a second explicit click for copying
- Keep generated text visible in a textarea as fallback
- On copy failure, select the textarea and instruct the user to press `Command+C`

Do not rely on a long async chain ending in `navigator.clipboard.writeText()`; Safari popup clipboard behavior is fragile.

## 5. Retrieve current page URL defensively

When the extension needs the current URL:

1. Query the active tab with `tabs.query`
2. If `tab.url` is unavailable, use `scripting.executeScript(() => window.location.href)` as a fallback
3. If both fail, explain that the extension likely is not running in a page context it can access

Declare only the permissions actually needed, but Safari extension tasks commonly need:

- `activeTab`
- `tabs`
- `storage`
- `scripting`

## 6. Handle Xcode converter usage carefully

Use `xcrun safari-web-extension-converter` for initialization, not as a blind sync tool.

Preferred approach:

1. Maintain Web extension source in a standalone folder.
2. Run converter once to initialize the Xcode host project.
3. After native edits exist, manually sync Web resource changes into the Xcode project, or regenerate into a new directory and merge intentionally.

Warn the user that rerunning converter on an actively modified Xcode project may overwrite native code or project configuration.

## 7. Deliver complete operating instructions

When finishing a Safari Web Extension task, include:

1. The Web extension source files created or modified
2. The exact `xcrun safari-web-extension-converter` command
3. Xcode signing and run steps
4. Safari enablement path
5. Any Safari-specific capability boundary that affects the requested behavior

## References

- Read [workflow.md](references/workflow.md) for the standard end-to-end build process.
- Read [pitfalls.md](references/pitfalls.md) for Safari-specific failure modes and design traps.
