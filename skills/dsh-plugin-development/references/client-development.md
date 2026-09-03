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
  // 用构建器支持的 intro/banner/footer 选项包裹 ModuleLoader 契约。
  intro: 'const module = { exports: {} }; const exports = module.exports;',
  banner: {
    js: "window.__ModuleLoader__.load({ id: '@scope/dsh-example', factory: (require) => {",
  },
  footer: {
    js: 'return module.exports; } });',
  },
})
```

上面展示的是契约形状；实际 tsdown 版本的字段名、入口对象写法和 banner/footer 拼接顺序要以项目安装的构建工具文档及生成产物为准。构建后必须检查生成文件确实包含：

1. `window.__ModuleLoader__.load(...)` 注册。
2. 与 manifest 相同的插件 `id`。
3. `factory` 闭包和 `module.exports` 返回值。
4. 没有把 `import` 留在只支持 CJS 的宿主加载路径中。

### external 策略

平台 external 只来自执行时确认的宿主模块表。当前基线（2026-09-02）可作为调查线索而不是永久清单的模块类别包括：

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

当用户需要配置开关、路径、连接参数或权限时使用 Settings 配置卡。设置 UI 只负责展示和提交，默认值、schema、敏感字段处理和持久化由公开 Host/Settings 协议负责。保存成功、校验失败、权限拒绝和网络失败要有独立反馈。

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
