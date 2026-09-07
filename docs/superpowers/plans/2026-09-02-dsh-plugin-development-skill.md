# 通用 DSH 插件开发 Skill Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在 `skills/dsh-plugin-development/` 落地一个可指导并辅助 Agent 从零创建、测试、本地安装和发布独立 DSH 插件的 Skill。

**Architecture:** `SKILL.md` 只承担触发、路由和质量门禁；DSH 架构、清单、Host、Client、测试与发布知识拆分到 `references/`。确定性的项目初始化与发布前静态检查分别由 `scripts/scaffold.mjs` 和 `scripts/validate.mjs` 实现，配套 Node 内建测试与三类行为评测。

**Tech Stack:** Markdown、Node.js ESM、Node `node:test`、JSON、YAML、DSH/Cordis、TypeScript、tsdown、Vitest。

## Global Constraints

- Skill 目录固定为 `skills/dsh-plugin-development/`，skill 名固定为 `dsh-plugin-development`。
- 支持 Host-only、Client-only 和 Full-stack 三种插件形态；Full-stack 使用 Core 共享纯类型和协议。
- 生成工程必须能脱离 `dsh-web` monorepo，不得引用 `dsh-web/shared/*`。
- 不得写死 `@linxin666` 或其他第三方 npm scope；包名和 scope 必须来自用户输入。
- 不把 2026-09-02 的 SDK、Node、pnpm 或 DSH 版本描述成永久最新版。
- 不深度导入 DSH 内部源码；优先官方 `@deepseek-ai/*` npm SDK 和公开 Cordis 接口。
- 不覆盖非空目标目录，除非未来调用者明确提供单独设计过的覆盖能力；本计划不实现覆盖选项。
- 不自动执行正式 npm 发布；发布前必须展示精确包名、版本、registry、access 和 dist-tag 并获得确认。
- 不修改或提交当前工作区已有的 `skills/agent-cli-skill/references/pi/extensions.md` 与 `skills/agent-cli-skill/references/pi/testing.md` 改动。
- 新增脚本必须支持 `--help`，参数错误或环境无效退出 `2`，校验失败退出 `1`，成功退出 `0`。

---

## File Responsibility Map

| 文件 | 职责 |
|---|---|
| `skills/dsh-plugin-development/SKILL.md` | Skill 触发、任务分类、主流程、引用路由和安全门禁 |
| `references/architecture.md` | Host、Client、Core 边界与插件形态决策 |
| `references/project-anatomy.md` | 独立仓库目录、入口、构建产物和命名规则 |
| `references/manifest-and-bundle.md` | `package.json`、`dsh.bundle.patch`、`dsh.client`、exports、Cordis patch |
| `references/host-development.md` | Host 生命周期、服务、配置、资源和错误边界 |
| `references/client-development.md` | ModuleLoader 客户端产物、平台模块、页面/Slot/设置 UI 与卸载 |
| `references/testing-and-debugging.md` | 分层测试、产物纯度、tarball 和加载故障树 |
| `references/local-installation.md` | link、tarball、profile 安装和运行时验证 |
| `references/publishing.md` | prerelease、npm pack、发布确认和发布后冒烟 |
| `references/upstream-compatibility.md` | 2026-09-02 基线、动态版本确认顺序和来源链接 |
| `scripts/lib.mjs` | 模板遍历、占位符替换、参数解析和 manifest 读取共享函数 |
| `scripts/scaffold.mjs` | 创建 host/client/fullstack 独立插件工程 |
| `scripts/validate.mjs` | 静态检查 manifest、patch、exports、files、版本范围和 tarball |
| `scripts/tests/scaffold.test.mjs` | 脚手架三种形态和拒绝覆盖测试 |
| `scripts/tests/validate.test.mjs` | 校验器成功及主要失败类型测试 |
| `assets/standalone-template/package.json.tmpl` | 独立发布包的基础 scripts、dependencies、exports 和 files 模板 |
| `assets/standalone-template/LICENSE.tmpl` | 默认 MIT 许可证文本，发布前允许用户改为其选择的许可证 |
| `assets/standalone-template/*` | 不依赖上游 monorepo 的其余最小插件模板 |
| `evals/evals.json` | Skill 行为评测场景 |

---

### Task 1: 创建 Skill 入口和架构路由

**Files:**
- Create: `skills/dsh-plugin-development/SKILL.md`
- Create: `skills/dsh-plugin-development/references/architecture.md`
- Create: `skills/dsh-plugin-development/references/project-anatomy.md`
- Test: `/Users/cheyipai/.codex/skills/.system/skill-creator/scripts/quick_validate.py`

