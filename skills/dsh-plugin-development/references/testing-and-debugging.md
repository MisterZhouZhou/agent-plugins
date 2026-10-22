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

## DSH 宿主启动报错（先于插件排查）

`dsh: startup failed: N required plugins did not activate` 或启动即退，常见以下几类与宿主/环境相关，先于插件代码排查：

1. **webserver `host "0.0.0.0" is an unspecified (wildcard) address ... not supported`**：0.2.x 拒绝通配地址（会把远程代码执行暴露到网络）。把 profile 的 webserver `host` 改成具体地址：`127.0.0.1` 仅本机；要局域网访问再另行评估暴露风险。
2. **webserver `listen EADDRINUSE ... :3080`**：端口被占，多为**重复启动**——已有一个 dsh 实例在跑，又起了一个。先 `pgrep -fl "dsh --profile web"` 和 `lsof -nP -iTCP:3080 -sTCP:LISTEN` 定位占用者，结束旧实例再启动。典型误判：新实例打印 `startup failed`，但**旧实例其实健康、Web UI 仍可访问**——别据此以为代码坏了而反复重启。保持单实例，别在已有实例活着时再敲启动命令。
3. **`SyntaxError: ... does not provide an export named 'X'`**：ESM 命名导出的**版本 gap**——插件的 `@deepseek-ai/dsh-tools` 等 SDK 与 dsh 运行时 cohort 不一致，上游改名/删除了某导出（例：`dsh-tools@0.1.x` 里 `import { CallId }`，而 `dsh-llm@0.2.x` 只导出 `ToolCallId`）。把 SDK 依赖对齐到运行时版本（如运行时 `0.2.1-rc.2` 就把 `dsh-tools` 固定到 `0.2.1-rc.2`）后重装重建。

附：`dsh: skipping profile bundle "<pkg>": ... incompatible with dsh 0.2.1-rc.2: requirements {...}` 且 `Exact-version exemption: not active`，是该 bundle 的 peerDependencies 只兼容 0.1.x，被宿主**跳过**。它**不阻塞启动**，但该插件及其贡献的 slot 不生效，可能连带 `slot "..." is not declared` 警告（如 better-sidebar 被 skip 后其他插件往它声明的槽位注册被拒）。要启用需升级该插件或用 `dsh plugin allow-version` 授权 exact-version。

## 固定故障树

遇到“插件不可用”时按加载链路逐层定位，不要一开始修改业务代码。

### 设置页可见但提示 unavailable（0.2.0-rc.2）

先核对实际 Host/profile 和编译依赖版本，再核对 Host entry id、运行状态和 Config 的 volatile 字段。Client 使用 `configForms.get(entryId)`；检查实际 lib 是否仍有旧 `webUiSettings.bind()`，并确认嵌套字段读写和连接 mode。标签页存在不能证明 Host 表单存在，源码正确不能证明加载产物正确。完整顺序及验证案例见 [设置迁移参考](settings-0.2-migration.md)。

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

「设置面板看不到标签页」两个高发根因（都**不报错**，必须回读构建产物确认）：

- `settings.section` 是 list 槽位，注册项缺 `id` 会被 `SlotCore` 直接拒绝 → 标签页静默不出现。典型错误是把 `slots.register` 拆成 `(spec, options, component)` 三参数形式，把 `id` 放进了第二个对象。正确形式是单对象 `register({ name, id, order, label, inject }, Component)`。
- 注册项的 `inject` 必须是**函数**（`() => ({ scope })`），不是对象字面量。写成 `inject: { scope }` 时组件收不到注入值。

确认方法：`grep -n "slots.register" dist/client.js`（或 `lib/client.js`），核对 `id` 与 `inject` 形状。

### Host 报 `xxx service missing` 但服务其实在

