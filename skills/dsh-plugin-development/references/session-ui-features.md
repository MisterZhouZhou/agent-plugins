# 会话菜单与会话详情功能规范

本文件沉淀 DSH Web Client 中“会话记录菜单操作”和“会话详情消息操作”的实现经验。适用于删除会话、归档会话、重命名、分叉会话、重新生成某条助手回复等功能。

## 1. 先区分两个作用域

会话类功能必须先明确操作对象，不能把两个作用域混在一起：

| 入口 | 操作对象 | 典型功能 |
|---|---|---|
| 会话记录下拉菜单 | 当前会话 | 重命名、分叉、归档、删除 |
| 会话详情中的消息菜单 | 当前消息/当前助手回复 | 复制、重新生成、编辑后重试、继续 |

实现前先写清楚 `sessionId`、`messageId`、`turn` 和目标节点的关系。按钮显示在哪里，不等于操作对象就在哪里；消息级操作不能退化成“对整个会话发送一条新提示词”。

## 2. 会话菜单新增操作

### 2.1 优先使用公开 Slot 或菜单扩展 API

如果 DSH Client SDK 提供会话菜单扩展点，应优先使用公开契约。只有宿主没有公开入口时，才通过 DOM 适配层接入现有菜单，并将 DOM 适配代码集中在一个小模块中，避免散落在业务组件里。

DOM 适配层应满足：

- 使用稳定的语义选择器，例如 `role="menuitem"`、`aria-label`、可观察的宿主语义属性；不要依赖随机 class、层级深度或构建哈希。
- 通过 `MutationObserver` 处理菜单的懒加载和重新挂载。
- 给插件创建的节点添加稳定标记，例如 `data-dsh-session-delete="true"`，用于幂等判断和卸载清理。
- 监听菜单项时使用捕获阶段，并在确认目标为插件节点后阻止宿主原处理，避免一次点击触发两个动作。
- Observer 必须在卸载时断开，插件创建的节点、监听器和定时器必须可清理。

### 2.2 保持宿主菜单的一致性

新增“删除会话”时，最稳妥的方式是克隆一个已有的同级菜单项（通常是归档会话），再只替换业务文字和图标：

1. 克隆归档菜单项，继承宿主的 class、布局、间距、快捷键容器、hover 状态和无障碍属性。
2. 删除会话项插入到归档会话项之后。
3. 只替换菜单中的可见文本节点，不要使用 `item.textContent = '删除会话'`。
4. 删除 `aria-current` 等只属于原菜单项的状态属性，重新设置 `aria-label`。
5. 使用宿主的错误色 token；不要硬编码一套与宿主不一致的菜单样式。

`textContent` 会删除克隆节点中的 SVG、快捷键、嵌套布局和无障碍辅助节点，是“文字正确但 icon 消失”的常见根因。应使用 `TreeWalker` 找到菜单项中第一个非 SVG 的非空文本节点，只替换该文本节点；找不到时才追加文本节点。

### 2.3 菜单 icon 的 SVG 约束

如果要复用宿主 SVG 的尺寸和样式，`cloneNode(false)` 只会复制 SVG 根节点，不会复制原图标子节点上的 `stroke`、`fill` 等属性。替换子节点后必须显式设置：

```ts
icon.setAttribute('viewBox', '0 0 24 24')
icon.setAttribute('fill', 'none')
icon.setAttribute('stroke', 'currentColor')
icon.setAttribute('stroke-width', '1.8')
icon.setAttribute('stroke-linecap', 'round')
icon.setAttribute('stroke-linejoin', 'round')
```

图形路径必须按宿主实际 `viewBox` 绘制。若宿主 icon 使用 `24 × 24`，却用只占 `10 × 10` 的路径，图标虽然存在但会明显偏小。不要只放大 CSS 宽高；先匹配 `viewBox` 和路径占用范围，再微调描边宽度。

路径使用 `currentColor`，这样删除菜单项设置为错误色时 icon 与文字会自动保持一致。验收时同时检查：可见性、尺寸、基线、颜色、hover/disabled 状态和窄屏布局。

