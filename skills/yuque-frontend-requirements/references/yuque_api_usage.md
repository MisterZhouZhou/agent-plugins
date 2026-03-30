# 语雀 API 调用说明

## 基础信息

- API Base URL：`https://www.yuque.com/api/v2`
- `repo namespace` 示例：`owner/repo`
- `doc slug` 示例：`doc-slug`

## 请求方式

读取单篇文档时使用：

```bash
curl -X GET "https://www.yuque.com/api/v2/repos/owner/repo/docs/doc-slug?raw=1" \
  -H "X-Auth-Token: YOUR_TOKEN" \
  -H "User-Agent: AI-Data-Extractor"
```

用于解析的文档链接格式可以是：

- `https://www.yuque.com/owner/repo/doc-slug`
- `https://tenant.yuque.com/owner/repo/doc-slug`

## 关键要求

- 必须带上 `raw=1`，否则拿不到原始正文内容。
- 必须带上 `X-Auth-Token`。
- 建议始终带上 `User-Agent`。
- Token 至少需要文档读取权限。
- 如果是私有知识库，Token 对应账号必须能在语雀 Web 端打开该文档。

## 常见 404 原因

- Token 无法访问该私有知识库。
- 链接路径写错了。
- `repo namespace` 或 `doc slug` 填错了。
- 请求里遗漏了 `raw=1`。
- 请求里遗漏了 `User-Agent`。

## 排查建议

- 先在浏览器里确认自己能打开文档。
- 再核对链接中 `owner/repo/doc-slug` 是否与实际页面一致。
- 如果是通过脚本传参，优先打印出最终使用的 `repo namespace` 和 `doc slug`。
- 若同一 Token 能访问其他文档但访问该文档失败，优先怀疑文档权限或路径错误。
