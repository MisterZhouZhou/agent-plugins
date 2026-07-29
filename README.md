# Agent Plugins

本仓库用于维护本地 Agent Skills 和 Codex Plugins，并通过 marketplace 配置暴露给插件系统。

## 目录结构

```text
.
├── .claude-plugin/
│   └── marketplace.json
├── .agents/plugins/
│   └── marketplace.json
├── plugins/
│   ├── agent-notify/
│   ├── memory-with-files/
│   └── planning-workflows/
└── skills/
    ├── api-generate-image/
    ├── azure-ssml-tts/
    ├── cdp-skill/
    ├── chrome-extension-icon-generator/
    ├── cli-session-manager/
    ├── codex-plugin-marketplaces/
    ├── codex-session-export/
    ├── codex-session-import/
    ├── cold-water/
    ├── agent-cli-skill/
    ├── electron-skills/
    ├── figma-rest-h2d-source/
    ├── geo-skill/
    ├── grok-imagine-video/
    ├── iOS-skill/
    ├── image-size-generator/
    ├── react-skill/
    ├── safari-web-extension/
    ├── svelte-skill/
    ├── tauri-desktop/
    ├── threejs-skill/
    ├── uni-app-x/
    ├── vscode-extension-skills/
    ├── vue-skill/
    ├── yuque-frontend-requirements/
    ├── yuque-kb-search/
    └── yuque-develop-requirements/
```

## Codex 插件市场

- 市场名称：`codex-agent-plugins`
- 配置文件：`.agents/plugins/marketplace.json`
- 当前插件：`memory-with-files`、`agent-notify`、`planning-workflows`

### memory-with-files

主动维护项目根目录 `.memory/` 中的高价值长期知识、任务记忆和恢复状态，但不接管 `planning-workflows` 的任务清单。

- 目标、主要范围和关键约束基本明确后，可为多阶段任务、复杂问题或跨会话工作主动初始化
- `SessionStart`：注入项目规则、任务来源、当前阶段和下一步等精简恢复摘要
- `PreCompact`：压缩前提醒刷新任务恢复状态
- 不注册结束 Hook，避免每次会话结束都显示重复提醒
- `findings.md` 默认不自动注入
- `MEMORY_WITH_FILES_DISABLED=1` 可禁用所有写入和 Hook 输出
- 项目记忆只写入 `<project-root>/.memory/`，不会写入全局 Codex Memories

#### Codex 安装

```bash
codex plugin marketplace add ~/Desktop/ai/agent-plugins
codex plugin add memory-with-files@codex-agent-plugins
```

安装后审核并信任 `SessionStart` 和 `PreCompact` Hook，然后新建会话。

#### 初始化与完成

通常由 Skill 在满足高价值条件时主动初始化；也可显式请求“记住这个项目的当前上下文”。新结构为：

```text
.memory/
├── project/
│   ├── memory.md
│   └── findings.md
├── tasks/
│   └── <slug>/
│       ├── memory.md
│       ├── findings.md
│       └── handoff.md
└── .active_memory
```

对应规范路径为 `.memory/project/` 与 `.memory/tasks/<slug>`。初始化命令：

```bash
python3 plugins/memory-with-files/skills/memory-with-files/scripts/init_memory.py \
  "主题名称" --root <project-root> \
  --task-source "docs/planning/plans/YYYY-MM-DD-topic.md"
```

任务由权威计划确认完成，并写好最终 handoff 后执行：

```bash
python3 plugins/memory-with-files/skills/memory-with-files/scripts/complete_memory.py \
  --root <project-root>
```

完成任务会标记为 `completed`、清除匹配的活动指针并保留目录，后续不再自动注入。旧 `.memory/<slug>/` 会在不覆盖新目录的前提下迁移到 tasks 层。

### planning-workflows

提供两个规划 Skill 和一个独立调试 Skill，并保持类似 Superpowers 的严格自动触发体验。

