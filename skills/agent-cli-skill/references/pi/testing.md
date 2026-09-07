# Pi Testing and Troubleshooting

适用基线：Pi `0.84.1`。验证应从静态配置逐层推进到完整最小生成；每层只报告已测到的边界，不用低层成功替代端到端结论。

## 十层验证矩阵

1. **静态配置**：用 `python3 -m json.tool` 解析配置副本；检查 provider/model/default 一致；扫描 key、cookie、Authorization 和私有地址。
2. **传输层**：分别确认 DNS、TCP、TLS、HTTP status 和 `content-type`。超时只说明传输层未完成。
3. **API contract**：核对 HTTP method、实际 path、认证 header、请求 body 和流式格式；Pi `api` 映射见 [providers.md](providers.md)。
4. **模型层**：确认上游接受的精确 model ID、provider 返回、输入类型、thinking/tool 能力和上下文限制。
5. **最小生成**：关闭工具和持久 session，使用短 prompt，等待完整有效响应。
6. **Extension 隔离**：先 `--no-extensions`，再一次只加入一个显式 `-e`，确认命令、tool 和事件。
7. **Subagent**：在已确认 package 版本下依次验证 single、parallel、chain、失败回传和父子审批。
8. **Session/协议**：验证恢复、`--no-session`、JSON 事件和 RPC response/event framing；不要把 stdout 日志混入 RPC。
9. **安全**：覆盖 SAFE、YOLO、无 UI fail closed、普通写入确认和灾难 Bash 阻断。
10. **完整用户路径**：从实际启动命令、资源发现、provider 选择、模型响应到工具/子 Agent/session 结果全部完成。

## 404 的 HTML/JSON 判别

- 根地址返回 HTML 的 `404 Not Found`：只证明域名和网页路由可达，不证明 API provider contract 正确。
- `/models` 返回 JSON：可作为 control endpoint 证据，但不能单独证明生成 endpoint 可用。
- `/messages` 或 `/chat/completions` 返回 JSON `404`：请求通常已经到达服务端，继续核对 path、API 类型、base URL、模型路由和代理重写。
- HTML 404 与 JSON 404 必须分别记录 `status`、`content-type`、请求 method/path 和 body 摘要。

对 OpenRouter，`anthropic-messages` 会导向 `/messages`，而常见 Chat Completions 兼容入口应按 `openai-completions` 导向 `/chat/completions`；这仍需按当前服务商文档和实际模型响应确认。

## 脱敏静态检查

对配置副本运行：

```bash
python3 -m json.tool /path/to/models.json >/dev/null
rg -n -i 'api[_-]?key|authorization|cookie|token|192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[0-1])\.' /path/to/redacted-artifacts
```

命令输出应只显示字段名或已替换的 `[REDACTED]`，不要把真实 key 作为命令参数或写入本 skill。

## 隔离和最小生成模板

目标环境确认支持相应 flag 后，再执行占位符命令：

```bash
pi --no-extensions --no-session --no-tools \
  --provider <provider> --model <provider>/<model-id> \
  -p "Reply with exactly OK"
```

人工验收必须看到：进程以 0 退出、收到完整 assistant 文本 `OK`（不是仅收到请求已发送/流开始）、没有未处理错误，并且 provider/model/path 与预期一致。用户中止生成、超时、只拿到 HTTP 200、只看到 JSON 事件或只验证了 `/models`，都不能宣称端到端成功。

## Extension 路径不存在：先区分参数错误和资源缺失

遇到类似：

```text
Failed to load extension ".../packages/status-line": Extension path does not exist
```

不要立即创建目录或修改 Pi 全局配置。先按以下顺序定位实际来源：

```bash
pwd
fd -t d -d 3 .
fd -t f -d 3 . | sort
rg -n "status-line|packages/status|--extension|-e " . --hidden --glob '!node_modules/**'
pi list
```

判断规则：

- 如果报错路径来自另一个仓库，确认测试命令的 `cwd` 是否错误；例如插件仓库可能是 `/path/pi-extensions/packages/status-line`，而当前工作区是另一个 `Pi` 项目。
- 如果项目根目录确实存在目标包，使用绝对路径或从正确仓库根目录执行，避免相对路径解析到错误位置：

```bash
cd /path/to/pi-extensions
pi --no-extensions -e "$PWD/packages/status-line/index.ts" --no-session --help
```

- `--no-extensions` 只关闭自动发现；显式 `-e` 仍会加载指定资源。因此隔离测试时必须保留正确的 `-e`，不能把 `-ne` 当作修复路径错误。
- 检查项目 `.pi/settings.json`、用户 `~/.pi/agent/settings.json`、package.json 的 `pi.extensions` 和 shell/IDE 启动参数；项目中没有引用时，优先怀疑旧命令或外部启动配置残留。
- `pi list` 只能说明已安装 package，不保证某个手写 `-e` 路径存在；手写路径必须用 `test -e` 或 `fd` 单独确认。

## Extension 隔离与状态栏配置验证

对一个自定义状态栏扩展，验证应分层执行：

```bash
cd /path/to/pi-extensions
node --test test/status-line.test.mjs
npm run typecheck
npm run validate
npm test
pi --no-extensions -e "$PWD/packages/status-line/index.ts" --no-session --help
pi --no-extensions -e "$PWD/packages/status-line/index.ts" --no-session
```

交互验收至少确认：

- 状态栏显示内容与配置菜单项目一一对应；不存在的功能不要放进菜单。
- `/status` 使用持久 TUI 多选组件时，方向键移动、Enter 切换、Ctrl+S 保存、Esc 取消；勾选过程中不应反复打开 `select` 或刷新 footer。
- 配置保存一次后，重新启动/恢复 session 能读回当前分支的配置。
- `ctx.getContextUsage()` 的 `contextWindow` 和 `percent` 缺失时分别降级，不把未知值显示成 0。
- 模型信息、工作目录、Git 分支、扩展状态只有在实际渲染且用户确实需要时才作为开关；“扩展状态”表示 `setStatus()` 状态，不等于扩展清单。

完成声明要区分：单元测试、类型检查、扩展加载和真实 TUI 手工验收。通过 `--help` 只能证明扩展路径和模块可加载，不能证明 footer 或 `/status` 交互已经正确。

