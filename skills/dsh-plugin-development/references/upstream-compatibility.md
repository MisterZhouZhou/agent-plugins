# 上游兼容性与版本确认

> **官方文档对照审计：2026-09-03**

本文件把用户提供的 DSH 官方开发文档与 `zhu1090093659/dsh-web` 项目参考提炼成执行核对表。它不是永久版本承诺；每次创建、升级或发布插件时，都必须重新确认目标宿主、lockfile、公开 SDK 和 npm registry。

## 权威来源优先级

1. 用户明确的目标 DSH 版本、registry、Node/pnpm 范围。
2. 目标宿主的 `package.json`、lockfile、实际模块表和测试结果。
3. DSH 官方开发文档：`https://deepseek-harness.github.io/deepseek-harness/develop/basic/`
4. 官方仓库当前默认分支的等价源码、示例和包元数据。
5. 历史项目 `https://github.com/zhu1090093659/dsh-web` 及其派生项目，仅用于理解既有实现，不作为 API 事实来源。
6. npm registry 上的包版本；仅凭“有更新版本”不能证明 cohort 兼容。

如果来源冲突，不要静默选择。记录冲突，优先满足用户目标，并通过最小兼容矩阵、构建、tarball 和隔离 profile 冒烟来缩小支持范围。

## 官方文档对照结果

官方入口覆盖的不只是最小 `apply`：

| 官方章节 | 本 Skill 对应落地 | 执行要点 |
|---|---|---|
| 第一个插件 / Config | `architecture.md`、脚手架、`validate.mjs` | `Config` 类型若存在，必须导出同名 Schemastery runtime schema；默认值写在 schema。 |
| Tool | `tool-development.md`、`--capability tool` | `defineTool` + `inject=['tools']` + `ctx.tools.register`；参数、规范输出、render 和 execute 要形成完整契约。 |
| Service / 生命周期 | `services-and-dependencies.md`、`cordis-lifecycle.md` | Service 用 `Service` 基类和声明合并；必需依赖 `inject`，可选依赖 `ctx.get`；注册自动随 Fiber 清理。 |
| Events | `events.md` | 区分 `emit`、`bail`、`serial`、`waterfall`；waterfall 必须调用 `next()`；会话持久化事件和 Cordis 事件不要混淆。 |
| 能力分层 | `capability-seams.md` | 需要可替换后端时拆 Definition、Provider、Consumer；Consumer 不依赖 Provider 私有实现。 |
| LLM Adapter | `llm-adapter.md` | 实现公开 `LlmAdapter` 契约，正确输出 StreamChunk、usage/finish 顺序、取消和稳定错误码。 |
| 发布 | `manifest-and-bundle.md`、`local-installation.md`、`publishing.md` | 区分包的 `dsh.bundle` 与 profile 的 `dsh.profile`；前者随 npm 包分发，后者由 `dsh plugin` 管理。 |
| 动态 Cordis / HMR | `cordis-lifecycle.md`、`testing-and-debugging.md` | 以 effect/dispose 验证资源可逆、重载无重复注册；动态插件必须有安全边界和存续时间。 |

## 官方命令链与两条开发路径

官方文档区分源码 checkout 的临时 overlay 和已安装 profile：

### 源码开发

```bash
pnpm dsh web --patch /absolute/path/to/cordis.patch.yml
```

patch 只贡献配置层；本地插件源码、构建方式和当前 checkout 由开发者负责。重启或按宿主支持的方式 reload 后，检查 Host 日志和浏览器 Console/Network。

### profile / 安装包

```bash
dsh plugin --profile demo add link:/absolute/path/to/plugin-root
# 或：dsh plugin --profile demo add /absolute/path/to/plugin.tgz

dsh --profile demo --dump-config
dsh --profile demo
```

如果在官方源码 checkout 内运行 CLI，将 `dsh` 替换为 `pnpm dsh`。link 与 tarball 必须都验证：link 适合迭代，tarball 才能暴露 `files`、exports、prepare 和 patch 打包错误。

### 包与 profile 的边界

- 插件包的 `package.json` 声明 `dsh.bundle`，回答“这个包贡献什么 patch”。
- profile 的 `package.json` 声明 `dsh.profile` 及有序 bundles，回答“这套组合按什么顺序启动”。
- profile manifest 不手写，由 `dsh plugin` 创建和维护。
- profile 层顺序、用户覆盖层和 home 级 patch 以目标 CLI 文档为准；不要把 profile patch 写进插件包或反过来。

## 审计时动态确认的版本

