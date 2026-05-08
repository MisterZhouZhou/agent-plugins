---
name: rust-desktop
description: |
  Rust 桌面端开发技能，基于 Tauri v2 框架。当用户想要创建、初始化或开发 Rust 桌面应用程序时触发。
  适用场景：创建新的 Rust 桌面项目、初始化可执行的 Tauri 项目、设置 Rust 桌面开发环境、构建 Rust 桌面应用。
  支持向导式初始化，可按需选择功能模块，支持后续补充配置。
compatibility: |
  - Rust toolchain (rustup, cargo)
  - Node.js 18+
  - npm 9+
  - Tauri CLI v2
---

# Rust 桌面端开发 - 标准化流程

本 skill 基于 cockpit-tools 项目最佳实践，提供 Tauri v2 + Rust 桌面应用向导式开发工作流。

## 初始化流程概览

```
┌─────────────────────────────────────────────────────────────┐
│                    项目初始化向导                            │
├─────────────────────────────────────────────────────────────┤
│  1. 基础配置 ──▶ 2. 功能模块 ──▶ 3. 打包配置 ──▶ 4. 完成    │
│      (必选)         (可选)          (可选)                   │
└─────────────────────────────────────────────────────────────┘
```

---

## 第一步：基础配置（必选）

### 1.1 询问项目基本信息

| 配置项 | 默认值 | 说明 |
|--------|--------|------|
| 项目名称 | `my-app` | 应用英文名 (kebab-case) |
| 应用标题 | `My App` | 窗口标题 |
| 应用标识符 | `com.example.my-app` | 唯一 ID |
| 版本号 | `0.1.0` | 初始版本 |
| 描述 | `A productivity tool` | 应用简介 |
| 许可证 | `MIT` | 开源协议 |

**询问项目名称：**

```
请输入项目名称（英文，kebab-case），输入 n 使用默认 "my-app"：
> _
```

**确认配置：**

```
项目配置确认：

┌─────────────────────────────────────────────────────┐
│  1. 应用标题: My App                               │
│  2. 标识符: com.example.my-app                   │
│  3. 版本: 0.1.0                                   │
│  4. 描述: A productivity tool                      │
│  5. 许可证: MIT                                   │
└─────────────────────────────────────────────────────┘
```

输入要修改的项号，输入 n 跳过：
> _

### 1.2 使用脚手架创建项目

**必须使用 `npm create tauri-app@latest` 创建项目，禁止手动创建文件：**

请在目标目录下执行以下命令：

```bash
npm create tauri-app@latest my-app -- --template react-ts --manager npm
```

脚手架会交互式询问：
```
? Project name (skipping will use "my-app") ›
? Add npm scripts for: (选择 All)
? Which template would you like to use? › (选择 TypeScript + React)
```

创建完成后进入项目目录并安装依赖：
```bash
cd my-app
npm install
```

---

**询问用户：**

```
请在终端中执行脚手架命令，完成后告诉我。

输入 y 表示已完成：
> _
```

### 1.3 基础 Cargo.toml (workspace)

```toml
[workspace]
members = ["src-tauri"]
resolver = "2"

[workspace.dependencies]
serde = { version = "1", features = ["derive"] }
serde_json = "1"
anyhow = "1.0"
thiserror = "2"
chrono = "0.4"
dirs = "5.0"
tokio = { version = "1", features = ["full"] }
tracing = "0.1"
tauri = { version = "2", features = ["macos-private-api", "tray-icon", "image-png"] }
```

### 1.4 基础 tauri.conf.json

```json
{
  "$schema": "https://schema.tauri.app/config/2",
  "productName": "{{APP_TITLE}}",
  "version": "{{VERSION}}",
  "identifier": "{{IDENTIFIER}}",
  "build": {
    "beforeDevCommand": "npm run dev",
    "devUrl": "http://localhost:1420",
    "beforeBuildCommand": "npm run build",
    "frontendDist": "../dist"
  },
  "app": {
    "macOSPrivateApi": true,
    "windows": [
      {
        "label": "main",
        "title": "{{APP_TITLE}}",
        "width": 1280,
        "height": 800,
        "minWidth": 900,
        "minHeight": 600,
        "center": true
      }
    ]
  },
  "bundle": {
    "active": true,
    "targets": "all",
    "icon": [
      "icons/48x48.png",
      "icons/32x32.png",
      "icons/16x16.png",
      "icons/64x64.png",
      "icons/128x128.png",
      "icons/256x256.png",
      "icons/512x512.png",
      "icons/icon.icns",
      "icons/icon.ico"
    ]
  }
}
```

