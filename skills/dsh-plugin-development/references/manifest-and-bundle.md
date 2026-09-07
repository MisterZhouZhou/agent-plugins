# Manifest 与 Bundle 规范

本文件定义独立 DSH 插件发布包必须向 DSH/Cordis 暴露的清单、入口和 bundle patch。它服务于 Host-only、Client-only 和 Full-stack 三种形态；具体形态先由 `references/architecture.md` 决定，再按本文件删减不需要的入口。

## 1. 最小完整清单

下面是一个同时包含 Host 与 Client 入口的 Full-stack 插件最小示例。`USER_VERIFIED_VERSION` 是占位符，生成或发布前必须替换为执行时确认过的 DSH 版本范围，不能把它当作固定版本号提交。

```json
{
  "name": "@scope/dsh-example",
  "version": "0.1.0",
  "type": "module",
  "main": "lib/index.js",
  "types": "lib/types/index.d.ts",
  "exports": {
    ".": {
      "types": "./lib/types/index.d.ts",
      "default": "./lib/index.js"
    },
    "./client": {
      "types": "./lib/types/client/index.d.ts",
      "default": "./lib/client.js"
    },
    "./package.json": "./package.json"
  },
  "dsh": {
    "engines": { "dsh": ">=USER_VERIFIED_VERSION" },
    "bundle": { "patch": "./cordis.patch.yml" },
    "client": {
      "platform": "web",
      "inject": ["@deepseek-ai/dsh-client-runtime"]
    }
  },
  "files": ["lib/**/*.js", "lib/**/*.js.map", "lib/**/*.d.ts", "cordis.patch.yml", "README.md", "LICENSE"]
}
```

### Config 与运行时依赖

如果入口导出 `Config` 类型和同名运行时 schema，schema 包必须作为运行时 `dependencies` 声明：

```json
{
  "dependencies": {
    "@deepseek-ai/schemastery": "<与宿主验证过的版本范围>"
  }
}
```

Tool 还必须声明 `@deepseek-ai/dsh-tools`，并在代码中导出 `inject: ['tools']`。Tool 的 schema、渲染和执行契约见 `references/tool-development.md`。不要仅因为某个包能在当前机器解析，就把它列为 Client external。

### 字段一致性

| 字段 | 约束 | 检查重点 |
| --- | --- | --- |
| `name` | 必须是最终发布名，例如 `@scope/dsh-example`。 | 该值必须同时出现在 `cordis.patch.yml` 的插件节点中；不要在 patch 中写另一个包名。 |
| `version` | 遵循 npm semver；首次开发可从 `0.1.0` 开始。 | 发布前确认版本没有覆盖已发布版本，预发布版本要明确 dist-tag。 |
| `type` | 独立工程使用 `module`。 | 源码、构建配置和导出路径都要按 ESM 工程解析；Client bundle 的运行格式另行设为 CJS。 |
| `main` | 指向 Host/公共入口的实际构建文件。 | `lib/index.js` 必须在 `npm pack` 后存在，并且能被 DSH 加载。 |
| `types` | 指向公共入口声明文件。 | 文件路径必须与构建器实际输出一致；声明文件不可指向源码路径。 |
| `exports["."]` | 暴露公共入口的声明与运行文件。 | `types` 和 `default` 都应为 `./` 开头的包内路径。 |
| `exports["./client"]` | 仅 Client/Full-stack 保留。 | `lib/client.js` 和对应声明文件必须实际生成并进入 npm tarball。 |
| `exports["./package.json"]` | 保留给运行时读取公开元数据的场景。 | 不要通过未声明的深层路径暴露源码或构建内部文件。 |
| `dsh.engines.dsh` | 使用已验证的 DSH 兼容下限或范围。 | 先检查目标宿主和官方 SDK，再填写具体值；不要声称当前值永久是最新版。 |
| `dsh.bundle.patch` | 必须是相对于 package 根目录的路径。 | `./cordis.patch.yml` 在打包后仍须存在，且文件名大小写一致。 |
| `dsh.client.platform` | Client/Full-stack 声明目标客户端平台，例如 `web`。 | Client-only 和 Full-stack 都需要；Host-only 不应声明无用的 Client 配置。 |
| `dsh.client.inject` | 只列出执行时确认由宿主提供的模块。 | 每个 external 都必须在宿主模块表中存在；普通第三方依赖不能因为“看起来常用”就 external。 |
| `files` | 只发布运行所需的构建产物、patch、文档和许可证。 | 用 `npm pack --dry-run` 检查，不能漏掉入口、声明、source map 或 patch。 |