- `brainstorming`：新增功能、行为修改、架构和方案设计必须先澄清需求并取得设计确认
- `writing-plans`：将已确认的设计转换为包含精确路径、接口、测试和验证命令的实施计划
- `systematic-debugging`：Bug、测试失败、构建失败、性能或集成异常必须先调查根因，再提出修复
- `SessionStart`：在 `startup`、`resume`、`clear`、`compact` 时重新注入三个 Skill 的职责路由
- 调试 Skill 独立运行且不依赖 TDD；计划或调试完成后不自动进入执行、Review、Worktree 或子代理工作流

#### 安装

```bash
codex plugin marketplace add ~/Desktop/ai/agent-plugins
codex plugin add planning-workflows@codex-agent-plugins
```

安装后审核并信任 `SessionStart` Hook，然后新建 Codex 会话。新功能请求会自动进入 `brainstorming`；设计确认后自动衔接 `writing-plans`。

不要与完整的 Superpowers 插件同时启用，否则两个 Bootstrap 和同类 Skill 会产生重复或冲突触发。

#### 验证

```bash
python3 -m unittest discover -s plugins/planning-workflows/tests -v
python3 skills/codex-plugin-marketplaces/scripts/audit_marketplace.py .
```

更完整的说明见 `plugins/planning-workflows/README.md`。

### agent-notify

将 Claude Code、Codex 和 OpenCode 的回合结束 / 权限申请事件转发为 macOS 原生桌面通知，点击通知可激活发起任务的终端应用。

- Claude Code：`Stop`、`Notification` + `permission_prompt`
- Codex：`Stop`、`PermissionRequest`
- OpenCode：`session.idle`、`permission.updated` / `permission.asked`
- 通知按项目路径分组，新通知替换旧通知
- 优先使用 `terminal-notifier`，未安装时降级到 `osascript`
- macOS 独占；建议先安装 `brew install terminal-notifier`

#### 安装

Claude Code：

```bash
/plugin marketplace add ~/Desktop/ai/agent-plugins
/plugin install agent-notify@claude-agent-plugins
```

Codex：

```bash
codex plugin marketplace add ~/Desktop/ai/agent-plugins
codex plugin add agent-notify@codex-agent-plugins
```

安装后打开 `/hooks` 审核并信任相关 Hook，然后重新打开会话。

OpenCode：

```bash
~/Desktop/ai/agent-plugins/scripts/install-opencode.sh install --disable-legacy
```

脚本会把 `plugins/agent-notify/opencode/agent-notify.js` 软链接到 `~/.opencode/plugins/`。安装后完整退出并重启 OpenCode。

状态检查 / 卸载：

```bash
~/Desktop/ai/agent-plugins/scripts/install-opencode.sh status
~/Desktop/ai/agent-plugins/scripts/install-opencode.sh uninstall
```

#### 手动测试

```bash
printf '%s' '{"cwd":"/tmp/demo","last_assistant_message":"Claude 通知验证"}' \
  | python3 ~/Desktop/ai/agent-plugins/plugins/agent-notify/bin/agent-notify claude stop

printf '%s' '{"cwd":"/tmp/demo","last_assistant_message":"Codex 通知验证"}' \
  | python3 ~/Desktop/ai/agent-plugins/plugins/agent-notify/bin/agent-notify codex stop

printf '%s' '{"cwd":"/tmp/demo","last_assistant_message":"OpenCode 通知验证"}' \
  | python3 ~/Desktop/ai/agent-plugins/plugins/agent-notify/bin/agent-notify opencode stop
```

更完整的说明见 `plugins/agent-notify/README.md`。

## Claude 插件市场

- 市场名称：`claude-agent-plugins`
- 配置文件：`.claude-plugin/marketplace.json`
- 当前包含 `agent-notify`、`memory-with-files`、`planning-workflows` 三个插件与四个 skill 分组：

### memory-with-files

Claude Code 与 Codex 共用同一套主动记忆 Skill、项目本地目录、精简恢复摘要和两个生命周期 Hook。

