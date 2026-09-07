# 全局辅助 Chat / 独立悬浮对话

本参考用于实现类似 `dsh-inline-chat` 的全局辅助 Chat：在 DSH Web 右下角提供悬浮入口，打开一个随时可用的辅助对话面板。它不是当前工作区的会话功能，也不是会话记录的另一种入口。

## 1. 先锁定产品边界

实现前先把以下边界写进需求和 Core 契约：

- **独立于工作区**：不读取当前页面内容，不依赖当前选中的会话，不修改工作区消息，不调用会话创建、追加、删除、归档或重试 API。
- **不进入会话记录**：辅助 Chat 的消息只能存在于插件自己的状态中，不应出现在侧边栏、会话列表或当前会话详情中。
- **只有一个当前辅助 Chat**：关闭面板只隐藏，不清空；刷新或重启是否恢复由插件自己的持久化策略决定。若产品要求“新建”，其语义应是取消正在生成、清除当前内容并开始一个新的 Chat，而不是创建第二个可切换历史。
- **能力复用而非状态复用**：可以复用 DSH 的模型目录、默认模型和 LLM 执行能力，但不能复用工作区会话状态。
- **用户提示要诚实**：空状态中说明这是独立辅助 Chat，不会读取当前页面，也不会写入会话记录，避免用户误以为它具备工作区上下文。

最容易出现的错误是把辅助 Chat 当作“隐藏的工作区会话”实现。这样虽然能快速得到回复，却会污染会话列表、引入当前会话耦合，并让“新建/清空”的语义变得不一致。

## 2. 推荐的 Host / Client 分层

全局悬浮 UI 属于 Client，凭据、模型调用和取消控制属于 Host。推荐结构如下：

```text
Core：可序列化请求、响应、流事件、运行时校验
  │
  ├─ Host：ctx.llm.stream + agentDefaultModel + request 生命周期
  │
  └─ Client：悬浮按钮、Shadow DOM、输入框、模型选择、消息持久化
```

约束：

- Core 不依赖浏览器 DOM 或 Node API；只放通道名、类型、解析器和边界校验。
- Client 不直接访问 provider、API key 或 Host secret；通过公开 connection RPC 调用 Host。
- Host 使用公开的 `ctx.llm.stream` 执行模型调用，不从浏览器直接拼接 provider 请求。
- 模型目录可以由 Client 通过公开的 `ctx.connection.api.llm.models` 获取，默认模型和真正的推理执行仍由 Host 负责。
- RPC 输入要在 Host 边界再次校验，不能因为 Client 已经校验过就信任输入。限制消息数量、文本长度、provider/model 标识和 request id 长度。

## 3. 流式回复、停止与清理

悬浮 Chat 需要“发送中显示增量内容”和“发送按钮变为停止”时，不要把整个响应一次性返回。一个简单、可调试且容易跨 Host/Client 的协议是：

1. `start` 接收当前消息数组和可选模型选择，校验最后一条必须是用户消息，返回唯一 `requestId`。
2. Host 为每个 request 保存 `AbortController`、事件队列、完成状态和错误状态。
3. Host 调用 `ctx.llm.stream`，把文本增量、推理增量、完成和错误转换成可序列化事件。
4. Client 循环调用 `poll(requestId)`，消费并清空事件队列；收到增量后只更新当前 assistant 气泡。
5. `cancel(requestId)` 触发 AbortController，Host 结束任务并删除 pending 状态。
6. Host 在正常结束、异常结束和取消路径都释放 pending map、定时器、监听器和异步任务；不要让一次失败的请求永久留在内存中。

Client 还应使用 generation token 或等价的过期请求标记：点击“新建”、停止或重新挂载后，旧请求即使晚到，也不能把内容写回新 Chat。轮询间隔应有限且在完成后立即停止，不能使用无法取消的无限循环。

Host 对外返回的错误应经过清洗，只给出可理解的用户提示；不要把 provider 原始堆栈、文件绝对路径或密钥相关信息展示到页面。

## 4. 模型选择与推理强度

模型选择必须来自 DSH 当前可用的模型目录和默认模型，而不是硬编码某一个 provider/model：

- 启动时并行获取模型目录和 Host 返回的默认模型；单项失败时应有降级策略，而不是让整个悬浮 Chat 白屏。
- 持久化的 provider、model 在目录中不存在时，回退到默认模型或第一个可用模型，并更新本地状态。
- provider 和 model 要作为独立字段传输，不能只保存展示名称；展示名称可能重复或变化。
- 当前模型没有有效的 reasoning effort 选项时，**整个推理强度控件隐藏**，不要留下只有箭头、空文本或不可用的下拉框。
- 切换到不支持推理强度的模型时，清除旧的 `reasoningEffort`；否则会把上一个模型的配置错误地带给新模型。
- 只有模型目录明确提供合法的 effort id/name 时才渲染选项，并给出可读的默认项。

这条规则解决了“默认只看到一个箭头，没有推理强度内容”的问题：控件是否存在应该由当前模型能力决定，而不是由 UI 布局固定渲染。

## 5. DSH 风格输入框与悬浮 UI

可以做成和 DSH UI 一致的交互，但应复用公开协议和视觉约定，不要深度导入 DSH Web 私有组件：

