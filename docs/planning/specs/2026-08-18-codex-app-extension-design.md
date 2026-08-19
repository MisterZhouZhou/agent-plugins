# Codex App Extension Skill 设计

## 1. 背景与目标

当前仓库已有 `cdp-skill`，覆盖通用 Chromium DevTools Protocol 连接、注入、恢复和安全问题；已有 `codex-plugin-marketplaces`，覆盖插件市场、安装缓存和发布生命周期。

本设计新增 `codex-app-extension` Skill，沉淀基于 Codex App 的扩展开发经验，重点解决以下问题：

- 如何启动并验证 Codex App 的调试端点；
- 如何通过 CDP 定位 renderer、注入脚本并支持页面重载恢复；
- 如何建立页面与宿主注入器之间的双向消息桥；
- 如何经由注入器调用 Codex App Server；
- 如何创建 thread、切换 workspace、提交 composer 和管理 automation；
- 如何让 Skill 调用本地 CLI，例如 Taskboard 的 `taskctl`；
- 如何把上述流程复用到新的 Codex App 扩展中。

本 Skill 是开发指导和模板集合，不负责直接修改 Codex 官方安装包，也不实现一个特定业务扩展。

## 2. 已确认的方案

采用“文档 + 可复用代码模板”方案：

```text
skills/codex-app-extension/
├── SKILL.md
├── agents/
│   └── openai.yaml
├── references/
│   ├── architecture.md
│   ├── injection-lifecycle.md
│   ├── app-server-rpc.md
│   └── taskboard-case-study.md
└── templates/
    ├── codex-injector.mjs
    ├── codex-userscript.js
    └── app-server-client.mjs
```

其中：

- `SKILL.md` 是入口，负责触发条件、工作流、边界和验证清单；
- `references/` 存放按主题拆分的详细说明，避免入口文件过长；
- `templates/` 存放带注释的最小实现骨架，可复制到新扩展中继续开发；
- `agents/openai.yaml` 提供 Skill 在 Codex 中的展示元数据。

## 3. 目标工作流

Skill 被触发后，Codex 按以下顺序工作：

1. **识别任务类型**：解释架构、实现扩展、排查连接、审查安全或同步 App Server 协议。
2. **检查现有代码**：搜索 CDP 启动参数、HTTP discovery、WebSocket、注入脚本、消息协议和 App Server 请求封装。
3. **确认目标身份**：验证调试地址、进程 PID、Browser ID、target ID 和 renderer 页面标记。
4. **建立 CDP 生命周期**：连接、启用必要 domain、命令超时、断线清理和重连退避。
5. **执行注入**：区分当前页面执行和导航前注入，确保脚本幂等并能在 reload 后恢复。
6. **建立双向桥**：使用页面消息和 `Runtime.addBinding` 传递请求，统一请求 ID、结果、错误和超时格式。
7. **调用 App Server**：通过宿主侧代理调用允许的方法，并对返回结果做 schema 校验。
8. **验证结果**：检查 thread、workspace、automation 或页面状态，必要时保存只读诊断信息。
9. **整理交付**：说明源码、运行时缓存、安装版本和新线程生效之间的关系。

## 4. 关键架构边界

### 4.1 三层职责

```text
页面层 userscript
  ↕ postMessage
注入器 / CDP bridge
  ↕ App Server RPC
Codex App Server
```

- 页面层只负责 UI 交互、用户意图和消息发送；
- 注入器负责 CDP、目标校验、权限边界、请求转发和生命周期；
- App Server 负责 thread、workspace、automation 等 Codex 领域操作；
- Skill 和 CLI 属于 Codex 会话内的任务执行层，不应被误认为页面层 API。

### 4.2 Taskboard 作为案例而非依赖

`taskboard-case-study.md` 只说明以下模式：

```text
Taskboard API 写入任务
  → 用户提交 Codex composer 或 cron 到期
  → Codex thread 执行 Skill
  → Skill 调用 taskctl
  → taskctl 再调用 Taskboard API 更新状态
```

Skill 不依赖 Taskboard 的数据库、URL 或业务字段；模板也不内置 `taskctl`。

## 5. 模板设计

