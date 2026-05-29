# Tauri v2 模板参考

本参考说明官方 CLI 创建后的二次配置。可复制文件模板统一放在 `templates/` 目录；这里只维护选择规则、目标路径和配置要点。

## 快速初始化

```bash
npm create tauri-app@latest my-app -- --template react-ts --manager npm
cd my-app
npm install
```

`create-tauri-app` 需要 TTY。代理执行时要用可交互终端运行；如果 CLI 继续询问 `Identifier`，直接使用默认值，除非用户明确提供了应用标识符。

## 推荐目录结构

```text
my-app/
├── src/
├── src-tauri/
├── scripts/
│   └── sync-version.js
├── .github/
│   └── workflows/
│       ├── build.yml
│       └── release.yml
├── index.html
├── package.json
├── postcss.config.cjs
├── tailwind.config.cjs
├── tsconfig.json
├── vite.config.ts
└── README.md
```

## 模板落点

| 模板 | 目标路径 | 说明 |
|------|----------|------|
| `templates/package/scripts.json` | 合并到 `package.json.scripts` | 不要覆盖整个 package.json |
| `templates/scripts/sync-version.js` | `scripts/sync-version.js` | 构建前同步版本 |
| `templates/tauri/tauri.conf.base.json` | 对照修改 `src-tauri/tauri.conf.json` | 用于基础窗口和 bundle 配置 |
| `templates/tauri/tauri.conf.bundle-fragment.json` | 合并到 `tauri.conf.json.bundle` | 打包发布能力 |
| `templates/tauri/tauri.conf.updater-fragment.json` | 合并到 `tauri.conf.json` | 自动更新能力 |
| `templates/tauri/cargo-dependencies.toml` | 按需合并到 `src-tauri/Cargo.toml` | 只添加所选依赖 |
| `templates/github/build.yml` | `.github/workflows/build.yml` | CI 构建矩阵 |
| `templates/github/release.yml` | `.github/workflows/release.yml` | tag release |

## 常用 Rust/Tauri 依赖

基础依赖与可选插件清单在 `templates/tauri/cargo-dependencies.toml`。使用时按需合并：

- 基础：`tauri`、`tauri-plugin-opener`、`serde`、`serde_json`。
- 通用工具：`anyhow`、`thiserror`、`tokio`、`tracing`、`dirs`、`chrono`。
- 可选插件：dialog、fs、notification、autostart、single-instance、deep-link、process、updater。
- 可选能力：reqwest、rusqlite、tracing-subscriber、sysinfo。

系统托盘需要把 `tauri` features 调整为包含 `tray-icon`：

```toml
tauri = { version = "2", features = ["macos-private-api", "tray-icon", "image-png"] }
```

## 自动更新

选择 updater 时：

1. 安装 `@tauri-apps/plugin-updater` 和 `tauri-plugin-updater`。
2. 合并 `templates/tauri/tauri.conf.updater-fragment.json`。
3. 替换 `pubkey` 和 `endpoints`。
4. Rust 侧注册 `tauri_plugin_updater::Builder::new().build()`。
5. 如果要生成 updater artifacts，确保 bundle 配置中 `createUpdaterArtifacts` 为 `true`。

开启 updater 签名的 GitHub Release 需要仓库 Secrets：

- `TAURI_SIGNING_PRIVATE_KEY`
- `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`

## 打包发布

选择打包发布时：

1. 合并 `templates/tauri/tauri.conf.bundle-fragment.json`。
2. 合并 `templates/package/scripts.json` 中的 `package*` scripts。
3. 本地先运行 `npm run package:app` 做冒烟测试。
4. 完整安装包和 DMG 用 `npm run package` 或 GitHub Actions 验证。

`package:app` 只验证 `.app` 目标，能避开部分沙箱、无 GUI、磁盘镜像挂载受限环境里的 DMG 失败。

## GitHub Workflows

选择 GitHub Workflows 时：

- 复制 `templates/github/build.yml` 到 `.github/workflows/build.yml`。
- 复制 `templates/github/release.yml` 到 `.github/workflows/release.yml`。
- release workflow 默认通过 `v*` tag 触发，并校验 tag 与 `package.json.version` 一致。
- 如果项目有 sidecar、Homebrew Cask、changelog 合并等项目特定逻辑，再在模板基础上扩展，不要默认塞进通用 skill。

## 深链接

选择 deep-link 时：

- 添加 `tauri-plugin-deep-link = "2"`。
- 添加 `tauri-plugin-single-instance = { version = "2", features = ["deep-link"] }`。
- 在 `tauri.conf.json.plugins.deep-link.desktop.schemes` 写入应用 scheme。
- Rust 侧用 single-instance 在二次打开时聚焦主窗口。

## 版本同步

始终创建 `scripts/sync-version.js`。脚本模板在 `templates/scripts/sync-version.js`，以 `package.json.version` 为唯一来源，同步：

- `src-tauri/tauri.conf.json.version`
- `src-tauri/Cargo.toml` 的 package version

## 验证命令

```bash
npm run typecheck
npm run build
npm run tauri:dev
npm run package:app
```

完整打包：

```bash
npm run package
```
