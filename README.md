# Agent Plugins

本仓库用于维护本地 Agent Skills，并通过 `.claude-plugin/marketplace.json` 暴露给插件市场配置。

## 目录结构

```text
.
├── .claude-plugin/
│   └── marketplace.json
└── skills/
    ├── api-generate-image/
    ├── azure-ssml-tts/
    ├── chrome-extension-icon-generator/
    ├── cli-session-manager/
    ├── cold-water/
    ├── electron-skills/
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
    └── yuque-requirements/
```

## Marketplace 分组

当前在 `.claude-plugin/marketplace.json` 中配置了三个插件分组：

- `draw-skills`
  - `chrome-extension-icon-generator`
  - `image-size-generator`
  - `grok-imagine-video`
  - `azure-ssml-tts`
  - `api-generate-image`
- `project-skills`
  - `yuque-kb-search`
  - `yuque-frontend-requirements`
  - `yuque-requirements`
  - `geo-skill`
- `dev-skills`
  - `uni-app-x`
  - `tauri-desktop`
  - `electron-skills`
  - `iOS-skill`
  - `react-skill`
  - `vue-skill`
  - `svelte-skill`
  - `threejs-skill`
  - `safari-web-extension`
  - `vscode-extension-skills`
  - `cli-session-manager`
  - `cold-water`

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

### 8. yuque-requirements

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

- `skills/yuque-requirements/SKILL.md`

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

### 18. safari-web-extension

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

### 19. vscode-extension-skills

用途：

- VS Code 扩展开发专项技能
- 覆盖 TypeScript 脚手架、`package.json` manifest、activationEvents、contributes.commands、命令注册、Webview、ExtensionContext、VSIX 打包、本地安装与发布前检查

适用请求示例：

- “帮我创建一个 VS Code 扩展”
- “给扩展新增一个命令和快捷键”
- “把 VS Code 扩展打包成 VSIX”

详情见：

- `skills/vscode-extension-skills/SKILL.md`

### 20. cli-session-manager

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

### 21. cold-water

用途：

- 泼冷水模式，覆盖需求审查、Code Review、产品决策、个人决策、架构选型、上线前风险、测试盲区和上线后复盘
- 适合在方案评估、重大决策或上线前主动挑刺，暴露隐含假设、过度工程和最可能故障点

适用请求示例：

- “帮我泼冷水看看这个方案”
- “这个架构有没有问题”
- “上线前帮我挑刺”

详情见：

- `skills/cold-water/SKILL.md`

## 维护建议

- 新增 skill 时，至少包含一个 `SKILL.md`
- 如需被 marketplace 发现，需要同步更新 `.claude-plugin/marketplace.json`
- 参考资料、脚本、模板文件建议放在 skill 目录内，避免散落在仓库根目录