**Interfaces:**
- Consumes: 已确认设计文档 `docs/superpowers/specs/2026-09-02-dsh-plugin-development-skill-design.md`。
- Produces: Skill 触发描述、任务路由、插件形态决策和后续引用文件名。

- [ ] **Step 1: 建立目录并验证缺少入口时失败**

```bash
mkdir -p skills/dsh-plugin-development/references
python /Users/cheyipai/.codex/skills/.system/skill-creator/scripts/quick_validate.py skills/dsh-plugin-development
```

Expected: 非零退出，并报告缺少 `SKILL.md`。

- [ ] **Step 2: 写入 `SKILL.md`**

```markdown
---
name: dsh-plugin-development
description: 从零创建、实现、测试、调试、本地安装或发布独立 DSH 插件；适用于 Host、Web Client、Full-stack、Cordis patch、ModuleLoader bundle 和 npm 打包任务。不用于与 DSH 无关的普通 Cordis 插件。
---

# DSH Plugin Development

先读取项目级 `AGENTS.md`、`README`、`package.json` 和已有 patch；保留用户现有结构与未提交改动。

## 路由

| 任务 | 必读 |
|---|---|
| 选型或新建插件 | `references/architecture.md`、`references/project-anatomy.md`、`references/manifest-and-bundle.md` |
| Host 能力 | `references/host-development.md` |
| Client UI | `references/client-development.md` |
| 测试或故障排查 | `references/testing-and-debugging.md` |
| 本地安装 | `references/local-installation.md` |
| npm 发布 | `references/publishing.md`、`references/upstream-compatibility.md` |
| 最新兼容版本 | `references/upstream-compatibility.md`，并按环境联网规则重新核实 |

## 主流程

1. 判断 Host-only、Client-only 或 Full-stack；只创建需求需要的半区。
2. 确定目标 DSH 版本，再选择同一兼容 cohort 的官方 SDK。
3. 新项目优先运行 `node scripts/scaffold.mjs`；已有项目先审计再补文件。
4. 先定义 Core 协议，再实现 Host 和 Client；跨端只交换可序列化数据。
5. 运行单元测试、构建、`node scripts/validate.mjs <project>` 和 tarball 安装测试。
6. 使用 link 或 tarball 安装到隔离 profile，验证 Host 与 Client 两条加载链。
7. 发布前展示包名、版本、registry、access、dist-tag 和 pack 文件表，等待明确确认。

## 硬约束

- 运行时代码只使用公开 SDK；不深度导入 DSH 源码。
- Client bundle 只能 externalize 宿主 ModuleLoader 实际提供的平台模块，其余浏览器安全依赖内联。
- `dsh.bundle.patch`、Cordis patch、`exports["./client"]` 和 `dsh.client` 必须彼此一致。
- 不把参考文档中的版本称为最新版；执行时按兼容性文档重新确认。
- 不覆盖非空目录，不自动执行正式 npm 发布，不泄漏密钥、绝对路径或 Host 堆栈。
```

- [ ] **Step 3: 写入架构参考**

`references/architecture.md` 必须完整包含：

```markdown
# DSH 插件架构

## 形态决策

- Host-only：命令、工具、任务、进程、文件系统、服务或无 UI 能力。
- Client-only：页面、Slot、设置卡、浏览器事件；仍可保留一个无业务逻辑的 Node 入口供 bundle roster 加载。
- Full-stack：浏览器需要调用 Host，必须建立 Core 协议。

默认选择最小形态。没有浏览器需求时不声明 `dsh.client`；没有 Host 业务时 Node 入口只承担 Cordis 插件身份。

## 边界

### Host
运行在 Node/Cordis 宿主，负责权限敏感操作、持久化、子进程、网络代理和服务端状态。卸载时释放事件、定时器、子进程和服务。

### Client
运行在 DSH Web 浏览器环境，负责页面、Slot、设置 UI 和交互。不得依赖 `node:*`、裸文件系统、宿主绝对路径或服务端密钥。

### Core
只放类型、schema、事件名、请求响应 DTO 和纯函数。不得引用 DOM、Node API 或带单例身份的运行时对象。

## 跨端协议

使用稳定命名空间 `dsh:<plugin>:<operation>`；请求、响应和事件都必须可序列化并接受运行时校验。Host 返回用户可理解的错误码和安全消息，不向 Client 发送堆栈或本机路径。

## 生命周期

所有注册都应有对应清理路径。优先使用 Cordis effect/dispose 机制；热重载后不得重复注册页面、事件或定时器。
```

- [ ] **Step 4: 写入项目结构参考**

`references/project-anatomy.md` 必须包含独立项目树、kebab-case 命名规则、`lib/index.js`、`lib/client.js`、`lib/types` 的职责，并明确 `src/client/index.ts` 的存在决定是否构建浏览器半区。示例树使用：

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