```bash
/plugin marketplace add ~/Desktop/ai/agent-plugins
/plugin install memory-with-files@claude-agent-plugins
```

安装后审核并信任 `SessionStart`、`PreCompact` Hook，再重新启动 Claude Code 会话。任务状态仍由 `planning-workflows` 的设计或实施计划管理；设置 `MEMORY_WITH_FILES_DISABLED=1` 可临时关闭插件。

### agent-notify

Claude Code 回合结束或触发权限提示时，通过 macOS 通知栏推送提醒；点击通知回到发起会话的终端窗口。仅支持 macOS。

- `Stop`：会话结束时提示 `last_assistant_message` 摘要
- `Notification` + matcher `permission_prompt`：授权等待中提醒
- 图标随插件目录分发，通过 `${CLAUDE_PLUGIN_ROOT}/assets` 加载
- 首选 `terminal-notifier`，缺失时降级到 `osascript`

#### 安装

```bash
brew install terminal-notifier
/plugin marketplace add ~/Desktop/ai/agent-plugins
/plugin install agent-notify@claude-agent-plugins
```

在 Claude Code 中重新启动会话生效。首次启用如提示 Hook 需要信任，按提示确认即可。

#### 手动测试

```bash
printf '%s' '{"cwd":"/tmp/demo","last_assistant_message":"Claude 通知验证"}' \
  | python3 ~/.claude/plugins/agent-notify/bin/agent-notify claude stop
```

实际安装路径以 Claude Code 插件缓存位置为准。

OpenCode 安装请使用仓库根目录脚本：

```bash
~/Desktop/ai/agent-plugins/scripts/install-opencode.sh install --disable-legacy
```

### planning-workflows

与 Codex 版本共用 `brainstorming`、`writing-plans`、`systematic-debugging` 和 SessionStart Bootstrap：

- 新功能、行为修改、架构与方案设计自动进入 `brainstorming`
- 设计确认后自动衔接 `writing-plans`
- Bug、测试失败、构建失败、性能或集成异常优先进入 `systematic-debugging`
- 三个 Skill 按各自职责严格路由；调试 Skill 独立运行且不依赖 TDD
- 计划或调试完成后停止，不自动进入执行、Review、Worktree 或子代理工作流

#### 安装

```bash
/plugin marketplace add ~/Desktop/ai/agent-plugins
/plugin install planning-workflows@claude-agent-plugins
```

安装后审核并信任 `SessionStart` Hook，然后重新启动 Claude Code 会话。不要与完整的 Superpowers 插件同时启用。

详情见 `plugins/planning-workflows/README.md`。

### draw-skills

- `chrome-extension-icon-generator`
- `image-size-generator`
- `grok-imagine-video`
- `azure-ssml-tts`
- `api-generate-image`

### project-skills

- `yuque-kb-search`
- `yuque-frontend-requirements`
- `yuque-develop-requirements`
- `geo-skill`

### dev-skills

- `uni-app-x`
- `tauri-desktop`
- `electron-skills`
- `iOS-skill`
- `react-skill`
- `vue-skill`
- `svelte-skill`
- `threejs-skill`
- `figma-rest-h2d-source`
- `safari-web-extension`
- `vscode-extension-skills`
- `cli-session-manager`
- `codex-session-export`
- `codex-session-import`
- `cold-water`
- `cdp-skill`

## Skills 一览

### 1. chrome-extension-icon-generator

用途：

- 生成 Chrome 扩展标准图标
- 输出 `16x16`、`48x48`、`128x128` 三个尺寸 PNG

适用请求示例：

- “帮我做一个 Chrome 扩展图标”
- “把这个 SVG 导出成浏览器插件图标”

详情见：

- `skills/chrome-extension-icon-generator/SKILL.md`

### 2. image-size-generator

用途：

- 生成多个指定尺寸的图片资源
- 适合图标、封面图、OG 图、Banner、缩略图

适用请求示例：

- “生成 1200x630 和 800x450 两张分享图”
- “把这个 logo 导出成 16/32/48/128 PNG”

