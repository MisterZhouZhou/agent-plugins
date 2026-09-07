# Host 开发规范

Host 代码运行在 DSH 的 Node/Cordis 宿主中，负责服务、命令、任务、持久化、子进程、网络代理和其他权限敏感能力。它必须通过公开 SDK 和 Cordis 生命周期接入，不得依赖 DSH 未公开的内部实现。

## 1. 公共入口契约

最小可加载骨架如下：

```ts
export const name = 'example'
export interface Config {}
export function apply(): void {}
```

这是用于确认模块形状和 bundle 可加载性的最小示例，不代表业务插件可以忽略生命周期和配置校验。实际插件应明确 `ctx`、配置类型和需要注入的服务：

```ts
export const name = 'example'

export const inject = [
  // 只填写执行时确认存在的公开服务名
] as const

export interface Config {
  enabled?: boolean
  dataDir?: string
}

export function apply(ctx: HostContext, config: Config): void {
  // 1. 校验并规范化 config
  // 2. 创建服务或注册命令
  // 3. 为所有注册建立 effect/dispose 清理路径
}
```

其中 `HostContext` 代表目标 DSH/Cordis 公开的 Host 上下文类型，实际项目应从官方 SDK 或宿主公开类型导入，不要在插件里复制一个与宿主脱节的“近似类型”。

### `name`、`inject`、`Config` 与 `apply`

| 项目 | 要求 |
| --- | --- |
| `name` | 使用稳定、短小且与插件身份对应的 Cordis 名称，例如 `example`。不要把版本号、用户目录或临时分支名放进名称。 |
| `inject` | 只声明 `apply` 真正需要的公开服务。依赖不存在时应让宿主给出清晰的加载错误，不要在函数内部静默访问未声明的全局服务。 |
| `Config` | 描述用户可配置项，并区分缺省值、可选值和敏感值。配置解析后应得到规范化对象，业务逻辑不要到处重复处理 `undefined`。 |
| `apply(ctx, config)` | 作为公开安装入口；负责注册服务、命令、事件和清理逻辑。不要在模块 import 阶段启动进程、读写文件或访问网络。 |

## 2. 插件的三种导出形态

DSH/Cordis 插件支持函数、对象和类三种形态。三者共享同一生命周期与依赖注入原则，但适用场景不同；不要为了“更规范”而把简单插件强行写成类。

### 函数形式：默认选择

函数形式最轻量，适合绝大多数简单功能、Tool、事件监听和无公共状态的 Host 插件：

```ts
import type { Context } from '@deepseek-ai/cordis'

export const name = 'example'
export const inject = ['tools']

export function apply(ctx: Context) {
  // 通过 ctx 注册 Tool、事件或 effect。
}
```

选择规则：

- 插件只需要在加载时注册能力，没有供其他插件调用的公共服务。
- 状态可以封装在 `apply` 闭包中，并由 `ctx`/`ctx.effect()` 管理清理。
- 优先用于 Tool、事件监听、一次性初始化和简单业务逻辑。

### 对象形式：结构化打包

对象形式将名称、依赖和执行逻辑放进同一个默认导出对象，行为与函数形式基本一致，适合希望入口更集中、模块结构更明确的插件：

```ts
import type { Context } from '@deepseek-ai/cordis'

export default {
  name: 'example',
  inject: ['tools'],
  apply(ctx: Context) {
    // 通过 ctx 注册能力。
  },
}
```

对象形式不是新的生命周期模型，也不会自动获得 Service 能力。其 `apply` 内仍应使用 `ctx.on()`、`ctx.effect()`、`ctx.tools.register()` 等受生命周期追踪的 API。配置 schema、类型推断和对象字段形状必须以目标 DSH/Cordis 版本的公开类型为准。

### 类形式：提供公共 Service

类形式通常继承 Cordis `Service`，用于向其他插件暴露有状态的公共能力、可替换 Provider 或基础设施服务：

```ts
import { Service, type Context } from '@deepseek-ai/cordis'

export default class MetricsService extends Service {
  static inject = ['storage']

  constructor(ctx: Context) {
    super(ctx, 'metrics')
    // 只做同步初始化；异步资源和清理由生命周期 effect 管理。
  }

  record(name: string, value: number) {
    // 对其他插件公开的稳定方法。
  }
}
```

选择规则：

- 插件需要通过 `ctx.<serviceName>` 向其他插件提供公共方法或状态。
- 能力需要拆成 Definition、Provider、Consumer，或存在多个可替换实现。
- 自定义 LLM 后端、存储、检索、指标、网关等基础设施能力可采用类形式；具体 LLM Adapter 仍须遵守 DSH 的 `LlmAdapter`/注册契约。
- `super(ctx, 'serviceName')`、Context declaration merging、Consumer 的 `inject` 名称必须一致。

### 选型速查

| 需求 | 推荐形态 |
|---|---|
| Tool、事件监听、简单初始化 | 函数形式 |
| 与函数形式等价，但希望元数据集中 | 对象形式 |
| 向其他插件提供公共服务或有状态 Provider | 类形式（`Service`） |

默认从函数形式开始；仅当需要集中对象元数据时改用对象形式，仅当确实要提供公共 Service 时改用类形式。三种形态都必须遵守 Config schema、依赖注入、effect 清理、HMR 和公开 SDK 边界。

## 3. 配置 schema 与边界

TypeScript 类型不能替代运行时校验。配置来自 profile、用户文件或宿主注入时，必须在进入业务逻辑前做 schema 校验：