`ctx.get('settings')` 返回 undefined ≠ 服务缺失：更常见是插件 `inject` 漏了这个名字，导致 Cordis 没把服务接线进当前 fiber。先 `dsh --profile <p> --dump-config` 确认服务真的在树里，再把名字加进 `inject`（`ctx.get` 与 `ctx.<service>` 都是这个规则）。详见 `references/host-development.md`「可选服务的 ctx.get 与 inject」。

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

## 排查工具：最小 probe 启动 + boot graph 快照

不污染正式 profile 的前提下，隔离复现「Host 已加载但 client 现象不对」的最快路径：

1. 复制 `~/.dsh/profiles/<profile>` 到临时 probe 目录，软链 `node_modules`（或用 `DSH_HOME` 指向临时目录）。
2. 写一个 probe overlay 覆盖端口（`probe.yml`），随插件 overlay 一起 `--patch`：
   ```yaml
   - id: webserver
     name: '@deepseek-ai/dsh-host-webserver'
     config:
       host: '127.0.0.1'
       port: 3099
   ```
3. 用任务专用临时目录设置 `DSH_HOME=<probe>`，执行 `dsh web --patch <插件 overlay> --patch probe.yml`；先确认目标 CLI 支持该隔离方式。检查插件加载状态与本地访问 URL，不要求必有某条 `apply` 或 namespace 注册日志。对 `0.2.0-rc.2` 设置表单，应在认证连接的 `settings.describe()` 返回中核对目标 `ns` 和字段；不要通过改写 HOME 混用临时 profile 与用户环境。
4. 用 token 走完登录跳转拿到 cookie 后：
   - 抓 index 页，解析 `window.__DSH_BOOT__.entries`，确认含本插件 id；这证明已进入 Client 启动装配图，执行、服务注入和 UI 行为仍需另行验证。
   - 抓 `/plugins/??<id>/client.js&rev=<rev>`（带 cookie），确认 200，且 wrapper 里 `id` 与包名一致、`slots.register` 的形状正确。
5. 常见落点定位：
   - `entries` 没有本包 → `dsh.client`/`exports["./client"]` 缺失，或 overlay 里条目 `name` 写成了源码路径而不是包名。
   - `entries` 有本包、bundle 也 200，但 UI 不显示 → slot register 的 `id`/`inject` 形状（见故障树 #4）。
   - Host 日志出现 `settings service missing` → 插件 `inject` 漏声明（见上方 Host 误报条目）。

> 正式页面带认证：裸 `curl` 拿到 401/404 是网关表现，不代表 bundle 路由不存在；必须带 token/cookie 才能读 boot graph 和 bundle。probe 服务器用完要 kill，避免占端口。

## 最小验收命令集

逐项记录证据范围：typecheck/test/build 只证明对应开发环境与测试覆盖；ModuleLoader stub 证明产物形状和桩内行为；目标 SettingsForms 的隔离投影检查不等于真实 profile 持久化或通知事件验收。浏览器实测应确认显示、写入、刷新后保留和业务生效。未执行项明确标记，不能以 boot graph、HTTP 200 或新 lib 已生成替代真实交互结论。

在提交或交给发布流程前，至少保留以下命令的结果：

```bash
pnpm typecheck
pnpm test
pnpm build
npm pack --dry-run --json
npm pack
```

任何一条失败都不能用“开发模式可以打开”作为豁免；应记录失败层级、根因、修复和重跑结果。

## 浏览器实机调试（chrome-devtools MCP）

Client UI 问题（按钮不出现、抖动、闪烁、定位错）不要靠猜——直接连上用户正在运行的 DSH 页面实测。经验来自 dsh-session-manager 回退按钮的多轮排查：三次猜测性修复都不如一次实机测量。

### 接入步骤

1. 找进程与端口：`ps aux | rg dsh`；`lsof -iTCP -sTCP:LISTEN -P | rg node`（dsh web 默认 3080）。
2. dsh web 需要认证。带 token 的 URL 在用户浏览器历史里（Chrome 运行中时 History 库被锁，先复制再查）：
   ```bash
   cp ~/Library/Application\ Support/Google/Chrome/Default/History /tmp/chrome-history.db
   sqlite3 /tmp/chrome-history.db "SELECT url FROM urls WHERE url LIKE '%3080/?token=%' ORDER BY last_visit_time DESC LIMIT 1;"
   ```
