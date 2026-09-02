# 通用 DSH 插件开发 Skill 设计

## 1. 背景

本设计从 `zhu1090093659/dsh-web` 的插件文档、脚手架、包配置、构建约定和发布检查中提取可复用规则，目标不是复制其 monorepo，而是沉淀一个可在任意独立仓库使用的 Codex Skill。

Skill 应帮助 Agent 完成完整闭环：从需求判断、项目初始化、Host/Client/Core 分层，到测试、本地安装、构建、打包和 npm 发布，同时保留与 DSH Web/Cordis 插件加载机制的兼容性。

基线调研日期：2026-09-02。

主要上游来源：

- `https://github.com/zhu1090093659/dsh-web`
- `docs/plugins.md`
- `docs/development.md`
- `docs/publish-prep.md`
- `scripts/dsh-plugin-new`
- `scripts/plugin-template/`

## 2. 目标

在仓库的 `skills/` 目录新增 `dsh-plugin-development` Skill，使 Agent 能够：

1. 在任意目录从零创建独立 DSH 插件工程。
2. 支持 Host-only、Client-only、Full-stack 三种插件形态。
3. 将跨端类型、事件和协议提取到 Core 层。
4. 生成 DSH/Cordis 可识别的插件清单和 patch 配置。
5. 建立可重复的单元测试、构建测试、tarball 测试和本地挂载验证流程。
6. 完成 npm prerelease、正式发布以及发布后安装验证。
7. 在上游版本发生变化时主动重新确认 SDK、Node、pnpm 和 DSH 兼容范围，而非永久依赖本次调研版本。

## 3. 非目标

本 Skill 不负责：

- 修改 DSH 主仓库内部实现。
- 深度导入 DSH 未公开的内部模块。
- 自动申请 npm 组织或发布权限。
- 自动替用户执行不可逆的正式发布；发布前必须再次展示包名、版本和 dist-tag。
- 生成复杂业务功能；它只提供插件工程、协议、测试和发布规范。
- 将插件强制纳入 `dsh-web` 聚合包。

## 4. 方案选择

采用“流程 + 独立模板 + 校验工具”方案。

相比纯文档方案，它能降低手工创建工程时遗漏 `exports`、`dsh.bundle.patch`、浏览器产物和 npm `files` 的风险；相比直接复制 `dsh-web` 脚手架，它不会依赖 monorepo 私有的 shared 配置、固定 npm scope 或工作区 catalog。

## 5. Skill 目录设计

```text
skills/dsh-plugin-development/
├── SKILL.md
├── references/
│   ├── architecture.md
│   ├── project-anatomy.md
│   ├── manifest-and-bundle.md
│   ├── host-development.md
│   ├── client-development.md
│   ├── testing-and-debugging.md
│   ├── local-installation.md
│   ├── publishing.md
│   └── upstream-compatibility.md
├── scripts/
│   ├── scaffold.mjs
│   └── validate.mjs
├── assets/
│   └── standalone-template/
│       ├── package.json.tmpl
│       ├── cordis.patch.yml.tmpl
│       ├── tsconfig.json
│       ├── tsconfig.build.json
│       ├── tsdown.config.ts.tmpl
│       ├── vitest.config.ts
│       ├── README.md.tmpl
│       ├── src/
│       │   ├── index.ts.tmpl
│       │   ├── core/index.ts.tmpl
│       │   ├── host/index.ts.tmpl
│       │   └── client/index.tsx.tmpl
│       └── tests/
│           ├── host.test.ts.tmpl
│           ├── client.test.tsx.tmpl
│           └── manifest.test.ts.tmpl
└── evals/
    └── evals.json
```

`SKILL.md` 保持精简，只描述触发条件、决策树、主工作流、质量门禁和引用入口；详细知识通过 `references/` 渐进加载。

## 6. 触发范围

Skill 描述需要覆盖这些典型请求：

- 创建、初始化或脚手架化 DSH 插件。
- 开发 DSH Web 页面、设置卡、Slot 或浏览器插件。
- 开发 Cordis Host 服务、命令、任务或文件操作插件。
- 为 DSH 插件设计 Host/Client 通信协议。
- 调试“Host 已加载但 UI 不显示”等插件加载问题。
- 为 DSH 插件补充测试、构建、打包或发布流程。
- 将已有 DSH 插件改造成可独立发布的 npm 包。

如果用户只是开发普通 Cordis 插件且未涉及 DSH，Skill 不应强制接管。

## 7. 工作流设计