同时写明：scope 可选、package name 由用户决定、Cordis row id 必须稳定、源码和构建产物不得引用 `dsh-web/shared/*`。

- [ ] **Step 5: 验证入口并提交**

```bash
python /Users/cheyipai/.codex/skills/.system/skill-creator/scripts/quick_validate.py skills/dsh-plugin-development
git add skills/dsh-plugin-development/SKILL.md skills/dsh-plugin-development/references/architecture.md skills/dsh-plugin-development/references/project-anatomy.md
git commit -m "feat: 创建 DSH 插件开发 Skill 入口"
```

Expected: validator 输出 `Skill is valid!`，提交只包含上述三个文件。

---

### Task 2: 沉淀 manifest、Host 和 Client 规范

**Files:**
- Create: `skills/dsh-plugin-development/references/manifest-and-bundle.md`
- Create: `skills/dsh-plugin-development/references/host-development.md`
- Create: `skills/dsh-plugin-development/references/client-development.md`

**Interfaces:**
- Consumes: Task 1 的形态决策与目录约定。
- Produces: 脚手架模板和校验器共同使用的清单、入口和运行时规则。

- [ ] **Step 1: 写入 manifest 与 bundle 规范**

`manifest-and-bundle.md` 必须给出以下完整最小示例，并逐项解释字段一致性：

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

同时包含 patch 示例：

```yaml
- insert:
    - id: ui-example
      name: '@scope/dsh-example'
```

明确 Host-only 删除 `exports["./client"]` 和 `dsh.client`；Client/Full-stack 两者都要保留。说明 `dsh.bundle.patch` 是 package 相对路径，patch 中包名必须等于 manifest `name`。

- [ ] **Step 2: 写入 Host 开发规范**

`host-development.md` 必须包含：Cordis `name`、`inject`、`Config`、`apply(ctx, config)` 公共入口；配置 schema；Service 与 effect 清理；公开 SDK；路径、命令、网络和错误边界；Host 单元测试的依赖注入策略。使用以下最小入口示例：

```ts
export const name = 'example'
export interface Config {}
export function apply(): void {}
```

说明示例是可加载骨架，不代表业务插件可以忽略生命周期和配置校验。

- [ ] **Step 3: 写入 Client 开发规范**

`client-development.md` 必须包含：

- `window.__ModuleLoader__.load({ id, factory })` 产物契约。
- tsdown 使用 CJS browser bundle、`module.exports` intro、banner 和 footer 包装。
- 平台 external 只来自执行时确认的宿主模块表；其他依赖内联。
- 当前基线平台模块示例只作为日期化参考：React、React DOM、Cordis、UI Slots、UI Primitives。
- 页面、Slot、设置卡的选择标准。
- Client 卸载、样式清理和 Node-only 依赖禁止项。
- Client 测试中使用最小 `__ModuleLoader__` stub。

示例包装必须写成：

```js
window.__ModuleLoader__.load({
  id: '@scope/dsh-example',
  factory: (require) => {
    const module = { exports: {} }
    const exports = module.exports
    // 编译后的 Client 模块
    return module.exports
  },
})
```

- [ ] **Step 4: 检查引用可发现性并提交**

```bash
rg -n 'manifest-and-bundle|host-development|client-development' skills/dsh-plugin-development/SKILL.md
rg -n 'dsh\.bundle|__ModuleLoader__|apply' skills/dsh-plugin-development/references
git add skills/dsh-plugin-development/references/manifest-and-bundle.md skills/dsh-plugin-development/references/host-development.md skills/dsh-plugin-development/references/client-development.md
git commit -m "docs: 沉淀 DSH 插件清单与双端规范"
```

Expected: 三个引用文件都能从 `SKILL.md` 路由找到，搜索命中相应关键契约。

---

### Task 3: 沉淀测试、本地安装、发布和上游兼容流程

**Files:**
- Create: `skills/dsh-plugin-development/references/testing-and-debugging.md`
- Create: `skills/dsh-plugin-development/references/local-installation.md`
- Create: `skills/dsh-plugin-development/references/publishing.md`
- Create: `skills/dsh-plugin-development/references/upstream-compatibility.md`

**Interfaces:**
- Consumes: Task 2 的 manifest、Host、Client 契约。
- Produces: 从源码测试到 registry 重装的完整质量门禁。

- [ ] **Step 1: 写入测试与故障树**

`testing-and-debugging.md` 必须按 Core、Host、Client、manifest、build、bundle purity、tarball、installation 八层组织，并包含命令：

```bash
pnpm typecheck
pnpm test
pnpm build
npm pack --dry-run --json
npm pack
```

故障树固定为：