3. 用 chrome-devtools MCP `new_page` 打开带 token 的 URL，后续 `navigate_page`（reload + `ignoreCache: true` 硬刷新加载新构建的 client.js）、`evaluate_script`、`take_screenshot` 全程可用。**host 代码变更仍需用户重启 dsh**；client 代码只需硬刷新。
4. 改完即验：`pnpm build` → `ignoreCache` reload → 测量脚本 → 数字确认，闭环在一两分钟内。

### 插件自带的诊断开关

在插件 client 里内置 `localStorage` 调试开关 + sync 签名行（状态变化才输出一行），实机排查时一行就能定位卡在哪层：

```ts
const debugEnabled = () => { try { return localStorage.getItem('dshXxxDebug') === '1' } catch { return false } }
// sync 末尾:JSON.stringify({ sessionId, hasChat, rows, resolved, candidates, pills })
console.debug('[dsh-xxx] sync:', signature)
```

### 抖动/闪烁类问题的测量方法（不要用肉眼和猜测）

- **滚动抖动**：rAF 循环采样滚动容器（`[data-conversation-scroll]`）`scrollTop`，记录 |Δ|>2px 的跳变序列——修复前实测 `+30px@71ms → -30px@93ms`，修复后 `[]`。
- **闪烁帧数**：rAF 循环里检查目标内容的可见性/文本，统计出现帧数——"加载中"闪 1 帧也能量化。
- **布局跳动**：MutationObserver 采样 + 挂载/落定两个时刻 `getBoundingClientRect()` 对比（top/left/height delta）。
- **测量脚本的匹配条件要可靠**：曾用"文本包含某字符串"判断命令行是否可见，实际渲染文本不含该字面量，得出"0 帧可见"的假阴性结论。优先按结构性属性（`data-chat-flow-kind`、class、几何）判断，不按渲染文本。

### 类型包对照法（先于实机排查）

对“老插件在新宿主上功能失效”类问题，先 `npm pack` 对应版本的 `@deepseek-ai/*` 包、直接读 `.d.ts` 对照插件里的 duck-type 假设，常能一步定位：曾一次对照就发现 `UserMessageNode` 已无 `visibility` 字段、`ISessions.fork` 的注释明确写着“fork 只入目录、binding 需先 retain”。比逐个实机试探便宜得多。版本取运行时的真实版本（`ps`/lockfile/宿主 node_modules 里查）。

### 症状分两层：按钮渲染 vs 点击失败

“功能不生效”要先区分两层，修法完全不同：

1. **按钮不渲染** = 数据链路断（快照读取、节点字段、目标计算）——用调试签名行逐字段看（hasChat/candidates/…）。
2. **按钮在但点击失败** = 执行链路断（命令通道、宿主 API 语义变化）——点一次看按钮 title 的失败信息与 console。

两层可能同时断（如 0.2.1 上的刷新：visibility 断了渲染，fork 语义断了执行），修完一层务必再实测到第二层。

### 按层定位 Client UI 问题（实测顺序）

1. 插件样式是否注入（`style[data-xxx]` 存在）——证明 client bundle 加载、install 运行。
2. 调试签名行：`hasChat / rows / resolved / candidates / pills` 逐层看断在哪。
3. 行身份属性实际值：`data-chat-anchor-key` / `data-chat-node-key` / `data-chat-flow-key` 是否存在、能否映射到快照节点。
4. 快照读取路径是否返回 undefined（0.2.1 的 `target('chat')` vs 旧 `views.get('chat')`）。
5. 当前会话解析（0.2.1 无 `current` 字段，看 `retainedBy.mainView`）。
