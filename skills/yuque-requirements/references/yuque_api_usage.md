# Yuque API Usage

## Base settings

- API base: `https://www.yuque.com/api/v2`
- Repo namespace example: `owner/repo`
- Doc slug example: `doc-slug`

## Request pattern

Use:

```bash
curl -X GET "https://www.yuque.com/api/v2/repos/owner/repo/docs/doc-slug?raw=1" \
  -H "X-Auth-Token: YOUR_TOKEN" \
  -H "User-Agent: AI-Data-Extractor"
```

Document URLs used for parsing may be either:

- `https://www.yuque.com/owner/repo/doc-slug`
- `https://tenant.yuque.com/owner/repo/doc-slug`

## Important notes

- `raw=1` should be sent to retrieve the raw document body.
- `User-Agent` should always be sent.
- The token must have read permission.
- For private knowledge bases, the token owner must be able to open the document in the Yuque web UI.

## Common 404 causes

- The token cannot access the private knowledge base.
- The URL path is wrong.
- The `repo namespace` or `doc slug` is incorrect.
- The request omits the `User-Agent` header.