1. Host 与 Client 都未加载：检查 profile 依赖、bundle 列表、patch 路径。
2. Host 已加载但 Client 未注入：检查 `dsh.client`、`exports["./client"]`、`lib/client.js`。
3. Client 已下载但入口未注册：检查 ModuleLoader id、factory 运行异常、未知 external。
4. 入口已注册但 UI 不显示：检查页面/Slot key、inject 服务、顺序和卸载状态。
5. link 可运行但 tarball 失败：检查 npm `files`、exports、patch 和构建前置脚本。

- [ ] **Step 2: 写入本地安装流程**

`local-installation.md` 必须包含源码 link 和 tarball 两条路径：

```bash
dsh plugin --profile web add link:/absolute/path/to/plugin
dsh plugin --profile web add /absolute/path/to/package.tgz
dsh web
```

说明优先使用隔离 profile；安装后检查 profile 依赖、bundles、Host 日志、浏览器 Network 和 Console。不得建议直接编辑 DSH 源码。

- [ ] **Step 3: 写入发布流程**

`publishing.md` 必须包含：npm 身份、包名归属、版本存在性、README/LICENSE、测试、构建、pack、临时目录安装、发布确认、publish、registry 重装。正式发布命令只能作为确认后的命令：

```bash
npm publish --access public --tag next
```

并明确 `latest` 不作为默认 dist-tag；发布前必须展示精确 package/version/registry/access/tag。

- [ ] **Step 4: 写入上游兼容基线**

`upstream-compatibility.md` 必须：

- 标注“调研基线：2026-09-02”。
- 说明用户给出的 `dsh-web` 项目当前内容可能重定向或演进为 `dsh-web-ui`，执行时以仓库实际默认分支和最新模板为准。
- 记录上游来源 URL，不复制整个上游文件。
- 记录版本解析优先级：用户目标版本 → 项目锁定 cohort → 本机宿主 → 上游模板/npm。
- 要求 `@deepseek-ai/*` 包使用相互兼容的 cohort。
- 将 Node 22、pnpm 11、具体 alpha/rc 版本标记为“基线观察”，禁止称为永久要求。
- 记录 Client closure factory、`dsh.bundle.patch` 和 tarball smoke 是高风险兼容点。

- [ ] **Step 5: 自检并提交**

```bash
rg -n '2026-09-02|不得|发布前|npm pack|link:' skills/dsh-plugin-development/references
python /Users/cheyipai/.codex/skills/.system/skill-creator/scripts/quick_validate.py skills/dsh-plugin-development
git add skills/dsh-plugin-development/references/testing-and-debugging.md skills/dsh-plugin-development/references/local-installation.md skills/dsh-plugin-development/references/publishing.md skills/dsh-plugin-development/references/upstream-compatibility.md
git commit -m "docs: 补全 DSH 插件测试与发布流程"
```

Expected: 所有流程文档可被路由，Skill 校验继续通过。

---

### Task 4: 建立独立插件模板和共享脚本函数

**Files:**
- Create: `skills/dsh-plugin-development/scripts/lib.mjs`
- Create: `skills/dsh-plugin-development/assets/standalone-template/package.json.tmpl`
- Create: `skills/dsh-plugin-development/assets/standalone-template/LICENSE.tmpl`
- Create: `skills/dsh-plugin-development/assets/standalone-template/README.md.tmpl`
- Create: `skills/dsh-plugin-development/assets/standalone-template/cordis.patch.yml.tmpl`
- Create: `skills/dsh-plugin-development/assets/standalone-template/tsconfig.json`
- Create: `skills/dsh-plugin-development/assets/standalone-template/tsconfig.build.json`
- Create: `skills/dsh-plugin-development/assets/standalone-template/tsdown.config.ts.tmpl`
- Create: `skills/dsh-plugin-development/assets/standalone-template/vitest.config.ts`
- Create: `skills/dsh-plugin-development/assets/standalone-template/src/index.ts.tmpl`
- Create: `skills/dsh-plugin-development/assets/standalone-template/src/core/index.ts.tmpl`
- Create: `skills/dsh-plugin-development/assets/standalone-template/src/client/index.ts.tmpl`
- Create: `skills/dsh-plugin-development/assets/standalone-template/tests/host.test.ts.tmpl`
- Create: `skills/dsh-plugin-development/assets/standalone-template/tests/client.test.ts.tmpl`
- Create: `skills/dsh-plugin-development/assets/standalone-template/tests/manifest.test.ts.tmpl`

**Interfaces:**
- Consumes: Task 2 的 manifest、ModuleLoader 和入口规范。
- Produces: `scaffold.mjs` 可复制的无 scope 假设模板，以及 `parseArgs()`、`renderTemplate()`、`walkFiles()`、`readManifest()`。模板记录 2026-09-02 上游基线版本，但生成命令允许调用者覆盖 SDK 和 Cordis 版本。