### 2.4 删除动作的语义

“删除”必须调用真正的删除协议。只有当宿主公开 API 明确规定“归档即删除”时，才可以复用归档接口；否则不能为了复用代码把删除按钮连接到归档动作。

DSH 0.2.1 上经 `workspaces.archiveSession(sessionId)` + DOM 菜单兼容层（克隆归档项、捕获阶段监听）实测仍可用；该功能未受 0.2.1 客户端 API 断裂影响。

动作流程建议：

1. 从当前菜单上下文取得稳定的 `sessionId`，不要依赖菜单项文本反推会话。
2. 弹出确认，并在确认前不修改会话状态。
3. 调用删除 API，处理权限拒绝、网络失败和会话已不存在等错误。
4. 删除当前会话后，按照宿主约定选择相邻会话或空状态，避免详情区继续引用已删除 id。
5. 成功后让宿主刷新列表；不要手动复制一套会话 store。

## 3. 会话详情中的重新生成/重试

### 3.1 重试是替换当前回复，不是继续对话

“重试当前回复”的语义是：针对已有的用户回合，重新生成当前这一条助手内容，并替换原内容。它不应该：

- 创建一条新的用户提示词；
- 把同一个提示词追加到会话末尾；
- 把重试实现成“继续生成下一轮”；
- 让用户看到两条并列的助手回复而没有明确替换关系。

如果 Host 只有 append/continue 能力，应先补充原子化的 replace/regenerate 协议，而不是在 Client 侧伪造“重试”。请求至少应携带 `sessionId`、目标 `messageId` 或稳定节点 id，以及原用户回合/turn 信息。

### 3.2 正确的目标定位

在会话详情快照中：

1. 通过当前按钮绑定的 `messageId` 定位目标助手节点。
2. 向前寻找属于同一回合的用户节点，不能简单取会话最后一条用户消息。
3. 读取该回合的上下文边界，确保重试不会影响后续回合。
4. 将原助手节点作为替换目标传给 Host；不要重新构造一条没有原身份的消息。

目标节点消失、快照过期或消息已经被其他操作替换时，应安全退出并给出可理解的错误，而不是发送一个猜测性的全新提示词。

### 3.3 避免重试时白屏

重试期间必须保持当前详情页和原消息的稳定挂载。不要通过切换到临时会话、改变整个详情组件的 `key`、清空消息数组或强制路由跳转来等待新结果，否则页面会短暂进入空状态，表现为白屏。

建议流程：

1. 点击后只将当前重试按钮置为 busy，禁用重复点击。
2. 保留原详情树和必要的原消息占位；可以在目标消息位置显示重新生成中的状态。
3. 调用 Host 的 replace/regenerate 操作。
4. 等待新的助手内容实际出现在目标回合，而不是只等待用户消息或请求发送成功。
5. 新内容就绪后，在同一消息位置替换旧内容，再解除 busy。
6. 超时、取消或失败时保留原内容，恢复按钮，并展示错误；不要把详情页置为空。

如果实现必须先删除旧回复再生成，删除和生成之间也要保留稳定占位或旧内容快照，并设置“替换已打开/已提交”的保护标记，避免清理逻辑把刚生成的替换内容再次归档或删除。

### 3.4 状态与并发

- busy 状态以 `sessionId + messageId` 为粒度，不能用全局布尔值锁住整个应用。
- 同一条消息同时只能有一个重试请求；切换会话或卸载组件时取消/忽略旧请求结果。
- 结果回写前验证目标会话和消息仍然是当前实例，防止旧请求串写到新会话。
- 原内容、替换内容和错误状态应有明确的数据状态，不要依赖 DOM 文本判断请求是否完成。

### 3.5 0.2.1 实现路径：优先就地回退，fork 链已断裂

「重新生成/刷新」在 ≤0.2.0 的经典实现是 fork 链：`sessions.fork(atSeq)` → `binding(新id)` → 同步模型选择 → `prompt('queue')` → 切换会话 → 归档旧会话。**这条链在 0.2.1 断了多处**（见 §7.8 表）：

