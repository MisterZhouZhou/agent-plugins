# Workflow Recipes

复制前先按仓库实际命令、分支名、包管理器、发布目标调整。模板默认使用最小权限和可手动扩展的结构。

## Node.js CI

适用于 npm/pnpm/yarn 项目。先读取 `package.json` scripts，只保留真实存在的命令。

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
    strategy:
      fail-fast: false
      matrix:
        node-version: [20, 22]
    steps:
      - uses: actions/checkout@v6
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
          cache: npm
      - run: npm ci
      - run: npm run lint --if-present
      - run: npm test --if-present
      - run: npm run build --if-present
```

pnpm 变体：

```yaml
      - uses: pnpm/action-setup@v4
        with:
          version: 10
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm lint
      - run: pnpm test
      - run: pnpm build
```

## Python CI

```yaml
name: Python CI

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
    strategy:
      fail-fast: false
      matrix:
        python-version: ["3.11", "3.12"]
    steps:
      - uses: actions/checkout@v6
      - uses: actions/setup-python@v5
        with:
          python-version: ${{ matrix.python-version }}
          cache: pip
      - run: python -m pip install --upgrade pip
      - run: |
          if [ -f requirements.txt ]; then pip install -r requirements.txt; fi
          if [ -f pyproject.toml ]; then pip install -e .; fi
      - run: pytest
```

## Docker Build And Push To GHCR

适用于有 `Dockerfile` 的仓库。仅在 push 到 main 或 tag 时推送镜像，PR 只构建不推送。

```yaml
name: Docker

on:
  pull_request:
  push:
    branches: [main]
    tags: ["v*"]

permissions:
  contents: read
  packages: write

concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

env:
  IMAGE_NAME: ghcr.io/${{ github.repository }}

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
      - uses: docker/setup-buildx-action@v3
      - uses: docker/login-action@v3
        if: github.event_name != 'pull_request'
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}
      - uses: docker/metadata-action@v5
        id: meta
        with:
          images: ${{ env.IMAGE_NAME }}
      - uses: docker/build-push-action@v6
        with:
          context: .
          push: ${{ github.event_name != 'pull_request' }}
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max
```

## GitHub Pages Static Deploy

适用于构建产物目录，例如 `dist`、`build`、`public`。需要在仓库 Pages 设置中选择 GitHub Actions。

```yaml
name: Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - run: npm run build
      - uses: actions/configure-pages@v5
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist

  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build
    steps:
      - uses: actions/deploy-pages@v4
        id: deployment
```

## GitHub Release From Tag

```yaml
name: Release

on:
  push:
    tags: ["v*"]
  workflow_dispatch:

permissions:
  contents: write

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
      - run: ./scripts/build-release.sh
      - uses: actions/upload-artifact@v4
        with:
          name: release-assets
          path: dist/*

  release:
    runs-on: ubuntu-latest
    needs: build
    steps:
      - uses: actions/download-artifact@v5
        with:
          name: release-assets
          path: dist
      - uses: softprops/action-gh-release@v2
        with:
          files: dist/*
```

生产发布中第三方 action 建议 pin SHA；使用上面 release 模板时，考虑把 `softprops/action-gh-release@v2` 改成已核验 commit SHA。

## Reusable Workflow

被调用方：

```yaml
name: Reusable Node CI

on:
  workflow_call:
    inputs:
      node-version:
        required: false
        type: string
        default: "22"
    secrets:
      npm-token:
        required: false

permissions:
  contents: read

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ inputs.node-version }}
          cache: npm
      - run: npm ci
      - run: npm test --if-present
```

调用方：

```yaml
jobs:
  ci:
    uses: ./.github/workflows/reusable-node-ci.yml
    with:
      node-version: "22"
    secrets: inherit
```