- 布尔、字符串、数字、数组和枚举值要检查实际类型。
- 路径要拒绝空字符串、意外的绝对路径和超出插件工作目录的路径，除非产品需求明确允许并经过确认。
- 命令参数要使用结构化参数或白名单，禁止把用户输入直接拼接为 shell 命令。
- 超时时间、并发数、文件大小和重试次数要设置明确上限。
- 秘密、token、cookie 和完整凭据不写入日志、错误响应、patch 或 README 示例。
- 配置错误应在加载时报告字段路径和修复建议，而不是等到第一次业务调用才失败。

推荐流程：

```text
原始配置 -> schema.safeParse -> 默认值/规范化 -> 构造服务 -> 注册能力
```

对于 Full-stack 插件，Host 返回给 Client 的配置只包含 UI 所需的非敏感字段；schema、错误码和请求/响应结构放入 Core，并在两端分别执行运行时校验。

## 4. Service、生命周期与清理

需要长期持有状态、响应事件或提供公共方法时，使用 Cordis `Service` 或等价的宿主服务抽象。服务应遵循以下顺序：

1. `apply` 只完成依赖确认、配置解析和服务注册。
2. `start` 或首次启动阶段建立监听器、定时器、缓存、子进程和网络客户端。
3. 任何注册都要保存对应的取消函数或使用 Cordis effect/dispose 机制托管。
4. `stop`、dispose 或宿主卸载时，按相反顺序清理事件、定时器、子进程、临时文件和连接。
5. 清理操作要幂等；热重载、重复加载和启动失败后的回滚不能留下第二份监听器或后台任务。

不要把 `setInterval`、进程句柄或事件监听器藏在模块级单例中。模块被重新加载时，旧资源可能无法被宿主回收，最终表现为重复执行、端口占用或内存泄漏。

## 5. 公开 SDK 与资源访问

运行时能力通过目标 DSH 公开 SDK 获取。当前参考的 Host 文件能力包括：

| 能力 | 用途 | 边界 |
| --- | --- | --- |
| `ctx.rootDir` | 插件/宿主约定的根目录。 | 不把它当作任意系统目录；拼接后仍需做边界检查。 |
| `ctx.resolve(...)` | 解析根目录下的相对资源。 | 不接受未经检查的用户输入直接穿越目录。 |
| `ctx.readText` / `ctx.readJson` | 读取文本或 JSON。 | 对缺失、格式错误和过大文件分别处理。 |
| `ctx.writeText` / `ctx.writeJson` | 持久化插件数据。 | 原子写入或临时文件替换，避免进程中断造成半文件。 |
| `ctx.trash` | 将不再需要的资源移入宿主认可的回收路径。 | 删除前确认目标属于插件管理范围；不要无条件递归删除。 |
| `ctx.spawnCommand` | 调用外部命令。 | 使用结构化 argv、白名单、超时、退出码和输出大小限制。 |

具体方法签名以执行时安装的官方 SDK 为准。不要用 `node:fs`、`child_process` 或对 DSH 内部目录的深层 import 绕过 SDK；这样会让插件失去宿主权限边界，并且无法可靠适配不同 DSH 版本。

网络访问同样要经过公开的 Host 能力或注入的客户端：

- 只访问产品允许的域名和协议。
- 配置连接超时、响应大小上限、重试和取消。
- 不把 Host 密钥下发给浏览器；Client 只调用受控的 Host 方法。
- 区分网络不可达、认证失败、限流、协议错误和业务拒绝，避免统一返回“未知错误”。

## 6. 错误边界

Host 错误分三层处理：

1. **配置/输入错误**：返回稳定错误码、字段路径和用户可执行的修复提示。
2. **外部依赖错误**：记录内部诊断信息，但对 Client 只返回安全消息、错误码和是否可重试。
3. **程序错误**：保留 Host 侧完整日志和关联 ID；不要把堆栈、本机绝对路径、环境变量或请求凭据直接放进跨端响应。

跨端协议建议使用稳定命名空间，例如：

```text
dsh:example:request
 dsh:example:response
 dsh:example:error
```

请求、响应和事件都必须可序列化，并在接收端再次做 schema 校验。错误码一旦对 Client 公开，就要考虑兼容和迁移，不要让 Client 依赖易变的错误文本。

## 7. Host 单元测试

Host 测试应围绕公开行为，而不是内部字段或真实 DSH 进程。采用依赖注入策略：

- 将文件、命令、网络、时钟和日志封装为接口或工厂参数。
- 单元测试注入内存实现、fake SDK 或 spy，实现可重复的成功和失败路径。
- 需要验证真实路径边界时使用测试临时目录，并在每个测试结束时清理。
- 不在普通单元测试中调用用户机器上的真实命令、真实网络或真实凭据。
- 为服务挂载、配置默认值、公共方法、输入错误、依赖失败、重复启动和 dispose 清理分别写断言。
- 对 `spawnCommand` 断言 argv、超时和退出码；不要只断言“函数被调用过”。

最小测试检查表：

```text
[ ] apply 可在最小 fake context 上加载
[ ] 配置 schema 拒绝错误类型和越界值
[ ] 服务/命令注册名称稳定
[ ] 公共方法成功结果可序列化
[ ] 失败只暴露稳定错误码和安全消息
[ ] stop/dispose 后监听器、定时器和子进程均被清理
[ ] 相同插件不能因热重载重复注册
```
