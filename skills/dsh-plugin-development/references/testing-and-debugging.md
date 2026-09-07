# 测试与故障排查

本参考用于把 DSH 插件从“源码能运行”推进到“可安装、可打包、可发布”。测试顺序按依赖从内到外排列：先验证纯逻辑，再验证 Host/Client 运行时，最后验证 npm tarball 和 DSH profile 安装。不要用一次成功的开发目录启动替代完整验收。

## 测试总览

插件至少应经过以下八层测试。Host-only 插件可以跳过 Client 层，但应在记录中明确跳过原因；Client-only 插件可以跳过 Host 层，但仍须验证清单中没有残留 Host 声明。

| 层级 | 目标 | 重点问题 | 建议产物 |
| --- | --- | --- | --- |
| Core | 验证跨端类型、schema、codec、事件名和纯函数 | 输入边界、序列化、未知字段、错误码 | 单元测试与可序列化 DTO |
| Host | 验证 Cordis 插件挂载、服务、配置和清理 | `apply`、依赖注入、失败路径、重载 | Host 单元测试、服务状态 |
| Client | 验证浏览器入口和 UI 注册 | ModuleLoader、页面/Slot/设置、卸载 | 最小宿主桩、浏览器单元测试 |
| manifest | 验证 npm 与 DSH 清单的一致性 | `exports`、patch、`dsh` 字段、文件路径 | 可解析的 `package.json` 与 patch |
| build | 验证 Host/Client 构建产物 | entry、类型声明、source map、构建顺序 | `lib/index.js`、`lib/client.js`、`lib/types`（由 `tsc -p tsconfig.build.json` 生成） |
| bundle purity | 验证 Client 包可在浏览器独立加载 | `node:*`、裸 `fs`、宿主私有路径、未知 external | Client bundle 检查记录 |
| tarball | 验证发布包实际包含可运行文件 | npm `files`、README、LICENSE、patch、exports | `.tgz` 与 `npm pack` 清单 |
| installation | 验证真实 DSH profile 加载链路 | profile 依赖、Host、浏览器 Network/Console、UI | 隔离 profile 冒烟记录 |

## 1. Core 层

Core 只放两端共享的纯内容：类型、请求/响应 DTO、事件名、schema、编码/解码和无副作用的校验函数。

检查项：

- schema 能拒绝缺失字段、错误类型、过长字符串、未知操作和非法枚举。
- 请求、响应和事件经过 JSON 序列化后仍保持语义；不要把 `Error`、函数、类实例、`File` 或循环引用放进协议。
- 错误码稳定、面向用户可理解；堆栈、本地绝对路径和密钥不得成为协议字段。
- 对空值、边界数值、超时、重复请求和未知版本分别测试。
- Core 测试不依赖 DOM、Node API、真实 DSH 服务或网络。

## 2. Host 层

Host 测试关注公开入口，而不是未公开的 DSH 内部实现。使用最小的 Cordis 上下文和显式 stub 注入文件、命令、网络或事件能力；不要在测试中直接改 DSH 源码。

至少覆盖：

- 插件 `apply(ctx, config)` 能挂载，服务名和依赖名符合 manifest/架构文档。
- 有效配置会生成预期服务状态；缺失、越界和未知配置会给出结构化错误。
- 公共方法返回 Core 定义的结果，不泄漏异常堆栈、宿主路径或环境变量。
- 文件、子进程、网络和定时器在成功、失败、取消和重复调用时行为明确。
- Cordis effect/dispose 或等价清理逻辑会移除事件监听、停止定时器、回收子进程。
- 热重载或重复挂载不会注册重复服务、重复事件或重复命令。

## 3. Client 层

Client 测试使用最小 `window.__ModuleLoader__` stub，不把完整 DSH Web 应用作为单元测试前置条件。验证入口的加载协议，然后再验证页面、Slot、设置卡和卸载。

至少覆盖：

- `window.__ModuleLoader__.load({ id, factory })` 被调用一次，`id` 与 npm `name` 或约定的稳定插件 ID 一致。
- factory 在最小 `require` 环境下可以执行；所有 external 都来自目标宿主实际提供的模块表。
- `ctx.page`、`ctx.slot`、`ctx.settings` 注册了正确的 key、标题、组件和依赖服务。
- UI 操作会通过 Core 协议请求 Host，不在浏览器直接访问文件系统、子进程或宿主密钥。
- 卸载后页面、Slot、事件、样式和定时器不残留；重新加载不会重复注册。
- 浏览器 bundle 不依赖 `node:*`、`fs`、`path`、`child_process`、`process` 等 Node-only API。

