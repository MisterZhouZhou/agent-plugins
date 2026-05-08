# 前端技术栈参考

基于 cockpit-tools 项目的完整前端技术栈。

## 核心技术栈

| 类别 | 技术 | 版本 | 用途 |
|------|------|------|------|
| 框架 | React | ^19.1.0 | UI 框架 |
| 构建 | Vite | ^7.0.4 | 开发服务器和构建工具 |
| 类型 | TypeScript | ~5.8.3 | 类型安全 |
| 样式 | Tailwind CSS | ^4.0.0 | 原子化 CSS |
| UI 组件 | DaisyUI | ^5.0.0 | Tailwind 组件库 |
| 状态管理 | zustand | ^5.0.10 | 轻量级状态管理 |
| 国际化 | i18next | ^25.7.4 | 国际化框架 |
| 图标 | lucide-react | ^0.562.0 | 图标库 |
| 日期 | date-fns | ^4.1.0 | 日期处理 |
| 工具类 | clsx | ^2.1.1 | 条件类名合并 |
| 工具类 | tailwind-merge | ^3.4.0 | Tailwind 类名合并 |

## Tauri 插件

| 插件 | 版本 | 用途 |
|------|------|------|
| @tauri-apps/api | ^2 | Tauri API |
| @tauri-apps/plugin-dialog | ^2.7.0 | 对话框 |
| @tauri-apps/plugin-fs | ^2.5.0 | 文件系统 |
| @tauri-apps/plugin-opener | ^2.5.3 | 打开链接/文件 |
| @tauri-apps/plugin-process | ^2.3.1 | 进程管理 |
| @tauri-apps/plugin-updater | ^2.10.0 | 自动更新 |

## 完整 package.json 示例

```json
{
  "name": "your-app-name",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "typecheck": "tsc --noEmit",
    "prebuild": "npm run typecheck",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "tauri": "tauri"
  },
  "dependencies": {
    "react": "^19.1.0",
    "react-dom": "^19.1.0",
    "@tauri-apps/api": "^2",
    "@tauri-apps/plugin-dialog": "^2.7.0",
    "@tauri-apps/plugin-fs": "^2.5.0",
    "@tauri-apps/plugin-opener": "^2.5.3",
    "@tauri-apps/plugin-process": "^2.3.1",
    "@tauri-apps/plugin-updater": "^2.10.0",
    "clsx": "^2.1.1",
    "daisyui": "^5.5.14",
    "date-fns": "^4.1.0",
    "i18next": "^25.7.4",
    "react-i18next": "^16.5.3",
    "tailwind-merge": "^3.4.0",
    "zustand": "^5.0.10",
    "lucide-react": "^0.562.0"
  },
  "devDependencies": {
    "@tauri-apps/cli": "^2",
    "@types/react": "^19.1.8",
    "@types/react-dom": "^19.1.6",
    "@vitejs/plugin-react": "^4.6.0",
    "@tailwindcss/vite": "^4.0.0",
    "tailwindcss": "^4.0.0",
    "typescript": "~5.8.3",
    "vite": "^7.0.4"
  }
}
```

## Tailwind + DaisyUI 配置 (v4)

### 安装

```bash
npm install -D @tailwindcss/vite tailwindcss daisyui
```

### 配置流程

1. **在 `vite.config.ts` 中添加插件**
```typescript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig(async () => ({
  plugins: [react(), tailwindcss()],
}));
```

2. **创建 `src/index.css`**
```css
@import "tailwindcss";
@plugin "daisyui";
```

3. **在 `main.tsx` 中引入**
```typescript
import './index.css';
```

### 注意事项

- Tailwind v4 不再使用 `tailwind.config.js` 和 `postcss.config.js`
- `@tailwindcss/vite` 插件会自动处理所有配置
- daisyui 通过 `@plugin "daisyui"` 直接在 CSS 中引入

## 国际化配置

### 安装

