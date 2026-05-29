---
name: electron-skills
description: Electron 桌面应用专项开发技能。用于创建、维护、迁移或排查 Electron 与 electron-egg 项目，覆盖主进程、渲染进程、preload、IPC、BrowserWindow、菜单、打包、配置、升级链路与安全实践；详细文档按 full-stack-skills 的 electron-skills 目录结构存放在 references/。
---

# Electron Skills

## 使用场景

当用户需要处理 Electron 桌面应用时使用本技能，尤其是：

- 新建或改造 Electron 跨平台桌面应用。
- 设计主进程、渲染进程、preload 与 IPC 通信边界。
- 配置 BrowserWindow、菜单、窗口生命周期、应用启动与退出行为。
- 使用 Electron Forge、electron-builder 或项目已有打包流程发布应用。
- 维护 electron-egg 项目，处理配置、路由、窗口、IPC、构建和前后端工程结构。
- 实现或排查 upgradeLink 自动升级、版本检测、下载与安装链路。

## 工作流

1. 先识别项目类型和版本：查看 `package.json`、Electron 入口、preload 文件、构建工具、框架目录和打包配置。
2. 优先沿用项目已有模式：模块系统、进程拆分、IPC 命名、窗口管理、配置文件、日志和错误处理方式。
3. 根据任务读取最相关的引用文档，避免一次加载所有内容。
4. 实现时保持进程边界清楚：系统能力留在主进程或 preload 暴露的窄 API 内，渲染进程只调用受控接口。
5. 完成后运行项目已有的类型检查、lint、测试、构建或打包命令；涉及界面时启动应用并检查关键窗口行为。

## 文档结构

详细文档按参考仓库 `skills/electron-skills` 的目录结构沉淀在 `references/`：

```text
references/
  electron/
  electron-egg/
  upgradeLink/
```

## 引用文档导航

先读对应子目录的 `overview.md`，再按它的映射继续读取 `examples/`、`api/`、`templates/` 中的细分文档。

- Electron 官方开发、主进程、BrowserWindow、菜单、IPC、打包和 preload 模板：读 [references/electron/overview.md](references/electron/overview.md)。
- electron-egg 项目结构、配置、主进程、渲染进程、IPC、窗口和构建：读 [references/electron-egg/overview.md](references/electron-egg/overview.md)。
- upgradeLink 自动升级链路、基础使用和接入说明：读 [references/upgradeLink/overview.md](references/upgradeLink/overview.md)。

## 决策规则

- 新 Electron 代码默认启用 `contextIsolation`，禁用渲染进程 `nodeIntegration`，通过 preload 暴露最小 API。
- IPC 通道要按领域命名并限制参数形状；优先使用 `ipcMain.handle` / `ipcRenderer.invoke` 处理请求响应式调用。
- 主进程负责原生能力、窗口生命周期、菜单、文件系统和系统集成；渲染进程负责 UI 状态与交互。
- 多窗口应用要集中管理窗口创建、销毁、聚焦和恢复逻辑，避免在业务组件里散落 `BrowserWindow` 操作。
- 打包配置要区分开发、测试和生产环境，确认图标、签名、asar、原生依赖和目标平台差异。
- electron-egg 项目优先遵循框架约定目录和配置入口，不要把原生 Electron 写法硬塞进框架抽象之外。
- 涉及升级链路时要验证版本比较、下载失败、断点/重试、校验、安装权限和回滚提示。

## 常用核查

- 安全：不要把 `ipcRenderer`、`require`、文件系统或 shell 能力直接暴露给页面。
- 生命周期：`app.whenReady()` 后创建窗口；macOS 激活、所有窗口关闭、二次启动等平台行为要单独处理。
- 资源管理：窗口、事件监听器、定时器、下载任务和子进程要在关闭时清理。
- IPC：主进程处理异常并返回可解释错误；渲染进程不要假设调用一定成功。
- 打包：确认生产入口加载本地文件或构建产物，开发入口加载 dev server；不要把开发 URL 写死到生产包。
- 质量：优先运行 `npm run type-check`、`npm run lint`、`npm test`、`npm run build`、`npm run package` 中项目已定义的命令。