## 4. manifest 层

在构建前和构建后各检查一次 `package.json` 与 `cordis.patch.yml`：

- `name`、目录名、patch 中的包名和 ModuleLoader ID 没有互相漂移。
- Host 入口、Client 入口和类型声明分别由 `exports` 指向实际文件。
- `dsh.bundle.patch`/`dsh.bundle.patch` 等当前宿主要求的字段指向 package 内真实存在的 patch 文件。
- `dsh.client` 只在存在 Client 入口时声明；Host-only 包不得留下误导性的 Client 声明。
- `files` 覆盖所有运行时文件、patch、类型声明、README 和 LICENSE。
- DSH semver 范围可解析，并与执行时确认的宿主版本相容。

## 5. build 层

按以下顺序执行基础命令：

```bash
pnpm typecheck
pnpm test
pnpm build
```

要求：

- `typecheck` 不依赖构建产物中不存在的 monorepo 私有路径。
- `test` 在干净依赖环境中通过，不能只依赖本机全局模块或已运行的 DSH。
- `build` 同时产生声明中承诺的 Host、Client（如有）和类型文件。
- 构建后检查入口文件首行/包装、source map 引用和相对路径；Client 产物应是宿主约定的 browser bundle。
- 如果 Client 构建使用 external，逐个确认它们运行时确实由 DSH Web 提供；不能把“本机能解析”当作“浏览器能加载”。

## 6. bundle purity 层

Bundle purity 是 Client 最容易被忽略的门禁。对 `lib/client.js` 或等价产物做静态检查：

```bash
grep -nE 'node:|require\(["'"'](fs|path|child_process|module|os|net|tls)["'"']\)|dsh-web/(shared|internal)' lib/client.js
```

命中不一定都代表错误（例如字符串被业务展示），但每一项都必须解释并排除运行时加载风险。尤其检查：

- 不得把 Node-only 包、Host SDK、文件系统适配器或服务端密钥打进 Client。
- 不得把 `dsh-web/shared/*`、未公开 DSH 内部模块或本机绝对路径作为运行时依赖。
- external 名称、factory 的 `require` 方式和宿主 ModuleLoader 的提供方式必须一致。
- 产物在没有 Node 全局变量的浏览器环境中能完成入口注册。

## 7. tarball 层

源码目录可运行不代表 npm 包可运行。先查看 dry-run 清单，再生成真实包：

```bash
npm pack --dry-run --json
npm pack
```

检查 JSON 和生成的 `.tgz`：

- 包内存在 `lib/index.js`、`lib/client.js`（如声明 Client）和 `lib/types`（由 `tsc -p tsconfig.build.json` 生成）。
- `cordis.patch.yml` 在包根目录且没有被 `.npmignore` 或 `files` 排除。
- `package.json` 的 `exports` 指向包内存在的文件；不会指向 `src`、绝对路径或 monorepo 私有文件。
- README、LICENSE、版本号和包名正确。
- 没有把测试缓存、`.env`、密钥、宿主源码或无关的大型构建目录带入包。
- 用 tarball 安装时会触发正确的 `prepare`/构建前置逻辑，但发布包不应依赖发布者本机才能访问的路径。

## 8. installation 层

将 `.tgz` 安装到隔离目录或隔离 DSH profile，再启动宿主。验证顺序：

1. profile 依赖和 bundle 列表包含插件。
2. Host 日志出现插件节点/服务挂载，且没有 patch 解析异常。
3. 浏览器 Network 能看到 Client 产物，状态码、响应类型和路径正确。
4. Console 没有 ModuleLoader、external、factory 或 schema 错误。
5. 页面/Slot/设置入口出现，调用 Host 后返回预期结果。
6. 重载、卸载和再次安装后没有重复 UI、事件或服务。

## 固定故障树

遇到“插件不可用”时按加载链路逐层定位，不要一开始修改业务代码。

### 1. Host 与 Client 都未加载

检查顺序：

