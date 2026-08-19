# CodexPlusPlus 对 Codex App Extension Skill 的补充设计

## 1. 背景

现有 `codex-app-extension` Skill 已覆盖 Codex App 的 CDP 注入、页面消息桥、App Server RPC、composer/automation 和 Taskboard/taskctl 触发边界。

对 `/Users/cheyipai/Downloads/CodexPlusPlus` 的只读审查显示，它代表另一种真实的 Codex App 外部扩展实现：

```text
外部启动器
  → CDP target discovery
  → Runtime.addBinding bridge
  → Renderer userscript
  → 本地 Helper HTTP Server
  → 可选的 Codex 内部 Bundle API
```

因此需要补充“CDP Bridge + 本地 Helper Server”的双通道模式，但不把 CodexPlusPlus 的 Python 实现误写成 Codex App Server 标准，也不修改 CodexPlusPlus 源码。

## 2. 目标与非目标

### 2.1 目标

- 让 Skill 使用者能区分 CDP Bridge、Local Helper Server 和 Codex App Server。
- 记录 CodexPlusPlus 的启动、注入、多页面、watchdog 和 userscript 生命周期。
- 记录本地 HTTP endpoint 的认证、CORS、loopback 和端口生命周期要求。
- 明确 Codex App 内部 bundle 动态 import 属于高风险兼容层。
- 保持现有 JavaScript 模板的通用性，不把 Python 特定实现硬编码到模板中。

### 2.2 非目标

- 不修改 CodexPlusPlus 源码。
- 不新增 Python CDP 模板。
- 不声称 CodexPlusPlus 调用了 Codex App Server，除非源码另有明确证据。
- 不把内部 bundle 模块或混淆导出包装成稳定公开 API。
- 不启动真实 Codex App，不连接真实 CDP 端口。

## 3. 方案选择

采用“架构文档补充 + 独立案例文档 + Skill 入口更新”的方案：

```text
修改：
- skills/codex-app-extension/SKILL.md
- skills/codex-app-extension/references/architecture.md

新增：
- skills/codex-app-extension/references/codexplusplus-case-study.md
```

不修改：

```text
skills/codex-app-extension/templates/*
/Users/cheyipai/Downloads/CodexPlusPlus/*
```

理由：通用 Skill 需要说明架构选择，但 CodexPlusPlus 的 Python `websocket-client`、线程和本地服务实现不适合直接成为现有 JavaScript 模板的一部分。

## 4. 文档设计

### 4.1 `references/codexplusplus-case-study.md`

章节如下：

1. 项目定位与源码入口
2. 启动链：debug port、helper port、Codex 启动参数、CDP readiness
3. CDP binding Bridge：`Runtime.enable`、`Runtime.addBinding`、early script、当前页执行、`Runtime.bindingCalled`、`Runtime.evaluate` resolve/reject
4. Helper Server：`ThreadingHTTPServer`、`/health`、HTTP endpoint、attach/shutdown
5. 双通道选择原则
6. 多页面注入注册表与 watcher
7. userscript inventory、enable/disable、reload 和状态观测
8. 内部 Bundle API 的版本风险
9. HTTP 安全审计：loopback、CORS、Private Network Access、token 和 endpoint 权限
10. 可借鉴实现与不应照抄的实现

文档必须把源码事实、推断和建议分开标注。

### 4.2 `references/architecture.md`

在现有页面层、注入器、App Server 三层架构旁增加本地 Helper Server 分支：

```text
Renderer userscript
  ├─ CDP binding → 注入器/宿主 handler → 本地能力
  ├─ fetch(loopback helper) → Helper HTTP Server → 本地服务/API/文件
  └─ 宿主代理 → Codex App Server → thread/turn/composer/automation
```

明确三条通道的职责：

- CDP binding：宿主权限、同步请求桥、页面 Promise 返回。
- Helper HTTP：Renderer 可 `fetch()` 的本地业务接口，必须有 loopback、认证和 endpoint 权限控制。
- App Server RPC：Codex 领域动作，不因存在 CDP 或 Helper Server 就自动成立。

### 4.3 `SKILL.md`

增加按需读取入口：

```text
- CodexPlusPlus 的 Python CDP Bridge、Local Helper Server、
  多页面注入与内部 Bundle API 风险：
  references/codexplusplus-case-study.md
```

在目标或安全规则中补充：

- 不要把所有本地业务都建模为 App Server RPC。
- 先判断请求需要 CDP binding、Local Helper HTTP 还是 App Server。
- `debug_port` 与 `helper_port` 是两套独立生命周期。
- 私有 bundle import 必须能力探测、失败降级并记录 App 版本风险。

## 5. 关键技术事实

### 5.1 CDP Bridge

CodexPlusPlus 使用固定 binding 名称 `codexSessionDeleteV2`。页面请求格式包含：

```json
{
  "id": "request-id",
  "path": "/operation",
  "payload": {}
}
```

宿主接收 `Runtime.bindingCalled` 后调用 Python handler，再执行：

```text
Runtime.evaluate
  → window.__codexSessionDeleteResolve(id, result)
```

异常通过对应 reject 函数返回页面。

### 5.2 Helper Server

Helper Server 默认绑定 `127.0.0.1`，使用独立端口，提供 `/health` 和多个 POST endpoint。部分 endpoint 使用 `X-Codex-Session-Delete-Token`。

文档需要指出：源码当前对 mutation endpoint 的授权覆盖并不完全一致，新增扩展不能简单复制该做法，而应按 endpoint 建立明确的读写权限矩阵。

### 5.3 多页面与 watchdog

`inject_file_into_all_pages()` 按 target ID 或 WebSocket URL 保存注入结果，并以轮询方式发现新页面。启动器另有注入重试和 bridge watchdog。

文档需要同时记录当前实现的限制：target 消失后的 registry 删除、socket 关闭和异常可观测性仍应由生产实现补齐。

### 5.4 内部 Bundle API

Renderer 中存在对 `vscode-api-*.js` 和 `app-server-manager-signals-*.js` 的动态 import。这些是 App 内部构建产物，不是稳定 App Server 协议。扩展必须：

- 启动时探测模块是否存在；
- 校验导出函数和参数能力；
- import 失败时不阻断核心功能；
- 记录版本、chunk 名称和失败原因；
- 优先使用公开或已验证的边界。

## 6. 验证设计

修改后执行：

```bash
python3 /Users/cheyipai/.codex/skills/skill-creator/scripts/quick_validate.py \
  /Users/cheyipai/Desktop/ai/agent-plugins/skills/codex-app-extension

node --check skills/codex-app-extension/templates/codex-injector.mjs
node --check skills/codex-app-extension/templates/codex-userscript.js
node --check skills/codex-app-extension/templates/app-server-client.mjs

git diff --check
```

并进行静态内容检查：

```bash
rg -n 'Helper Server|helper port|Runtime\.bindingCalled|Runtime\.addBinding|bundle|CORS|token|多页面' \
  skills/codex-app-extension/SKILL.md \
  skills/codex-app-extension/references
```

不启动 Codex App，不连接真实 CDP，不修改 CodexPlusPlus。

## 7. 成功标准

- 新案例文档可以独立解释 CodexPlusPlus 的双通道架构。
- `architecture.md` 不再把所有宿主能力都归为 App Server RPC。
- `SKILL.md` 能路由到新案例文档。
- 现有模板语法和协议边界不被破坏。
- 文档明确区分源码事实、版本依赖和建议改进。
- 所有静态验证通过。
