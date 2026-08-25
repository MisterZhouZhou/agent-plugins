# Pi Skills, Prompts, and Context

适用基线：Pi `0.84.1`。这些资源都可能改变模型上下文，但加载机制不同，不能把 skill、prompt、extension 或 `AGENTS.md` 互相替代。

## 四类资源

| 资源 | 作用 | 典型入口 |
| --- | --- | --- |
| `AGENTS.md` / `CLAUDE.md` | 启动时的项目/用户上下文指令 | 用户目录、当前目录及祖先目录 |
| Skill | 按需加载的专项能力包，通常含 `SKILL.md`、脚本和 references | `~/.pi/agent/skills`、`.pi/skills`、`.agents/skills`、package、settings、`--skill` |
| Prompt template | `/name` 展开的 Markdown prompt | `~/.pi/agent/prompts`、`.pi/prompts`、package、settings、`--prompt-template` |
| Extension | 在 Pi 进程中注册工具、事件、命令或 UI | `~/.pi/agent/extensions`、`.pi/extensions`、package、`-e` |

项目 `.pi` 和项目 `.agents/skills` 的加载受 project trust 影响；用户级资源和显式 CLI 路径需要单独记录。安全上，skill 可以指示模型执行任意动作，也可能附带可执行脚本，使用前必须审查内容。

## 发现和关闭

```bash
pi --no-skills --no-prompt-templates --no-context-files --no-session
pi --no-skills --skill ./path/to/SKILL.md --no-session
pi --no-prompt-templates --prompt-template ./path/to/review.md --no-session
```

显式 `--skill` 是 additive，即使同时使用 `--no-skills` 也会加载该路径。`--no-context-files` 只影响 `AGENTS.md`/`CLAUDE.md`，不等于关闭 skills 或 extensions。

## Prompt template 参数

模板文件名决定 `/name` 命令名，frontmatter 可包含 `description` 和 `argument-hint`。支持 `$1`、`$2`、`$@`、`${1:-default}` 等参数展开。模板是 prompt 文本，不具备 extension 的事件监听或工具注册能力。

## `enableSkillCommands` 的边界

`settings.json` 中的：

```json
{ "enableSkillCommands": true }
```

只控制是否启用 `/skill:name` 形式的命令入口，不代表 skill 已被发现、全文加载或得到项目 trust。排查时分别确认：发现路径、是否被 `--no-skills` 禁用、system prompt 中是否列出描述，以及模型是否真正读取了 `SKILL.md`。

## 与其他 harness 共享

Pi 可以通过 settings 添加 `~/.claude/skills` 或 `~/.codex/skills`，但这只是把目录纳入 Pi 的 skill 发现，不表示 Claude/Codex 的命令、权限、hook 或 metadata 语义兼容。跨 CLI 复用前按当前 Pi 版本重新检查 frontmatter 和相对路径。

关联：provider 与默认模型见 [providers.md](providers.md)，资源执行权限见 [permissions.md](permissions.md)。