### 5.1 `codex-injector.mjs`

提供以下可替换函数或模块边界：

- 调试端点发现；
- `/json/version`、`/json/list` 查询；
- loopback 和目标进程校验；
- WebSocket 命令 ID、pending map、超时和断线拒绝；
- `Runtime.evaluate` 与 `Page.addScriptToEvaluateOnNewDocument`；
- `Runtime.addBinding` 和 `Runtime.bindingCalled`；
- 页面重载、新 target 和 watcher 恢复；
- 宿主请求白名单和统一错误返回。

模板不包含固定端口、固定 Codex 安装路径或真实认证信息。

### 5.2 `codex-userscript.js`

提供页面侧最小结构：

- 版本化初始化标记；
- `window.postMessage` 请求封装；
- 请求 ID 与 Promise 等待；
- 宿主响应、错误和超时处理；
- 任务按钮或扩展入口的占位接入点；
- 注销监听器和重复注入清理。

### 5.3 `app-server-client.mjs`

提供宿主侧 RPC 封装：

- 方法白名单；
- 参数序列化和基础 schema 校验；
- 请求超时和错误分类；
- thread、workspace、automation 请求的示例接口；
- 不把 WebSocket、认证或敏感配置暴露给页面层。

## 6. 安全与兼容性要求

- 调试端点默认绑定 `127.0.0.1`，不绑定 `0.0.0.0`；
- 连接前验证监听 PID、Browser ID、target ID 和页面标记；
- 不根据端口可访问或页面标题单独判断目标身份；
- 不自动附着到 Browser ID 已变化的未知端点；
- 注入必须幂等，避免重复监听器、重复样式和重复 bridge；
- 页面层只能调用白名单 RPC，不能直接执行任意 App Server 方法；
- 所有 CDP、WebSocket、HTTP 和 RPC 操作都有有限超时；
- Codex App 更新后优先重新发现协议和 DOM，不修改 `app.asar`；
- 模板中的凭据、项目路径和端口只能从运行时配置获取，不写入 Skill。

## 7. 仓库集成

实施时同步更新：

- `README.md`：目录树、Skill 说明、适用场景和入口路径；
- `.claude-plugin/marketplace.json`：将新 Skill 加入 `dev-skills`。

不修改 `.agents/plugins/marketplace.json`，因为该文件登记的是完整 Codex Plugin，而不是独立 Skill 目录。

## 8. 验收标准

### 文档

- `SKILL.md` frontmatter 合法，触发描述能覆盖 Codex App、App Server、CDP 注入和扩展开发场景；
- 入口文档明确说明何时读取四个 reference 文件；
- reference 文档完整描述启动、注入、桥接、RPC、automation 和 Taskboard 案例；
- 文档明确区分页面层、注入器、App Server、Skill 和 CLI 的职责。

### 模板

- 三个模板均为可读、可复制的 JavaScript/Node.js 骨架；
- 模板不含真实凭据、用户机器绝对路径或未经说明的固定端口；
- 模板展示命令超时、断线处理、请求 ID 和错误返回；
- 页面模板和宿主模板之间的消息字段保持一致。

### 仓库验证

```bash
python3 ~/.codex/skills/.system/skill-creator/scripts/quick_validate.py \
  skills/codex-app-extension

node --check skills/codex-app-extension/templates/codex-injector.mjs
node --check skills/codex-app-extension/templates/codex-userscript.js
node --check skills/codex-app-extension/templates/app-server-client.mjs

python3 -m json.tool .claude-plugin/marketplace.json
python3 skills/codex-plugin-marketplaces/scripts/audit_marketplace.py .
git diff --check
```

本次不要求启动 Codex App、连接真实 CDP 端口或执行完整构建；验证重点是 Skill 结构、文档边界、模板语法和 marketplace 索引一致性。

## 9. 非目标

- 不实现 Taskboard 本身；
- 不实现 Codex App Server 的完整客户端 SDK；
- 不绕过 Codex 权限、认证或用户确认；
- 不修改 Codex 官方应用包；
- 不承诺不同 Codex App 版本之间的 DOM 或 RPC 方法永久兼容；
- 不把模板包装成可直接生产运行的通用注入器。