- profile 依赖是否包含插件包。
- bundle 列表是否包含插件，patch 是否被实际应用。
- `cordis.patch.yml`/`dsh.bundle.patch` 路径是否正确，patch 中 package name 是否等于 manifest `name`。
- profile 是否仍使用旧的 lockfile 或缓存；用隔离 profile 重现。

### 2. Host 已加载但 Client 未注入

检查：

- `dsh.client` 是否存在且 platform/inject 字段正确。
- `exports["./client"]` 是否存在并指向正确文件。
- `lib/client.js` 是否生成并被 npm `files` 包含。
- DSH Web profile 是否支持当前声明的 Client 平台和入口。

### 3. Client 已下载但入口未注册

检查：

- ModuleLoader 的 `id` 是否稳定且与宿主预期一致。
- factory 是否在最小 `require` 环境中抛异常。
- 是否引用了宿主未提供的 external，或把 external 名称写成了错误版本/路径。
- bundle 是否因语法、格式或 CJS wrapper 错误而在入口前停止。

### 4. 入口已注册但 UI 不显示

检查：

- 页面、Slot key 和设置 key 是否与宿主注册表一致。
- 所需 inject 服务是否已就绪，注册顺序是否正确。
- 条件渲染、权限、路由和配置开关是否使 UI 隐藏。
- 是否在初始化后立即执行了卸载或清理；热重载是否留下旧实例。

### 5. link 可运行但 tarball 失败

检查：

- npm `files` 是否遗漏 `lib`、`lib/client.js`、类型声明或 patch。
- `exports` 是否指向构建后的路径而非源码路径。
- patch 是否被打入 tarball，且内部 package name 没有漂移。
- `prepare`/build 前置脚本是否依赖工作区私有配置、未发布的 shared 包或本机绝对路径。

### 6. Tool 已注册但模型不可见

Tool 通过 `ctx.tools.register(defineTool({...}))` 注册后，在浏览器 Console 可以看到插件加载日志，但模型（AI）的工具列表中不出现该 Tool。

**原因**：DSH 的工具可见性与会话生命周期绑定。Tool 注册成功后，只在**新创建的会话**中可见。重启 DSH Web 后，旧会话仍然使用重启前的工具快照，不会自动刷新。

**排查步骤**：

1. **确认插件已加载**：浏览器 Console 出现插件加载日志（如 `[hello-plugin] plugin loaded!`），证明 `apply` 已执行。
2. **确认 Tool 代码正确**：`defineTool` 参数完整，`inject` 包含 `'tools'`，`output.schema` 和 `render` 符合规范。
3. **检查会话**：当前会话可能是在插件注册前创建的。**创建新会话**（新对话），查看模型工具列表是否出现该 Tool。
4. **检查 tools mode**：如果 `DSH_TOOLS_MODE=code`（或 `tools.config.mode === "code"`），AI 只能看到 `run_code` 一个工具，其他 Tool 被隐藏。检查 profile 的 `cordis.patch.yml` 中 tools 的 mode 配置。
5. **检查工具过滤**：如果其他插件或 preset 调用了 `ctx.tools.restrict({allow: [...]})` 或 `ctx.tools.restrict({deny: [...]})`，可能排除了该 Tool。
6. **检查 scope**：Tool 注册在 `ctx`（通常是全局层），但如果注册时 `ctx` 是 agent scope（如通过 `agent.ctx`），则只有该 agent 可见。

**预防措施**：

- 插件开发阶段，每次修改插件代码并重启 DSH Web 后，**务必创建新会话**来测试 Tool 可见性。
- 如果不想反复创建新会话，可以在 profile 中配置 `dsh.profile.patchReload: "live"`（看 DSH 版本是否支持）。
- 在调试阶段，在插件 `apply` 中加 `console.log('[tool registered]', toolName)` 配合浏览器 Console，确认 `ctx.tools.register` 被执行。
- 正式发布前，在隔离 profile 中创建全新会话完成一次完整的模型调用验收。

## 最小验收命令集

在提交或交给发布流程前，至少保留以下命令的结果：

```bash
pnpm typecheck
pnpm test
pnpm build
npm pack --dry-run --json
npm pack
```

任何一条失败都不能用“开发模式可以打开”作为豁免；应记录失败层级、根因、修复和重跑结果。