```bash
npm install i18next react-i18next
```

### 配置

**src/i18n/index.ts**
```typescript
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from '../locales/en.json';
import zhCN from '../locales/zh-CN.json';

const resources = {
  en: { translation: en },
  'zh-CN': { translation: zhCN },
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: navigator.language || 'zh-CN',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
```

**src/locales/en.json**
```json
{
  "common": {
    "save": "Save",
    "cancel": "Cancel",
    "delete": "Delete",
    "edit": "Edit",
    "confirm": "Confirm"
  },
  "app": {
    "title": "My App",
    "welcome": "Welcome to {{name}}"
  }
}
```

**src/locales/zh-CN.json**
```json
{
  "common": {
    "save": "保存",
    "cancel": "取消",
    "delete": "删除",
    "edit": "编辑",
    "confirm": "确认"
  },
  "app": {
    "title": "我的应用",
    "welcome": "欢迎使用 {{name}}"
  }
}
```

### 使用

```tsx
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t, i18n } = useTranslation();

  return (
    <div>
      <h1>{t('app.title')}</h1>
      <p>{t('app.welcome', { name: 'My App' })}</p>
      <button onClick={() => i18n.changeLanguage('en')}>English</button>
      <button onClick={() => i18n.changeLanguage('zh-CN')}>中文</button>
    </div>
  );
}
```

## zustand 状态管理

### 安装

```bash
npm install zustand
```

### 创建 Store

**src/stores/useAppStore.ts**
```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AppState {
  theme: 'light' | 'dark';
  language: string;
  counter: number;
  setTheme: (theme: 'light' | 'dark') => void;
  setLanguage: (lang: string) => void;
  increment: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      theme: 'dark',
      language: 'zh-CN',
      counter: 0,
      setTheme: (theme) => set({ theme }),
      setLanguage: (language) => set({ language }),
      increment: () => set((state) => ({ counter: state.counter + 1 })),
    }),
    {
      name: 'app-storage',
    }
  )
);
```

### 使用

```tsx
import { useAppStore } from './stores/useAppStore';

function Counter() {
  const { counter, increment } = useAppStore();

  return (
    <div>
      <p>Count: {counter}</p>
      <button onClick={increment}>Increment</button>
    </div>
  );
}
```

## 常用工具函数

### clsx 条件类名

```tsx
import clsx from 'clsx';

function Button({ variant = 'primary', className, ...props }) {
  return (
    <button
      className={clsx(
        'px-4 py-2 rounded',
        variant === 'primary' && 'bg-blue-500 text-white',
        variant === 'secondary' && 'bg-gray-200 text-gray-800',
        className
      )}
      {...props}
    />
  );
}
```

### tailwind-merge 合并类名

```tsx
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// 使用
<div className={cn('px-4', shouldHavePadding && 'py-4')} />
```

## 前端目录结构建议

```
src/
├── main.tsx                  # 入口
├── App.tsx                   # 根组件
├── App.css                   # 全局样式
├── components/               # 组件
│   ├── ui/                   # 基础 UI (Button, Input, Card 等)
│   ├── layout/              # 布局组件 (Header, Sidebar, Footer)
│   └── ...
├── hooks/                    # 自定义 hooks
│   ├── useAuth.ts
│   └── useTheme.ts
├── i18n/                     # 国际化
│   └── index.ts
├── locales/                  # 翻译文件
│   ├── en.json
│   ├── zh-CN.json
│   └── ...
├── pages/                    # 页面
│   ├── Home.tsx
│   ├── Settings.tsx
│   └── ...
├── presentation/             # 展示组件
├── services/                 # API 服务
│   └── api.ts
├── stores/                   # zustand stores
│   ├── useAppStore.ts
│   └── useUserStore.ts
├── styles/                   # 样式
│   └── index.css
├── types/                    # 类型定义
│   └── index.ts
└── utils/                    # 工具函数
    ├── cn.ts
    └── format.ts
```