- [ ] **Step 1: 写入共享函数的失败测试草稿**

在下一任务的 `scaffold.test.mjs` 中将直接导入以下签名，因此先固定接口：

```js
export function parseArgs(argv, schema)
export function renderTemplate(source, variables)
export async function walkFiles(root)
export async function readManifest(root)
export function isKebabCase(value)
```

- [ ] **Step 2: 实现 `scripts/lib.mjs`**

```js
import { readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'

export function parseArgs(argv, schema) {
  const result = {}
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index]
    if (token === '--help') return { help: true }
    if (!token.startsWith('--') || !(token.slice(2) in schema)) {
      throw new TypeError(`未知参数：${token}`)
    }
    const key = token.slice(2)
    const value = argv[index + 1]
    if (value === undefined || value.startsWith('--')) {
      throw new TypeError(`参数 --${key} 缺少值`)
    }
    result[key] = value
    index += 1
  }
  return result
}

export function renderTemplate(source, variables) {
  return Object.entries(variables).reduce(
    (output, [key, value]) => output.replaceAll(`__${key}__`, String(value)),
    source,
  )
}

export async function walkFiles(root) {
  const output = []
  for (const entry of await readdir(root, { withFileTypes: true })) {
    const path = join(root, entry.name)
    if (entry.isDirectory()) output.push(...await walkFiles(path))
    else output.push(path)
  }
  return output.sort()
}

export async function readManifest(root) {
  return JSON.parse(await readFile(join(root, 'package.json'), 'utf8'))
}

export function isKebabCase(value) {
  return /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/.test(value)
}
```

- [ ] **Step 3: 写入基础模板**

模板必须使用这些占位符：`__PLUGIN_NAME__`、`__PACKAGE_NAME__`、`__PLUGIN_ID__`、`__DSH_RANGE__`、`__DESCRIPTION__`、`__CORDIS_VERSION__`、`__SDK_VERSION__`。`package.json.tmpl` 必须固定提供 `build`、`prepare`、`watch`、`test`、`typecheck` 脚本，`files` 至少包含 `lib`、`cordis.patch.yml`、`README.md`、`LICENSE`，并使用 2026-09-02 基线 `@deepseek-ai/cordis ^4.0.2`、DSH Client SDK `^0.1.2-alpha.4` 作为可覆盖默认值。核心文件内容：

```yaml
# cordis.patch.yml.tmpl
- insert:
    - id: __PLUGIN_ID__
      name: '__PACKAGE_NAME__'
```

```ts
// src/index.ts.tmpl
export const name = '__PLUGIN_NAME__'
export interface Config {}
export function apply(): void {}
```

```ts
// src/core/index.ts.tmpl
export const protocolNamespace = 'dsh:__PLUGIN_NAME__' as const
```

```ts
// src/client/index.ts.tmpl
export const name = '__PLUGIN_NAME__-client'
export function apply(): void {}
```

`LICENSE.tmpl` 使用 MIT 文本和 `Copyright (c) 2026 DSH plugin contributors`，生成后的 README 明确发布者可在发布前替换许可证。

`tsdown.config.ts.tmpl` 必须生成 Node ESM 和可选 Client CJS 两个配置，Client 配置使用：

