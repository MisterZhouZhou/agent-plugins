## When to use this reference

Use this reference whenever the user wants to:

- Build or maintain a cross-platform desktop application with Electron.
- Work with the main process, renderer process, preload scripts, or IPC.
- Create and manage `BrowserWindow` instances.
- Add native menus or window-level desktop behavior.
- Package and distribute an Electron application.
- Reference Electron `app` or `BrowserWindow` API details.

## How to use this reference

This reference follows the `electron` section from `skills/electron-skills` in the upstream full-stack-skills repository. Identify the user's topic, then load only the matching file.

### Getting started

- `examples/getting-started/installation.md` - installing Electron and project setup.
- `examples/getting-started/quick-start.md` - minimal Electron app flow.

### Processes

- `examples/processes/main-process.md` - main process responsibilities and lifecycle.
- `examples/processes/ipc-communication.md` - IPC patterns between main and renderer.
- `templates/main-process.md` - reusable main process template.
- `templates/preload-script.md` - preload script template with safe exposed APIs.

### API examples

- `examples/api/browser-window.md` - creating and configuring windows.
- `examples/api/menu.md` - application menus and context menus.

### Advanced

- `examples/advanced/packaging.md` - packaging and distribution guidance.

### API reference

- `api/app.md` - `app` module API notes.
- `api/browser-window.md` - `BrowserWindow` API notes.

## Practical rules

- Keep privileged code in the main process or preload; expose a narrow, typed surface to renderer code.
- Use preload plus `contextBridge` for renderer access to native capabilities.
- Prefer request/response IPC with `ipcMain.handle` and `ipcRenderer.invoke` when the renderer expects a result.
- Keep production loading paths separate from development dev-server URLs.
- Verify packaging config, native dependencies, icons, signing, and platform-specific behavior before release.

## Keywords

Electron, desktop app, main process, renderer process, preload, IPC, BrowserWindow, Menu, packaging, electron-forge, electron-builder, cross-platform, 桌面应用, 主进程, 渲染进程, 预加载脚本, 打包