- Enter 发送，Shift+Enter 换行；处理 IME composition，避免中文输入法回车误发送。
- 发送中按钮切换为停止，停止后保留已经收到的内容，并让旧请求失效。
- 关闭面板保留消息；“新建”清空消息和持久化状态，再开始新的当前 Chat。
- 用 Shadow DOM 或严格的插件 CSS 命名空间隔离样式，避免宿主页面的全局 CSS 改写输入框和按钮。
- 悬浮根节点带稳定的 `data-dsh-plugin` / `data-dsh-part` 属性，便于排查和自动化定位。
- 挂载前删除同插件旧根节点，并调用上一次实例的 dispose；否则 HMR、重启或重复加载会出现多个悬浮按钮、重复事件和多个轮询器。
- 固定定位、z-index、移动端宽度和视口高度都要设置降级值；打开面板后再聚焦输入框，不能因为挂载失败导致页面空白。

### 输入框焦点样式

如果产品明确要求输入框不显示蓝色高亮，只移除 composer 的边框/outline/shadow，不要全局写 `*:focus { outline: none }`：

```css
textarea,
textarea:focus,
textarea:focus-visible {
  border: 0 !important;
  outline: none !important;
  box-shadow: none !important;
}

/* 其他按钮仍保留可访问的键盘焦点指示 */
button:focus-visible {
  outline: 2px solid var(--focus-color);
}
```

如果浏览器默认样式或宿主样式仍覆盖规则，检查选择器优先级、规则顺序和 Shadow DOM 边界，再对局部控件使用 `!important`；不要为了消除一个输入框高亮而牺牲整页键盘可访问性。

## 6. 回复渲染与多余空行

模型输出通常含有 CRLF、连续空行或缩进。若直接使用 `white-space: pre-wrap` 渲染，多个换行会被原样放大，页面中间会出现异常大的空白。轻量文本渲染至少要：

1. 先统一换行符。
2. 把连续三行及以上的空行压缩为最多一个段落间隔。
3. 在进入 `innerHTML` 前转义 `& < > " '`；模型文本不能直接作为 HTML。
4. 若要支持 Markdown，再引入明确的 Markdown 解析器和 HTML sanitizer；不要把 `innerHTML` 当作 Markdown 渲染器。

示例：

```ts
function normalizeAssistantText(value: string): string {
  return value
    .replace(/\r\n?/g, '\n')
    .replace(/\n[ \t]*(?:\n[ \t]*){2,}/g, '\n\n')
}
```

这是一种“保持段落、去除异常空洞”的轻量策略；如果产品要求代码块、列表、表格和链接，应单独定义 Markdown 渲染和安全策略，不要继续堆叠正则。

## 7. 本地状态与安全边界

- 使用插件命名空间的 storage key，例如 `dsh-inline-chat:v1`、`dsh-inline-chat:model:v1`；不要写入 DSH 会话 store。
- 只保存必要的消息和模型选择，限制消息条数与单条文本长度，避免 localStorage 无限增长。
- 读取 localStorage 时处理损坏 JSON、旧版本结构和隐私清理；失败时回到空 Chat，不应阻塞页面加载。
- 若消息涉及敏感信息，应在 README 和 UI 中说明其保存位置，并提供“新建/清空”操作；清空时同时清除消息和相关临时请求。
- 不要把 Host 返回的 token、provider 凭据或原始网络响应持久化到浏览器。

## 8. 打包、安装与常见误判

独立 Client 插件通常同时需要 Host 入口和 ModuleLoader 浏览器 bundle：

- `tsdown` 的 Client 产物使用宿主可加载的 CJS factory；banner 中的 ModuleLoader id 必须与 manifest `name` 完全一致。
- `exports['./client']`、`dsh.client.inject`、`dsh.bundle.patch` 和 bundle 中的 ModuleLoader id 必须互相对齐。
- `dsh.client.inject` 只填写已经从目标 DSH Web runtime 确认存在的宿主 external；不确定的依赖应内联或作为发布依赖，不要凭包名猜测 external。
- 本地优先 `pnpm build` 后用 `dsh plugin --profile web add link:/绝对路径` 验证；源码变更后重新 build 并重启对应 profile，浏览器缓存或旧 bundle 可能让新 UI 看不到。
- 如果安装过程卡在 `node_modules/cloudflared` 的 postinstall，那通常是 profile 或依赖图中的网络隧道依赖，不是 `dsh-inline-chat` 的功能依赖。先区分插件构建失败、插件加载失败和 profile 依赖安装失败，不要把 cloudflared workaround 写进插件业务代码。

## 9. 交付前检查清单

- [ ] 悬浮 Chat 不创建、读取、修改或删除 DSH 会话记录。
- [ ] “新建”清空当前内容并取消旧请求，不产生第二个隐藏历史。
- [ ] Host/Client 通过可序列化、带运行时校验的协议通信。
- [ ] 流式增量、停止、异常、取消和卸载都有明确清理路径。
- [ ] 模型目录、默认模型、provider/model 持久化和失效回退完整。
- [ ] 无 reasoning effort 时不显示空的推理选择控件。
- [ ] 输入框按要求去除局部高亮，但按钮仍保留键盘焦点指示。
- [ ] 回复文本已转义；连续空行不会造成异常大间距。
- [ ] 重复挂载不会产生重复根节点、事件、样式或轮询器。
- [ ] Client bundle 没有 Node-only 依赖，安装失败能区分 cloudflared 等无关依赖问题。
