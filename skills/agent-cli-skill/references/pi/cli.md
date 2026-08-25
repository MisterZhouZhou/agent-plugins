# Pi CLI

适用基线：Pi `0.84.1`。CLI 选项、资源发现和环境变量会随版本变化；遇到版本升级、发行版封装或扩展自定义 flag 时，先运行 `pi --version`、`pi --help`，再以当前安装的 `docs/usage.md` 为准。

## 先确认运行的是哪个 Pi

```bash
command -v pi
pi --version
pi --help
```

`pi` 是 `@earendil-works/pi-coding-agent` 提供的 CLI。Pi SDK 也随这个 runtime package 提供，`createAgentSession`、`SessionManager` 和 `ResourceLoader` 属于同一套 Pi API；不要把它描述成与 Pi runtime 无关的通用兼容 SDK。

## 运行模式

```bash
pi                         # 交互式 TUI
pi -p "Summarize README.md" # print 模式，输出响应后退出
pi --mode json -p "..."    # JSON Lines 事件，便于脚本解析
pi --mode rpc              # stdin/stdout 上的 JSONL RPC
```

print 模式也会读取管道 stdin。`--mode json` 输出事件流；`--mode rpc` 是有命令/响应/事件的协议，不要把它当作普通文本输出。嵌入 Node/TypeScript 应用时，优先核对 `AgentSession` SDK API 与当前文档，而不是自行猜测 RPC schema。

## 常用诊断选项

| 选项 | 用途 |
| --- | --- |
| `--provider <name>` | 选择 provider |
| `--model <pattern>` | 选择模型；支持 `provider/id` 和可选 thinking 后缀 |
| `--thinking <level>` | `off`、`minimal`、`low`、`medium`、`high`、`xhigh`、`max` |
| `--tools <list>` / `--no-tools` | 限制或关闭工具 |
| `--no-session` | 不写入持久 session |
| `-e <source>` | 仅本次加载 extension/package 资源，可重复 |
| `--no-extensions` | 禁止 extension 自动发现 |
| `--skill <path>` / `--no-skills` | 显式加载或关闭 skill 发现 |
| `--prompt-template <path>` / `--no-prompt-templates` | 显式加载或关闭 prompt 发现 |
| `--no-context-files` | 关闭 `AGENTS.md`/`CLAUDE.md` 发现 |
| `--approve` / `--no-approve` | 只覆盖本次 project-local 资源信任，不等于批准工具调用 |
| `--verbose` | 强制输出启动诊断 |

隔离 provider 或 extension 时，可以使用：

```bash
pi --no-extensions --no-session --no-tools -p "reply with OK"
pi --no-extensions -e ./path/to/extension.ts --no-session -p "reply with OK"
```

第二条只适合已审查的 extension；extension 运行在 Pi 进程权限内。

## 配置目录和资源范围

- 默认用户目录：`~/.pi/agent/`
- 项目资源：`.pi/`，项目资源在 trust 规则允许后才加载
- 可用 `PI_CODING_AGENT_DIR` 覆盖用户配置目录
- 可用 `PI_CODING_AGENT_SESSION_DIR` 或 `--session-dir` 覆盖 session 目录

相关环境变量包括：`PI_OFFLINE`（关闭启动网络操作）、`PI_SKIP_VERSION_CHECK`（跳过版本检查）、`PI_TELEMETRY`（覆盖 telemetry/归因 header）和 `PI_CACHE_RETENTION`（prompt cache 保留策略）。不要把这些变量误当作 provider API key；认证仍按 [providers.md](providers.md) 的配置链核对。

## 最小排障顺序

1. 确认 `pi --version` 与文档基线。
2. 用 `--provider`、`--model` 显式固定选择，避免默认值遮蔽问题。
3. 使用 `--no-session --no-extensions --no-tools` 缩小变量。
4. provider/path/API 类型核对见 [providers.md](providers.md)。
5. extension、skills 和项目资源分别按 [extensions.md](extensions.md)、[skills.md](skills.md) 验证。
6. 记录完整最小生成响应前，不宣称端到端可用；验证分层见 [testing.md](testing.md)。

