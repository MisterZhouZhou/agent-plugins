# Client 开发规范

Client 代码运行在 DSH Web 浏览器环境，负责页面、Slot、设置卡和用户交互。它以宿主的 ModuleLoader 和公开 UI/服务协议为边界；不能把 Node 权限、文件系统或 Host 密钥带入浏览器 bundle。

## 1. ModuleLoader 产物契约

Client 构建产物不是普通的独立 `<script>` 页面应用，而是交给宿主的 `window.__ModuleLoader__` 注册。最小包装契约如下：

```js
window.__ModuleLoader__.load({
  id: '@scope/dsh-example',
  factory: (require) => {
    const module = { exports: {} }
    const exports = module.exports
    // 编译后的 Client 模块
    return module.exports
  },
})
```

必须满足：

- `id` 与 manifest 的 `name` 一致，不能使用临时目录名或未经约定的别名。
- `factory` 只在宿主加载该模块时执行；不要在 bundle 被下载时就启动业务副作用。
- factory 返回公共 Client 模块导出，导出对象中的注册函数应由宿主明确调用。
- 不假设 `window.__ModuleLoader__` 永远存在；开发和测试环境应提供最小 stub，生产环境缺失时给出可诊断错误。
- 重复加载应可识别并避免重复注册页面、Slot、事件、样式和定时器。

## 2. tsdown 与浏览器 bundle

Client 入口使用 CJS browser bundle，以便被 ModuleLoader 的 factory 兼容加载；根项目仍可以保持 ESM。构建配置必须显式表达以下约束：

```ts
import { defineConfig } from 'tsdown'

const confirmedExternals = [
  // 仅填入执行时从宿主模块表确认的模块
]

export default defineConfig({
  entry: ['src/client/index.ts'],
  platform: 'browser',
  format: ['cjs'],
  external: confirmedExternals,
  // 用构建器支持的 banner/footer 选项包裹 ModuleLoader 契约。
  // module/exports 必须声明在 factory 闭包内部（见下），不要用 intro 放到顶层。
  banner: {
    js: [
      "window.__ModuleLoader__.load({ id: '@scope/dsh-example', factory: (require) => {",
      '  const module = { exports: {} };',
      '  const exports = module.exports;',
    ].join('\n'),
  },
  footer: {
    js: '  return module.exports; } });',
  },
})
```

上面展示的是契约形状；实际 tsdown 版本的字段名、入口对象写法和 banner/footer 拼接顺序要以项目安装的构建工具文档及生成产物为准。构建后必须检查生成文件确实包含：

1. `window.__ModuleLoader__.load(...)` 注册。
2. 与 manifest 相同的插件 `id`。
3. `factory` 闭包和 `module.exports` 返回值。
4. `module`/`exports` 声明在 `factory` 闭包**内部**，没有通过 `intro` 泄漏到文件顶层（否则每个插件的 `module`/`exports` 都抢同一个顶层变量，和宿主的工厂式 CJS 形状不一致）。
5. 没有把 `import` 留在只支持 CJS 的宿主加载路径中。

### external 策略

平台 external 只来自执行时确认的宿主模块表。当前调查基线（2026-09-03）可作为调查线索而不是永久清单的模块类别包括：

- React
- React DOM
- Cordis
- UI Slots
- UI Primitives

在实际生成或升级插件时，先查询目标 DSH 的 Client runtime、ModuleLoader 和 UI 包版本，再决定哪些模块 external。除宿主明确提供的模块外，其他依赖默认内联或作为发布依赖处理。错误 external 会导致宿主 `require` 失败；错误内联会造成 React/UI 多实例、bundle 膨胀或上下文不兼容。

## 3. `apply(ctx)` 与 UI 接入选择

Client 入口通常导出 `apply(ctx)` 或等价的 Client service module。注册动作集中在入口，组件本身保持可测试和可卸载：

```ts
export function apply(ctx: ClientContext): void {
  // 根据功能选择 page、slot 或 settings
}
```

具体注册 API 以目标 DSH Client SDK 为准，常见选择标准如下：

### Page

当功能需要独立 URL、完整工作区、较大信息密度或独立导航入口时使用 Page。Page 应定义稳定的路由/标识、加载失败状态、空状态和返回路径；不要为了一个小按钮创建完整页面。

### Slot

当功能是现有页面中的局部能力，例如工具栏按钮、列表项操作、详情区块或上下文动作时使用 Slot。Slot 注入应：

- 绑定宿主公开的 slot 名称和契约。
- 对宿主上下文做运行时校验，缺字段时显示降级状态。
- 通过事件或受控 Host API 完成操作，不直接读取宿主内部 store。
- 使用稳定的 `data-dsh-plugin`、`data-dsh-part` 等语义属性便于测试和诊断。