- `fork()` 只把子会话写入目录，**不再建立保留**；`binding(id)` 要求已保留（需先 `retainAgentScope`），直接 binding 返回 undefined（报“重建会话失败”）。
- 视图选择（切换到某会话）已移出 sessions 控制器，旧 `sessions.open` 不在其职责内。

**推荐改为就地重发**（dsh-rewind 语义下的刷新，实测可用）：

```
定位目标回合的用户消息 seq（anchorSeq ?? data.seq）
  → 引擎命令 /<engine> @<seq> chat   （就地回退：撤回该消息及其后）
  → waitForCommand 等 marker 结局
  → composer 回填该消息文本（messageTextAt / conversation.input setDraft）
  → 派发 Enter 到 [data-composer-input] 自动重发
```

语义与 fork 版一致（原回复被替换=旧行隐藏、之后的轮次一并丢弃），且更优：**会话 id 不变**——无需切换、归档、模型选择同步，fork 机器（约 200 行）整个删除。用户消息旁的“刷新”与助手消息的“重新生成”应共用同一条回退+回填管线（两者本质相同：重发所属回合的用户消息）。

注意：
- 目标 seq 必须在计算目标时就取好（快照节点 `anchorSeq`，老快照回退 `data.seq`），执行时不再反推。
- 自动重发前确认仍是当前会话（用户可能已切换）；生成中的回合按钮置灰（`assistantStatus === 'running'`）。
- 回退往返的短窗口内保留“正在回复中…”占位/降暗，提交后交给宿主自己的生成 UI。
- 端到端验证时遇到 `model-retry` 行（“已重试模型请求 n/5 · 失败原因：524 …”）是**模型网关超时**（基础设施问题），不是插件故障——宿主会自动重试。

## 4. 适配层的幂等性和最小化

这类功能容易因为“先能显示”而积累无关代码。实现完成后应清理：

- 没有被入口调用的 Host/Core 文件、旧 Tool、临时测试组件和重复的状态封装；
- 为一次 DOM 插入而引入的额外依赖；
- 直接操作宿主私有 store、复制宿主会话状态的代码；
- 无法卸载的全局 observer、事件监听、样式和定时器；
- 只为绕过一次安装问题而写入宿主 bundle 或 profile 安装目录的脚本。

Client-only 插件可以保留最小 Host 空入口，但不要为了“看起来完整”继续保留没有注册 Tool、Service 或状态的 Core 层。

## 5. 调试与安装链排查

遇到“代码已改但 UI 不变”时按以下顺序排查：

1. 确认 `src/client` 改动已经重新生成 `lib/client.js`。
2. 确认 `package.json` 的 `exports["./client"]` 和 `dsh.client` 指向该产物。
3. 区分 `link:` 与 tarball：`link:` 通常只需重新构建并重启/刷新 Web；tarball 必须重新打包并重新安装。
4. 检查浏览器 Network 实际下载的 Client bundle 是否包含最新代码，避免只看源码。
5. 检查 Console 是否有 ModuleLoader、external、factory 或宿主 API 错误。
6. 最后才检查 DOM 选择器、Observer、菜单挂载时机和 CSS。

`dsh plugin --profile web add/remove` 可能会重新整理整个 profile 的依赖，而不只是处理当前插件。若输出显示大量包被重新安装并卡在某个无关包的 `postinstall`（例如 `cloudflared` 下载二进制），这属于 profile 依赖安装阻塞，不代表当前插件依赖该包。不要反复执行 add/remove；先定位 profile 中引入该包的依赖，或使用宿主支持的脚本跳过/网络代理方案，再继续验证插件。


## 7. 消息行操作按钮与浮层（0.2.1 实战经验）

沉淀自 dsh-session-manager 就地回退功能（移植 SiriLee/dsh-rewind）：每条用户消息旁注入操作按钮 + 点击弹出模式选择浮层。以下经验在 DSH `0.2.1-rc.x` 运行时实测验证。