### 7.1 阶段一：读取上下文

Agent 先读取：

- 当前仓库的 `AGENTS.md`、`README`、`package.json` 和 workspace 配置。
- 是否已存在 DSH 插件文件或 Cordis patch。
- 已安装 DSH、Node、pnpm 和官方 SDK 版本。
- 用户是否要求兼容某个既有 DSH 版本。

不能在未检查已有工程约定时直接覆盖配置。

### 7.2 阶段二：确定插件形态

通过业务需求选择：

- **Host-only**：服务、命令、进程、任务、文件系统或仅服务端能力。
- **Client-only**：页面、Slot、设置 UI、纯浏览器交互。
- **Full-stack**：浏览器 UI 需要调用 Host 能力。
- **Core**：Full-stack 默认建立，用于纯类型、事件名、schema 和序列化协议。

默认推荐最小形态，不为简单插件创建无用半区。

### 7.3 阶段三：版本解析

版本来源按以下优先级确定：

1. 用户明确指定的宿主 DSH 版本。
2. 当前工程已经锁定的兼容 cohort。
3. 本机实际安装并能运行的 DSH 版本。
4. 最新上游模板和官方 npm 包信息。

所有同一 cohort 的官方 SDK 必须使用兼容版本。Skill 不在主流程中把 2026-09-02 的具体版本描述成永久最新版。

若需要联网确认最新版本，必须遵循环境的联网 Skill 和来源约束。

### 7.4 阶段四：生成工程

`scaffold.mjs` 接收至少以下参数：

```text
--name <kebab-case-name>
--directory <target-directory>
--kind host|client|fullstack
--package-name <npm-package-name>
--dsh-range <semver-range>
```

规则：

- 插件短名必须符合 kebab-case。
- npm 包名允许无 scope 或用户指定 scope。
- 已存在且非空的目标目录默认拒绝覆盖。
- 生成后输出下一步命令，但不自动发布。
- 模板使用占位符，不写死 `@linxin666` 等第三方 scope。
- 独立构建配置不得引用 `dsh-web/shared/*`。

### 7.5 阶段五：实现 Host

Host 指南应覆盖：

- Cordis 插件入口和生命周期。
- 配置类型与运行时 schema。
- Service 注册、命名和依赖注入。
- 使用官方 Host SDK 提供的宿主能力。
- 路径、进程和文件操作的权限边界。
- 错误清洗，避免把堆栈和敏感路径直接暴露给 Client。
- 卸载或重载时释放事件、定时器和子进程。

运行时不深度导入 DSH 内部源码。

### 7.6 阶段六：实现 Client

Client 指南应覆盖：

- 浏览器入口导出和插件加载约定。
- 页面、Slot、设置入口及其适用场景。
- UI 框架与宿主 externals 的处理。
- 样式隔离和必要的语义属性。
- 事件注册和卸载清理。
- 避免把 Node-only 依赖打进浏览器产物。
- Full-stack 插件通过 Core 中定义的稳定协议与 Host 通信。

### 7.7 阶段七：清单和 bundle patch

校验并讲解：

- npm `name`、`version`、`type`、`files`。
- Host、Client 和公共入口的 `exports`。
- `dsh.bundle.patch` 或当前宿主要求的等价字段。
- Client platform、inject 和入口声明。
- `dsh.engines.dsh` 或当前版本门槛字段。
- `cordis.patch.yml` 中依赖、插件节点和配置路径。

文档需明确区分“当前基线字段”和“执行时从上游确认的字段”。

### 7.8 阶段八：测试

测试分层如下：

1. **Core 测试**：schema、codec、事件名、边界值。
2. **Host 测试**：挂载、公共方法、配置、失败路径和清理。
3. **Client 测试**：入口注册、页面/Slot/设置挂载和卸载。
4. **Manifest 测试**：exports、patch 路径、文件存在性和 semver。
5. **构建测试**：Host 和 Client 产物均成功生成。
6. **依赖纯度测试**：Client 产物不包含 Node-only 模块。
7. **tarball 测试**：`npm pack --dry-run` 和实际 tarball 内容检查。
8. **安装测试**：从 tarball 安装，而不是只从源码目录运行。

### 7.9 阶段九：本地安装

本地验证覆盖：

- 使用 `link:` 或 tarball 安装到 DSH Web profile。
- 应用 profile patch。
- 启动或重启 `dsh web`。
- 查看 Host 服务加载结果。
- 查看 Client 脚本是否进入浏览器加载链。
- 检查控制台、网络请求、Cordis 服务图和页面/Slot 注册结果。

