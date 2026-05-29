# lime-echart 参考导航

## 何时使用

当用户需要在 uni-app、UniAppX、H5、小程序或 App 中使用 ECharts 能力时，优先读取本目录。典型关键词包括 `lime-echart`、`l-echart`、ECharts、折线图、柱状图、饼图、散点图、雷达图、仪表盘、漏斗图、热力图、地图、动态数据、事件绑定、主题和性能优化。

## 使用方式

1. 新接入先读 `examples/getting-started/installation.md`，再读 `examples/getting-started/basic-usage.md`。
2. 配置项问题读 `api/options-api.md`；组件属性读 `api/component-api.md`；实例方法读 `api/methods-api.md`；事件读 `api/events-api.md`。
3. 按图表类型读取 `examples/charts/` 中的对应文件，再把示例中的 option 改造成项目当前数据结构。
4. 复杂需求优先读取 `examples/advanced/`，再使用 `templates/` 中的模板搭建组件。

## 图表类型映射

- 折线图：`examples/charts/line-chart.md`
- 柱状图：`examples/charts/bar-chart.md`
- 饼图：`examples/charts/pie-chart.md`
- 散点图：`examples/charts/scatter-chart.md`
- 雷达图：`examples/charts/radar-chart.md`
- 仪表盘：`examples/charts/gauge-chart.md`
- 漏斗图：`examples/charts/funnel-chart.md`
- 热力图：`examples/charts/heatmap.md`
- 地图：`examples/charts/map-chart.md`
- K 线图：`examples/charts/candlestick-chart.md`
- 箱线图：`examples/charts/boxplot-chart.md`
- 树图：`examples/charts/tree-chart.md`

## 进阶能力映射

- 自定义主题：`examples/advanced/custom-theme.md`
- 动态数据：`examples/advanced/dynamic-data.md`
- 事件交互：`examples/advanced/event-handling.md`
- 多图表页面：`examples/advanced/multiple-charts.md`
- 性能优化：`examples/advanced/performance-optimization.md`
- 响应式图表：`examples/advanced/responsive-charts.md`

## 实现提醒

- 确保图表容器有明确高度，避免初始化时宽高为 0。
- 在 `bindinit` 或库要求的初始化回调里拿到 chart 实例后再 `setOption`。
- 页面销毁时释放实例或停止定时更新，避免移动端内存泄漏。
- 跨端开发时至少检查 H5 与目标小程序/App 端表现。

