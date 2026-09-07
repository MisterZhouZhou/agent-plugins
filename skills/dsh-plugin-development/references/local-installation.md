# 本地安装与运行时验证

本地安装的目标是验证 DSH 的真实加载链路，而不是只验证 TypeScript 或直接 import 源码。优先使用隔离 profile，避免污染日常 DSH 配置；整个过程不得直接编辑 DSH 源码或手工修改生成后的宿主 bundle。

## 前置检查

在安装前确认：

- 插件仓库已经完成 `pnpm typecheck`、`pnpm test` 和 `pnpm build`。
- `package.json` 的 `name`、`version`、`exports`、`files` 和 DSH 字段已检查。
- 如果是 Client/Full-stack，`lib/client.js` 已生成；如果是 Host-only，没有残留 Client 声明。
- `cordis.patch.yml`/`dsh.bundle.patch` 在插件包根目录，且 patch 中的包名与 manifest 一致。
- 已确认目标 DSH 宿主、profile 和 SDK cohort；不把本机恰好安装的版本默认为兼容版本。

## 路径一：源码 link

源码 link 适合快速迭代 Host、Client 和 patch。先在插件仓库构建，再把插件根目录挂入隔离的 web profile：

```bash
pnpm build
dsh plugin --profile web add link:/absolute/path/to/plugin
dsh --profile web --dump-config
dsh --profile web
```

其中 `link:/absolute/path/to/plugin` 必须指向包含 `package.json`、构建产物和 patch 的插件项目根目录，不要指向 `src/` 或单个 `.ts` 文件。

开发循环建议：

1. 修改源码。
2. 重新执行 `pnpm build`（必要时运行 `pnpm dev`/watch）。
3. 重启或按宿主支持的方式重载 `dsh web`，确保读取了新 bundle。
4. 重新检查 Host 日志、浏览器 Network 和 Console。
5. 完成 link 验证后，再执行 tarball 路径验证；两者不能互相替代。

如果宿主不支持对 link 包自动刷新，停止并重新启动 DSH Web；不要直接修改已生成的 DSH bundle 来“验证”效果。

## 路径二：tarball

tarball 路径用于模拟用户从 npm 安装插件，能发现 `files`、exports、patch 和构建前置脚本问题：

```bash
npm pack
# 下面的文件名以 npm pack 实际输出为准

dsh plugin --profile web add /absolute/path/to/package.tgz
dsh --profile web --dump-config
dsh --profile web
```

安装前可先在临时目录验证包的消费方式：

```bash
TMP_DIR="$(mktemp -d)"
cd "$TMP_DIR"
npm init -y
npm install /absolute/path/to/package.tgz
node -e "import('你的包名').then(() => console.log('host entry ok'))"
```

如果插件有 Client 入口，应额外验证：

```bash
node -e "import('你的包名/client').then(() => console.log('client export ok'))"
```

上述 Node import 只验证 exports 可解析，不能替代浏览器 ModuleLoader 冒烟。最终仍需执行 DSH profile 安装和 `dsh web`。

## 源码 overlay 与 profile 的区别

在 DSH 官方源码 checkout 内，未打包的临时插件可以通过 overlay 直接运行：

```bash
pnpm dsh web --patch /absolute/path/to/local-dev.patch.yml
```

这条路径适合快速试验源码和 patch；它不等于 `dsh plugin --profile ... add` 的安装链。profile 会维护自己的 `dsh.profile` bundle 列表，正式验收应从 link 和 tarball 两条路径都走一遍。

## profile 与宿主验证

安装完成后，按以下顺序检查，保留关键输出或截图：

### 1. profile 依赖和 bundle

- profile 的依赖清单出现插件包名和正确版本/来源。
- bundle 列表包含插件；patch 应用没有 YAML、路径或 package name 错误。
- link 路径是绝对路径，tarball 路径指向刚生成的文件，而不是旧包。
- 如果宿主有 lockfile 或缓存，确认它没有继续使用上一版本。

### 2. Host 日志与服务图

- Host 入口被加载，插件服务达到预期生命周期状态。
- 配置解析成功；失败时显示结构化错误，而不是未处理的堆栈。
- 事件、命令、定时器和子进程只注册一次。
- 重载/退出后资源被释放，没有端口、进程或文件锁泄漏。

