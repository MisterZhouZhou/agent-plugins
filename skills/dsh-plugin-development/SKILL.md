---
name: dsh-plugin-development
description: 从零创建、实现、测试、调试、本地安装或发布独立 DSH 插件；适用于 Host、Web Client、Full-stack、会话菜单与会话详情消息操作、全局辅助 Chat/悬浮 Chat、Tool、Service、事件、LLM Adapter、Cordis patch、ModuleLoader bundle 和 npm 打包任务。不用于与 DSH 无关的普通 Cordis 插件。
---

# DSH Plugin Development

用于把一个 DSH 插件从需求、架构和项目骨架推进到可测试、可本地安装、可发布的独立 npm 包。

先读取目标项目的 `AGENTS.md`、README、`package.json`、lockfile 和已有 patch；保留用户现有结构与未提交改动。除非用户明确要求，否则不要覆盖非空目录、删除现有实现或执行正式发布。

## 资料来源与优先级

本 Skill 对照以下官方入口沉淀，执行时以目标宿主实际源码、lockfile、官方文档和已验证的运行结果为准：

- DSH 官方开发入口：`https://deepseek-harness.github.io/deepseek-harness/develop/basic/`
- 重点官方章节：第一个插件、Tool、Config、发布、插件生命周期、Service、事件、能力分层、动态 Cordis、LLM Adapter。
- 历史项目参考：`https://github.com/zhu1090093659/dsh-web`；其目录、分支和包名可能演进，不可当作永久 API。

版本、API 和 external 都可能变化。需要“最新”时，先检查宿主和官方来源，不要把本 Skill 的调研基线当成最新版。

## 路由

根据任务最小化读取引用文件。若任务跨越多个阶段，按顺序读取对应文件；不要预加载整个目录。

| 任务 | 必读 |
|---|---|
| 选型或新建插件 | `references/architecture.md`、`references/project-anatomy.md`、`references/manifest-and-bundle.md` |
| Host 普通逻辑 | `references/host-development.md` |
| Tool 能力 | `references/tool-development.md`、`references/services-and-dependencies.md` |
| Service 或依赖 | `references/services-and-dependencies.md`、`references/capability-seams.md` |
| Client UI | `references/client-development.md` |
| 会话菜单/会话详情操作 | `references/client-development.md`、`references/session-ui-features.md` |
| 全局辅助 Chat/独立悬浮 Chat | `references/client-development.md`、`references/global-inline-chat.md` |
| 事件、生命周期、HMR | `references/events.md`、`references/cordis-lifecycle.md` |
| LLM Adapter | `references/llm-adapter.md`、`references/services-and-dependencies.md` |
| 测试或故障排查 | `references/testing-and-debugging.md` |
| 发布前静态校验 | `scripts/validate.mjs`、`references/testing-and-debugging.md` |
| 本地安装 | `references/local-installation.md` |
| npm 发布 | `references/publishing.md`、`references/upstream-compatibility.md` |
| 最新兼容版本 | `references/upstream-compatibility.md`，并按联网规则重新核实 |
| Tool 不可见/模型调不到 | `references/tool-development.md`、`references/testing-and-debugging.md` |

## 主流程

1. **确认需求和形态**：判断 Host-only、Client-only、Full-stack；再判断是普通 Plugin、Tool、Service Provider/Consumer 或 LLM Adapter。Host 入口默认使用函数形式；需要集中元数据时可用对象形式；只有向其他插件提供公共 Service/有状态 Provider 时才使用继承 `Service` 的类形式。不要因为“完整”而加入空壳半区。
2. **确认兼容 cohort**：读取目标 DSH 的版本、package manager、lockfile、宿主提供的 Client external 和公开 SDK；按同一 cohort 选择 Cordis、Schemastery、dsh-tools、Client SDK 等版本。
3. **生成或审计工程**：新项目定位本 Skill 自身目录，用脚本绝对路径运行 `scripts/scaffold.mjs`；已有项目先审计再补文件。脚手架默认生成同名运行时 `Config` schema；Tool 能力生成 `defineTool + inject=['tools']` 最小入口。
4. **先定义契约**：Full-stack 先定义 Core 协议；可替换能力拆成 Definition、Provider、Consumer；Service、事件和 Tool 的输入输出都使用稳定、可序列化、可校验的契约。全局辅助 Chat 还要先明确“独立于工作区、不写会话记录、单一当前 Chat、新建清空”的边界。
5. **实现生命周期**：通过 `ctx` 注册事件、Tool、Service 和 effect；记录 timer、watcher、子进程、连接、页面、Slot、样式的清理路径；验证卸载和 HMR 不重复注册。对会话菜单和消息级操作，额外遵循 `references/session-ui-features.md` 的作用域、替换语义、DOM 幂等和白屏规避要求。
6. **运行质量门禁**：依次运行 `pnpm typecheck`、`pnpm test`、`pnpm build`、`node <skill>/scripts/validate.mjs <project>`；依赖未安装或只做静态检查时可先用 `--skip-pack`，但发布前必须执行 pack。
7. **验证安装链**：优先在隔离 profile 验证源码 `link:`，再验证真实 tarball；检查 profile bundle、Host 日志、Client Network/Console、ModuleLoader、页面/Slot 和卸载重载。
8. **发布确认**：先展示 package、version、registry、access、dist-tag、tarball 和全部门禁结果，等待用户明确确认后才执行正式 `pnpm publish`/`npm publish`。

## 脚手架入口

```bash
SKILL_DIR="/absolute/path/to/agent-plugins/skills/dsh-plugin-development"
node "$SKILL_DIR/scripts/scaffold.mjs" \
  --name my-plugin \
  --directory ./my-plugin \
  --kind host \
  --capability plugin \
  --package-name @scope/dsh-my-plugin \
  --dsh-range '>=0.1.0'
```

可选 `--capability tool` 生成官方 Tool 注册骨架；Tool 必须是 Host 或 Full-stack，不接受 client-only。版本可用 `--cordis-version`、`--schemastery-version`、`--tools-version`、`--sdk-version` 覆盖，但覆盖后必须重新跑兼容和集成验证。

## 硬约束

- 运行时代码只使用公开 SDK；不深度导入 DSH 源码或 `dsh-web/shared/*` 私有路径。
- Config 若声明了 `interface/type Config`，必须同时导出同名运行时 Schemastery schema；默认值写在 schema，不写成普通对象。
- Tool 必须使用 `@deepseek-ai/dsh-tools` 的 `defineTool`，声明 `inject = ['tools']`，注册到 `ctx.tools`，并校验参数、规范输出、render、失败和取消。
- Service Consumer 只依赖 Definition/公开服务，不读取 Provider 私有字段；可选服务使用 `ctx.get` 并定义缺失行为。
- 函数、对象、类三种插件形态共享同一生命周期规则：对象形式不是 Service，类形式的服务名、类型声明与 Consumer `inject` 必须一致。
- Client bundle 只能 externalize 宿主 ModuleLoader 实际提供的平台模块，其余浏览器安全依赖内联或作为发布依赖处理。
- `dsh.bundle.patch`、Cordis patch、`exports['./client']` 和 `dsh.client` 必须彼此一致；包内 `dsh.bundle` 与 profile 的 `dsh.profile` 不要混淆。
- 不覆盖非空目录，不自动执行正式 npm 发布，不泄漏密钥、绝对路径或 Host 堆栈。
- 校验器返回 `0/1/2`：通过、校验失败、参数或环境错误；发布前必须处理所有 `FAIL`，并复核 `WARN`。
