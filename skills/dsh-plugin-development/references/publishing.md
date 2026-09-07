# npm 发布流程

发布是不可逆或高影响操作。本参考把“发布前准备”和“正式发布”分开：Agent 可以自动执行读取、测试、构建、打包和临时目录安装；正式 `npm publish` 只能在向用户展示精确发布参数并获得明确确认后执行。

## 发布前检查

### 1. 工作区与身份

先确认没有把密钥、`.env`、临时构建目录或不相关改动带入提交：

```bash
git status --short
npm whoami
npm config get registry
npm config get access
```

确认：

- 当前 npm 身份拥有目标 scope/package 的发布权限。
- registry 是用户预期的地址；不要把私有 registry 的凭据发布到公共 registry。
- 包名的 scope、组织归属和访问权限已确认；不能因为本机登录成功就推断有目标包的 publish 权限。
- 若使用二次认证或 automation token，确认发布方式符合组织安全策略。

### 2. 包名与版本

从 `package.json` 读取精确值，并检查 registry 是否已有该版本：

```bash
npm pkg get name version type exports files dsh
npm view <package-name> versions --json --registry <registry>
```

检查：

- `name` 合法且属于预期 scope；目录名、patch 中 package name、ModuleLoader ID 不漂移。
- `version` 是有效 semver，且尚未在目标 registry 中存在。
- prerelease 版本使用明确的 `-alpha`、`-beta`、`-rc` 或其他团队约定标识。
- 版本变更有对应 changelog/README 说明；不要复用已发布版本覆盖内容。
- `latest` 不是默认 dist-tag；首次发布、实验版本和不保证稳定性的版本优先使用 `next` 或团队明确指定的 prerelease tag。

如果版本已经存在，应停止发布，先确认是版本遗漏、registry 选错还是需要递增版本；不得使用同版本重发来“覆盖”问题。

### 3. 文档与许可

发布包至少应包含：

- README：用途、支持的 DSH 版本、安装方式、Host/Client 能力、配置示例、已知限制和故障入口。
- LICENSE：与项目许可和依赖分发要求一致。
- CHANGELOG 或 release notes：本版本新增、修复、破坏性变化和迁移说明。
- 不包含内部路径、调试密钥、本机路径或只对维护者可见的文档。

## 完整质量门禁

发布前必须运行并记录：

```bash
pnpm typecheck
pnpm test
pnpm build
npm pack --dry-run --json
npm pack
```

然后解包或安装实际 tarball 检查：

- `lib/index.js`、`lib/client.js`（若声明 Client）、`lib/types`（由 `tsc -p tsconfig.build.json` 生成） 和 patch 文件存在。
- `exports` 每个目标都能解析；`files` 没有遗漏运行时文件。
- Client bundle 没有 Node-only 依赖和未知 external。
- 在临时目录从 tarball 安装成功，并能 import 公共 Host/Client 入口。
- 在隔离 DSH profile 通过 tarball 路径完成最小 Host/Client 冒烟。

临时目录示例：

```bash
TARBALL="$(pwd)/$(npm pack --silent)"
TMP_DIR="$(mktemp -d)"
cd "$TMP_DIR"
npm init -y
npm install "$TARBALL"
node -e "import('<package-name>').then(() => console.log('host export ok'))"
node -e "import('<package-name>/client').then(() => console.log('client export ok'))"
```

若是 Host-only 包，不要执行不存在的 Client import；应确认 manifest 没有 `./client` 和 `dsh.client` 声明。

## 发布确认卡

正式发布前，必须把以下精确值展示给用户，并等待明确确认。不能用“看起来没问题”“继续吧”替代具体确认：

```text
即将发布：
- package：<package-name>
- version：<version>
- registry：<registry>
- access：public / restricted
- dist-tag：next / beta / rc / latest / <custom-tag>
- tarball：<absolute-path>
- 已通过：typecheck、test、build、pack、临时目录安装、隔离 profile 冒烟

是否确认执行正式 npm publish？
```

`latest` 只有在用户明确指定、版本已满足稳定发布门禁且没有未完成的迁移风险时才可使用。默认不替用户选择 `latest`，也不在确认前执行 publish。

## 正式发布

收到明确确认后，才执行与确认卡完全一致的命令。例如：

```bash
npm publish --access public --tag next
```

命令中的 package、registry、access 和 tag 必须与确认卡一致；若命令需要额外参数或发现 registry/版本发生变化，应停止并重新展示确认卡。不要执行未经确认的：

```bash
npm publish
npm publish --tag latest
```

## 发布后验证

发布命令成功只说明 registry 接收了包，不说明 DSH 用户一定能安装。发布后执行：

```bash
npm view <package-name>@<version> dist.tarball version dist-tags --json --registry <registry>
```

再从 registry 重新安装，而不是继续使用本地 tarball：

```bash
POST_DIR="$(mktemp -d)"
cd "$POST_DIR"
npm init -y
npm install <package-name>@<version> --registry <registry>
node -e "import('<package-name>').then(() => console.log('registry host export ok'))"
```

Client/Full-stack 插件还应：

1. 在隔离 DSH profile 中安装 registry 版本。
2. 重新启动 DSH Web，确认 profile 使用的是新版本而不是 link 或缓存。
3. 检查 Host 日志、浏览器 Network、Console、ModuleLoader 注册和 UI。
4. 验证 prerelease dist-tag 能被目标用户按文档安装。

如果发布后的 tarball 与本地 tarball 不同，停止扩散并记录 registry、版本、包内容和 lockfile；不要通过删除/重发同版本解决。

## 发布失败处理

- npm 身份失败：检查登录账户、scope、registry 和二次认证，不要索取或打印 token。
- 403/无权限：确认包名归属和 access 设置；不要改包名规避组织策略。
- 版本已存在：递增版本或选择正确的未发布版本；不可覆盖。
- tarball 缺文件：回到 `files`、exports、build 和 patch 检查，递增版本后重新走完整门禁。
- registry 安装失败：保留失败命令和响应摘要，确认是否发布到了预期 registry/tag，再决定是否回滚文档或发布修复版本。
- DSH 安装失败：优先读取 `upstream-compatibility.md`，确认宿主和 SDK cohort，不要直接改 DSH 源码。