调试树至少覆盖：

- Host 与 Client 均未加载。
- Host 已加载、Client 未注入。
- Client 已下载、入口未注册。
- 入口已注册、页面或 Slot 不显示。
- 开发目录可用、npm tarball 安装失败。

### 7.10 阶段十：发布

发布流程：

1. 确认 git 工作区和测试状态。
2. 确认包名归属、npm 登录和发布权限。
3. 检查版本是否已存在。
4. 检查 changelog 和 README。
5. 执行完整校验和构建。
6. 生成 tarball 并在临时目录安装验证。
7. 展示即将发布的包名、版本、registry、access 和 dist-tag。
8. 得到明确确认后执行 `npm publish`。
9. 从 registry 重新安装并执行最小冒烟测试。
10. 可选生成社区插件登记所需元数据。

默认首次或 alpha/beta 版本使用 prerelease dist-tag；只有用户明确要求并满足发布门禁时才使用 `latest`。

## 8. 校验脚本设计

`validate.mjs` 应提供机器可读和人类可读两种输出，并检查：

- 必需文件存在。
- package.json 可解析。
- 插件名、包名和目录名一致性。
- exports 指向的源文件或构建产物存在。
- patch 路径存在且在 npm `files` 范围内。
- DSH semver 范围合法。
- Client 声明与 client 构建入口匹配。
- Host-only 或 Client-only 不包含互相矛盾的清单声明。
- 不包含已知 monorepo 私有路径。
- 不包含模板占位符残留。
- `npm pack --dry-run --json` 可执行。

退出码：

- `0`：全部通过。
- `1`：存在阻止构建或发布的问题。
- `2`：调用参数或环境无效。

## 9. 渐进式文档设计

`SKILL.md` 不重复所有参考内容，而是根据任务加载：

- 新建插件：读 `architecture.md`、`project-anatomy.md`、`manifest-and-bundle.md`。
- Host 开发：额外读 `host-development.md`。
- Client 开发：额外读 `client-development.md`。
- 调试和测试：读 `testing-and-debugging.md`、`local-installation.md`。
- 发布：读 `publishing.md`、`upstream-compatibility.md`。

## 10. Skill 评测设计

`evals/evals.json` 至少包含三个场景：

1. **独立 Full-stack 插件**  
   创建一个带设置页面、Host 服务和共享协议的插件，检查是否生成正确分层和验证命令。

2. **Host-only 插件**  
   创建一个执行受控命令并返回结构化结果的插件，检查是否避免生成不必要的 Client 声明，并包含失败路径测试。

3. **发布故障诊断**  
   给出“源码 link 可运行、npm 安装后页面消失”的项目，检查 Agent 是否优先排查 npm `files`、bundle patch、exports 和浏览器产物。

评测标准：

- 是否正确选择插件形态。
- 是否使用公开 SDK 和稳定协议。
- 是否包含完整清单和 patch。
- 是否执行构建、tarball 和安装验证。
- 是否在发布前要求明确确认。
- 是否没有把上游瞬时版本误写为永久最新版。

## 11. 安全与质量约束

- 不覆盖已有文件，除非用户明确要求。
- 不修改与任务无关的工作区改动。
- 不在 Client 代码中暴露密钥、主机路径和内部错误堆栈。
- 不执行正式 npm 发布，除非用户明确确认精确版本和 dist-tag。
- 所有脚本应支持 `--help`，错误信息应给出修复方向。
- 模板和脚本必须在临时目录中进行自测。
- Skill 文档中的命令必须能够在独立仓库执行，不能隐含依赖 `dsh-web` monorepo。

## 12. 验收标准

完成后应满足：

1. `skills/dsh-plugin-development/SKILL.md` frontmatter 有效且触发描述明确。
2. Skill 主文档不超过适合渐进加载的规模，详细内容拆入 references。
3. 脚手架可在空临时目录生成三种插件形态。
4. 生成项目不引用 `dsh-web/shared/*` 或固定第三方 npm scope。
5. 校验脚本能发现缺失 patch、错误 exports、占位符残留和 tarball 缺文件。
6. 模板至少有 Host、Client、Manifest 示例测试。
7. `evals/evals.json` 可解析并包含不少于三个真实场景。
8. 不覆盖当前仓库中已有的用户修改。
9. 最终交付包含文件清单、验证结果、已知上游版本风险和后续维护入口。
