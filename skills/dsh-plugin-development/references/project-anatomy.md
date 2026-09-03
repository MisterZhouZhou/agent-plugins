# 独立 DSH 插件项目结构

本文件用于从零创建独立仓库，或审计一个已有仓库是否具备可构建、可打包和可被 DSH 加载的最小结构。独立插件不应依赖 `dsh-web` monorepo 的目录别名或内部构建配置。

## 推荐目录树

```text
my-plugin/
├── package.json
├── cordis.patch.yml
├── tsconfig.json
├── tsconfig.build.json
├── tsdown.config.ts
├── src/
│   ├── index.ts
│   ├── core/index.ts
│   └── client/index.ts
├── tests/
└── lib/
```

按插件形态裁剪目录：

- Host-only 可以省略 `src/client/` 和浏览器构建配置，但仍保留稳定的公共入口与 Cordis patch。
- Client-only 需要 `src/client/index.ts` 以及浏览器 bundle 配置；Node 入口只保留加载所需的最小身份。
- Full-stack 通常同时保留 `src/core/`、Host 入口和 Client 入口；协议类型与 schema 放在 Core。
- `tests/` 可按仓库习惯改为源码旁的 `src/**/*.test.ts(x)`，但必须覆盖实际公共入口和打包产物。

## 命名与身份

- 插件目录名使用 kebab-case，例如 `my-plugin`；只允许小写字母、数字和单个连字符分隔的片段。
- package name 由插件作者决定，可以使用或不使用 npm scope，例如 `dsh-plugin-my-plugin` 或 `@scope/dsh-plugin-my-plugin`。
- Cordis row id 必须稳定、唯一，并在后续版本中保持不变；不要把版本号、临时目录或随机值放进 id。
- patch 中登记的包名必须与 `package.json#name` 完全一致。
- scope 可选；发布到受限 scope 时，提前确认 registry、访问级别和组织权限，不要把 scope 写死为某个上游组织。

## 源码职责

### `src/index.ts`

公共入口。导出插件的稳定公共 API，并按需要转出 Host、Client 或 Core 的类型。不要在这里隐式执行网络请求、注册全局副作用或读取宿主绝对路径。

### `src/core/index.ts`

跨端协议和纯逻辑入口。放请求/响应类型、事件名、schema、错误码和无环境依赖的函数；不得导入 `node:*`、DOM API 或 Host/Client 单例。

### `src/client/index.ts`

浏览器入口。只有当文件存在并被构建配置纳入时，才构建浏览器半区并生成 `lib/client.js`。它负责页面、Slot、设置和浏览器事件注册，不能携带 Node-only 依赖。

### `cordis.patch.yml`

DSH bundle 的挂载声明。它把插件包的稳定 row id 和包名接入宿主加载 roster；具体字段应与目标 DSH 版本和 `package.json` 中的 `dsh.bundle.patch` 保持一致。

## 构建产物职责

- `lib/index.js`：Node/Cordis 公共入口或 Host 可加载入口。
- `lib/client.js`：浏览器 ModuleLoader 可加载的 Client bundle；只在项目包含 `src/client/index.ts` 时生成。
- `lib/types/`：与公共 exports 对齐的 TypeScript 声明文件，至少覆盖实际发布的入口。
- source map、声明文件和其他产物是否发布，由 `package.json#files` 明确控制；不要依赖 npm 默认忽略规则。

构建目录可以改名，但 `package.json` 的 `main`、`types`、`exports`、`dsh.client` 和 patch 必须共同指向真实存在且相互一致的产物。源码和构建产物不得引用 `dsh-web/shared/*`，也不得依赖只有上游 monorepo 才能解析的路径。

## 独立仓库检查顺序

1. 读取 `AGENTS.md`、README、`package.json`、TypeScript 配置和 patch，确认仓库本身的约定。
2. 先确定插件形态，再删除不需要的半区；不要复制一个包含无关运行时的全家桶模板。
3. 检查入口、构建输出、`exports` 和 `files` 是否形成闭环。
4. 检查 patch row id、包名和 Client bundle id 是否稳定且一致。
5. 在写入前确认目标目录是否为空或不存在；不覆盖用户已有的非空目录。
6. 用构建产物和 `npm pack --dry-run` 检查最终 npm tarball，而不是只检查 `src/`。