详情见：

- `skills/image-size-generator/SKILL.md`

### 3. grok-imagine-video

用途：

- 对接 xAI Grok Imagine API，支持文生图、图像编辑、文生视频、图生视频、视频编辑
- 适合通过自然语言生成图片或视频，或对现有图片、视频素材进行编辑

适用请求示例：

- “生成一段夕阳海边的短视频”
- “把这张静态图片做成会动的视频”
- “给这段视频加上暖色夕阳滤镜”

需要的环境变量：

- `XAI_API_KEY`
  xAI API Key，必填。用于调用 Grok Imagine API。
- `XAI_API_BASE_URL`
  可选。用于覆盖默认 API 地址；未设置时默认使用 `https://api.x.ai/v1`。
- `XAI_IMAGE_MODEL`
  可选。用于覆盖默认图片模型名称；未设置时使用 xAI 默认值。
- `XAI_VIDEO_MODEL`
  可选。用于覆盖默认视频模型名称；未设置时使用 xAI 默认值。

备注：

- 原作者 Github 地址：https://github.com/devvgwardo/grok-imagine-video

详情见：

- `skills/grok-imagine-video/SKILL.md`

### 4. azure-ssml-tts

用途：

- 通过 Azure Speech REST SSML 生成 MP3 旁白
- 支持中、英、日、韩、法、德、西、俄等多语言声音
- 适合中文多音字强制读音、SSML phoneme、停顿、强调、语速、音调、音量和风格控制

适用请求示例：

- “帮我生成一段中文旁白音频”
- “这句文案里的‘重’要读 chong2”
- “用 SSML 控制停顿和语速”

需要的环境变量：

- `AZURE_SPEECH_KEY`
  Azure Speech 资源 Key。
- `AZURE_SPEECH_REGION`
  Azure Speech 资源区域。

详情见：

- `skills/azure-ssml-tts/SKILL.md`

### 5. api-generate-image

用途：

- 通过 OpenAI 兼容的 Image API 生成位图图片
- 默认使用官方 OpenAI API，也支持通过 `CUSTOM_IMAGE_URL` 接入兼容端点
- 适合用户明确要求走 API、CLI、`/v1/images/generations` 或指定图片模型/端点的场景

适用请求示例：

- “用 API 生成一张产品海报”
- “通过自定义图片模型生成这张图”
- “调用 `/v1/images/generations` 出图”

需要的环境变量：

- `OPENAI_API_KEY`
  OpenAI 或兼容服务 API Key，必填。
- `CUSTOM_IMAGE_URL`
  可选。自定义 OpenAI 兼容图片服务地址。

详情见：

- `skills/api-generate-image/SKILL.md`

### 6. yuque-kb-search

用途：

- 检索语雀知识库文档
- 根据搜索结果继续读取正文
- 面向 SDK/API 类问题补充原文地址和调用示例

适用请求示例：

- “检索语雀里关于导航栏设置的文档”
- “查一下某个业务项目的需求文档”
- “找语雀里 SDK 调用方式，并给示例”

需要的环境变量：

- `YUQUE_TOKEN`
  语雀开放 API Token，必填。用于访问语雀知识库接口并读取文档内容。

详情见：

- `skills/yuque-kb-search/SKILL.md`
- `skills/yuque-kb-search/references/yuque-api.md`

### 7. yuque-frontend-requirements

用途：

- 拉取并清洗语雀文档内容，转为可读 Markdown
- 基于语雀 PRD、交互说明、页面方案等内容整理前端技术实现需求文档

适用请求示例：

- “把这篇语雀需求文档整理成前端开发文档”
- “根据语雀链接提炼页面字段、交互和接口需求”
- “把语雀 PRD 转成前端可执行的技术文档”

需要的环境变量：

- `YUQUE_TOKEN`
  语雀开放 API Token。用于读取私有或受限语雀文档；如果命令行已显式传入 `--token`，则可以不依赖该环境变量。