### Settings

当用户需要配置开关、路径、连接参数或权限时使用 Settings 配置卡。设置 UI 只负责展示和提交，默认值、schema、敏感字段处理和持久化由公开 Host/Settings 协议负责。

#### `settings.section` Slot 注册

注册到 `settings.section` 槽位会在 DSH Web 的「设置」面板中新增一个标签页：

```ts
// src/client/index.ts
export const name = 'dsh-example-client'
export const inject = ['slots', 'settingsScope'] as const

export function apply(ctx: ClientContext): void {
  // 创建 settings scope 控制器（namespace 必须与 Host 端一致）。
  // 实际 API 是 SettingsScopeBinder.bind<T>({ namespace })，不是可调用函数
  // ctx.settingsScope<T>({ namespace })。
  const scope = ctx.settingsScope.bind<Record<string, boolean>>({
    namespace: 'dsh-example',
  })

  ctx.slots.inject('settings.section', () => {
    // SlotCore.register 只有「单对象 options + 组件」这一种两参数形式：
    // name/id/order/label/inject 必须放在同一个对象里。
    return ctx.slots.register(
      {
        name: 'settings.section',
        id: 'dsh-example',           // 唯一 id（list 槽位缺 id 会被 SlotCore 直接拒绝）
        order: 800,                   // 排序（越小越靠前）
        label: '示例设置',            // 标签页名称
        inject: () => ({ scope }),    // inject 是「函数」：返回的对象合并进组件 props
      },
      SettingsComponent,
    )
  })
}
```

关键约束：
- `namespace` 与 Host 端 `ctx.settings.register()` 的命名空间一致，通过 `settingsNamespace('dsh-example')` 定义。
- `inject` 必须是**返回 props 对象的函数**（`() => ({ scope })`），不是对象字面量 `{ scope }`。写成对象字面量会静默失效：组件拿不到注入值。inject 函数返回的对象与 owner props（settings.section 的 `{ close }`）合并后传给组件。
- **list 槽位的注册项必须有 `id`**：`SlotCore` 对没有 `id` 的 list 条目直接拒绝注册，后果是标签页**悄无声息地不出现**（不是报错）。排查「设置里看不到标签页」时第一件事是回读 `dist/client.js`/`lib/client.js`，确认 `register` 的单对象里 `id` 与 `inject` 函数形状正确。
- 组件签名应为 `React.FC<Record<string, unknown>>`，通过 `props as unknown as MyProps` 解构 inject 值。
- 组件需处理三种状态：`loading`（加载中）、`unavailable`（namespace 未注册）、`ready`（可读写）。

#### settingsScope 读写

Client 端通过 `ctx.settingsScope<T>({ namespace })` 获取控制器：

```ts
interface SettingsScope<T> {
  getSnapshot(): SettingsScopeSnapshot<T>
  subscribe(listener: () => void): () => void
  set(field: string, value: unknown): Promise<void>
  unset(field: string): Promise<void>
}
```

| 方法 | 说明 |
|---|---|
| `getSnapshot()` | 获取当前快照：`{ status, value, writable, revision }` |
| `subscribe(listener)` | 订阅变更，返回取消函数 |
| `set(field, value)` | 异步写入单个字段，返回 Promise |
| `unset(field)` | 清除字段，恢复继承 base 默认值 |

`status` 三种状态：
- `'loading'` — 等待首次 Host 响应，显示加载中
- `'ready'` — 数据就绪，`writable` 为 true 时可调用 `set`/`unset`
- `'unavailable'` — namespace 未注册或连接断开，显示降级提示

#### 注入依赖

Client 的 `ctx.settingsScope` 由 `@deepseek-ai/dsh-client-ui-settings` 提供，加载顺序由其 plugin 自身的 `export const inject = ['slots', 'settingsScope']` 声明；`package.json` 的 `dsh.client` 只描述包级图关系，不声明 Cordis 服务。

```json
{
  "dsh": {
    "client": {
      "platform": "web",
      "inject": [
        "@deepseek-ai/dsh-client-ui-settings"
      ]
    }
  }
}
```

`dsh.client` 三个字段语义不同，别混用（这是排查「Client 没进 boot graph / require 报 missed the module table」的关键）：

| 字段 | 含义 | 填什么 | 典型错误 |
|---|---|---|---|
| `platform` | 目标平台声明 | `"web"` | 缺失或拼错 → 该包直接被 `dsh-client-modules` 跳过 |
| `inject` | 「这个 **graph 行（包名）** 必须先于我到达」的到达顺序约束 | 同样声明了 `dsh.client` 的**包名 id** | 把 `react`、服务名（`slots`/`settingsScope`）或 npm 依赖名写进来——它们不是 graph 行，会被静默忽略或产生误导 |
| `external` | 本 bundle 里 `require(...)` 的**非基线模块**请求 | 由另一个动态 graph 行提供的包名，或 platform seed 表里的精确 key | 漏掉非基线依赖 → 运行时报 `require("...") missed the module table`；把基线模块写进去 → 冗余但通常无害 |

