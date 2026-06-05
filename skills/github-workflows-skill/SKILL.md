---
name: github-workflows-skill
description: Build, audit, and repair production-ready GitHub Actions workflows. Use when Codex needs to create or update .github/workflows/*.yml or *.yaml files, design CI/CD pipelines, choose workflow triggers, add test/build/release/deploy automation, configure reusable workflows, matrix jobs, caching, artifacts, environments, permissions, secrets, OIDC cloud authentication, Pages deployment, Docker image publishing, or troubleshoot GitHub Actions YAML failures.
---

# GitHub Workflows Skill

## 目标

快速为当前仓库构建可运行、可维护、权限最小化的 GitHub Actions workflow。优先交付可直接提交到 `.github/workflows/` 的 YAML，而不是只给说明。

## 工作流

1. **识别项目**
   - 查看仓库文件：`package.json`、`pnpm-lock.yaml`、`requirements.txt`、`pyproject.toml`、`go.mod`、`Cargo.toml`、`Dockerfile`、`src-tauri/`、`apps/`、`packages/`、现有 `.github/workflows/`。
   - 若用户只要求模板，可直接生成；若要落地到仓库，先检查现有 workflow，避免重复触发或覆盖关键发布流程。

2. **确定自动化目标**
   - CI：安装依赖、lint、typecheck、test、build。
   - CD/发布：Docker 镜像、GitHub Pages、npm/PyPI release、GitHub Release、云部署。
   - 维护：定时任务、issue/PR triage、依赖检查、复用 workflow。

3. **选择触发器**
   - 默认 CI：`pull_request` + `push` 到主分支，必要时加 `paths` 限定。
   - 手动执行：加 `workflow_dispatch`，并为高风险发布流程添加 inputs。
   - 发布：用 tags、release、或手动触发；不要把生产发布绑定到所有 push。
   - 定时：用 `schedule`，说明 cron 是 UTC。

4. **生成 YAML**
   - 总是设置顶层或 job 级 `permissions`，默认从 `contents: read` 开始。
   - 使用 `concurrency` 防止同分支重复运行浪费资源。
   - 使用 `actions/checkout`，再按语言使用官方 setup action 和缓存。
   - 对多版本/多系统测试使用 `strategy.matrix`。
   - 对部署 job 使用 `environment`、`needs` 和最小权限。

5. **安全加固**
   - 按需阅读 `references/security-checklist.md`。
   - 不要把 token、密钥、账号写进 workflow；使用 `${{ secrets.NAME }}` 或 OIDC。
   - 对第三方 action：生产/发布/部署流程优先 pin 到 commit SHA；普通 CI 可用主版本 tag，但要提示权衡。
   - 避免在 `pull_request_target` 中 checkout 或执行不可信 PR 代码，除非已明确隔离。

6. **验证**
   - 本地检查 YAML 语法：`ruby -e 'require "yaml"; YAML.load_file(ARGV[0])' .github/workflows/name.yml` 或 `python3 - <<'PY' ...`。
   - 若安装了 GitHub CLI，可用 `gh workflow list`、`gh workflow view` 辅助核验。
   - 如修改仓库，最后列出创建/修改的 workflow 文件、触发条件、需要配置的 secrets/environments。

## 按需加载参考

- `references/official-actions-guide.md`：GitHub Actions 官方语法与核心概念摘要；创建复杂 workflow 前阅读。
- `references/workflow-recipes.md`：可复制改造的 Node、Python、Docker、Pages、Release、Reusable workflow 模板。
- `references/security-checklist.md`：权限、secrets、OIDC、第三方 action、PR 安全检查清单；涉及部署/发布/外部服务时必须阅读。

## 输出约定

- 用户要求“帮我创建/添加 workflow”时，直接写入 `.github/workflows/<purpose>.yml`。
- 用户未指定文件名时，用短横线命名：`ci.yml`、`docker-publish.yml`、`pages.yml`、`release.yml`。
- 回复中用中文概述：文件路径、触发器、主要 job、还需用户在 GitHub 配置的 secrets 或 environment。
- 如果无法确定包管理器或发布目标，做保守假设并标注；只有在会导致错误发布或泄露凭据时才停下来问问题。
