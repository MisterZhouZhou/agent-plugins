---
name: rust-desktop
description: |
  Rust 桌面端开发技能，基于 Tauri v2 框架。当用户想要创建、初始化、配置、打包或发布 Rust/Tauri 桌面应用程序时触发。
  默认使用官方 Tauri CLI 创建 React + TypeScript 项目，并按用户选择补充前端依赖、国际化、主题、自动更新、打包发布和 GitHub Workflows。
compatibility: |
  - Rust toolchain (rustup, cargo)
  - Node.js 18+
  - npm 9+
  - Tauri CLI v2
---

# Rust 桌面端开发 Skill

本 skill 参考 `jlcodes99/cockpit-tools` 的通用配置风格，但不复制业务代码。目标是用官方 Tauri CLI 创建项目，然后用本 skill 的 `templates/` 目录补齐可复用配置。

## 核心规则

1. 创建项目必须使用官方 CLI：`npm create tauri-app@latest`，禁止手写项目骨架替代。
2. 初始化时保持轻量：只询问项目名和“需要哪些可选能力”。
3. 基础配置默认添加：React、TypeScript、Vite、Tauri、Tailwind CSS v4、DaisyUI v5、clsx、tailwind-merge、版本同步脚本、基础主题色。
4. 可复制文件模板必须优先来自 `templates/`，不要从 `SKILL.md` 正文临时拼大段代码。
5. 修改后至少运行 `npm run typecheck` 和 `npm run build`；打包冒烟优先运行 `npm run package:app`。
6. 默认使用最新模板轨道。只有用户明确要求 Tailwind v3、DaisyUI v4、PostCSS 或旧版兼容时，才使用 `templates/legacy-tailwind3/`。

## 初始化问题

如果用户没有给项目名，先问项目名。然后只问一个能力选择问题：

```text
需要添加哪些可选能力？直接输入序号，空格或逗号分隔；输入 n 使用基础配置。

1. 国际化 i18next + react-i18next
2. 日期处理 date-fns
3. 状态管理 zustand
4. 图标 lucide-react
5. 自动更新 @tauri-apps/plugin-updater + tauri-plugin-updater
6. 文件系统 @tauri-apps/plugin-fs + tauri-plugin-fs
7. 对话框 @tauri-apps/plugin-dialog + tauri-plugin-dialog
8. 进程管理 @tauri-apps/plugin-process + tauri-plugin-process
9. 系统通知 @tauri-apps/plugin-notification + tauri-plugin-notification
10. 系统托盘 tray-icon
11. 自动启动 tauri-plugin-autostart
12. 深链接 tauri-plugin-deep-link + single-instance
13. 打包发布配置 bundles + updater artifacts
14. GitHub Workflows 构建矩阵 + tag release
```

## 官方 CLI 创建项目

在目标目录运行：

```bash
npm create tauri-app@latest my-app -- --template react-ts --manager npm
cd my-app
npm install
```

注意：`create-tauri-app` 需要 TTY。代理执行时要用可交互终端运行；如果 CLI 继续询问 `Identifier`，直接使用默认值，除非用户明确提供了应用标识符。

## 依赖安装

基础依赖：

```bash
npm install clsx tailwind-merge
npm install -D "tailwindcss@^4" "@tailwindcss/vite@^4" "daisyui@^5.5.14" typescript
```

默认模板使用 Tailwind v4 的 `@tailwindcss/vite` 插件和 DaisyUI v5 的 CSS `@plugin` 集成方式。不要复制 `tailwind.config.cjs` 或 `postcss.config.cjs`，否则会把项目混回 Tailwind v3 配置模型。

旧版兼容依赖仅在用户明确要求时使用：

```bash
npm install clsx tailwind-merge "daisyui@^4.12.24"
npm install -D "tailwindcss@^3.4.19" postcss autoprefixer typescript
```

按用户选择追加：

```bash
npm install i18next react-i18next
npm install date-fns
npm install zustand
npm install lucide-react
npm install @tauri-apps/plugin-updater @tauri-apps/plugin-dialog @tauri-apps/plugin-fs @tauri-apps/plugin-process @tauri-apps/plugin-notification
```

Rust 侧依赖参考 `templates/tauri/cargo-dependencies.toml`，只添加用户选择的插件和功能，避免把所有可选依赖一次性塞进 `Cargo.toml`。

## 模板索引

基础模板：

- `templates/package/scripts.json`：推荐 `package.json` scripts，包含 typecheck、build、tauri、package、sync-version。
- `templates/config/vite.config.ts`：Tailwind v4 的 Vite 插件配置，合并到官方 CLI 生成的 `vite.config.ts`。
- `templates/frontend/App.tsx`：使用 DaisyUI 组件类的默认首页，替换官方 CLI 的裸样式示例页。
- `templates/frontend/index.css`：Tailwind v4 + DaisyUI v5 入口和 `appLight/appDark` 主题。
- `templates/scripts/sync-version.js`：把 `package.json` 版本同步到 `tauri.conf.json` 和 `Cargo.toml`。
- `templates/tauri/tauri.conf.base.json`：基础 Tauri 配置参考。

旧版兼容模板：

- `templates/legacy-tailwind3/config/tailwind.config.cjs`：Tailwind v3 + DaisyUI v4 主题配置。
- `templates/legacy-tailwind3/config/postcss.config.cjs`：PostCSS + Autoprefixer 配置。
- `templates/legacy-tailwind3/frontend/index.css`：Tailwind v3 入口和主题 CSS 变量。