### 7.1 行身份解析：三级 key 兜底

消息行的 DOM 身份按优先级解析，任一命中即用 `chat.nodes`（快照 `nodes.values()` 建成的 `Map<key, node>`）反查节点：

1. `data-chat-anchor-key` —— FLOW key；step 部件是复合 `["<nodeKey>","<part>"]`，解析不到时降级
2. `data-chat-node-key` —— 恒为纯节点 key
3. `data-chat-flow-key` —— 旧版属性（0.1.x/0.2.0），新 DOM 可能不存在

目标事件 seq 取 `node.anchorSeq`，缺失时回退 `node.data.seq`（同为事件 seq）。行 kind 用 `data-chat-flow-kind`（`user` / `steering` / `assistant-step` / `command` / `turn-process` / `turn-tail` / `tool-call`）。

### 7.2 actions 容器：结构性定位，不要扫 class

按钮要插进宿主的消息操作行（复制/分支按钮那一行）。定位必须**结构性**：取行内**最后一个非本插件 `<button>` 的 `parentElement`**。不能取第一个 button——带图片的用户消息里，图片缩略图也是 `<button>` 且在 actions 行**之前**。`[class*="_actions"]` class 扫描只作旧版回落。

按钮视觉克隆相邻的复制按钮模板（`aria-label` 为"复制/copy"），克隆后把 children 替换为自己的内联 SVG。SVG 无文本内容，不会污染其他插件对该行的文本抓取。

### 7.3 悬空引用陷阱（克隆按钮的必踩坑）

克隆模板意味着原按钮节点会被 `replaceWith` 换掉。**点击回调绝不能闭包捕获克隆前的按钮引用**——脱离 DOM 的元素 `getBoundingClientRect()` 全零，弹层会定位到 `(0,0)` 飞到左上角。回调里必须实时 `pill.querySelector('button')` 取活节点。

### 7.4 事件绑定与预取

- `pointerdown` + `click` 双绑定，均捕获阶段 + `preventDefault`/`stopPropagation`：防宿主在 click 前重绘吞掉点击。
- **pointerdown 同时是预取窗口**：人手按下到弹起约 80–150ms，足够覆盖一次 host 命令往返。弹层依赖的只读探测（preview 类命令）应在 pointerdown 就发起，弹层打开时直接以落定态首渲染——消除"检查中…"加载闪烁。

### 7.5 单例浮层（模式选择/确认弹窗）

纯 DOM 单例，挂 `document.body`，`role="dialog"`：

- **键盘**：document 捕获阶段监听 ↑/↓/Enter/Esc（↑ 在 composer 是历史召回，必须抢）。↑/↓ 只在当前步的启用按钮间循环；Esc 是各步 ghost 按钮（取消/返回）的键盘孪生，ghost 不进循环。
- **外点关闭**：pointerdown 捕获，目标在浮层或锚点内则忽略。
- **定位**：锚点下方右对齐，近底部翻转到上方；最终值**钳制在视口内**（`Math.min/Math.max` clamp），任何异常锚点（脱离 DOM、滚出视口）都不出屏。
- **关闭还键盘**：经 composerFocuser 通道聚焦对应会话的 composer——**只聚焦，绝不写草稿**（误调 `setDraft('')` 会清空用户正在输入的内容）。
- **闪烁治理**：内容落定若需整步重渲染（对齐 dsh-rewind），布局高度变化会造成可见跳动——优先"开门即最终态"（预取），慢路径才显示加载态。

### 7.6 引擎命令通道（host↔client 机器协议）

Client 驱动 host 动作的标准回路：