详情见：

- `skills/yuque-frontend-requirements/SKILL.md`

### 8. yuque-develop-requirements

用途：

- 拉取语雀文档内容，清洗 HTML/CSS 包裹内容为可读 Markdown
- 基于语雀 PRD、需求说明提炼技术实现需求文档
- 支持前端 JavaScript/TypeScript 和后端 Java 两种技术栈

适用请求示例：

- “把这个语雀需求文档转成前端技术文档”
- “根据语雀链接提炼后端接口需求”
- “把语雀 PRD 转成技术可执行的需求文档”

需要的环境变量：

- `YUQUE_TOKEN`
  语雀开放 API Token，必填。用于读取语雀文档内容。

详情见：

- `skills/yuque-develop-requirements/SKILL.md`

### 9. geo-skill

用途：

- GEO（Generative Engine Optimization）与 AI SEO 策略
- 优化网站、品牌、内容在 ChatGPT、Perplexity、Gemini、Google AI Overview 等生成式答案中的可见度
- 支持 AI 引用策略、内容审计、结构化数据、`llms.txt`、robots、sitemap 和实体可信度分析

适用请求示例：

- “帮我做一次 GEO 审计”
- “怎么让 ChatGPT 更容易引用我的网站”
- “优化这篇文章，让 AI 搜索更容易发现和推荐”

详情见：

- `skills/geo-skill/SKILL.md`

### 10. uni-app-x

用途：

- 辅助 AI 开发 uni-app x 跨平台应用
- 涵盖 UTS 语言、uvue 渲染引擎、组件、API、CSS、插件开发等完整知识体系
- 支持 Android、iOS、HarmonyOS、Web、微信小程序多端开发指导

适用请求示例：

- “创建一个 uni-app x 项目页面”
- “帮我写一个 uni-app x 的列表组件”
- “UTS 和 TypeScript 有什么区别”
- “uni-app x 的 CSS 支持哪些属性”

详情见：

- `skills/uni-app-x/SKILL.md`
- 官方文档：https://doc.dcloud.net.cn/uni-app-x/

### 11. tauri-desktop

用途：

- Rust 桌面端开发技能，基于 Tauri v2 框架
- 使用官方 Tauri CLI 初始化 React + TypeScript 项目
- 支持 Tailwind/DaisyUI、国际化、主题、自动更新、打包发布和 GitHub Workflows 等可选能力

适用请求示例：

- “创建一个 Rust 桌面应用”
- “初始化一个 Tauri 项目”
- “给应用添加自动更新和打包发布配置”

详情见：

- `skills/tauri-desktop/SKILL.md`

### 12. electron-skills

用途：

- Electron 桌面应用专项开发、维护、迁移和排障
- 覆盖主进程、渲染进程、preload、IPC、BrowserWindow、菜单、打包、配置、升级链路与安全实践
- 支持 Electron 官方项目和 electron-egg 项目

适用请求示例：

- “帮我创建一个 Electron 应用”
- “排查 Electron preload 和 IPC 通信问题”
- “给 electron-egg 项目配置打包和自动升级”

详情见：

- `skills/electron-skills/SKILL.md`

### 13. iOS-skill

用途：

- iOS Swift 专项开发、维护、迁移和排障
- 覆盖 Swift、SwiftUI、UIKit、导航、async/await、Combine、URLSession、Core Data、SwiftData、Xcode 配置、签名、TestFlight 和 App Store 发布
- 支持测试、性能、权限、推送、后台任务、Widget、深链和 Apple 平台能力

适用请求示例：

- “帮我写一个 SwiftUI 页面”
- “排查 iOS 网络请求和 async/await 取消问题”
- “准备 TestFlight 或 App Store 发布前检查”

详情见：

- `skills/iOS-skill/SKILL.md`

### 14. react-skill

用途：

- React 专项开发、维护、迁移和排障
- 覆盖 React 18/19、Hooks、组件、React Router、Redux Toolkit、TanStack Query、Next.js、React Native、TypeScript、测试、性能与可访问性

