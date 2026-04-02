# Agent Plugins

本仓库用于维护本地 Agent Skills，并通过 `.claude-plugin/marketplace.json` 暴露给插件市场配置。

## 目录结构

```text
.
├── .claude-plugin/
│   └── marketplace.json
└── skills/
    ├── chrome-extension-icon-generator/
    ├── image-size-generator/
    └── yuque-kb-search/
```

## Marketplace 分组

当前在 `.claude-plugin/marketplace.json` 中配置了两个插件分组：

- `draw-skills`
  - `chrome-extension-icon-generator`
  - `image-size-generator`
- `yuque-skills`
  - `yuque-kb-search`

## Skills 一览

### 1. chrome-extension-icon-generator

用途：

- 生成 Chrome 扩展标准图标
- 输出 `16x16`、`48x48`、`128x128` 三个尺寸 PNG

适用请求示例：

- “帮我做一个 Chrome 扩展图标”
- “把这个 SVG 导出成浏览器插件图标”

### 2. image-size-generator

用途：

- 生成多个指定尺寸的图片资源
- 适合图标、封面图、OG 图、Banner、缩略图

适用请求示例：

- “生成 1200x630 和 800x450 两张分享图”
- “把这个 logo 导出成 16/32/48/128 PNG”

### 3. yuque-kb-search

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

### 4. grok-imagine-video

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

- 原作者Github地址
  https://github.com/devvgwardo/grok-imagine-video

### 5. yuque-frontend-requirements

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

## 维护建议

- 新增 skill 时，至少包含一个 `SKILL.md`
- 如需被 marketplace 发现，需要同步更新 `.claude-plugin/marketplace.json`
- 参考资料、脚本、模板文件建议放在 skill 目录内，避免散落在仓库根目录