1. host 注册**内部引擎命令**（非人类命令名，人类触达一律拒绝），文法如 `@<seq> chat|both [planId]`、`preview @<seq>`、`__candidates`。
2. client 调 `sessions.binding(id).session.command('/<engine-name> args')` → `RemoteResult{ matched }`。
3. 命令结局落成 chat 快照的 `CommandNode{ seq, args, outcome: { kind, text?, sourceEventSeq? } }`——`outcome.sourceEventSeq` 非空才代表"真正执行了"（preview 类探测的 success 没有它）。
4. client 用 `waitForCommand`（谓词 + `binding(id).target('chat').subscribe` 唤醒）等结局；**发命令前先采样 `knownCommandSeqs`**，等待谓词排除已存在节点——重复操作同一目标时才不会落在上一条命令的陈旧结局上。
5. host 结果文本尾部带 **locale 无关的机器 token**（`impact=<n>` / `restore:<path>` / `delete:<path>` / `plan=<id>`），client 只解析 token 渲染，绝不解析人读文案。

### 7.7 DOM 调度：queueMicrotask，不是 setTimeout

对"插入的行要立刻隐藏/改样式"类逻辑，observer 的调度必须是 `queueMicrotask`（微任务，**绘制之前**执行）。`setTimeout(0)` 是宏任务，跑在**绘制之后**——插入的行先被画出来（transcript 长高、滚动被顶 +N px），下一拍才隐藏（弹回 -N px），一帧可见的布局弹跳，用户感知为"页面抖动"。

配套必须有**忽略域过滤**（微任务级全量扫描在打字时会过热）：composer（`[data-composer-seat]`/`[data-composer-input]`）、右侧栏（`[data-sidebar-right-panel]`/`[data-sidebar-chat]`）、插件页（`[data-plugin-panel]`）内的变更不可能影响行集合，全部落在忽略域内则跳过本轮调度。

### 7.8 0.2.1 client API 断裂点（升级必查）

| 断裂点 | 旧（≤0.2.0） | 新（0.2.1） |
|---|---|---|
| 当前会话 | `list.getSnapshot().current` | 字段已删除；`byId[id].retainedBy.mainView > 0` |
| chat 视图 | `binding(id).snapshot.getSnapshot().views.get('chat')` | `binding(id).target('chat').getSnapshot()` |
| 行 key | `data-chat-flow-key` | `data-chat-anchor-key` + `data-chat-node-key` |
| 节点可见性 | `node.visibility === 'visible'` 判定 | `visibility` 字段已删除；仅显式 `'hidden'` 才跳过，缺席视为可见 |
| fork 后可用性 | fork → 立即 `binding(id)` | fork 仅入目录；`binding` 需先 `retainAgentScope(id)`，视图切换移出 sessions 服务 |

写法上双路径兼容（新路径优先、旧路径回落）。**快照适配器要透传全部已知字段**——漏传 `locations`（turn 索引）这类字段会让依赖它的逻辑（如"整轮被撤则隐藏回合摘要行"）静默空转，不报错、只是不生效。

### 7.9 顶栏吸顶最近用户消息（sticky prompt）与视口几何判定

沉淀自 dsh-session-manager sticky prompt（dsh-oil-sticky-prompt 迁移 + 0.2.1 修复），DSH `0.2.1-rc.x` 实测验证。

**DOM 锚点**：滚动容器 `[data-conversation-scroll]`；用户行 `[data-chat-flow-kind="user"][data-chat-flow-key]`。

**最大陷阱：rewind 隐藏行是幽灵吸顶源**。就地回退/编辑重发后，旧行保留在 DOM（`data-dsh-rewind-hidden="true"` + `style="display: none"`），`getBoundingClientRect()` 返回全零。任何"行底 ≤ 视口顶 → 已滚出"的判定都会把它误判成已滚出视口的最近用户消息，造成：吸顶条与仍可见的消息本体同屏、且点击吸顶条 `scrollIntoView` 到 `display:none` 行完全无效。这是 §7.3"脱离 DOM 元素 rect 全零"在视口判定场景的变体——**规则：凡用 rect 做视口/滚动判定，先剔除零尺寸行（`bottom <= top` 即零高度），且滞回分支里的当前 pinned 查找也必须用过滤后的列表**（否则旧幽灵 key 在滞回带内继续保持粘滞，只在主循环过滤修不掉）。

其余要点：