适用请求示例：

- “帮我改一个 React 组件”
- “排查 React Router 路由问题”
- “初始化一个 React Native / Expo 页面”

详情见：

- `skills/react-skill/SKILL.md`

### 15. vue-skill

用途：

- Vue.js 专项开发、维护、迁移和排障
- 覆盖 Vue 2、Vue 3、Vue Router 3/4、Pinia、Vuex、组件、路由、状态管理、TypeScript、测试、性能与迁移决策

适用请求示例：

- “帮我写一个 Vue 3 组件”
- “把 Vuex 逻辑迁移到 Pinia”
- “排查 Vue Router 路由守卫问题”

详情见：

- `skills/vue-skill/SKILL.md`

### 16. svelte-skill

用途：

- Svelte/SvelteKit 专项开发、维护、迁移和排障
- 覆盖 Svelte 4/5、runes、legacy 响应式语法、stores、路由、load、form actions、SSR/SSG、Vite、TypeScript、测试、性能与部署

适用请求示例：

- “帮我写一个 Svelte 5 组件”
- “排查 SvelteKit load 或 form action 问题”
- “把旧 Svelte 组件迁移到 runes 写法”

详情见：

- `skills/svelte-skill/SKILL.md`

### 17. threejs-skill

用途：

- Three.js / WebGL / WebGPU 3D 应用开发、调试和优化
- 覆盖项目搭建、场景、相机、灯光、材质、纹理、几何体、交互拾取、动画、加载器、后期处理、控件、音频、WebXR、Node/TSL 和性能排查

适用请求示例：

- “帮我搭一个 Three.js 场景”
- “修复 glTF 模型加载问题”
- “给 3D 页面添加 OrbitControls 和后期 Bloom”

详情见：

- `skills/threejs-skill/SKILL.md`

### 18. figma-rest-h2d-source

用途：

- 在 Figma MCP `get_metadata` / `get_design_context` 不可用、限流或未注入时，用 Figma REST 节点 JSON 作为 h2d 组件生成的兜底数据源
- 支持从完整 Figma URL 或 `fileKey` + `nodeId` 拉取 `/v1/files/:fileKey/nodes` 原始节点树
- 辅助提取尺寸、坐标、颜色、文字、圆角、Auto Layout 等设计事实，并标注 REST 原始 JSON 来源

适用请求示例：

- “用 REST 兜底继续生成这个 h2d 组件”
- “Figma MCP 拿不到 design_context，改用 Figma REST JSON”
- “根据这个 Figma URL 拉节点 JSON 做 h2d”

需要的环境变量：

- `FIGMA_TOKEN` 或 `FIGMA_REST_TOKEN`
  Figma REST API Token，必填。用于调用 Figma REST `/v1/files/:fileKey/nodes` 接口。

详情见：

- `skills/figma-rest-h2d-source/SKILL.md`

### 19. safari-web-extension

用途：

- 构建、修改和调试 Safari Web Extension 及其 Xcode Host 项目
- 覆盖 `manifest.json`、popup/content/background 脚本、storage/tabs/scripting、图标和转换流程
- 处理 Safari 特有问题，例如 Web Inspector 限制、`file:///` 路由映射、popup 剪贴板行为和 converter 覆盖风险

适用请求示例：

- “帮我创建一个 Safari Web Extension”
- “把 Chrome Extension 转成 Safari 插件”
- “排查 Safari 插件 popup 不能访问剪贴板的问题”

详情见：

- `skills/safari-web-extension/SKILL.md`

### 20. vscode-extension-skills

用途：

- VS Code 扩展开发专项技能
- 覆盖 TypeScript 脚手架、`package.json` manifest、activationEvents、contributes.commands、命令注册、Webview、ExtensionContext、VSIX 打包、本地安装与发布前检查

适用请求示例：

- “帮我创建一个 VS Code 扩展”
- “给扩展新增一个命令和快捷键”
- “把 VS Code 扩展打包成 VSIX”