---

## 第二步：功能模块（可选 - 按需选择）

### 2.1 询问功能模块

**展示可选模块（带序号），直接输入序号选择，空格分隔多选：**

```
┌─────────────────────────────────────────────────────┐
│  功能模块                                            │
├─────────────────────────────────────────────────────┤
│  1. [ ] 数据库支持 (SQLite)                         │
│  2. [ ] 日志系统 (tracing)                         │
│  3. [*] 系统托盘 (tray-icon)                       │
│  4. [ ] 自动启动 (autostart)                       │
│  5. [*] 系统通知 (notification)                     │
│  6. [ ] 深链接 (deep-link)                         │
│  7. [ ] 自动更新 (updater)                         │
│  8. [*] 文件系统访问 (fs)                           │
│  9. [*] 对话框 (dialog)                            │
│ 10. [ ] 进程管理 (process)                          │
└─────────────────────────────────────────────────────┘
[*] = 默认选择

直接输入序号（如 1,3,5），输入 n 跳过：
> _
```

### 模块 A：数据库支持

**添加依赖：**
```toml
rusqlite = { version = "0.32", features = ["bundled"] }
```

**创建 `src-tauri/src/modules/database.rs`：**
```rust
use rusqlite::{Connection, Result};
use std::path::PathBuf;

pub fn get_db_path() -> PathBuf {
    dirs::data_dir()
        .unwrap_or_else(|| PathBuf::from("."))
        .join("your-app")
        .join("data.db")
}

pub fn init_db() -> Result<Connection> {
    let conn = Connection::open(get_db_path())?;
    conn.execute(
        "CREATE TABLE IF NOT EXISTS items (
            id INTEGER PRIMARY KEY,
            name TEXT NOT NULL,
            created_at INTEGER NOT NULL
        )",
        [],
    )?;
    Ok(conn)
}
```

### 模块 B：网络请求

**添加依赖：**
```toml
reqwest = { version = "0.12", features = ["json", "gzip", "brotli", "deflate", "zstd", "stream"] }
```

### 模块 C：日志系统

**添加依赖：**
```toml
tracing-subscriber = { version = "0.3", features = ["env-filter", "time"] }
tracing-appender = "0.2"
tracing-log = "0.2"
```

**lib.rs 中初始化：**
```rust
use tracing_subscriber::{fmt, prelude::*, EnvFilter};
use tracing_appender::rolling::{RollingFileAppender, Rotation};

pub fn init_logging() {
    let log_dir = dirs::data_dir()
        .unwrap_or_else(|| PathBuf::from("."))
        .join("your-app")
        .join("logs");
    std::fs::create_dir_all(&log_dir).ok();

    let file_appender = RollingFileAppender::new(Rotation::DAILY, log_dir, "app.log");
    let (non_blocking, _guard) = tracing_appender::non_blocking(file_appender);

    tracing_subscriber::registry()
        .with(EnvFilter::try_from_default_env().unwrap_or_else(|_| EnvFilter::new("info")))
        .with(fmt::layer().with_writer(non_blocking))
        .init();
}
```

### 模块 D：系统托盘

**tauri.conf.json 中已启用特性，已包含此模块。**

**lib.rs 中添加托盘：**
```rust
use tauri::{Manager, menu::{Menu, MenuItem}, tray::TrayIconBuilder};

pub fn setup_tray(app: &tauri::App) -> Result<(), Box<dyn std::error::Error>> {
    let quit = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;
    let show = MenuItem::with_id(app, "show", "Show Window", true, None::<&str>)?;
    let menu = Menu::with_items(app, &[&show, &quit])?;

    let _tray = TrayIconBuilder::new()
        .menu(&menu)
        .tooltip("Your App Name")
        .on_menu_event(|app, event| {
            match event.id.as_ref() {
                "quit" => {
                    app.exit(0);
                }
                "show" => {
                    if let Some(window) = app.get_webview_window("main") {
                        window.show().ok();
                        window.set_focus().ok();
                    }
                }
                _ => {}
            }
        })
        .build(app)?;

    Ok(())
}
```

### 模块 E：自动启动

