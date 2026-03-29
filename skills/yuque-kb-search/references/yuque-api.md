# 语雀知识库检索 API 参考

## 认证

- Header: `X-Auth-Token`
- Base URL: `https://www.yuque.com/api/v2`

## 检索接口

- Method: `GET`
- Path: `/search`

### 参数

- `q` `string` 必填：搜索关键词
- `type` `string` 可选：`doc` / `repo` / `art`
- `scope` `string` 可选：搜索范围，默认全站

### AI 侧约定

- 用户问“关于 XXX 的内容有哪些”时，优先调用该接口。
- 优先提取搜索结果中的 `title`、`summary`、`url` 返回给用户。
- 对需要进一步回答的问题，再读取正文。

## 内容提取

### 1. 列出知识库文档

- Method: `GET`
- Path: `/repos/{namespace}/docs`
- 用途：拿到某个知识库下的文档列表与 `slug`

### 2. 获取文档详情

- Method: `GET`
- Path: `/repos/{namespace}/docs/{slug}`
- 可选参数：`raw=1`
- 用途：获取文档正文；`raw=1` 时优先返回原始 Markdown

## 推荐 RAG 流程

1. 从用户问题提取核心关键词
2. 调用 `/search?q=关键词&type=doc`
3. 选最相关的 3 到 5 篇文档
4. 对候选文档调用 `/repos/{namespace}/docs/{slug}?raw=1`
5. 将文档正文作为上下文总结回答

## 错误处理

- `403`：Token 权限不足或文档为私有
- 限流：批量任务中控制读取数量，必要时加入间隔
- 解析重点：优先关注返回 JSON 的 `data` 节点

## 本技能中的实现约定

- 搜索结果若直接包含 `namespace`、`slug`、`url`，优先直接使用。
- 若搜索结果没有 `slug`，可从文档 URL 推断：
  - 形如 `https://www.yuque.com/{group}/{repo}/{slug}`
  - 则 `namespace = {group}/{repo}`
  - `slug = {slug}`
- 若只能拿到 `title + namespace`，可先调用 `/repos/{namespace}/docs`，再按标题近似匹配 `slug`。
