# 上游兼容性与版本确认

> **调研基线：2026-09-02**

本文件记录从 `zhu1090093659/dsh-web` 提取的插件制作约定，作为历史基线和执行时的核对清单，不是永久版本承诺。用户在 2026 年 9 月 2 日之后执行本 Skill 时，必须重新确认宿主、模板和 npm 上的实际版本。

## 基线范围

截至调研日期，插件规范围绕 DSH Web/Cordis 的 profile、bundle patch、Host/Client/Core 分层和浏览器 ModuleLoader 产物展开。调研时观察到的开发环境包括 Node 22、pnpm 11，以及带 alpha/rc 标识的 DSH/SDK 版本；这些均标记为**基线观察**，不能写成所有插件的永久要求。

独立模板可把调研时观察到的版本作为可覆盖默认值，例如：

- `@deepseek-ai/cordis`：`^4.0.2`（基线观察值）。
- DSH Client SDK：`^0.1.2-alpha.4`（基线观察值，实际包名和版本必须以执行时宿主提供的 SDK 为准）。
- Node 22、pnpm 11：用于复现调研时工具链的观察值，不表示插件必须永远锁定这两个大版本。

若目标宿主仍要求 Node 20+ 或其他 pnpm/Node 范围，应以目标宿主的官方文档和实际运行检查为准，并在插件 README 中写明经过验证的范围。

## dsh-web 项目名称与来源变化

用户给出的项目地址是：

- 主仓库：<https://github.com/zhu1090093659/dsh-web>

调研时发现项目内容可能重定向、拆分或演进为 `dsh-web-ui`。因此执行时：

1. 以仓库实际默认分支为准，不假设 `dev` 永远存在。
2. 记录实际打开的仓库地址、分支/提交和调研时间。
3. 优先读取最新的插件文档、脚手架和模板，而不是复制本文件中的版本号。
4. 如果仓库已经迁移到 `dsh-web-ui` 或其他地址，记录重定向后的 canonical URL，并说明迁移关系。

## 上游来源 URL

只记录来源，不复制整个上游文件：

- 插件生命周期：<https://github.com/zhu1090093659/dsh-web/blob/dev/docs/plugins.md>
- 开发与验证命令：<https://github.com/zhu1090093659/dsh-web/blob/dev/docs/development.md>
- 插件生成器：<https://github.com/zhu1090093659/dsh-web/blob/dev/scripts/dsh-plugin-new>
- 独立模板目录：<https://github.com/zhu1090093659/dsh-web/tree/dev/scripts/plugin-template>
- 模板包清单：<https://github.com/zhu1090093659/dsh-web/blob/dev/scripts/plugin-template/package.json>
- 模板 Client 构建配置：<https://github.com/zhu1090093659/dsh-web/blob/dev/scripts/plugin-template/tsdown.config.ts>

如果 `dev` 分支、文件路径或仓库名称发生变化，执行时应先搜索最新默认分支的等价文件，并更新本次项目记录；不要把失效 URL 当作现行规范。

## 版本解析优先级

为避免把历史调研值误当作“最新版”，按以下顺序解析版本和兼容范围：

1. **用户目标版本**：用户明确要求支持的 DSH 版本、Node/pnpm 范围和 npm registry 优先。
2. **项目锁定 cohort**：当前插件仓库的 lockfile、package manager、peerDependencies、测试矩阵和 README 中已验证的版本组合。
3. **本机宿主**：实际运行的 DSH、Node、pnpm、profile 和已提供的 SDK 版本；只能作为候选，必须与项目目标和测试结果对照。
4. **上游模板/npm**：最新仓库默认分支模板、官方 SDK 发布版本和宿主文档；联网读取时记录日期、来源和具体版本。

若各来源冲突，不要静默选择一个版本。向用户说明冲突，优先满足用户目标，再通过最小兼容矩阵和安装冒烟确定可支持范围。

## SDK cohort 规则

所有 `@deepseek-ai/*` 包必须使用相互兼容的 cohort：

- 不要只升级其中一个 SDK 包而假设其它包仍兼容。
- 检查 peerDependencies、lockfile、上游模板和 DSH 宿主实际导出的 API。
- 如果升级跨越 alpha、beta、rc 或主版本边界，重新运行 Core、Host、Client、bundle purity、tarball 和隔离 profile 测试。
- 将经过验证的 cohort 写入 package.json、README 和兼容矩阵；将未验证的版本标记为候选，不宣称支持。
- 遇到协议变化时，先在 Core 层增加版本/能力协商或迁移逻辑，再更新 Host/Client；不要在 Client 中猜测 Host 行为。

## 高风险兼容点

以下三项必须在每次宿主或 SDK 变化后重新检查：

### Client closure factory

Client 产物依赖宿主约定的 closure factory/ModuleLoader 包装。验证：

- `window.__ModuleLoader__.load` 的 `id`、`factory` 和 `require` 形状与宿主当前实现一致。
- browser bundle 的 CJS wrapper、banner/footer 和 external 列表没有随构建工具升级而漂移。
- 在最小 ModuleLoader stub 和真实 DSH Web 中各执行一次入口加载。

### `dsh.bundle.patch`

这是 profile 将插件接入 DSH bundle 的高风险边界。验证：

- patch 文件位于 package 根目录并被 npm `files` 包含。
- patch 中的 row/plugin id 稳定，依赖 package name 与 manifest 完全一致。
- 当前宿主仍支持该 patch 字段、操作和路径；如果上游更名为等价字段，以最新宿主文档为准。
- 重新生成 profile 或安装 tarball 后，实际 bundle 列表确实包含插件。

### tarball smoke

源码 link 可能绕过 npm 包边界，必须用真实 tarball 和 registry 包各做一次 smoke：

- `npm pack --dry-run --json` 清单包含所有运行时文件。
- 临时目录能安装并解析 public exports。
- 隔离 DSH profile 能加载 Host，Client 能被下载、注册并显示 UI（如有）。
- 发布后从 registry 重装，确认结果与本地 tarball一致。

## 执行时记录模板

```text
核验日期：
目标 DSH 版本：
DSH 仓库/分支/提交：
Node/pnpm：
@deepseek-ai/* cohort：
宿主提供的 Client externals：
patch 字段与来源：
link smoke：
本地 tarball smoke：
registry tarball smoke：
已知不兼容项：
```

## 不能做的假设

- 不得把“调研基线：2026-09-02”写成永久兼容声明。
- 不得把 Node 22、pnpm 11 或某个 alpha/rc 版本当作所有用户的硬性要求，除非最新宿主文档和测试明确如此。
- 不得仅凭 npm 上存在新版本就升级 SDK cohort；必须检查宿主、peerDependencies、协议和安装冒烟。
- 不得从 DSH 未公开内部路径导入运行时实现。
- 不得把失效的 `dsh-web` URL、旧分支或本机缓存当作当前规范。
