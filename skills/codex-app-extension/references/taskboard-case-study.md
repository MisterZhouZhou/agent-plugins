# Taskboard / taskctl 案例

仅在分析任务看板如何接入 Codex、解释“写库后为什么没有执行”，或设计类似自动化时读取本文件。

## 原始模式

以 `dashi-taskboard` 的集成为例，职责链可抽象为：

```text
Taskboard API 写入任务
  → 用户提交 Codex composer，或 cron automation 到期
  → Codex App Server 创建/启动 thread
  → thread 加载 Skill 执行任务
  → Skill 调用 taskctl
  → taskctl 再调用 Taskboard API 更新状态
```

相关实现可按以下源码入口定位（项目版本变化时以 checkout 为准）：

- `web/src/App.tsx`：任务板 UI、提交 composer 或自动化的页面交互；
- `inject/codex-taskboard.user.js`：页面侧 bridge/userscript；
- `scripts/codex-injector.mjs`：CDP 发现、注入和宿主转发；
- `shared/taskboard-automation.mjs`：任务与 automation 的数据映射。

## 为什么“存储后”不会立即执行

Taskboard API 的职责是持久化任务状态。API 请求成功只说明任务已经写入数据库，并没有向 Codex App Server 发出 `turn` 或 `automation` 启动请求。真正触发通常只有两种：

1. 用户在 Codex composer 中确认并提交；
2. 已创建的 automation 到达 cron 计划时间。

如果产品额外实现 worker/队列来监听数据库，那是另一条明确的调度链，不能从“API 写入成功”推断出来。

## taskctl 的作用

taskctl 是 Codex Skill/CLI 层使用的任务操作工具，典型职责包括：

- 查询待处理任务；
- 创建、更新、评论、归档或标记任务；
- 将执行状态、结果摘要、错误信息回写 Taskboard API。

它不是 Codex 调度器，不负责启动 App Server，不负责创建 thread，也不应绕过页面/宿主权限直接执行任意 RPC。

## 接入时应先核对

- Taskboard API 的真实 endpoint、认证和字段 schema；
- Skill 约定的状态转换和幂等键；
- taskctl 的安装位置、退出码和超时；
- composer 提交与 automation 创建是否分别需要用户确认；
- thread 完成/失败事件如何映射回任务状态。