**添加依赖：**
```toml
tauri-plugin-autostart = "2"
```

**lib.rs 中初始化：**
```rust
use tauri_plugin_autostart::MacosLauncher;

app.handle().plugin(
    tauri_plugin_autostart::init(MacosLauncher::LaunchAgent, Some(vec!["--minimized"]))
)?;
```

### 模块 F：单例模式

**添加依赖：**
```toml
tauri-plugin-single-instance = { version = "2", features = ["deep-link"] }
```

**lib.rs 中初始化：**
```rust
plugin(tauri_plugin_single_instance::init(|app, _argv, _cwd| {
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.show();
        let _ = window.set_focus();
    }
}))
```

### 模块 G：深链接

**添加依赖：**
```toml
tauri-plugin-deep-link = "2"
```

**tauri.conf.json 配置：**
```json
"plugins": {
  "deep-link": {
    "desktop": {
      "schemes": ["your-app", "yourapp"]
    }
  }
}
```

### 模块 H：自动更新

**添加依赖：**
```toml
tauri-plugin-updater = "2"
```

**tauri.conf.json 配置：**
```json
"plugins": {
  "updater": {
    "pubkey": "YOUR_PUBLIC_KEY",
    "endpoints": ["https://github.com/your-org/your-app/releases/latest/download/latest.json"]
  }
}
```

### 模块 I：系统通知

**添加依赖：**
```toml
tauri-plugin-notification = "2"
mac-notification-sys = "0.6"  # macOS
```

### 模块 J：文件系统

**添加依赖：**
```toml
tauri-plugin-fs = "2"
```

### 模块 K：对话框

**添加依赖：**
```toml
tauri-plugin-dialog = "2"
```

### 模块 L：进程管理

**添加依赖：**
```toml
tauri-plugin-process = "2"
```

---

## 第三步：前端配置（可选）

### 3.1 询问前端功能

**展示可选功能（带序号），直接输入序号选择，空格分隔多选：**

```
┌─────────────────────────────────────────────────────┐
│  前端功能                                            │
├─────────────────────────────────────────────────────┤
│  1. [*] React 框架                                  │
│  2. [*] Tailwind CSS + DaisyUI                    │
│  3. [ ] 国际化 (i18next)                           │
│  4. [*] 状态管理 (zustand)                         │
│  5. [ ] 图标库 (lucide-react)                      │
│  6. [ ] 日期处理 (date-fns)                        │
└─────────────────────────────────────────────────────┘
[*] = 默认选择

直接输入序号（如 1,3,5），输入 n 跳过：
> _
```
┌─────────────────────────────────────────────────────┐
│  前端功能                                            │
├─────────────────────────────────────────────────────┤
│  1. [*] React 框架                                  │
│  2. [*] Tailwind CSS + DaisyUI                    │
│  3. [*] 国际化 (i18next)                           │
│  4. [*] 状态管理 (zustand)                         │
│  5. [*] 图标库 (lucide-react)                      │
│  6. [*] 日期处理 (date-fns)                        │
└─────────────────────────────────────────────────────┘
[*] = 默认选择

直接输入序号（如 1,3,5），输入 n 跳过：
> _
```

### 前端 package.json（基础）

```json
{
  "name": "your-app-name",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "typecheck": "tsc --noEmit",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "tauri": "tauri"
  },
  "dependencies": {
    "react": "^19.1.0",
    "react-dom": "^19.1.0",
    "@tauri-apps/api": "^2"
  },
  "devDependencies": {
    "@tauri-apps/cli": "^2",
    "@types/react": "^19.1.8",
    "@types/react-dom": "^19.1.6",
    "@vitejs/plugin-react": "^4.6.0",
    "@tailwindcss/vite": "^4.0.0",
    "tailwindcss": "^4.0.0",
    "daisyui": "^5.0.0",
    "typescript": "~5.8.3",
    "vite": "^7.0.4"
  }
}
```

### vite.config.ts

```typescript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig(async () => ({
  plugins: [react(), tailwindcss()],
}));
```

### src/index.css

```css
@import "tailwindcss";
@plugin "daisyui";
```

**注意：Tailwind v4 不再使用 `postcss.config.js`，`@tailwindcss/vite` 插件会自动处理。如存在该文件请删除。

### 第四步：打包配置（可选）

### 4.1 询问打包方式

**展示可选打包方式（带序号），直接输入序号选择：**

```
┌─────────────────────────────────────────────────────┐
│  打包方式                                            │
├─────────────────────────────────────────────────────┤
│  1. [*] macOS DMG (Apple Silicon + Intel)         │
│  2. [*] macOS App                                 │
│  3. [ ] Windows MSI                                 │
│  4. [ ] Windows NSIS                                │
│  5. [ ] Linux AppImage                              │
│  6. [ ] Homebrew Tap                               │
└─────────────────────────────────────────────────────┘
[*] = 默认选择