基线（platform seed）模块**无需任何声明**即可在 bundle 里 `require`：`react`、`react/jsx-runtime`、`react-dom`、`react-dom/client`、`@deepseek-ai/cordis`，以及 UI 静态库（`@deepseek-ai/dsh-client-store`、`@deepseek-ai/dsh-client-ui-slots`、`@deepseek-ai/dsh-client-ui-primitives`）。它们由平台 seed 表自动解析，**不要**写进 `dsh.client.inject` 或 `dsh.client.external`。

> 本清单以执行时宿主的 module 表为准（当前调查基线见 `references/upstream-compatibility.md`）；`external` 写错会导致宿主 `require` 失败，把应 external 的写成内联会造成 React/UI 多实例、bundle 膨胀。

`@deepseek-ai/dsh-client-ui-settings` 由 DSH ModuleLoader 在运行时注入，无需放入 profile 的 npm 依赖。但必须加到 `devDependencies` 中以供编译时类型检查。

### 全局辅助 Chat / 悬浮 Chat

右下角悬浮的独立辅助 Chat 不应被当作会话详情或隐藏工作区会话实现：它不能写入会话记录，也不能耦合当前 workspace。Host/Client 分层、RPC 流式生命周期、模型选择、Shadow DOM、局部焦点样式、回复空行规范化和安装排查详见 `references/global-inline-chat.md`。

实现前先确认“关闭保留、新建清空、是否恢复本地内容、是否显示推理强度”等产品语义；不要用默认 UI 猜测这些行为。

## 4. 生命周期、卸载与样式

Client 注册的每一项资源都要有清理路径：

- 页面、Slot、设置卡：保存宿主返回的 unregister/dispose 函数，或使用 SDK 提供的生命周期 effect。
- 事件监听：保存取消函数；不得只调用 `addEventListener` 而没有 remove。
- 定时器、观察器和异步任务：在卸载时清理或取消，避免旧组件继续更新状态。
- 动态样式：使用插件命名空间或 CSS Modules；卸载时移除自己创建的 `<style>`、class 和 CSS 变量。
- DOM：只删除由插件创建且带有插件语义属性的节点，不删除宿主节点。

热重载后应满足“旧实例完全退出，新实例只注册一次”。可以把注册状态放在实例作用域，不要依赖无法清理的全局布尔值。

## 5. 浏览器依赖纯度

Client 源码和最终 bundle 禁止依赖：

- `node:*` 模块。
- `fs`、`path`、`child_process` 等裸 Node API。
- Host 的绝对文件路径、环境变量和 secret。
- DSH 未公开的内部模块或 `dsh-web/shared/*`。
- 只在 Host 端可用的 SDK 入口。

如果浏览器需要 Host 能力，定义 Core 中的可序列化请求/响应/事件协议，由宿主桥接；不要通过 `window` 暴露任意 Host 对象。构建和测试都要对产物做 Node-only 依赖扫描，而不是只检查 TypeScript 源码。

## 6. Client 测试

Client 测试不应启动完整 DSH Web 应用才能验证插件入口。使用最小 `__ModuleLoader__` stub 捕获加载注册：

```ts
test('registers the client module with ModuleLoader', async () => {
  const loaded: Array<{ id: string; factory: (require: unknown) => unknown }> = []

  ;(globalThis as typeof globalThis & {
    window?: {
      __ModuleLoader__?: {
        load(input: { id: string; factory: (require: unknown) => unknown }): void
      }
    }
  }).window = {
    __ModuleLoader__: {
      load(input) {
        loaded.push(input)
      },
    },
  }

  await import('../src/client/index.js')

  expect(loaded).toHaveLength(1)
  expect(loaded[0].id).toBe('@scope/dsh-example')
  expect(typeof loaded[0].factory).toBe('function')
})
```

实际测试还应覆盖：

- `apply(ctx)` 是否只注册预期的 Page、Slot 或 Settings。
- 注册参数是否包含稳定 id、插槽名、路由和卸载函数。
- 宿主上下文缺失或协议版本不兼容时是否安全降级。
- 重复加载和卸载后没有重复 DOM、事件、样式或定时器。
- Client 产物可在最小 ModuleLoader stub 中执行。
- bundle 不包含 Node-only 模块，也不依赖测试环境才存在的全局变量。
