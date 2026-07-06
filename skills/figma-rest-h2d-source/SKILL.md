---
name: figma-rest-h2d-source
description: Use Figma REST node JSON as the fallback source of truth for h2d component generation when Figma MCP get_metadata/get_design_context is unavailable, not injected, rate-limited, or blocked. Trigger when working on SOUCHE HTML-to-Figma components from a full Figma URL, fileKey/nodeId, "A方案", "REST 兜底", "figd token", "Figma REST JSON", or asks to continue h2d work without MCP design_context.
---

# Figma REST H2D Source

## 核心原则

把 Figma REST `/v1/files/:fileKey/nodes` 的节点 JSON 当作临时地面真相，继续推进 h2d 组件生成。REST JSON 不等同于 MCP `get_design_context`：不要声称拿到了 React/code 摘要，也不要伪造 `get_metadata` 或 `get_design_context` 响应。

适用场景：

- Figma MCP 工具未注入、OAuth/bearer 配置异常、Starter 调用次数耗尽。
- 用户提供完整 Figma URL，或 `fileKey` + `nodeId`，并允许用 REST token 拉取原始节点树。
- 项目已有 REST JSON，例如 `output/ActionPanel/figma-rest-node-16170-46288.json`。

## 工作流

1. **确认输入**：需要完整 Figma URL，或 `fileKey`、`nodeId`、组件名。没有组件名时从节点名推断，但要在总结里说明。
2. **优先复用现有 JSON**：先查 `output/<Component>/figma-rest-node-*.json`。已有且节点匹配时，不重复拉取。
3. **拉取 REST 节点**：使用 `scripts/fetch-figma-node.mjs`，token 只从环境变量读取。
4. **结构化解析**：用脚本或 Node 递归读取 JSON，不用字符串 grep 推断样式。
5. **提取设计事实**：记录节点名、类型、尺寸、absoluteBoundingBox、fills、strokes、cornerRadius、文字内容、fontSize、fontWeight、lineHeight、effects、layoutMode、padding、itemSpacing。
6. **生成 h2d**：按项目 `h2d-generator` 的两阶段模式构造节点树，再计算每个节点绝对 rect。
7. **标注数据来源**：组件规范和总结里写清“来源为 Figma REST 原始节点 JSON”，不要写“全 MCP 实测”。

## 拉取命令

推荐把 token 放在环境变量中，避免出现在命令历史或日志：

```bash
export FIGMA_TOKEN="figd_..."
node .codex/skills/figma-rest-h2d-source/scripts/fetch-figma-node.mjs \
  --file-key Zvry3oKVDBJrnCXL1oYPWX \
  --node-id 16170:46288 \
  --component ActionPanel
```

也支持完整 Figma 地址，脚本会自动解析 `/design/<fileKey>/` 和 `node-id=16170-46288`，并把节点 ID 规范化成 `16170:46288`：

```bash
node .codex/skills/figma-rest-h2d-source/scripts/fetch-figma-node.mjs \
  --url "https://www.figma.com/design/Zvry3oKVDBJrnCXL1oYPWX/xxx?node-id=16170-46288&m=dev" \
  --component ActionPanel
```

先验证解析结果但不请求网络：

```bash
node .codex/skills/figma-rest-h2d-source/scripts/fetch-figma-node.mjs \
  --url "https://www.figma.com/design/Zvry3oKVDBJrnCXL1oYPWX/xxx?node-id=16170-46288&m=dev" \
  --component ActionPanel \
  --dry-run
```

默认输出：

```text
output/<Component>/figma-rest-node-<nodeId-with-dashes>.json
```

也可以显式指定：

```bash
node .codex/skills/figma-rest-h2d-source/scripts/fetch-figma-node.mjs \
  --file-key <fileKey> \
  --node-id <nodeId> \
  --out output/<Component>/figma-rest-node-<node>.json
```

## 提取要点

- `document.absoluteBoundingBox` 是 Figma 画布坐标参考，适合校准组件外框尺寸。
- 子节点的 `absoluteBoundingBox` 可直接推导真实间距，不要凭视觉估算。
- 颜色优先从 `fills`、`strokes`、`backgroundColor` 提取，转换为 h2d 的 `rgb(...)` 或 `{r,g,b,a}` 时保留透明度。
- 文本层用 `characters`、`style.fontSize`、`style.fontWeight`、`style.lineHeightPx`；固定高容器内文本仍按项目规则用自然行高加 rect 居中。
- Auto Layout 信息通常在 `layoutMode`、`primaryAxisAlignItems`、`counterAxisAlignItems`、`padding*`、`itemSpacing`。
- 圆角可能是 `cornerRadius` 或 `rectangleCornerRadii`，四角要分写。

## 交付约束

- 不修改无关组件。
- 不把 token 写入仓库、日志、JSON 产物或最终回复。
- REST JSON 可以作为原始参考产物保存到 `output/<Component>/`。
- 如果最终仍需要 MCP `get_design_context`，把 REST 方案标成兜底数据源，不要替代声明。