直接输入序号（如 1,3），输入 n 跳过：
> _
```

### 打包 targets 配置

```json
"bundle": {
  "targets": ["dmg", "app", "msi", "nsis", "deb", "appimage"],
  "category": "public.app-category.productivity",
  "shortDescription": "A short description",
  "longDescription": "A long description of your app",
  "createUpdaterArtifacts": true
}
```

### Homebrew 配置（单独确认）

**展示默认配置：**

```
┌─────────────────────────────────────────────────────┐
│  Homebrew 分发配置                                  │
├─────────────────────────────────────────────────────┤
│  Tap 仓库: https://github.com/xxx/homebrew-xxx  │
│  GitHub Actions 自动发布: Yes                       │
└─────────────────────────────────────────────────────┘

输入 y 配置，输入 n 跳过：
> _
```

### 图标配置（单独确认）

**展示默认配置：**

```
┌─────────────────────────────────────────────────────┐
│  图标配置                                            │
├─────────────────────────────────────────────────────┤
│  源图标: src-tauri/icons/icon.png (1024x1024)     │
│  自定义 DMG 背景: No                               │
└─────────────────────────────────────────────────────┘

输入 y 修改，输入 n 跳过：
> _
```

**图标生成命令（初始化后执行）：**
```bash
cd src-tauri/icons
npx tauri icon icon.png
```

### 主题配置（单独确认）

**展示默认配置：**

```
┌─────────────────────────────────────────────────────┐
│  主题配置                                            │
├─────────────────────────────────────────────────────┤
│  深色模式: Yes                                       │
│  浅色模式: Yes                                       │
│  跟随系统: Yes                                       │
└─────────────────────────────────────────────────────┘

输入 y 修改，输入 n 跳过：
> _
```

---

## 后续补充配置

当用户需要添加新功能时，一次只问一个问题。

### 添加新功能模块

**询问：**

```
请输入要添加的模块名称：

可用模块：
- database (数据库)
- network (网络请求)
- logging (日志系统)
- tray (系统托盘)
- autostart (自动启动)
- notification (通知)
- deep-link (深链接)
- updater (自动更新)
- fs (文件系统)
- dialog (对话框)
- process (进程管理)

> _
```

**用户输入后，确认：**

```
┌─────────────────────────────────────────────────────┐
│  添加模块确认                                        │
├─────────────────────────────────────────────────────┤
│  模块: database (SQLite)                            │
│  依赖: rusqlite                                    │
└─────────────────────────────────────────────────────┘

输入 y 确认添加，输入 n 取消：
> _
```

### 补充打包配置

**询问：**

```
请输入要添加的打包方式：

可用方式：
- homebrew (Homebrew Tap)
- dmg (macOS DMG)
- msi (Windows MSI)
- nsis (Windows NSIS)
- appimage (Linux AppImage)
- deb (Linux DEB)

> _
```

### 更新主题

**询问：**

```
请选择要修改的主题配置：

1. 添加新 DaisyUI 主题
2. 修改主题颜色
3. 切换深色/浅色模式

> _
```

---

## 开发命令

```bash
# 安装依赖
npm install

# 开发模式 (显示 Rust tracing 日志)
npm run tauri dev

# 生产构建
npm run tauri build

# 仅前端构建
npm run build