```ts
outputOptions: {
  entryFileNames: 'client.js',
  banner: `window.__ModuleLoader__.load({ id: ${JSON.stringify('__PACKAGE_NAME__')}, factory: (require) => {`,
  footer: 'return module.exports; } });',
  intro: 'var module = { exports: {} }; var exports = module.exports;',
}
```

平台 external 初始只包含 React、React JSX runtime、React DOM、Cordis、DSH Client Slots 和 UI Primitives，并在注释中要求执行时按目标宿主核实。

- [ ] **Step 4: 写入测试模板和配置**

`vitest.config.ts` 使用 Node 环境；Host 测试断言 `name` 和 `apply`；Client 测试安装最小 `globalThis.window.__ModuleLoader__` stub 后验证 bundle 注册思想；manifest 测试读取 package.json 和 patch，断言包名、patch 路径和 client export 一致。

- [ ] **Step 5: 检查模板不依赖 monorepo 并提交**

```bash
if rg -n 'dsh-web/shared|@linxin666' skills/dsh-plugin-development/assets skills/dsh-plugin-development/scripts; then exit 1; fi
node --input-type=module -e "import('./skills/dsh-plugin-development/scripts/lib.mjs').then(m => { if (!m.isKebabCase('demo-plugin')) process.exit(1) })"
git add skills/dsh-plugin-development/scripts/lib.mjs skills/dsh-plugin-development/assets/standalone-template
git commit -m "feat: 添加独立 DSH 插件模板"
```

Expected: 禁止依赖搜索无输出，共享函数导入成功。

---

### Task 5: 实现脚手架并覆盖三种形态

**Files:**
- Create: `skills/dsh-plugin-development/scripts/scaffold.mjs`
- Create: `skills/dsh-plugin-development/scripts/tests/scaffold.test.mjs`
- Modify: `skills/dsh-plugin-development/SKILL.md`

**Interfaces:**
- Consumes: Task 4 的模板和共享函数。
- Produces: CLI `node scaffold.mjs --name ... --directory ... --kind ... --package-name ... --dsh-range ... [--cordis-version ...] [--sdk-version ...]`。

- [ ] **Step 1: 写入脚手架失败测试**

测试必须使用临时目录并覆盖：fullstack 文件齐全、host 删除 client/core 声明、client 保留无业务 Node 入口、非法名称退出 `2`、非空目录拒绝覆盖。测试核心：

```js
import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, mkdir, readFile, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'

import { fileURLToPath } from 'node:url'

const script = fileURLToPath(new URL('../scaffold.mjs', import.meta.url))

function run(args) {
  return spawnSync(process.execPath, [script, ...args], { encoding: 'utf8' })
}

test('fullstack 生成 host、core 和 client', async () => {
  const root = await mkdtemp(join(tmpdir(), 'dsh-skill-'))
  const target = join(root, 'demo-plugin')
  const result = run(['--name', 'demo-plugin', '--directory', target, '--kind', 'fullstack', '--package-name', '@acme/dsh-demo-plugin', '--dsh-range', '>=0.1.0'])
  assert.equal(result.status, 0, result.stderr)
  const manifest = JSON.parse(await readFile(join(target, 'package.json'), 'utf8'))
  assert.equal(manifest.name, '@acme/dsh-demo-plugin')
  assert.equal(manifest.dsh.bundle.patch, './cordis.patch.yml')
  assert.equal(manifest.exports['./client'].default, './lib/client.js')
})

test('拒绝非空目录', async () => {
  const root = await mkdtemp(join(tmpdir(), 'dsh-skill-'))
  const target = join(root, 'occupied')
  await mkdir(target)
  await writeFile(join(target, 'keep.txt'), 'keep')
  const result = run(['--name', 'demo-plugin', '--directory', target, '--kind', 'host', '--package-name', 'dsh-demo-plugin', '--dsh-range', '>=0.1.0'])
  assert.equal(result.status, 2)
})
```

补充另外三项断言，不使用网络。

- [ ] **Step 2: 运行测试确认失败**

```bash
node --test skills/dsh-plugin-development/scripts/tests/scaffold.test.mjs
```

Expected: FAIL，原因是 `scaffold.mjs` 不存在。

- [ ] **Step 3: 实现脚手架 CLI**

实现必须：

- `--help` 打印参数和三种 kind。
- 校验全部必需参数。
- 校验 kebab-case、kind、包名非空和 semver range 非空。
- `--cordis-version` 默认 `^4.0.2`，`--sdk-version` 默认 `^0.1.2-alpha.4`；帮助信息和生成 README 必须明确它们是 2026-09-02 基线，可由调用者按目标宿主覆盖。
- 拒绝已有非空目录。
- 遍历模板并替换占位符，`.tmpl` 后缀移除。
- host 删除 `src/client`、`src/core`、client 测试和 client manifest 字段。
- client 删除 `src/core`，保留无业务 Node 入口。
- fullstack 保留全部文件。
- 从 `package.json.tmpl` 读取基础 manifest，再动态删除或补充形态相关字段，避免使用脆弱的 JSON 条件占位符。
- 生成 manifest 包含 `build`、`prepare`、`watch`、`test`、`typecheck`、`files`、`license`、Cordis 和形态所需 Client SDK；不得包含 `private: true`。
- 输出生成路径和 `pnpm install / test / build / validate` 下一步。

Manifest 生成函数固定签名：

```js
function createManifest({ name, packageName, kind, dshRange, cordisVersion, sdkVersion })
```

Client/fullstack 的 manifest 必须有 `exports['./client']` 和 `dsh.client`；host 不得有这两个字段。

- [ ] **Step 4: 运行测试确认通过**

```bash
node --test skills/dsh-plugin-development/scripts/tests/scaffold.test.mjs
node skills/dsh-plugin-development/scripts/scaffold.mjs --help
```

Expected: 所有测试 PASS，帮助输出包含 `host|client|fullstack`。

- [ ] **Step 5: 在 Skill 中补充脚本绝对定位规则并提交**

在 `SKILL.md` 说明先定位 Skill 自身目录，再调用其中脚本，不假设当前目录是 skill 目录。

```bash
git add skills/dsh-plugin-development/SKILL.md skills/dsh-plugin-development/scripts/scaffold.mjs skills/dsh-plugin-development/scripts/tests/scaffold.test.mjs
git commit -m "feat: 实现 DSH 插件脚手架"
```

---

### Task 6: 实现发布前校验器

**Files:**
- Create: `skills/dsh-plugin-development/scripts/validate.mjs`
- Create: `skills/dsh-plugin-development/scripts/tests/validate.test.mjs`
- Modify: `skills/dsh-plugin-development/SKILL.md`

**Interfaces:**
- Consumes: Task 5 生成的 manifest、patch 和文件布局。
- Produces: `validate.mjs <project> [--json] [--skip-pack]`，返回 `errors`、`warnings`、`checks`。

- [ ] **Step 1: 写入校验器失败测试**

测试先用脚手架生成合法项目，再覆盖：合法项目通过、删除 patch 失败、残留占位符失败、client export 缺失失败、私有 monorepo 路径失败。JSON 输出断言结构：

```js
{
  ok: false,
  errors: [{ code: 'PATCH_MISSING', message: '...' }],
  warnings: [],
  checks: []
}
```

调用测试固定使用 `--json --skip-pack`，避免依赖 npm 安装。

- [ ] **Step 2: 运行测试确认失败**

```bash
node --test skills/dsh-plugin-development/scripts/tests/validate.test.mjs
```

Expected: FAIL，原因是 `validate.mjs` 不存在。

- [ ] **Step 3: 实现校验器**

实现检查：

- 必需文件和 JSON 可解析。
- package name、version、type、main、exports。
- `dsh.bundle.patch` 存在且目标文件存在。
- patch 的 `name:` 等于 manifest name。
- `dsh.engines.dsh` 是非空字符串，并用 `node:util` 之外的零依赖规则拒绝明显非法值；复杂范围交给包管理器验证。
- client 声明、client export、client 源文件三者一致。
- `files` 覆盖 patch、README、LICENSE 和 lib 产物模式。
- 全工程无 `dsh-web/shared`、`@linxin666` 和 `__[A-Z0-9_]+__` 残留。
- 未使用 `--skip-pack` 时运行 `npm pack --dry-run --json`，失败产生 `PACK_FAILED`。

CLI 参数：

```text
validate.mjs <project> [--json] [--skip-pack]
```

人类输出每项使用 `PASS`、`WARN`、`FAIL` 文本，不使用颜色作为唯一信号。

- [ ] **Step 4: 运行测试确认通过**

```bash
node --test skills/dsh-plugin-development/scripts/tests/validate.test.mjs
node --test skills/dsh-plugin-development/scripts/tests/*.test.mjs
```

Expected: 所有测试 PASS。

- [ ] **Step 5: 用校验器验证三种真实生成物**

```bash
root="$(mktemp -d)"
for kind in host client fullstack; do
  node skills/dsh-plugin-development/scripts/scaffold.mjs --name "demo-$kind" --directory "$root/demo-$kind" --kind "$kind" --package-name "@acme/dsh-demo-$kind" --dsh-range ">=0.1.0"
  node skills/dsh-plugin-development/scripts/validate.mjs "$root/demo-$kind" --skip-pack
done
```

Expected: 三次校验均退出 `0`。

- [ ] **Step 6: 更新 Skill 门禁并提交**

`SKILL.md` 的测试步骤必须明确先跑项目测试和构建，再运行校验器；不能把静态校验器描述成运行时测试替代品。

```bash
git add skills/dsh-plugin-development/SKILL.md skills/dsh-plugin-development/scripts/validate.mjs skills/dsh-plugin-development/scripts/tests/validate.test.mjs
git commit -m "feat: 添加 DSH 插件发布前校验器"
```

---

### Task 7: 添加 Skill 行为评测

**Files:**
- Create: `skills/dsh-plugin-development/evals/evals.json`

**Interfaces:**
- Consumes: Skill 路由、脚手架、校验器和发布门禁。
- Produces: 三个可复用真实请求及可观察断言。

- [ ] **Step 1: 写入 `evals/evals.json`**

```json
{
  "skill_name": "dsh-plugin-development",
  "evals": [
    {
      "id": 1,
      "prompt": "使用 $dsh-plugin-development 在一个空目录创建独立的 Full-stack DSH 插件 project-notes，npm 包名为 @acme/dsh-project-notes。它需要一个设置卡、Host 持久化服务和共享请求响应协议。先生成工程并完成发布前验证，但不要发布。",
      "expected_output": "应选择 Full-stack，建立 Host/Client/Core 分层，生成一致的 bundle patch、client export 和 dsh.client 声明，运行单元测试、构建、校验器和 tarball 检查，并且不执行 npm publish。",
      "files": [],
      "assertions": [
        "不引用 dsh-web/shared 或固定第三方 npm scope",
        "跨端协议位于 Core 且只包含可序列化契约",
        "发布前验证包含 npm pack 或 tarball 安装"
      ]
    },
    {
      "id": 2,
      "prompt": "使用 $dsh-plugin-development 创建一个 Host-only DSH 插件 safe-runner，用于执行经过白名单校验的命令。不要生成 Web UI。",
      "expected_output": "应选择 Host-only，不声明 dsh.client 或 ./client export，保留 Cordis bundle patch，覆盖命令白名单、错误清洗、进程清理和失败路径测试。",
      "files": [],
      "assertions": [
        "manifest 不包含 dsh.client",
        "manifest 不包含 ./client export",
        "测试覆盖拒绝未授权命令和卸载清理"
      ]
    },
    {
      "id": 3,
      "prompt": "使用 $dsh-plugin-development 排查一个插件：link 到 web profile 时页面正常，从 npm 安装后 Host 能加载但页面消失。给出检查顺序并直接修复能在仓库内确认的问题。",
      "expected_output": "应优先检查 npm files、./client export、dsh.client、lib/client.js、ModuleLoader id、bundle patch 和 tarball 实际内容；修复后从 tarball 重装验证，而不是只重复源码 link 测试。",
      "files": [],
      "assertions": [
        "先检查 npm tarball 内容而不是修改 DSH 源码",
        "区分 Host 加载链和 Client 加载链",
        "验证修复后的打包产物"
      ]
    }
  ]
}
```

- [ ] **Step 2: 验证 JSON 并提交**

```bash
node -e "JSON.parse(require('node:fs').readFileSync('skills/dsh-plugin-development/evals/evals.json', 'utf8')); console.log('evals valid')"
git add skills/dsh-plugin-development/evals/evals.json
git commit -m "test: 添加 DSH 插件 Skill 评测场景"
```

Expected: 输出 `evals valid`。

---

### Task 8: 完整验收和交付收尾

**Files:**
- Modify: `skills/dsh-plugin-development/SKILL.md` only if validation exposes a real gap.
- Modify: affected reference/script/template files only when required by a failing check.

**Interfaces:**
- Consumes: Tasks 1-7 全部产物。
- Produces: 通过 Skill 校验、脚本测试、三形态生成和静态发布检查的最终 Skill。

- [ ] **Step 1: 运行 Skill 结构校验**

```bash
python /Users/cheyipai/.codex/skills/.system/skill-creator/scripts/quick_validate.py skills/dsh-plugin-development
```

Expected: `Skill is valid!`。

- [ ] **Step 2: 运行脚本单元测试**

```bash
node --test skills/dsh-plugin-development/scripts/tests/*.test.mjs
```

Expected: 全部 PASS，零失败。

- [ ] **Step 3: 执行三形态端到端生成与校验**

```bash
root="$(mktemp -d)"
for kind in host client fullstack; do
  target="$root/$kind"
  node skills/dsh-plugin-development/scripts/scaffold.mjs --name "acceptance-$kind" --directory "$target" --kind "$kind" --package-name "@acceptance/dsh-$kind" --dsh-range ">=0.1.0"
  node skills/dsh-plugin-development/scripts/validate.mjs "$target" --json --skip-pack
done
```

Expected: 三个 JSON 结果均包含 `"ok": true`。

- [ ] **Step 4: 执行静态质量检查**

```bash
if rg -n 'dsh-web/shared|@linxin666|TO[D]O|T[B]D|FIX[M]E' skills/dsh-plugin-development; then exit 1; fi
git diff --check
wc -l skills/dsh-plugin-development/SKILL.md
```

Expected: 禁止项无命中，`git diff --check` 无输出，`SKILL.md` 保持精简且详细内容位于 references。

- [ ] **Step 5: 检查没有带入用户原有改动**

```bash
git status --short
git diff -- skills/agent-cli-skill/references/pi/extensions.md skills/agent-cli-skill/references/pi/testing.md
```

Expected: 两个已有修改仍存在但没有被本任务覆盖或暂存。

- [ ] **Step 6: 提交验收修正**

仅当 Step 1-5 产生真实修正时执行：

```bash
git add skills/dsh-plugin-development
git commit -m "fix: 完善 DSH 插件 Skill 验收门禁"
```

若没有修正，不创建空提交。

- [ ] **Step 7: 输出交付报告**

报告必须列出：

- 新增 Skill 路径。
- 主要能力和三种插件形态。
- 实际运行的验证命令和结果。
- 上游基线日期 2026-09-02 与动态版本确认策略。
- 未触碰的用户原有修改。
- 未执行正式 npm 发布。