详情见：

- `skills/vscode-extension-skills/SKILL.md`

### 21. cli-session-manager

用途：

- 管理 Claude Code、Codex、OpenCode 等 CLI session 生命周期
- 支持创建新 session、恢复已有 session、执行任务并记录 session ID
- 适合需要把具体任务交给外部 CLI Agent 执行或续接的场景

适用请求示例：

- “调用 Claude Code CLI 处理这个任务”
- “恢复上次 Codex CLI session 继续”
- “帮我管理 OpenCode 的 session”

详情见：

- `skills/cli-session-manager/SKILL.md`

### 22. codex-session-export

用途：

- 把本机 `~/.codex` 中属于当前项目的 Codex 会话导出到项目内 `.codex-session-archive`
- 支持导出全部会话、最近一条会话或指定 session

适用请求示例：

- “把当前项目的 Codex 会话导出到项目档案”
- “保存这个 session，之后要在另一台机器恢复”

详情见：

- `skills/codex-session-export/SKILL.md`

### 23. codex-session-import

用途：

- 把项目 `.codex-session-archive` 中的 Codex 会话导回本机 `~/.codex`
- 支持冲突检测、批量导入和临时恢复

适用请求示例：

- “把项目里的 Codex 会话恢复到本机”
- “导入这个 session，然后用 codex resume 继续”

详情见：

- `skills/codex-session-import/SKILL.md`

### 24. cold-water

用途：

- 泼冷水模式，覆盖需求审查、Code Review、产品决策、个人决策、架构选型、上线前风险、测试盲区和上线后复盘
- 适合在方案评估、重大决策或上线前主动挑刺，暴露隐含假设、过度工程和最可能故障点

适用请求示例：

- “帮我泼冷水看看这个方案”
- “这个架构有没有问题”
- “上线前帮我挑刺”

详情见：

- `skills/cold-water/SKILL.md`

### 25. cdp-skill

用途：

- 分析、设计、实现、审查和排查 Chromium DevTools Protocol（CDP）集成
- 覆盖远程调试端点发现、WebSocket 会话、Runtime 注入、页面重载重注入、renderer bridge、watcher 恢复和 CDP 截图验证
- 强调 loopback 绑定、目标身份校验、注入幂等性和不修改官方应用文件的增强方式

适用请求示例：

- “帮我分析这个项目的 CDP 连接和注入流程”
- “排查 Electron 远程调试端口或 WebSocket 连接问题”
- “通过 CDP 给 Chromium 应用注入脚本并支持页面重载恢复”

详情见：

- `skills/cdp-skill/SKILL.md`
- `skills/cdp-skill/references/`

### 26. codex-plugin-marketplaces

用途：

- 管理 Codex 插件和插件市场的完整生命周期
- 覆盖插件创建与迁移、本地或 Git marketplace 发布、安装与更新、缓存版本处理、Hook 信任和旧版本故障排查
- 区分源码仓库、已安装缓存、Codex marketplace、Claude marketplace 和 Codex 全局状态，避免修改错误目标
- 提供只读 marketplace 审计脚本，检查插件名称、目录、manifest、策略和 Hook 路径是否一致

适用请求示例：

- “在当前仓库创建一个 Codex marketplace 插件并安装”
- “把现有插件迁移到另一个 marketplace 仓库”
- “配置 Git marketplace 并安装插件”
- “插件更新后 Codex 仍然加载旧版本，帮我排查”

审计当前仓库：

```bash
python3 skills/codex-plugin-marketplaces/scripts/audit_marketplace.py .
```

详情见：

- `skills/codex-plugin-marketplaces/SKILL.md`
- `skills/codex-plugin-marketplaces/references/`

## 维护建议

- 新增 skill 时，至少包含一个 `SKILL.md`
- 如需被 marketplace 发现，需要同步更新 `.claude-plugin/marketplace.json`
- 参考资料、脚本、模板文件建议放在 skill 目录内，避免散落在仓库根目录