# 类型检查
npm run typecheck
```

---

## 前置条件

1. **Rust**
   ```bash
   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
   ```

2. **Node.js 18+**
   ```bash
   # macOS
   brew install node
   
   # Windows
   winget install OpenJS.NodeJS
   ```

3. **Tauri CLI v2**
   ```bash
   npm install -g @tauri-apps/cli@latest
   cargo install tauri-cli --version "^2.0"
   ```

4. **平台依赖**
   - **macOS**: Xcode Command Line Tools
   - **Windows**: Visual Studio Build Tools
   - **Linux**: `libwebkit2gtk-4.1-dev libssl-dev libgtk-3-dev`

---

## 初始化检查清单

### 基础
- [ ] 项目名称和应用标识符已设置
- [ ] 项目结构已创建
- [ ] 基础 Cargo.toml 已配置
- [ ] 基础 tauri.conf.json 已配置

### 功能模块（按需）
- [ ] 数据库模块 (如选择)
- [ ] 网络请求模块 (如选择)
- [ ] 日志系统 (如选择)
  - [ ] tracing-subscriber 配置
  - [ ] 日志回显到终端
  - [ ] RUST_LOG 环境变量支持
- [ ] 系统托盘 (如选择)
- [ ] 自动启动 (如选择)
- [ ] 单例模式 (如选择)
- [ ] 深链接 (如选择)
- [ ] 自动更新 (如选择)

### 前端（按需）
- [ ] React 基础配置
- [ ] Tailwind + DaisyUI (如选择)
- [ ] 国际化 (如选择)
- [ ] 状态管理 (如选择)

### 打包（按需）
- [ ] 打包 targets 配置
- [ ] 应用图标生成
- [ ] Homebrew Formula (如选择)
- [ ] DMG 背景 (如选择)

---

## 日志与调试

### Tracing 日志宏

```rust
use tracing::{info, warn, error, debug, trace};

fn example() {
    trace!("Trace level: {:?}", detailed_data);
    debug!("Debug level: {:?}", data);
    info!("Info level: operation started");
    warn!("Warning: something might be wrong");
    error!("Error: operation failed");
}
```

### 日志级别环境变量

```bash
# 设置日志级别
RUST_LOG=debug cargo run -p my-app-cli -- status

# 常用级别
RUST_LOG=trace   # 最详细
RUST_LOG=debug   # 调试信息
RUST_LOG=info    # 一般信息 (默认)
RUST_LOG=warn    # 警告
RUST_LOG=error   # 仅错误
RUST_LOG=off     # 关闭日志
```

### Tauri 开发模式日志

运行 `npm run tauri dev` 时，tracing 日志会自动回显到终端：

```bash
npm run tauri dev
```

**输出示例：**
```
[tauri] running on http://localhost:1420
[2024-01-01T12:00:00Z INFO  my_app::commands] Command 'get_data' called
[2024-01-01T12:00:00Z DEBUG my_app::modules] Processing request with id: abc123
[2024-01-01T12:00:00Z WARN  my_app::modules] Cache miss for key: user_settings
[2024-01-01T12:00:00Z ERROR my_app::modules] Failed to connect to database
```

### 前端日志面板（可选）

如果需要在应用内查看日志，可添加日志面板组件：

```tsx
// src/components/LogPanel.tsx
import { useEffect, useState } from 'react';

interface LogEntry {
  level: 'trace' | 'debug' | 'info' | 'warn' | 'error';
  time: string;
  target: string;
  message: string;
}

export function LogPanel() {
  const [logs, setLogs] = useState<LogEntry[]>([]);

  // 通过 Tauri 事件监听日志
  useEffect(() => {
    const unlisten = listen<LogEntry>('rust-log', (event) => {
      setLogs(prev => [...prev.slice(-100), event.payload]);
    });
    return () => { unlisten.then(fn => fn()); };
  }, []);

  const levelColors = {
    trace: 'text-gray-400',
    debug: 'text-gray-500',
    info: 'text-blue-400',
    warn: 'text-yellow-400',
    error: 'text-red-400',
  };

  return (
    <div className="bg-base-300 rounded-lg p-4 font-mono text-sm">
      {logs.map((log, i) => (
        <div key={i} className={`${levelColors[log.level]} mb-1`}>
          <span className="text-gray-500">[{log.time}]</span>
          <span className="text-primary">[{log.level.toUpperCase()}]</span>
          <span className="text-secondary">[{log.target}]</span>
          <span className="ml-2">{log.message}</span>
        </div>
      ))}
    </div>
  );
}
```

---

## 常见问题

**macOS "应用已损坏"**
```bash
sudo xattr -rd com.apple.quarantine "/Applications/YourApp.app"
```

**Tauri 编译失败**
```bash
cargo clean && rm -rf src-tauri/target && npm run tauri build
```

**Homebrew 安装失败**
```bash
brew install --cask --no-quarantine your-app-name
```