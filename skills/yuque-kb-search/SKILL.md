---
name: yuque-kb-search
description: 通过语雀开放 API 检索知识库并读取文档内容。当用户提到语雀、Yuque、语雀知识库、知识库搜索、搜索文档、检索文档、根据语雀文档回答问题、查询 SDK/API 调用方式、接入示例、调用示例时使用此技能。
---

# Yuque KB Search

此技能用于通过语雀 API 做知识库检索和文档读取，并基于检索结果生成回答。

## 何时使用

- 用户要在语雀知识库里搜索某个主题、术语、接口或 SDK。
- 用户希望根据语雀文档回答问题，而不是只返回搜索结果。
- 用户询问 SDK/API 调用方式、接入流程、示例代码或参数说明。

## 前提

- 所有请求都需要 `X-Auth-Token`。
- 默认从环境变量 `YUQUE_TOKEN` 读取 Token。
- 默认 Base URL 为 `https://www.yuque.com/api/v2`。

## 工作流

1. 提取用户问题中的核心检索词。
2. 先做全文检索，优先查文档类型：
   ```bash
   python3 skills/yuque-kb-search/scripts/yuque_search.py search "SDK 调用" --type doc --top-k 5
   ```
3. 如果需要正文上下文，直接对搜索结果做增强读取：
   ```bash
   python3 skills/yuque-kb-search/scripts/yuque_search.py rag "SDK 调用" --type doc --top-k 3 --raw --max-content-chars 5000
   ```
4. 如果已经拿到具体文档 URL，直接读取正文：
   ```bash
   python3 skills/yuque-kb-search/scripts/yuque_search.py read --url "https://www.yuque.com/org/repo/slug" --raw
   ```
5. 若搜索结果没有直接给出 `slug`，脚本会优先从 `url` 推断；仍无法确定时，会尝试列出该知识库文档并按标题匹配。

## 输出要求

- 普通检索问答：
  - 先给结论，再列出相关文档标题和原文地址。
  - 如果答案来自多篇文档，明确区分每篇文档支撑了哪部分结论。
- SDK/API 调用类问题：
  - 必须附带原文档地址。
  - 在结尾给一个最小可用调用示例。
  - 示例应尽量贴近文档原意；若文档未给出完整示例，可基于参数说明补全，但要明确这是推断示例。

## 调用建议

- 检索阶段优先使用 `rag`，因为它会在搜索后自动补抓正文，适合 RAG。
- 只想快速看候选文档时，用 `search`。
- 已知文档地址或 `namespace + slug` 时，用 `read`。

## 回答模板建议

当问题是普通知识查询时，回答应包含：

- 简要答案
- 相关文档
- 原文地址

当问题是 SDK/API 调用类问题时，回答应包含：

- 结论或步骤
- 关键参数/限制
- 原文地址
- 调用示例

## 异常处理

- 如果返回 `403`，优先提示 Token 权限不足或文档是私有文档。
- 如果返回限流或频率错误，降低批量读取数量，必要时减少 `top-k`。
- 如果搜索结果能拿到标题和 URL 但无法读正文，仍可先返回候选文档列表，并说明正文读取失败原因。

## 参考资料

- API 细节：`references/yuque-api.md`
- 调用脚本：`scripts/yuque_search.py`