## 2. 按插件形态裁剪

### Host-only

Host-only 插件只提供 Cordis/Node 侧能力：

1. 删除 `exports["./client"]`。
2. 删除整个 `dsh.client` 对象。
3. 不构建或发布 `lib/client.js`、`lib/types/client/**`。
4. `files` 只保留公共/Host 构建产物及 `cordis.patch.yml`、README、LICENSE。

Host-only 不因为没有 UI 就省略 `cordis.patch.yml`。只要插件要由 DSH bundle/profile 挂载，就必须让 patch 把包名插入宿主插件列表。

### Client-only

Client-only 插件保留 `exports["./client"]` 和 `dsh.client`。公共根入口可以只承担插件身份和类型导出，但不能让 DSH 在 Host 侧误以为存在服务端能力。需要根据目标宿主的 bundle 机制确认根入口是否仍须参与 patch；不要凭经验添加未被宿主识别的字段。

### Full-stack

Full-stack 插件同时保留：

- 根入口：Host 或公共 Cordis 入口。
- `./client`：浏览器 bundle 的入口。
- `dsh.client`：平台与宿主注入模块声明。
- `dsh.bundle.patch`：将插件挂载到宿主 bundle/profile。

Host 与 Client 间共享的事件名、请求/响应 DTO、schema 和纯函数放在 Core 层，不通过 `exports` 暴露未经审查的内部文件。

## 3. Cordis bundle patch

最小 patch 示例：

```yaml
- insert:
    - id: ui-example
      name: '@scope/dsh-example'
```

### patch 规则

- patch 文件路径由 `dsh.bundle.patch` 指定，并且是 package 相对路径，不是仓库根目录相对路径，也不是安装后机器上的绝对路径。
- `name` 必须与 manifest 的 `name` **完全相等**，包括 npm scope、大小写和连字符。
- `id` 是稳定的 Cordis row id。创建后不要因为改了显示名就随意重命名；否则可能造成重复挂载或旧配置无法迁移。
- patch 只描述“如何把插件挂载进宿主”，不把业务配置、密钥或本机绝对路径写进 patch。
- 如果宿主当前要求额外的 `inject`、配置路径或 profile 字段，先从执行时确认的宿主契约中取得，再扩展 patch；不要把某次仓库内部的隐式字段复制成通用规则。

## 4. 入口与构建产物对照

独立项目应保持以下对照关系：

```text
src/index.ts           -> lib/index.js
src/client/index.ts    -> lib/client.js
src/index.ts           -> lib/types/index.d.ts
src/client/index.ts    -> lib/types/client/index.d.ts
cordis.patch.yml       -> package 根目录下的 cordis.patch.yml
```

如果插件是 Host-only，删除 Client 两行；如果是 Client-only，确保 `lib/client.js` 的构建和发布不依赖只在 Node 环境存在的模块。

在提交 manifest 前逐项执行：

1. 构建项目。
2. 检查 `main`、`types` 和 `exports` 指向的文件都存在。
3. 检查 `cordis.patch.yml` 存在，且 patch 中的 `name` 与 manifest 一致。
4. 执行 `npm pack --dry-run`，确认 `files` 没有漏包或意外带入源码、密钥和本机配置。
5. 从实际 tarball 安装，而不是只从源码目录导入，验证 DSH 看到的清单与构建产物一致。

## 5. 依赖与版本范围

- 官方 DSH SDK、运行时和宿主提供的模块要根据目标 DSH 版本成组确认；不要混用未经验证的 SDK cohort。
- 只有真正随包发布、且运行时需要的第三方包放入 `dependencies`；仅用于类型或构建的包放入 `devDependencies`；由宿主保证的共享运行时才考虑 `peerDependencies`。
- `dsh.client.inject` 与 package dependencies 是两个不同概念：前者表示“宿主在运行时提供并可被 external 的模块”，后者表示“插件安装包如何满足代码依赖”。两者不能互相替代。
- 不深度导入 DSH 内部源码，不把 `dsh-web/shared/*` 或本机工作区路径写进发布包的 `exports`、构建配置和产物。
