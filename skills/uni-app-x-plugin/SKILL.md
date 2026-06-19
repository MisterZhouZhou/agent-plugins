---
name: uni-app-x-plugin
description: "Create, inspect, debug, and structure uni-app x UTS plugins under uni_modules for Android, iOS, HarmonyOS, Web, or Mini Program targets. Use this skill when Codex needs to build or review package.json plugin metadata, utssdk/interface.uts APIs, platform-specific index.uts implementations, uni-ext-api declarations, protocol.uts validation, HarmonyOS module.json5/config.json/resources setup, or plugin-market-ready uni-app x plugin layouts."
---

# uni-app-x-plugin

为 `uni-app x` 的 `UTS` 插件开发提供专项指导，聚焦 `uni_modules` 目录、`utssdk` 结构、插件 API 声明、分平台实现，以及 HarmonyOS 侧的 ArkTS/ohpm 约束。

## Quick Start

按任务选择最小参考文件：

1. 创建新插件、补目录、补 `package.json`
   - 先读 `references/plugin-quickstart.md`
2. 需要对齐真实插件模式
   - 再读 `references/plugin-examples.md`
3. 目标包含 HarmonyOS、`@ohos.*`、`@kit.*`、`.har`、`.ets`、`module.json5`、`resources`、权限或 `ohpm`
   - 再读 `references/harmony-plugin-notes.md`
   - 如果涉及系统打印、`@ohos.print`、`ohos.permission.PRINT`、`uni.chooseFile` 返回的 `file://docs/storage/...`，必须查看该文件的打印专项经验
4. 需要直接起草文件
   - 使用 `templates/` 下的模板

## Workflow

1. 先确认插件位置
   - 默认放在 `uni_modules/<plugin-id>/`
   - 优先使用 `uni_modules`，不要把插件散落在项目根目录

2. 先确认插件类型
   - `uni API 扩展插件`：对外暴露 `uni.xxx()` 或现有 `uni` API 扩展
   - `provider/service 插件`：通过 `getUniProvider()` 按服务名获取提供者
   - `平台能力封装插件`：仅封装某平台原生能力，也仍保持 `uni_modules + utssdk` 结构
   - `组件/页面插件`：通过 `components/`、`pages/`、`static/` 等目录提供前端内容，必要时再配合 `utssdk`

3. 再确定最小目录
   - 必需：`package.json`
   - 发布/维护常见：`readme.md`、`changelog.md`、`license.md`
   - 组件/页面插件按需添加：`components/`、`pages/`、`static/`
   - API 型插件通常必需：`utssdk/interface.uts`
   - 可选：根 `utssdk/index.uts`
   - 按需添加：`utssdk/app-android/index.uts`、`utssdk/app-ios/index.uts`、`utssdk/app-harmony/index.uts`、`utssdk/web/index.uts`
   - HarmonyOS 按需添加：`utssdk/app-harmony/config.json`、`module.json5`、`resources/`、`libs/`

4. 最后补实现
   - 先在 `interface.uts` 声明类型、错误码、回调、导出函数类型
   - 再在平台目录 `index.uts` 实现
   - 有参数校验时补 `protocol.uts`
   - 有统一错误映射时补 `unierror.uts`

## Implementation Rules

- 默认参考真实插件模式，不发明新目录层级。
- `package.json` 至少写 `id`、`displayName`、`version`、`description`、`uni_modules`。
- 对外 API 的声明入口是 `utssdk/interface.uts`；实现和声明分离。
- 平台目录和根目录同时存在 `index.uts` 时，优先分平台目录。
- `uni_modules.uni-ext-api` 里声明的 API 名称必须和实现能力一致。
- 只在确实需要时添加 `dcloudext`、销售信息、兼容矩阵等市场字段；不要臆造商业元数据。
- 继续遵守 `uni-app x`/`UTS` 基础约束：不用 `undefined`，条件表达式显式写成布尔判断。
- HarmonyOS 的 `config.json` 不能写注释；本地依赖路径相对 `config.json` 解析。
- 需要鸿蒙权限、资源、`.ets`、`.har`、`ohpm`、`module.json5`、`getContext` 或 `overrides` 时，优先查 `references/harmony-plugin-notes.md`。
- HarmonyOS 系统打印不要照搬 ArkTS 官方示例的 `@kit.BasicServicesKit` 命名导出；在 uni-app x UTS 插件中优先用 `@ohos.print` / `@ohos.file.fileuri`，并按 `references/harmony-plugin-notes.md` 的打印专项经验处理权限、文件 URI 和 `UIAbilityContext`。
- 需要举例时，优先复用 `uni-actionSheet`、`uni-clipboard`、`uni-payment` 这三种模式。

## Typical Decisions

### 何时需要根 `utssdk/index.uts`

- 要做简单跨端转发时需要
- 要集中写 `#ifdef` 分支时需要
- 如果插件只服务单个平台，可以省略根 `index.uts`，直接实现该平台目录

### 何时需要 `protocol.uts`

- 使用 `defineAsyncApi`
- 需要格式化参数默认值
- 需要参数类型校验或协议定义

### 何时需要 `module.json5`

- HarmonyOS 需要声明权限
- 需要控制模块信息或设备类型
- 需要依赖 `resources` 中的字符串、图片等资源

## Templates

- `templates/package-json-template.json`
- `templates/interface-template.uts`
- `templates/root-index-template.uts`
- `templates/app-harmony-config-template.json`
- `templates/module.json5-template.json5`

## Resources

- `references/plugin-quickstart.md`：目录结构、文件职责、最小落地流程
- `references/plugin-examples.md`：三个真实插件模式拆解
- `references/harmony-plugin-notes.md`：HarmonyOS/ArkTS/ohpm/module.json5 要点

## Output Expectations

完成插件相关任务时，优先给出：

1. 变更后的目录或目标文件列表
2. 哪个文件负责声明、哪个文件负责实现
3. 哪个平台分支已经覆盖，哪个仍是待补
4. 若答案依赖本 skill 的 reference，追加 `文档引用`

## 文档引用规则

当回答依据本 skill 自带的 reference 或 template 时，追加一个简短的 `文档引用` 小节，列出实际用到的文件与行号，例如：

- `references/plugin-quickstart.md:12`
- `references/harmony-plugin-notes.md:24-31`

不要引用 `SKILL.md` 本身。
