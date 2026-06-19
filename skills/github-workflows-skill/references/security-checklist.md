# GitHub Actions 安全检查清单

涉及发布、部署、包上传、云账号、第三方服务、写权限 token 时必须使用此清单。

## 权限

- 顶层默认：

```yaml
permissions:
  contents: read
```

- 只有需要时才加：
  - `contents: write`：创建 release、提交 tag、写仓库内容。
  - `packages: write`：发布 GHCR/package。
  - `pages: write` 和 `id-token: write`：GitHub Pages 部署。
  - `id-token: write`：OIDC 到 AWS/Azure/GCP/PyPI/Vault。
  - `pull-requests: write`：评论、打标签、修改 PR。
  - `issues: write`：issue 评论、标签、关闭。

把写权限尽量放在单个部署 job，而不是整个 workflow。

## Secrets

- 不要把真实 token、密钥、手机号、账号写进 YAML。
- 使用 `${{ secrets.NAME }}`，并在最终回复中列出需要用户创建的 secret 名称。
- 不要 echo secret；不要把 secret 拼进 artifact、cache key、日志文件。
- Fork PR 默认拿不到普通 secrets，这是预期行为；不要为了让 PR 拿到 secrets 而改用高风险触发器。

## OIDC

优先使用 OIDC 替代长期云密钥。OIDC job 需要：

```yaml
permissions:
  id-token: write
  contents: read
```

并且云端 trust policy 要限制：仓库、分支/tag/environment、audience。不要给任意 repo/ref 可 assume 的角色。

AWS 示例动作：`aws-actions/configure-aws-credentials`。
Azure 示例动作：`azure/login`。
PyPI Trusted Publishing 示例动作：`pypa/gh-action-pypi-publish`。

## 第三方 Action

- GitHub 官方 action 或可信生态 action 可用主版本 tag 作为常规 CI 默认。
- 部署/发布/写权限流程中，第三方 action 优先 pin 到 commit SHA。
- 检查 action 是否需要额外权限、是否执行远程脚本、是否有维护记录。
- 不要从 PR 可控输入直接拼接到 `uses:`。

## PR 安全

- 默认用 `pull_request`。
- 只有当任务完全不 checkout/执行 PR 代码时才考虑 `pull_request_target`。
- 对来自 fork 的 PR，不要在有 secrets/write token 的上下文执行仓库脚本。
- 对 shell 命令中的 PR 标题、body、branch name 等用户输入，使用环境变量传递并正确引用，避免命令注入。

## Cache 和 Artifact

- Cache 不适合存 secrets 或构建后的私有产物。
- Artifact 可能被有权限的人下载；不要上传 `.env`、凭据、完整 home 目录。
- cache key 使用 lockfile hash，不要使用包含 secret 的值。

## 发布与部署防护

- 使用 `environment` 绑定审批和环境级 secrets。
- 发布 job 应 `needs` 测试/构建 job。
- 生产发布建议加 `workflow_dispatch` inputs 或 GitHub Environment approval。
- 对同一环境使用 `concurrency`，避免并发部署互相覆盖。

## 最终回复必须提醒

交付 workflow 后，列出：

- 需要配置的 secrets。
- 需要配置的 GitHub Environments。
- 需要在仓库设置中开启的功能，例如 Pages source 选择 GitHub Actions、packages 权限、OIDC trust policy。
- 任何保守假设，例如默认分支为 `main`、构建产物目录为 `dist`。
