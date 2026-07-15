---
name: codex-session-export
description: "把本机 ~/.codex 里的 Codex 会话导出到当前项目 .codex-session-archive。适用于用户明确调用 $codex-session-export，或要求保存/导出/同步当前会话到项目档案；导入回 ~/.codex 应使用 $codex-session-import。"
---

# Codex Session Export

## 方向

```text
~/.codex -> <project>/.codex-session-archive
```

不要用这个 skill 做反向导入。导入固定使用 `$codex-session-import`。

## 脚本

以下命令均在本 skill 根目录执行。

```text
scripts/
```

常用命令：

```bash
scripts/export-session.sh
```

不传 `--project` 时默认导出当前项目的全部会话；传 `--project <dir>` 时导出指定项目的全部会话。

只导出当前项目最近一条：

```bash
scripts/export-session.sh --latest
```

导出指定 session：

```bash
scripts/export-session.sh <session_id>
```

## 行为约定

- 默认项目目录是当前工作目录；显式传 `--project "$PWD"` 更清楚。
- 项目档案目录固定为 `.codex-session-archive/`。
- 导出的原生 rollout 会保留在 `sessions/YYYY/MM/DD/rollout-*.jsonl`。
- 每个会话还会生成 `sessions/by-id/<session_id>/manifest.json` 和 `rollout.jsonl`。
- 本 skill 只提供显式导出，不处理 Codex 退出时自动导出。

## 执行前校验

执行脚本前，内部确认方向：

```text
我将把 ~/.codex 同步到 <project>/.codex-session-archive，session_id 是 <all|latest|id>。
```

## 回答要求

完成导出后汇报：

- archive root
- session id
- manifest 路径
- 恢复命令：`codex resume --all <session_id>`