前端能力模板：

- `templates/frontend/i18n/index.ts`：i18next 初始化。
- `templates/frontend/locales/en.json`：英文文案。
- `templates/frontend/locales/zh-CN.json`：中文文案。
- `templates/frontend/utils/theme.ts`：浅色、深色、跟随系统主题。
- `templates/frontend/utils/cn.ts`：clsx + tailwind-merge 工具。
- `templates/frontend/stores/useAppStore.ts`：zustand 基础 store。

Tauri 和发布模板：

- `templates/tauri/tauri.conf.bundle-fragment.json`：bundle targets、描述、updater artifacts 开关。
- `templates/tauri/tauri.conf.updater-fragment.json`：自动更新配置片段。
- `templates/tauri/cargo-dependencies.toml`：常用 Rust/Tauri 依赖清单。
- `templates/github/build.yml`：GitHub Actions 构建矩阵。
- `templates/github/release.yml`：GitHub tag release 工作流。

## 模板落盘规则

按目标路径复制模板：

- `templates/config/vite.config.ts` → 合并到 `vite.config.ts`，保留 Tauri 的 `server`、`hmr`、`watch` 配置，并加入 `@tailwindcss/vite`
- `templates/frontend/App.tsx` → `src/App.tsx`
- `templates/frontend/index.css` → `src/index.css`
- `templates/scripts/sync-version.js` → `scripts/sync-version.js`
- `templates/frontend/i18n/index.ts` → `src/i18n/index.ts`
- `templates/frontend/locales/*.json` → `src/locales/`
- `templates/frontend/utils/*.ts` → `src/utils/`
- `templates/frontend/stores/useAppStore.ts` → `src/stores/useAppStore.ts`
- `templates/github/build.yml` → `.github/workflows/build.yml`
- `templates/github/release.yml` → `.github/workflows/release.yml`

合并型模板不要直接覆盖用户文件：

- `templates/config/vite.config.ts`：合并到官方 CLI 的 `vite.config.ts`，重点是添加 `import tailwindcss from "@tailwindcss/vite";` 和 `plugins: [react(), tailwindcss()]`。
- `templates/package/scripts.json`：合并到现有 `package.json.scripts`。
- `templates/tauri/tauri.conf.base.json`：用于初始化或对照修改 `src-tauri/tauri.conf.json`。
- `templates/tauri/tauri.conf.bundle-fragment.json`：合并到 `src-tauri/tauri.conf.json.bundle`。
- `templates/tauri/tauri.conf.updater-fragment.json`：合并到 `src-tauri/tauri.conf.json`，并替换 pubkey/endpoints。
- `templates/tauri/cargo-dependencies.toml`：按需合并到 `src-tauri/Cargo.toml`。

旧版兼容落盘规则：

- 只有用户明确要求 Tailwind v3、DaisyUI v4、PostCSS、Autoprefixer 或旧版兼容时，才复制 `templates/legacy-tailwind3/config/tailwind.config.cjs` → `tailwind.config.cjs`。
- 只有旧版兼容模式才复制 `templates/legacy-tailwind3/config/postcss.config.cjs` → `postcss.config.cjs`。
- 旧版兼容模式使用 `templates/legacy-tailwind3/frontend/index.css` → `src/index.css`。
- 最新默认模式不得创建 `tailwind.config.cjs` 或 `postcss.config.cjs`。

## 必要接线

应用基础模板后，确认：

- `src/main.tsx` 引入 `./index.css`。
- 默认最新版模板下，`vite.config.ts` 已启用 `@tailwindcss/vite`。
- 默认最新版模板下，项目根目录没有 `tailwind.config.cjs` 和 `postcss.config.cjs`。
- 默认首页必须使用 DaisyUI/Tailwind 组件类，例如 `btn`、`input`、`card`、`navbar`，不要保留官方 CLI 的 `App.css` 裸样式示例。
- 选择国际化时，`src/main.tsx` 引入 `./i18n`。
- 选择主题时，在应用启动时调用 `applyTheme(getSavedTheme())`，或通过 zustand store 统一处理。
- 选择 updater 时，Rust `tauri::Builder` 注册 `tauri_plugin_updater::Builder::new().build()`。
- 选择 dialog/fs/process/notification 时，同时配置 Rust 插件、前端依赖和 `src-tauri/capabilities/default.json` 权限。

## 打包和 CI

本地打包：

```bash
npm run package:app
npm run package
```

本地冒烟测试优先运行 `npm run package:app`，它只验证 `.app` 目标，能避开部分沙箱、无 GUI、磁盘镜像挂载受限环境里的 DMG 失败。完整安装包和 DMG 用 `npm run package` 或 GitHub Actions 验证。

GitHub Workflows：

- 选择能力 14 时复制 `templates/github/build.yml` 和 `templates/github/release.yml`。
- 开启自动更新签名时，在仓库 Secrets 配置 `TAURI_SIGNING_PRIVATE_KEY` 和 `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`。
- release workflow 默认通过 `v*` tag 触发，并校验 tag 与 `package.json.version` 一致。

## 验证命令

每次初始化或添加能力后执行：

```bash
npm run typecheck
npm run build
```

桌面冒烟：

```bash
npm run tauri:dev
npm run package:app
```

## 参考文档

- `references/frontend-stack.md`：前端依赖和能力说明。
- `references/tauri-v2-template.md`：Tauri 配置、打包发布和 GitHub Workflows 说明。
- `references/rust-modules.md`：Rust 模块划分和 commands 调用规范。
