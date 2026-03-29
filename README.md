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

详情见：

- `skills/yuque-kb-search/SKILL.md`
- `skills/yuque-kb-search/references/yuque-api.md`

## 使用方式

### 通过 Skill 触发

如果 Agent 运行时已经接入本仓库中的 skills，用户只要在问题中提到相关场景，Agent 会按 `SKILL.md` 的描述自动触发对应技能。

例如：

- “为 Chrome 扩展生成 128/48/16 图标”
- “把这张图导出成 1200x630 和 512x512”
- “检索语雀知识库里某个 SDK 的导航参数”

### 直接运行语雀检索脚本

`yuque-kb-search` 附带了一个可直接运行的脚本：

```bash
python3 skills/yuque-kb-search/scripts/yuque_search.py --help
```

#### 1. 配置 Token

```bash
export YUQUE_TOKEN=your_token_here
```

也可以通过命令行显式传入：

```bash
python3 skills/yuque-kb-search/scripts/yuque_search.py --token "your_token_here" search "SDK 文档"
```

#### 2. 搜索文档

```bash
python3 skills/yuque-kb-search/scripts/yuque_search.py search "导航栏 配置" --type doc --top-k 5
```

#### 3. 搜索后补抓正文

```bash
python3 skills/yuque-kb-search/scripts/yuque_search.py rag "项目需求文档" --type doc --top-k 3 --raw --max-content-chars 5000
```

#### 4. 直接读取某篇文档

```bash
python3 skills/yuque-kb-search/scripts/yuque_search.py read --url "https://www.yuque.com/org/repo/slug" --raw
```

## 维护建议

- 新增 skill 时，至少包含一个 `SKILL.md`
- 如需被 marketplace 发现，需要同步更新 `.claude-plugin/marketplace.json`
- 参考资料、脚本、模板文件建议放在 skill 目录内，避免散落在仓库根目录
