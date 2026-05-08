# Tauri v2 完整项目模板

## 目录结构

```
my-app/
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── App.css
│   └── vite-env.d.ts
├── src-tauri/
│   ├── src/
│   │   ├── lib.rs
│   │   ├── main.rs
│   │   ├── error.rs
│   │   ├── commands/
│   │   │   ├── mod.rs
│   │   │   └── example.rs
│   │   ├── models/
│   │   │   ├── mod.rs
│   │   │   └── example.rs
│   │   ├── modules/
│   │   │   ├── mod.rs
│   │   │   └── example.rs
│   │   └── utils/
│   │       ├── mod.rs
│   │       └── helpers.rs
│   ├── Cargo.toml
│   ├── tauri.conf.json
│   ├── build.rs
│   ├── capabilities/
│   │   └── default.json
│   └── icons/
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

## 快速初始化命令

```bash
# 1. 创建 Tauri 项目
npm create tauri-app@latest my-app -- --template react-ts --manager npm

# 2. 进入项目目录
cd my-app

# 3. 安装依赖
npm install

# 4. 启动开发服务器
npm run tauri dev
```

## 推荐的 Cargo 依赖组合

### 基础依赖
```toml
[dependencies]
tauri = { version = "2", features = [...] }
serde = { version = "1", features = ["derive"] }
serde_json = "1"
anyhow = "1.0"
thiserror = "2"
tokio = { version = "1", features = ["full"] }
tracing = "0.1"
```

### 网络请求
```toml
reqwest = { version = "0.12", features = ["json", "gzip", "brotli", "deflate", "zstd", "stream"] }
```

### 数据库
```toml
rusqlite = { version = "0.32", features = ["bundled"] }
```

### 日志
```toml
tracing-subscriber = { version = "0.3", features = ["env-filter", "time"] }
tracing-appender = "0.2"
tracing-log = "0.2"
```

### 系统信息
```toml
sysinfo = "0.33"
dirs = "5.0"
```

## 常用 Tauri 特性

```toml
# 核心特性
tauri = { version = "2", features = [
    "macos-private-api",  # macOS 私有 API
    "tray-icon",          # 系统托盘
    "image-png",          # PNG 图片支持
] }

# 插件
tauri-plugin-opener = "2"
tauri-plugin-dialog = "2"
tauri-plugin-fs = "2"
tauri-plugin-notification = "2"
tauri-plugin-autostart = "2"
tauri-plugin-single-instance = { version = "2", features = ["deep-link"] }
tauri-plugin-deep-link = "2"
tauri-plugin-process = "2"
tauri-plugin-updater = "2"
```