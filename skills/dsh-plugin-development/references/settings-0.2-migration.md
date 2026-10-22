# DSH 0.2.0-rc.2 设置迁移与排错

本参考来自 dsh-notify 设置面板修复。核验日期：2026-10-17；目标宿主 DSH、dsh-settings、dsh-client-ui-settings 均为 `0.2.0-rc.2`，Cordis 为 `4.0.4`，Schemastery 为 `3.18.4`。这是已检查版本的行为，不是对后续版本的兼容承诺。其他 cohort 先读取目标宿主的公开类型、实际实现和 lockfile。

## 1. 迁移契约

| 项目 | 0.2.0-rc.2 的做法 | 容易沿用的旧做法 |
|---|---|---|
| Host 设置来源 | SettingsForms 从运行中插件导出的 Config 自动收集 volatile 字段 | 手动 `settingsNamespace()` / `ctx.settings.register()` |
| namespace | profile 条目的 `entry.options.id` | 假设等于包名或 `export const name` |
| Client 服务依赖 | `inject = ['slots', 'configForms']` | `webUiSettings` / `settingsScope` |
| Client 获取控制器 | `ctx.configForms.get<T>(entryId)` | `webUiSettings.bind({ namespace })` |
| Client 类型 | `ConfigForm`、`ConfigFormSnapshot`，从 `@deepseek-ai/dsh-client-ui-settings/client` type-only 导入 | 从旧 `dsh-client-runtime/client` 导入 SettingsScope |
| Host 实时读取 | volatile 引用 `.get()` | 将初始普通对象缓存到闭包 |
| Client 写字段 | 保持 Config 中的真实层级 | 将 `events.turnCompleted` 写为根字段 `turnCompleted` |

不需要额外增加 `metadata.settings` 或手工注册 namespace。`settings.configure({ auto: false })` 控制展示策略，不负责创建 namespace；仅为 Config 表单提供设置时，Host 不必读取或注入 `settings` 服务。

## 2. Host：声明可编辑字段并读取最新值

```ts
import type { Context, Volatile } from '@deepseek-ai/cordis'
import Schema from '@deepseek-ai/schemastery'

interface EventsConfig {
  turnCompleted: boolean
  permissionAsked: boolean
}

export interface Config {
  enabled: boolean
  events: Volatile<EventsConfig>
}

export const Config = Schema.object({
  enabled: Schema.boolean().default(true),
  events: Schema.object({
    turnCompleted: Schema.boolean().default(true),
    permissionAsked: Schema.boolean().default(true),
  }).default({ turnCompleted: true, permissionAsked: true }).volatile(),
})

export function apply(ctx: Context, config: Config): void {
  if (!config.enabled) return
  // 在实际业务回调内调用 config.events.get()，读取当前开关。
  // 回调通过 ctx 注册并随插件卸载清理。
}
```

`events` 整个对象标记 volatile 后，它的子树可编辑；未标记的 `enabled` 不会出现在表单中。没有任何 volatile 字段时，SettingsForms 会跳过整个 namespace，即使插件已加载、Config 也已导出。

> **2026-10-20 实证（scratch-plugin）**：一个能加载、能打印 `plugin loaded` 的插件，若 Config 全是普通字段（`Schema.string()/number()/boolean()` 无一 `.volatile()`），`configForms.get(entryId)` 恒 `unavailable`。此时改命名（`export const name`、patch `insert.id`、包名对齐）或换 `webUiSettings.bind` 都无效——namespace 被整体跳过，seam 里根本没有这条 ns。唯一解法是给要暴露的字段加 `.volatile()`。
>
> 两个易错点：① `export const name` 与 entry id 无关，ns 取 bundle patch 的 `insert.id`，别用 `export const name` 或包名推定，也别为此去改 `export const name`（改了不影响 ns）。② `webUiSettings`（`@linxin666/dsh-client-ui-web-ui-settings`）另带一份硬编码的 dsh-web 家族 allowlist（`FAMILY_NAMESPACES`/`NAMESPACE_ALIASES` 只列 ssh/task-board/remote-web-ui/market 等），独立插件的 ns 不在表里会被 `composeAllowlist` 过滤，即便 Host 收集了也恒 unavailable——所以正道只有 `configForms.get`。

自动收集还要求条目有运行中的 fiber 和可序列化的 runtime Config schema。namespace 来自 profile 条目 id，例如 bundle patch：

```yaml
- insert:
    - id: dsh-example
      name: '@scope/dsh-example'
```

这里 Client 必须访问 `dsh-example`。包名、Client ModuleLoader id 和 profile entry id 有不同职责，不能互相代替。

仅修改 volatile 字段且满足 Loader 的更新条件时，Loader 更新引用并保留插件实例，不重新执行 `apply`。事件触发时调用 `config.events.get()`；不要在 `apply` 中只读一次后缓存 `.get()` 的结果，也不要为接收这类更新额外建立旧 settings scope/watch。普通配置或其他结构变化仍可能导致重载。

## 3. Client：服务、类型与层级一起迁移

```ts
import type { Context } from '@deepseek-ai/cordis'
import type { ConfigForm, ConfigFormSnapshot } from '@deepseek-ai/dsh-client-ui-settings/client'

interface NotifySettings {
  events: { turnCompleted: boolean; permissionAsked: boolean }
}

export const inject = ['slots', 'configForms'] as const

export function apply(ctx: Context): void {
  const form: ConfigForm<NotifySettings> = ctx.configForms.get('dsh-example')
  const snapshot: ConfigFormSnapshot<NotifySettings> = form.getSnapshot()
  // 组件订阅 form.subscribe()，并在卸载时取消订阅。
  // 只有 ready 且 writable 时允许写入。
}
```

