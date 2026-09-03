---
name: dsh-plugin-development
description: 从零创建、实现、测试、调试、本地安装或发布独立 DSH 插件；适用于 Host、Web Client、Full-stack、Cordis patch、ModuleLoader bundle 和 npm 打包任务。不用于与 DSH 无关的普通 Cordis 插件。
---

# DSH Plugin Development

用于把一个 DSH 插件从需求、架构和项目骨架推进到可测试、可本地安装、可发布的独立 npm 包。

先读取目标项目的 `AGENTS.md`、`README`、`package.json` 和已有 patch；保留用户现有结构与未提交改动。除非用户明确要求，否则不要覆盖非空目录、删除现有实现或执行正式发布。

## 路由

根据任务最小化读取引用文件。若任务跨越多个阶段，按顺序读取对应文件；不要预加载整个目录。

| 任务 | 必读 |
|---|---|
| 选型或新建插件 | `references/architecture.md`、`references/project-anatomy.md`、`references/manifest-and-bundle.md` |
| Host 能力 | `references/host-development.md` |
| Client UI | `references/client-development.md` |
| 测试或故障排查 | `references/testing-and-debugging.md` |
| 本地安装 | `references/local-installation.md` |
| npm 发布 | `references/publishing.md`、`references/upstream-compatibility.md` |
| 最新兼容版本 | `references/upstream-compatibility.md`，并按环境联网规则重新核实 |

如果引用文件尚未存在，先说明它属于后续落地阶段，不要凭空声称已经读取；当前入口仍可用于架构分流和规划。

## 主流程

1. 判断插件是 Host-only、Client-only 还是 Full-stack；只创建需求需要的半区。
2. 确定目标 DSH 版本，再选择同一兼容 cohort 的官方 SDK。
3. 新项目先定位本 Skill 自身目录，再用该目录下脚本的绝对路径运行 `scripts/scaffold.mjs`；已有项目先审计再补文件。
4. 先定义 Core 协议，再实现 Host 和 Client；跨端只交换可序列化数据。
5. 运行单元测试、构建、由 Skill 自身目录定位的 `scripts/validate.mjs <project>` 和 tarball 安装测试。
6. 使用 link 或 tarball 安装到隔离 profile，验证 Host 与 Client 两条加载链。
7. 发布前展示包名、版本、registry、access、dist-tag 和 pack 文件表，等待明确确认。

## 硬约束

- 运行时代码只使用公开 SDK；不深度导入 DSH 源码。
- Client bundle 只能 externalize 宿主 ModuleLoader 实际提供的平台模块，其余浏览器安全依赖内联。
- `dsh.bundle.patch`、Cordis patch、`exports["./client"]` 和 `dsh.client` 必须彼此一致。
- 不把参考文档中的版本称为最新版；执行时按兼容性文档重新确认。
- 不覆盖非空目录，不自动执行正式 npm 发布，不泄漏密钥、绝对路径或 Host 堆栈。
