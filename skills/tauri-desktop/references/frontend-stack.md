# 前端技术栈参考

参考 `jlcodes99/cockpit-tools` 的依赖组合，初始化采用“基础依赖默认安装，可选能力按需添加”的方式。可复制文件模板统一放在 `templates/` 目录，不在本参考文档中重复维护。

## 默认技术栈：Tailwind v4 + DaisyUI v5

| 类别 | 技术 | 参考版本 | 用途 |
|------|------|----------|------|
| 框架 | React | ^19.1.0 | UI 框架 |
| 构建 | Vite | ^7.0.4 | 开发服务器和构建工具 |
| 类型 | TypeScript | ~5.8.3 | 类型安全 |
| 样式 | Tailwind CSS | ^4.x | 原子化 CSS |
| 样式插件 | @tailwindcss/vite | ^4.x | Vite 内集成 Tailwind v4 |
| UI 组件 | DaisyUI | ^5.5.14 | Tailwind v4 兼容的组件主题 |
| 工具类 | clsx | ^2.1.1 | 条件类名 |
| 工具类 | tailwind-merge | ^3.4.0 | Tailwind 类名合并 |

## 基础安装命令

```bash
npm install clsx tailwind-merge
npm install -D "tailwindcss@^4" "@tailwindcss/vite@^4" "daisyui@^5.5.14" typescript
```

默认模板使用 Tailwind v4 + DaisyUI v5。样式入口在 CSS 中通过 `@import "tailwindcss";` 和 `@plugin "daisyui";` 完成，不再需要 `tailwind.config.cjs`、`postcss.config.cjs`、`postcss` 或 `autoprefixer`。

## 旧版兼容技术栈

仅在用户明确要求 Tailwind v3、DaisyUI v4、PostCSS 或旧版兼容时使用：

```bash
npm install clsx tailwind-merge "daisyui@^4.12.24"
npm install -D "tailwindcss@^3.4.19" postcss autoprefixer typescript
```

旧版模板位于 `templates/legacy-tailwind3/`，使用传统 `tailwind.config.cjs` + `postcss.config.cjs` 方式。

## 可选能力

| 能力 | 依赖 | 模板 |
|------|------|------|
| 国际化 | i18next, react-i18next | `templates/frontend/i18n/index.ts`, `templates/frontend/locales/*.json` |
| 日期 | date-fns | 无模板，按业务使用 |
| 状态管理 | zustand | `templates/frontend/stores/useAppStore.ts` |
| 图标 | lucide-react | 无模板，组件中按需导入 |
| 主题 | DaisyUI + localStorage | `templates/frontend/utils/theme.ts`, `templates/frontend/index.css` |
| 类名工具 | clsx, tailwind-merge | `templates/frontend/utils/cn.ts` |

## 模板落点

| 模板 | 目标路径 |
|------|----------|
| `templates/config/vite.config.ts` | 合并到 `vite.config.ts` |
| `templates/frontend/App.tsx` | `src/App.tsx` |
| `templates/frontend/index.css` | `src/index.css` |
| `templates/frontend/i18n/index.ts` | `src/i18n/index.ts` |
| `templates/frontend/locales/en.json` | `src/locales/en.json` |
| `templates/frontend/locales/zh-CN.json` | `src/locales/zh-CN.json` |
| `templates/frontend/utils/theme.ts` | `src/utils/theme.ts` |
| `templates/frontend/utils/cn.ts` | `src/utils/cn.ts` |
| `templates/frontend/stores/useAppStore.ts` | `src/stores/useAppStore.ts` |

旧版兼容模板落点：

| 模板 | 目标路径 |
|------|----------|
| `templates/legacy-tailwind3/config/tailwind.config.cjs` | `tailwind.config.cjs` |
| `templates/legacy-tailwind3/config/postcss.config.cjs` | `postcss.config.cjs` |
| `templates/legacy-tailwind3/frontend/index.css` | `src/index.css` |

## 接线要求

- `src/main.tsx` 必须引入 `./index.css`。
- 默认最新版模板下，`vite.config.ts` 必须启用 `@tailwindcss/vite`，且不创建 `tailwind.config.cjs` / `postcss.config.cjs`。
- `src/App.tsx` 默认替换为 `templates/frontend/App.tsx`，确保首屏实际使用 DaisyUI 组件类，而不是官方 CLI 的 `App.css` 示例样式。
- 选择国际化时，`src/main.tsx` 必须引入 `./i18n`。
- 选择主题时，启动时调用 `applyTheme(getSavedTheme())`，或通过 zustand store 统一处理。
- 选择 zustand 时，不要创建未使用的 store；至少在设置页或根组件中接入主题/语言状态，避免严格 TypeScript 下未使用代码暴露问题。

## 前端目录结构建议

```text
src/
├── main.tsx
├── App.tsx
├── index.css
├── components/
│   ├── ui/
│   └── layout/
├── hooks/
├── i18n/
├── locales/
├── pages/
├── services/
├── stores/
├── styles/
├── types/
└── utils/
```