脚手架中的版本只是 2026-09-03 调研基线，允许 CLI 覆盖，不代表最新版：

- `@deepseek-ai/cordis`：`^4.0.2` 基线观察值。
- `@deepseek-ai/schemastery`：`^3.18.2` 基线观察值；Config schema 是运行时依赖。
- DSH Client SDK：`^0.1.2-alpha.4` 基线观察值；只在 Client/Full-stack 需要。
- `@deepseek-ai/dsh-tools`：`^0.0.1-rc.1` 基线观察值；只在 Tool 能力需要，且必须确认目标 registry/source checkout 可安装。
- Node、pnpm、tsdown、TypeScript、Vitest：只作为可复现工具链线索，不应硬编码成所有插件的永久要求。

执行时至少收集：

```bash
node --version
pnpm --version
npm view @deepseek-ai/cordis version peerDependencies --json
npm view @deepseek-ai/schemastery version peerDependencies --json
npm view @deepseek-ai/dsh-tools version peerDependencies --json
```

如果 registry 返回 404、包依赖 monorepo 私有包，或版本带 alpha/rc，停止自动升级，改用目标 DSH checkout 的 workspace/lockfile，并在报告中记录安装前提。 Tool 项目若只是需要验证自身类型、单测和构建，可临时使用 `pnpm install --config.auto-install-peers=false`，但这不会证明 peer cohort 可在真实宿主中工作，也不能替代源码 checkout/profile 集成测试。

## SDK cohort 规则

所有 `@deepseek-ai/*` 包必须使用相互兼容的 cohort：

- 不要只升级一个 SDK 包而假设其它包仍兼容。
- 检查 peerDependencies、lockfile、官方模板和宿主实际导出的 API。
- 跨越 alpha、beta、rc 或主版本边界后，重跑 Config、Core、Host、Client、bundle purity、tarball 和隔离 profile 测试。
- 将已验证组合写入 package.json、README 和兼容矩阵；未验证版本标记为候选。
- 协议变化优先在 Core 层增加版本/能力协商或迁移逻辑，不在 Client 中猜测 Host 行为。

## 高风险兼容点

### Client closure factory / ModuleLoader

- `window.__ModuleLoader__.load` 的 `id`、`factory`、`require` 形状必须与宿主当前实现一致。
- banner/footer、CJS wrapper 和 external 列表可能随 tsdown/宿主升级漂移。
- 在最小 ModuleLoader stub 和真实 DSH Web 中各执行一次入口加载。

### Config 与 Service

- `Config` runtime schema 不能只导出普通对象；必须确认 Schemastery 版本和 Standard Schema 契约。
- 必需 Service 用 `inject`；可选 Service 用 `ctx.get`，并测试提供方消失/恢复时的 dispose/reload。
- Service 声明合并的名称必须与 `super(ctx, 'serviceName')` 及 Consumer 的 `ctx.serviceName` 一致。

### Tool 与 LLM

- Tool 名称必须在组合后的 Harness 中稳定唯一；输出先符合 schema，再由 render 展示。
- Tool 的外部请求、子进程和长任务必须响应取消，并随插件 dispose 清理。
- LLM Adapter 的 `finish` 必须最后产生，`usage` 必须在其之前；block-start/block-end 必须配对。

### `dsh.bundle.patch` 与 tarball

- patch 位于 package 根目录并被 `files` 包含，patch package name 与 manifest 完全一致。
- `npm/pnpm pack --dry-run` 清单必须包含所有运行时文件。
- 临时目录能解析 public exports；隔离 profile 能加载 Host，Client 能下载、注册并显示 UI（如有）。
- 发布后从 registry 重装，确认结果与本地 tarball 一致。

## 执行时记录模板

```text
核验日期：
目标 DSH 版本：
DSH 仓库/分支/提交：
Node/pnpm：
@deepseek-ai/* cohort：
宿主提供的 Client externals：
Config schema：
Tool/Service/LLM API：
patch 字段与来源：
源码 overlay smoke：
link profile smoke：
本地 tarball smoke：
registry tarball smoke：
已知不兼容项：
```

## 不能做的假设

- 不得把调研日期、Node/pnpm 或 alpha/rc 版本写成永久兼容声明。
- 不得仅凭 npm 上存在新版本就升级 SDK cohort。
- 不得从 DSH 未公开内部路径导入运行时实现。
- 不得把失效的历史仓库 URL、旧分支或本机缓存当作当前规范。
- 不得因本地 link 可用就跳过 tarball/profile 验证。