### 3. 浏览器 Network

对 Client/Full-stack 插件检查：

- Client bundle 请求成功，路径、状态码和 MIME 类型符合宿主要求。
- 请求的依赖或 external 能由宿主提供；没有 404 的平台模块。
- bundle 内容没有 Node-only import、宿主绝对路径或测试代码。
- 若请求成功但 UI 不出现，转到 Console 和页面/Slot 注册检查，不要重复修改 npm 清单。

### 4. 浏览器 Console

关注以下类别：

- ModuleLoader `id` 重复、缺失或格式不匹配。
- factory 执行异常、CJS wrapper 错误、未知 external。
- 页面、Slot、设置注册 key 不存在或 inject 服务未就绪。
- schema 校验失败、Host 响应错误或跨端协议版本不匹配。
- 卸载/热重载后重复注册和样式残留。

### 5. UI 与跨端行为

- 页面、Slot 或设置卡出现在正确位置，标题、权限和可见条件正确。
- Client 通过稳定 Core 协议调用 Host；不绕过 Host 直接访问文件系统或秘密。
- 成功、失败、超时、取消和重试行为均有可理解的反馈。
- 刷新、切换路由、禁用配置、卸载和再次安装后，状态不会串到旧实例。

## link 与 tarball 的差异诊断

| 现象 | 优先检查 |
| --- | --- |
| link 和 tarball 都失败 | DSH 版本、profile 依赖、patch 语法、Host 入口和服务依赖 |
| 只有 link 成功 | `npm files`、`exports`、tarball 内的 `lib`/patch、prepare/build 前置脚本 |
| 只有 tarball 成功 | link 指向错误目录、旧构建产物、profile 缓存或路径权限 |
| Host 成功、Client 失败 | `dsh.client`、`exports["./client"]`、`lib/client.js`、ModuleLoader wrapper 和 external |
| Client 下载成功、UI 失败 | ModuleLoader ID、factory、页面/Slot key、inject 顺序、卸载状态 |

## 不允许的本地验证方式

- 不得直接编辑 DSH 源码、生成后的宿主 bundle 或安装目录来绕过 patch。
- 不得只执行 `npm link` 就声称完成 DSH 安装验证；应使用 DSH 支持的 `link:` profile 入口。
- 不得只在插件源码目录 `import` 源文件；至少要验证构建产物和 tarball。
- 不得把开发机已有的全局包、旧 profile 或浏览器缓存当作可重复的验证环境。
- 不得在日志、截图或临时包中提交密钥、`.env`、用户数据和绝对路径等敏感信息。

## 验收记录模板

```text
目标宿主/版本：
测试 profile：隔离 profile 名称或路径
源码 link：成功/失败；包根目录：
tarball：成功/失败；文件名：
Host 加载：
Client 请求：
ModuleLoader 注册：
页面/Slot/设置：
卸载与重载：
发现的问题与修复：
复验时间：
```

## 会话 UI 插件的安装故障补充

`dsh plugin --profile web add/remove` 修改的是整个 profile 的依赖图，不一定只处理当前插件。若执行过程中出现大量包重新安装，并卡在某个无关依赖的 `postinstall`，例如 `cloudflared` 下载二进制，应将其判定为 profile 安装链阻塞，而不是当前 Client 功能缺失。

排查顺序：

1. 先确认插件是否使用 `link:`。如果是，重新构建 `lib/client.js` 后通常只需重启或强制刷新 DSH Web，不要为了刷新本地代码反复 remove/add。
2. 如果是 tarball，确认重新生成了新的 `.tgz`，再安装新包；不要把旧 tarball 当成新构建。
3. 如果必须重新整理 profile，先从 profile lockfile/package manifest 查出引入阻塞包的插件或功能。
4. 不要直接编辑宿主生成的 bundle 或安装目录绕过问题；应使用 DSH 支持的插件管理、依赖移除、网络代理或脚本策略。
5. 安装完成后仍要验证浏览器实际下载的 Client bundle，而不是只确认命令退出成功。
