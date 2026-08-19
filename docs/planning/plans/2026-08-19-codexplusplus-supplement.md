# CodexPlusPlus Skill 补充实施计划

> **For agentic workers:** 按任务顺序执行，每个任务完成后运行该任务的静态验证；本计划不要求启动 Codex App 或连接真实 CDP。

**Goal:** 将 CodexPlusPlus 的 CDP Bridge、Local Helper Server、多页面注入和内部 Bundle API 风险补充到现有 `codex-app-extension` Skill。

**Architecture:** 保持现有 Skill 的通用 JavaScript 模板不变，通过 `architecture.md` 增加三通道架构，通过独立 `codexplusplus-case-study.md` 记录 Python 外部启动器的真实实现，再由 `SKILL.md` 提供按需路由。所有内容必须区分源码事实、版本相关推断和通用建议。

**Tech Stack:** Markdown、现有 Codex Skill 结构、Python/CDP 源码静态核对、quick_validate.py、Node `--check`、git diff check。

## Global Constraints

- 只修改 `/Users/cheyipai/Desktop/ai/agent-plugins` 中的 Skill 文档。
- 不修改 `/Users/cheyipai/Downloads/CodexPlusPlus` 源码。
- 不新增 Python CDP 模板。
- 不把 Helper Server 描述成 Codex App Server。
- 不把内部 Bundle 动态 import 描述成稳定公开 API。
- 不启动 Codex App，不连接真实 CDP 端口。
- `debug_port` 与 `helper_port` 必须作为独立端口和独立生命周期说明。
- 当前 workspace 不自动创建 Git commit；保留变更供用户审核。

---

### Task 1: 扩展通用架构说明

**Files:**
- Modify: `/Users/cheyipai/Desktop/ai/agent-plugins/skills/codex-app-extension/references/architecture.md`
- Reference: `/Users/cheyipai/Desktop/ai/agent-plugins/docs/planning/specs/2026-08-19-codexplusplus-supplement-design.md`

**Interfaces:**
- Consumes: 现有架构文档中的页面层、注入器、App Server、Taskboard 边界。
- Produces: 后续案例文档和 `SKILL.md` 可引用的三通道架构术语：`CDP binding`、`Local Helper HTTP`、`Codex App Server RPC`。

- [ ] **Step 1: 阅读现有架构文档并定位插入点**

运行：

```bash
sed -n '1,260p' skills/codex-app-extension/references/architecture.md
```

确认不删除既有 Taskboard 触发链和 App Server 边界。

- [ ] **Step 2: 增加三通道架构图**

在职责边界章节加入以下结构，并使用现有文档的术语：

```text
Renderer userscript
  ├─ CDP binding → 注入器/宿主 handler → 本地文件、数据库或系统能力
  ├─ fetch(loopback helper) → Local Helper HTTP Server → 本地业务服务
  └─ 宿主代理 → Codex App Server RPC → thread/turn/composer/automation
```

同时写明：三条通道可以并存，但 transport、权限边界、失败模式和生命周期不同。

- [ ] **Step 3: 增加通道选择表**

加入明确表格：

| 通道 | 适用动作 | 主要边界 | 不应做的事 |
| --- | --- | --- | --- |
| CDP binding | 宿主受控能力、低延迟请求返回 | binding 白名单、请求 ID、socket 生命周期 | 页面传任意宿主函数 |
| Local Helper HTTP | Renderer 可 fetch 的本地业务接口 | loopback、token、endpoint 权限、CORS | 把 HTTP 服务当 App Server |
| App Server RPC | thread、turn、composer、automation | 真实协议、schema、用户确认 | 从 API 写库推断自动执行 |

- [ ] **Step 4: 增加端口和安全边界**

明确：

```text
debug_port：Chromium CDP discovery/WebSocket
helper_port：本地 HTTP helper
```

两者不能混用；两个服务都默认 loopback；健康检查成功不等于服务身份已确认。

- [ ] **Step 5: 静态验证 Task 1**

运行：

```bash
rg -n 'Local Helper|Helper HTTP|helper_port|debug_port|CDP binding|App Server RPC' \
  skills/codex-app-extension/references/architecture.md

git diff --check -- skills/codex-app-extension/references/architecture.md
```

预期：三通道术语、两个端口和安全边界均命中，无 whitespace error。

---

### Task 2: 新增 CodexPlusPlus 案例文档

