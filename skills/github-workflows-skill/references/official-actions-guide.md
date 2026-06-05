# GitHub Actions 官方要点

来源优先级：GitHub 官方 Actions 文档与 GitHub Actions 产品页。

- 产品入口：https://github.com/features/actions
- Workflow 语法：https://docs.github.com/en/actions/writing-workflows/workflow-syntax-for-github-actions
- 创建示例 workflow：https://docs.github.com/en/actions/tutorials/creating-an-example-workflow
- 复用 workflow：https://docs.github.com/en/actions/how-tos/reuse-automations/reuse-workflows
- 安全部署与 OIDC：https://docs.github.com/en/actions/how-tos/secure-your-work/security-harden-deployments

## 核心模型

- Workflow 是仓库中的 YAML 文件，必须放在 `.github/workflows/`。
- 一个 workflow 由 `on` 触发器和 `jobs` 组成。
- 一个 job 在 runner 上运行，包含多个 `steps`。
- Step 可以执行 shell 命令 `run`，也可以引用 action `uses`。
- Job 默认并行；需要顺序时用 `needs`。

## 基础骨架

```yaml
name: CI

on:
  pull_request:
  push:
    branches: [main]

permissions:
  contents: read

concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
      - run: echo "Add project commands here"
```

## 常用顶层字段

- `name`：显示在 Actions 页面中的 workflow 名称。
- `run-name`：单次运行的显示名，可使用 `${{ github.actor }}` 等表达式。
- `on`：触发事件，常见值包括 `push`、`pull_request`、`workflow_dispatch`、`schedule`、`release`、`workflow_call`。
- `permissions`：设置 `GITHUB_TOKEN` 权限；优先显式最小权限。
- `env`：顶层环境变量；敏感值必须来自 `secrets`。
- `defaults.run`：统一 shell 或 working-directory。
- `concurrency`：限制同组并发，常用于取消同分支旧 CI。

## 常用 job 字段

- `runs-on`：runner，例如 `ubuntu-latest`、`windows-latest`、`macos-latest`、self-hosted labels。
- `needs`：声明依赖 job。
- `if`：条件执行。
- `strategy.matrix`：多版本/多平台矩阵。
- `timeout-minutes`：防止 job 卡死。
- `permissions`：job 级权限，适合部署 job 单独提升权限。
- `environment`：绑定 GitHub Environment，用于审批、环境 secrets、部署记录。

## 触发器选择

- CI 默认使用 `pull_request` 和 `push` 到主分支。
- 影响成本的 monorepo workflow 应使用 `paths` 或 `paths-ignore`。
- 发布默认使用 tag 或 `workflow_dispatch`，不要默认在任意 push 发布。
- `schedule` 使用 UTC cron；若用户说北京时间，需要换算。
- `pull_request_target` 有高风险，只用于不执行 PR 代码的元数据任务。

## 官方 action 常用版本

生成前如果网络可用，优先核验当前最新主版本；无法核验时使用官方文档常见主版本，并保持可升级。

- `actions/checkout@v6`
- `actions/setup-node@v4`
- `actions/setup-python@v5`
- `actions/cache@v4` 或 setup action 自带 cache
- `actions/upload-artifact@v4`
- `actions/download-artifact@v5`
- `docker/login-action@v3`
- `docker/setup-buildx-action@v3`
- `docker/build-push-action@v6`

## 生成策略

1. 优先使用项目已有命令：不要凭空发明 `npm run lint`，先看 `package.json scripts`。
2. 包管理器按锁文件判断：`pnpm-lock.yaml` > pnpm，`yarn.lock` > yarn，`package-lock.json` > npm。
3. 部署与发布 job 单独拆分，并通过 `needs` 依赖测试构建。
4. 对 release artifact 使用 upload/download artifact 跨 job 传递。
5. 对复用 workflow 使用 `workflow_call`，把环境差异设计成 inputs/secrets。
