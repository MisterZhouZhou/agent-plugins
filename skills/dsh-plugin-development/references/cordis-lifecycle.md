# Cordis 生命周期与 HMR

DSH 插件不是一次性执行的脚本。插件可能因依赖、配置或 HMR 被卸载并重新加载；所有副作用必须有可逆的 Fiber 生命周期边界。

## Fiber 状态机

```text
PENDING → LOADING → ACTIVE
                 ↘ FAILED
ACTIVE → UNLOADING → DISPOSED
```

- `PENDING`：插件已声明，但必需 `inject` 依赖尚未就绪。
- `LOADING`：正在执行 `apply`、构造 Service 和注册 effect。
- `ACTIVE`：插件运行中。
- `FAILED`：初始化失败，已完成部分仍要回滚。
- `UNLOADING` / `DISPOSED`：正在清理 / 已完成清理。

必需服务消失时，依赖插件会被 dispose；服务恢复后重新加载。不要缓存并继续调用已经消失的服务实例。

## 自动追踪与 `ctx.effect`

官方生命周期会追踪至少这些注册：

- `ctx.on(event, handler)`；
- `ctx.tools.register(tool)`；
- `ctx.llm.registerAdapter(names, adapter)`；
- `ctx.effect(() => cleanup)`。

自定义资源放进 `ctx.effect`：

```ts
export function apply(ctx: Context) {
  ctx.effect(() => {
    const timer = setInterval(() => {
      // 业务工作
    }, 5000)

    return () => clearInterval(timer)
  })
}
```

处置器按注册顺序的逆序开始调用，但多个异步处置器可能并发执行，不保证逐个完成。存在严格清理顺序的资源必须放在同一个 disposer 中，并由该 disposer 显式串行 `await`。

## 编写规则

- 模块顶层只声明常量、类型和纯函数；不要读写文件、启动进程、连接网络或注册全局监听。
- `apply` 做依赖确认、配置规范化和公开能力注册。
- 异步初始化要能表达失败、超时和取消；不要让未 await 的 Promise 脱离生命周期。
- 创建 timer、listener、watcher、子进程、socket、临时文件后，立即记录对应清理路径。
- 清理必须幂等；初始化失败也要执行已完成部分的回滚。
- HMR 后不能重复注册 Tool、Service、事件、页面、Slot、样式或定时器。

## 子 Fiber 与主动释放

`ctx.plugin(childPlugin)` 创建继承父上下文、但拥有独立生命周期的子 Fiber；父插件卸载时子插件递归卸载。需要提前结束子插件时，保存返回的 Fiber 并 `await fiber.dispose()`；该 Promise 在异步清理完成后兑现。

## 动态 Cordis 插件

若启用 `@deepseek-ai/dsh-tool-cordis` 让模型在运行进程中挂载/卸载插件，必须额外明确：

- 工具参数和允许加载的代码/包边界；
- 临时插件的存续时间与所有者；
- 卸载和进程退出时的清理行为；
- 对同一进程其他会话的影响；
- 文件、网络、子进程和凭据权限。

动态插件只存在于当前进程内存中，不能当作已发布或持久安装；生产环境默认关闭，除非经过隔离、审计和最小权限验证。

## HMR 验收

至少连续执行两次加载/卸载或配置替换，并观察：

- Tool 列表没有重复项；
- 事件只触发一次；
- 服务没有第二个实例或旧实例引用；
- 页面、Slot 和样式没有重复；
- timer、watcher、子进程和端口数量恢复到单实例水平；
- 初始化失败后可以再次加载；
- Client 的 ModuleLoader factory 不在 bundle 下载阶段产生副作用。