读取 `snapshot.value?.events`。写一个开关可使用 `form.set('events', { ...events, turnCompleted: false })`；需要避免重述整个对象时，使用 `form.mutate([{ op: 'set', path: ['events', 'turnCompleted'], value: false }])`。处理异步写入失败，并以 Host 接受后的快照为准。`set`、`unset`、`mutate` 返回 `Promise<boolean>`；传输失败可能 reject。

`status: 'ready'` 不代表可写，还要检查 `writable`。`unavailable` 表示该连接没有可用的 namespace，也可能来自 memory 模式；不要统一解释成“插件未启用”。

包级 `dsh.client.inject` 声明提供者包，Cordis 的 `export const inject` 声明服务，两者都要核对：

```json
{
  "dsh": {
    "engines": { "dsh": ">=0.2.0-rc.2" },
    "client": {
      "platform": "web",
      "inject": [
        "@deepseek-ai/dsh-client-ui-renderer",
        "@deepseek-ai/dsh-client-ui-settings"
      ]
    }
  }
}
```

同步更新旧 `dsh-client-runtime` 声明、开发类型依赖和 lockfile。示例最低版本只说明 API 引入边界，发布前按实际测试范围决定 engines；不要为了保留旧 engines 无条件添加双接口兼容层。Client 只 type-only 导入跨插件契约，不把 Host SDK 或 SettingsForms 实现打进浏览器。Host 使用的 Schemastery 是运行时依赖，构建 external 与 dependencies 必须一致。

## 4. “设置暂不可用”的排查顺序

1. 确认浏览器连接的 Host、启动命令、profile 和 DSH 实际版本。全局 DSH 可能为 `0.2.0-rc.2`，而插件 node_modules 仍是 `0.1.x`；分别记录运行时与编译依赖，不能用其中一个推定另一个。
2. 检查 profile 的 dependencies、bundles 和实际 patch 条目 id。设置标签页可见只证明 Client UI 已注册，不证明 Host 暴露了同名表单。
3. 检查实际 `exports` 指向的 Host 产物：Config 是否有 volatile 字段，插件是否处于运行状态，事件回调是否读取引用 `.get()`。
4. 检查 Host `settings.describe()` 返回中是否有目标 `ns`，schema/value 层级是否含 `events`；确认客户端 mode 和 writable，再追查前端降级分支。
5. 检查实际 Client bundle 是否声明 `configForms`、调用 `get(entryId)`，以及是否读取/写入正确层级。不要只搜索 src。
6. 对比 src 和 lib。`link:` 只连接包目录，不会自动编译；重新 build Host/Client 产物，再按宿主支持的方式重载或重启，刷新浏览器并检查实际收到的 bundle。profile 的 patch live reload 不等于 linked JavaScript 自动重编译或刷新。

离线安装提示找不到精确版本，只能说明本地缓存或元数据不足；不要据此断言 registry 未发布。检查实际安装结果，依网络约束联网确认，或使用目标 checkout 的 workspace/lockfile。

## 4.5 快速诊断：列出 Host 已注册的所有 settings ns

Client 侧一次性 dump，直接判断目标 ns 进没进 seam，比逐项猜命名快：

```ts
export const inject = ['configForms'] as const
export function apply(ctx: Context): void {
  const describe = ctx.configForms.describe()
  void describe.ensure().then(() => {
    const names = (describe.getSnapshot().view?.namespaces ?? []).map((n) => n.ns)
    console.log('registered settings ns =', names) // 每项标识字段是 ns，不是 namespace
  })
}
```

对照一个已知 `ready` 的 ns（如 `dsh-session-manager`）：

- 列表里**没有**目标 ns → Host 没收集它；高发根因是 Config 无 volatile 字段被整体跳过，其次是 entry id 对不上或插件没运行。
- 列表里**有**目标 ns 但 `get(entryId)` 仍 unavailable → 核对 `get` 用的字符串与列表里的 `ns` 是否完全相等（大小写、连字符）。

## 5. 回归验证与结论边界

先用实际旧构建复现，再修复，避免测试只覆盖新源码而遗漏 stale lib：

- Host 产物检查：Config 的目标字段含 volatile 元数据和预期默认值。
- Client bundle 桩验证：在无 Node 全局的 ModuleLoader stub 中执行 factory，确认服务获取、slot 注册、嵌套值展示和正确写入路径。
- 目标宿主集成检查：用该版本的 SettingsForms 确认 namespace、字段和值可被投影。内部实现可用于隔离诊断，不能成为插件运行时的深层依赖。
- 浏览器实测：确认开关可见，修改后快照更新，刷新后值保留，并在真实事件处理时读取新值；按需验证 volatile 更新未重复注册监听器。

本次 dsh-notify 修复已完成类型检查、构建、两项产物回归测试、打包 dry-run，以及本机 SettingsForms 的隔离投影检查；当时未完成浏览器交互实测、真实 profile 持久化验证或通知事件验收。后续不得把这些缺失项引用为已验证事实。报告逐项标明已通过、未执行或受阻原因；生成新 lib 不代表当前进程已经加载新代码。
