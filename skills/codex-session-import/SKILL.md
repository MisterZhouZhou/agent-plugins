---
name: codex-session-import
description: "把当前项目 .codex-session-archive 里的 Codex 会话导回本机 ~/.codex。适用于用户明确调用 $codex-session-import，或要求导入/恢复项目档案到全局 Codex；导出到项目应使用 $codex-session-export。"
---

# Codex Session Import

## 方向

```text
<project>/.codex-session-archive -> ~/.codex
```

不要用这个 skill 做导出。导出固定使用 `$codex-session-export`。

## 脚本

以下命令均在本 skill 根目录执行。

```text
scripts/
```

导入项目档案里的全部 session：

```bash
scripts/import-session.sh
```

不传 `--project` 时默认从当前项目导入全部会话；传 `--project <dir>` 时从指定项目导入全部会话。

导入指定 session：

```bash
scripts/import-session.sh <session_id>
```

如果全局已有同名 session，批量 `--all` 默认跳过冲突并继续。确定要以项目档案覆盖全局时，加：

```bash
scripts/import-session.sh --all --force
```

临时恢复而不导入全局：

```bash
scripts/restore-session.sh --project "$PWD" <session_id>
```

## 行为约定

- 不覆盖 `auth.json`、`config.toml` 或 `installation_id`。
- 只导入会话 rollout 和必要的 `session_index.jsonl` 记录。
- 单个导入遇到冲突时保留交互选择；非交互环境会失败，除非显式 `--force`。
- 批量 `--all` 遇到冲突默认跳过，不中断后续 session。

## 执行前校验

执行脚本前，内部确认方向：

```text
我将把 <project>/.codex-session-archive 同步到 ~/.codex，session_id 是 <id|all>。
```

## 回答要求

完成导入后汇报：

- 导入到的 `CODEX_HOME`
- session id 或 `--all` 结果摘要
- 直接恢复命令：`codex resume --all <session_id>`
