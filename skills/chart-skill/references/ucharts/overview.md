# uCharts 参考导航

## 何时使用

当用户需要在 uni-app、微信小程序、H5 或 App 中使用 uCharts / `@qiun/ucharts` / `qiun-data-chart` 时，优先读取本目录。典型关键词包括 uCharts、qiun-data-chart、canvas 图表、折线图、柱状图、面积图、饼图、环形图、雷达图、漏斗图、仪表盘、K 线图、混合图、图表数据格式和跨端适配。

## 使用方式

1. 新接入先读 `examples/guide/installation.md` 和 `examples/guide/quick-start.md`。
2. 平台差异读 `examples/guide/platform-support.md`；基础配置读 `examples/guide/configuration.md`。
3. 按图表类型读取 `examples/charts/` 中的对应文件，注意 uCharts 通常使用 `categories + series` 数据结构。
4. 数据、事件、方法、更新和样式问题读 `examples/features/` 与 `api/` 下的细分文档。
5. 常见脚手架可参考 `templates/installation.md`、`templates/basic-chart.md` 和 `templates/configuration.md`。

## 图表类型映射

- 折线图：`examples/charts/line.md`
- 柱状图：`examples/charts/column.md`
- 面积图：`examples/charts/area.md`
- 饼图：`examples/charts/pie.md`
- 环形图：`examples/charts/ring.md`
- 雷达图：`examples/charts/radar.md`
- 漏斗图：`examples/charts/funnel.md`
- 仪表盘：`examples/charts/gauge.md`
- K 线图：`examples/charts/candle.md`
- 混合图：`examples/charts/mix.md`

## 功能映射

- 数据格式：`examples/features/data-format.md` 和 `api/data-api.md`
- 图表事件：`examples/features/chart-events.md` 和 `api/events-api.md`
- 图表方法：`examples/features/chart-methods.md` 和 `api/methods-api.md`
- 动态更新：`examples/features/chart-update.md`
- 外观定制：`examples/features/chart-customization.md` 和 `api/options-api.md`
- 组件 API：`api/chart-api.md`

## 实现提醒

- 不要把 ECharts option 直接传给 uCharts；先转换成 uCharts 支持的数据和配置结构。
- `qiun-data-chart` 的 `type`、`chartData`、`opts` 要保持稳定，异步数据返回后再更新。
- canvas 图表在小程序/App 上对尺寸、像素比和生命周期更敏感，隐藏容器中初始化后要触发更新。
- 大数据量场景优先聚合或抽样，避免移动端 canvas 重绘卡顿。