- **吸附用行底不是行顶**：长消息行顶越过视口顶但行底仍在视口内（主体可见）时不吸附，否则吸顶条遮住消息上部导致无法完整阅读。配套滞回带（吸附阈值 0.5px / 释放阈值 8px）防边缘抖动。
- **会话切换/内容重建静默窗口**：整组用户行 key 全部替换时先隐藏吸顶条，等 300ms 布局稳定（变动顺延、上限 1200ms 兜底）再渲染，避免先闪"上一条"再跳"最新一条"。
- **吸顶文本抓取**：克隆行节点后剔除插件注入节点（`[data-dsh-checkpoint-pill]` 等）、复制类按钮（`aria-label` 为 复制/copy/空）、时间戳叶子（`^\d{1,2}:\d{2}$`）再取 `textContent`；换行折叠成单空格，防短首行占满两行 line-clamp 遮住后续内容。
- **跳回交互**：`scrollIntoView({ block: 'start' })`，`prefers-reduced-motion` 时 `behavior: 'auto'`；smooth 滚动中采样 rect 是中间态，验收要等动画结束再断言对齐。
- **吸顶条自身布局**：宿主 `position:sticky; top:0; height:0; overflow:visible; pointer-events:none`，按钮自身恢复 `pointer-events:auto`；入场只做透明度淡入，不做 FLIP 缩放（快速上滚会反复从放大态播动画，是闪烁源）。
- **更新调度**：document 捕获阶段 scroll（过滤 `[data-conversation-scroll]`）+ resize + MutationObserver，统一 rAF 合并渲染；设置关闭时把残留 host 节点移除（兼容旧 bundle 实例）。
- **调试手法**：这类问题用 `evaluate_script` 一次 dump 全部行几何（key / `data-dsh-rewind-hidden` / top / bottom / height）+ 吸顶条当前 key，幽灵行（height=0）立刻现形；顺带记录 `scrollHeight - clientHeight`——DSW 只渲染最近轮次，短会话可能完全不可滚，吸顶在该会话本就不应出现。

## 8. 验收清单

### 会话菜单

- 删除项位于归档项之后，文本、icon、间距、hover 和颜色与宿主菜单一致。
- icon 在当前宿主实际 viewBox 下可见且尺寸匹配。
- 菜单重复打开不会出现多个删除项。
- 删除确认、取消、成功、失败和当前会话切换均有正确行为。
- 卸载/重载后没有残留菜单项、监听器或 observer。

### 会话详情

- 重试按钮绑定明确的 `messageId`，只影响当前助手回复。
- 不发送新的用户提示词，不追加新的对话回合。
- 重新生成期间详情不白屏，原内容或稳定占位仍存在。
- 新助手内容就绪后替换原位置，失败时保留原内容。
- 快速重复点击、切换会话、卸载和超时不会串写或重复生成。

### 消息行按钮与浮层

- 按钮出现在每条用户/steering 消息的 actions 行内，视觉与相邻宿主按钮一致（克隆模板 + 自有 SVG）。
- React 重建行后按钮自动重挂；卸载后无残留按钮、observer、监听或样式。
- 点击后弹层定位在按钮旁且完整落在视口内；无滚动跳变（rAF 采样滚动位置差 > 2px 即不通过）。
- 预取生效时开门即最终态，无"检查中"加载闪烁；慢探测回退加载态且单次落定。
- 克隆按钮的点击回调实时取活节点（脱离 DOM 的旧节点 rect 全零 → 弹层飞左上角）。
- 关闭浮层只聚焦 composer，不清空、不改写用户草稿。

### 顶栏吸顶（sticky prompt）

- 回退/编辑重发过的会话（DOM 里有 `display:none` 的旧行）：消息主体可见时吸顶条不出现；点击吸顶条能跳回真实消息开头（前 2 行完整可见）。
- 长消息滚出视口后吸顶正常出现；消息回到视口（释放带外）时吸顶消失，边缘无抖动。
- 切换会话不闪现上一会话的吸顶文本；关闭设置后残留吸顶条被移除。