**Files:**
- Create: `/Users/cheyipai/Desktop/ai/agent-plugins/skills/codex-app-extension/references/codexplusplus-case-study.md`
- Reference: `/Users/cheyipai/Downloads/CodexPlusPlus/codex_session_delete/cdp.py`
- Reference: `/Users/cheyipai/Downloads/CodexPlusPlus/codex_session_delete/helper_server.py`
- Reference: `/Users/cheyipai/Downloads/CodexPlusPlus/codex_session_delete/launcher.py`
- Reference: `/Users/cheyipai/Downloads/CodexPlusPlus/codex_session_delete/user_scripts.py`
- Reference: `/Users/cheyipai/Downloads/CodexPlusPlus/codex_session_delete/inject/renderer-inject.js`

**Interfaces:**
- Consumes: Task 1 定义的三通道术语。
- Produces: 可独立阅读的 CodexPlusPlus 事实案例；不改变现有模板接口。

- [ ] **Step 1: 建立文档章节骨架**

文件必须包含以下一级标题：

```text
# CodexPlusPlus 案例
## 1. 项目定位与源码入口
## 2. 启动链与两个端口
## 3. CDP binding Bridge
## 4. Local Helper HTTP Server
## 5. 双通道如何选择
## 6. 多页面注入与 watchdog
## 7. userscript 管理与可观测状态
## 8. 内部 Bundle API 风险
## 9. 安全审计与改进建议
## 10. 可借鉴与不应照抄
```

- [ ] **Step 2: 写入项目定位和启动链**

基于源码记录以下事实：

```text
CLI
  → 选择/探测 debug port 与 helper port
  → 启动或 attach Helper Server
  → 启动 Codex App 并附加 --remote-debugging-port
  → 等待 CDP /json 可用
  → 注入当前 page 和后续 document script
  → 启动 page watcher 与 bridge watchdog
```

必须说明 `--remote-allow-origins=http://127.0.0.1:<debug-port>` 属于启动器参数，不是 Renderer userscript 行为。

- [ ] **Step 3: 写入 CDP binding Bridge 流程**

使用以下请求链，不能只写成泛化的 `postMessage`：

```text
window.__codexSessionDeleteBridge(path, payload)
  → window.codexSessionDeleteV2(JSON.stringify({id, path, payload}))
  → Runtime.bindingCalled
  → Python handle_bridge_request()
  → Runtime.evaluate
  → window.__codexSessionDeleteResolve/Reject()
```

说明 `Runtime.enable`、`Runtime.removeBinding`、`Runtime.addBinding`、`Page.addScriptToEvaluateOnNewDocument` 和当前页面 `Runtime.evaluate` 的顺序。

- [ ] **Step 4: 写入 Helper Server 和端点安全**

记录：

- `ThreadingHTTPServer` 和 loopback 绑定；
- `/health`、`/ads`、`/assets/*` 和业务 POST endpoint；
- `X-Codex-Session-Delete-Token`；
- CORS 与 `Access-Control-Allow-Private-Network`；
- `start_or_attach_helper()`、后台线程、`shutdown()`/`server_close()`。

必须明确指出：endpoint 授权覆盖存在不一致风险，生产扩展应逐 endpoint 建立权限矩阵，不能只按 GET/POST 判断。

- [ ] **Step 5: 写入多页面和 userscript 生命周期**

说明：

- 按 target ID 或 WebSocket URL 注册页面注入实例；
- 0.75 秒轮询发现新 page；
- 已注入 target 不重复处理；
- 注入失败不阻断其他 target；
- builtin/user script、全局开关、单脚本开关、reload；
- `loading/loaded/failed/disabled/not_loaded` 状态。

同时标注当前实现仍需强化 target 消失清理、socket 关闭和异常诊断。

- [ ] **Step 6: 写入内部 Bundle API 风险**

必须使用“私有构建产物/高版本风险”措辞，覆盖：

```js
import("./assets/vscode-api-*.js")
import("./assets/app-server-manager-signals-*.js")
```

说明 chunk 文件名、导出函数名和参数可能改变；需要能力探测、失败降级和版本记录；不能将其称为公开 App Server RPC。

- [ ] **Step 7: 写入案例结论**

将实现分成两类：

```text
可借鉴：loopback、固定 binding、当前页+新文档双注入、状态 inventory、独立 helper port
不应照抄：不完整 mutation token 覆盖、target registry 不主动清理、内部 chunk 作为稳定依赖
```

- [ ] **Step 8: 静态验证 Task 2**

运行：

```bash
test -s skills/codex-app-extension/references/codexplusplus-case-study.md
rg -n 'Runtime\.bindingCalled|Runtime\.addBinding|ThreadingHTTPServer|helper port|Access-Control|Private-Network|MutationObserver|loading|failed|vscode-api|app-server-manager-signals' \
  skills/codex-app-extension/references/codexplusplus-case-study.md

git diff --check -- skills/codex-app-extension/references/codexplusplus-case-study.md
```

