---
name: chart-skill
description: 图表与数据可视化专项开发技能。用于在 uni-app、UniAppX、H5、小程序和移动 App 中创建、维护、迁移或排查图表，重点覆盖 lime-echart/ECharts 与 uCharts 的安装、配置、图表类型、动态数据、事件交互、主题定制、性能优化和跨端适配；当用户提到 chart、ECharts、uCharts、图表、折线图、柱状图、饼图、仪表盘、可视化或 uni-app 图表时应优先使用本技能。
---

# Chart Skill

## 使用场景

当用户需要处理前端图表或数据可视化时使用本技能，尤其是：

- 在 uni-app、UniAppX、H5、小程序或 App 中接入图表。
- 使用 `lime-echart`、Apache ECharts、`@qiun/ucharts` 或 `qiun-data-chart`。
- 创建折线图、柱状图、饼图、环形图、雷达图、仪表盘、漏斗图、散点图、K 线图、热力图、地图或混合图。
- 处理动态数据更新、事件点击、tooltip、legend、主题、响应式布局和移动端性能。
- 排查图表不渲染、尺寸为 0、跨端差异、canvas 适配、数据格式错误或生命周期问题。

## 工作流

1. 先识别项目环境：查看 `package.json`、`pages.json`、组件使用方式和目标平台，判断是 Vue/H5、uni-app、UniAppX、小程序还是 App。
2. 判断图表库：已有 `l-echart`、`@nicefan/lime-echart`、`echarts` 时走 lime-echart；已有 `qiun-data-chart`、`@qiun/ucharts`、`uCharts` 时走 uCharts；项目已有图表封装优先沿用。
3. 根据任务读取最相关的引用文档，先读对应 `overview.md`，再按图表类型、API、模板或功能文档继续查。
4. 实现时保持改动聚焦：只改自然归属的页面、组件、数据转换或图表配置，不重写无关 UI。
5. 完成后验证图表容器尺寸、数据格式、生命周期初始化、跨端平台差异；有可运行项目时执行已有 lint、测试或构建，并预览关键视口。

## 文档结构

详细文档参考 `full-stack-skills/skills/chart-skills` 的结构沉淀在 `references/`：

```text
references/
  lime-echart/
    api/
    examples/
    templates/
    overview.md
    upstream-skill.md
  ucharts/
    api/
    examples/
    templates/
    overview.md
    upstream-skill.md
```

## 引用文档导航

- lime-echart / ECharts / `l-echart` / UniAppX 图表：读 [references/lime-echart/overview.md](references/lime-echart/overview.md)。
- uCharts / `@qiun/ucharts` / `qiun-data-chart` / uni-app canvas 图表：读 [references/ucharts/overview.md](references/ucharts/overview.md)。
- 如果用户未指定图表库，先检查项目依赖和已有组件；无法判断时，优先沿用项目当前库，不为单个图表引入第二套图表栈。

## 选型规则

- 已有 ECharts option、复杂交互、地图、热力图、箱线图、K 线图、复杂主题或多系列联动时，优先考虑 lime-echart/ECharts。
- 已有 `qiun-data-chart`、业务需要快速跨端 canvas 图表、数据结构是 `categories + series` 时，优先考虑 uCharts。
- 在 uni-app 小程序和 App 中，确认图表库支持目标端；不要只在 H5 成功后默认其他端也可用。
- 简单统计卡片、少量指标趋势或纯 CSS 可表达的微型图，不要强行接入完整图表库。
- 不要混用 ECharts option 和 uCharts 数据结构；做迁移时先建立数据适配层，再逐个替换图表。

## 常用核查

- 容器尺寸：图表父容器必须有稳定宽高；隐藏 Tab、弹窗、折叠面板内初始化时要在显示后 resize/update。
- 生命周期：初始化放在组件挂载或库要求的 init 回调中；页面卸载时销毁实例或清理定时器、监听器。
- 数据格式：空数据、缺失字段、字符串数字、时间序列排序、单位换算和精度都要在进入图表前处理清楚。
- 性能：移动端大数据要抽样、分页、聚合或关闭不必要动画；频繁更新要节流，避免每次响应式变化都重建实例。
- 交互：点击、tooltip、legend、缩放和选中状态要符合平台事件模型，小程序/App 端尤其要实机或模拟器验证。
- 质量：优先运行项目已有的 `npm run lint`、`npm test`、`npm run build` 或 uni-app 对应构建命令。