预期：文件非空，所有关键事实均有文档表述，无 whitespace error。

---

### Task 3: 更新 Skill 入口与路由规则

**Files:**
- Modify: `/Users/cheyipai/Desktop/ai/agent-plugins/skills/codex-app-extension/SKILL.md`
- Reference: `skills/codex-app-extension/references/codexplusplus-case-study.md`

**Interfaces:**
- Consumes: Task 1 的三通道架构和 Task 2 的案例文档。
- Produces: 根据问题类型选择最小参考资料的 Skill 路由。

- [ ] **Step 1: 增加案例文档入口**

在“按需读取参考资料”中加入：

```text
- CodexPlusPlus 的 Python CDP Bridge、Local Helper Server、多页面注入、
  userscript inventory 和内部 Bundle API 风险：
  references/codexplusplus-case-study.md
```

- [ ] **Step 2: 更新目标工作流中的通道判断**

在触发模型或消息边界步骤中加入：

```text
先判断需求属于：
1. CDP binding 宿主能力；
2. Local Helper HTTP 本地业务接口；
3. Codex App Server thread/turn/composer/automation。
不要因为页面需要执行动作，就默认调用 App Server。
```

- [ ] **Step 3: 更新安全底线**

加入以下规则：

- `debug_port` 与 `helper_port` 分离并独立验证；
- Local Helper 的 mutation endpoint 必须逐 endpoint 做认证和 schema 校验；
- `Access-Control-Allow-Origin: *` 不能代替认证；
- 私有 Bundle import 必须能力探测和失败降级；
- 多页面 registry 必须处理 target 消失、socket 关闭和版本重新注入。

- [ ] **Step 4: 检查入口文件长度和重复内容**

运行：

```bash
sed -n '1,240p' skills/codex-app-extension/SKILL.md
rg -n 'CodexPlusPlus|Helper Server|helper_port|App Server RPC|bundle' \
  skills/codex-app-extension/SKILL.md
```

如果详细解释重复出现，只保留路由和规则，具体实现放在 reference 文档。

- [ ] **Step 5: 静态验证 Task 3**

运行：

```bash
git diff --check -- skills/codex-app-extension/SKILL.md
```

预期：入口包含新 reference 路径和三通道判断，且无 whitespace error。

---

### Task 4: 验证 Skill 与现有模板

**Files:**
- Test: `/Users/cheyipai/Desktop/ai/agent-plugins/skills/codex-app-extension/**`
- Check: `/Users/cheyipai/Desktop/ai/agent-plugins/.claude-plugin/marketplace.json`

**Interfaces:**
- Consumes: Task 1-3 的全部文档。
- Produces: 可加载、结构完整、模板未回归的 Skill。

- [ ] **Step 1: 验证 Skill 结构**

运行：

```bash
python3 /Users/cheyipai/.codex/skills/skill-creator/scripts/quick_validate.py \
  skills/codex-app-extension
```

预期：验证通过。

- [ ] **Step 2: 验证现有 JavaScript 模板**

运行：

```bash
node --check skills/codex-app-extension/templates/codex-injector.mjs
node --check skills/codex-app-extension/templates/codex-userscript.js
node --check skills/codex-app-extension/templates/app-server-client.mjs
```

预期：三个命令退出码均为 0。

- [ ] **Step 3: 验证关键文档词汇**

运行：

```bash
rg -n 'Runtime\.evaluate|Runtime\.addBinding|Runtime\.bindingCalled|Page\.addScriptToEvaluateOnNewDocument|Helper Server|helper_port|App Server|taskctl|composer|automation' \
  skills/codex-app-extension/SKILL.md \
  skills/codex-app-extension/references
```

预期：既有 CDP/App Server/Taskboard 术语和新增 Helper Server 术语均有命中。

- [ ] **Step 4: 验证仓库差异**

运行：

```bash
git diff --check
```

预期：退出码 0。

- [ ] **Step 5: 检查 marketplace 是否需要更新**

运行：

```bash
rg -n 'codex-app-extension|skills/' .claude-plugin/marketplace.json README.md
```

只有当 Skill 路径或公开描述不准确时才修改索引；本次新增 reference 通常不需要新增 plugin entry。

---

## 最终交付检查

- [ ] `references/architecture.md` 已增加三通道架构。
- [ ] `references/codexplusplus-case-study.md` 已新增并覆盖源码事实。
- [ ] `SKILL.md` 已增加案例路由和通道选择规则。
- [ ] 未修改 CodexPlusPlus 源码。
- [ ] 未新增 Python 模板。
- [ ] quick_validate、三个 `node --check` 和 `git diff --check` 通过。
- [ ] 未启动真实 Codex App 或连接 CDP。
