---
name: tempermonkey
description: 开发、调试和审查 Tampermonkey/Greasemonkey Userscript。用于网页 DOM 增强、点击与动态内容处理、样式注入、localStorage 持久化、GM 菜单、SPA/历史导航恢复，以及“脚本已运行但页面效果不生效”的排障。
---

# Tampermonkey Userscript 开发与排障

用于在不修改网站源码的前提下编写、维护和排查浏览器 Userscript。优先读取真实页面 DOM、站点 CSS 和当前脚本生命周期，再做最小修改。

## 触发范围

当用户提到以下任一内容时使用：

- Tampermonkey、Greasemonkey、Violentmonkey、Userscript、`.user.js`
- `@match`、`@grant`、`GM_registerMenuCommand`、`GM_setValue`、`GM.xmlHttpRequest`
- 网页标题变色、自动点击、页面增强、浮动设置面板、脚本注入的样式或事件
- SPA 页面、无限滚动、局部刷新、浏览器后退后脚本效果丢失
- “脚本运行了但没有生效”“有些帖子生效、有些不生效”“点击后没有立即更新”等问题

## 基本工作流

1. 先确认目标域名、`@match`、脚本管理器和运行时页面。
2. 读取当前脚本、测试、站点实际 DOM 和覆盖目标的 CSS；不要根据旧版页面结构猜选择器。
3. 追踪完整数据流：用户操作或站点状态 -> 匹配函数 -> 持久化 -> DOM 标记 -> CSS 展示。
4. 对异常行为先写最小失败测试或最小 DOM 复现，再实施一个根因修复。
5. 修改后运行语法检查、针对性测试和动态生命周期回归测试。
6. 用户脚本更新时同步提升 `@version`，便于脚本管理器拉取新版本。

## 从零创建 Userscript

### 最小可用模板

创建 `.user.js` 文件时，先写元数据块，再写一个幂等的 IIFE。下面的模板适合不需要跨域请求、只操作当前页面的脚本：

```js
// ==UserScript==
// @name         页面增强示例
// @namespace    https://example.com/userscripts
// @version      0.1.0
// @description  一个最小的网页增强脚本
// @author       Your Name
// @match        https://example.com/*
// @run-at       document-idle
// @grant        none
// ==/UserScript==

(() => {
  'use strict'

  const STYLE_ID = 'example-userscript-style'

  function installStyle() {
    let style = document.getElementById(STYLE_ID)
    if (!style) {
      style = document.createElement('style')
      style.id = STYLE_ID
      document.head.append(style)
    }
    style.textContent = '.example-highlight { color: #8b5cf6 !important; }'
  }

  function apply(root = document) {
    root.querySelectorAll('.target').forEach((element) => {
      element.classList.add('example-highlight')
    })
  }

  function start() {
    installStyle()
    apply()
    new MutationObserver(() => apply()).observe(document.body, {
      childList: true,
      subtree: true,
    })
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true })
  } else {
    start()
  }
})()
```

模板中的关键约束：

- 使用 `(() => { 'use strict' })()`，避免变量泄漏到网站全局作用域。
- 初始化入口要兼容脚本早于页面完成加载和脚本晚于页面完成加载两种情况。
- 固定 `STYLE_ID`、私有 class 和初始化标记，重复执行时复用节点而不是重复追加。
- `MutationObserver` 只在确实需要处理动态 DOM 时添加，并通过 debounce 或批处理避免高频全量扫描。
- 不要为了“方便”阻止网站默认行为；除非需求明确要求，否则不调用 `preventDefault()`。

### 元数据块字段

| 字段 | 用途和注意事项 |
| --- | --- |
| `@name` | 脚本管理器显示名称；需要多语言时可增加 `@name:zh-CN` 等字段。 |
| `@namespace` | 脚本身份的一部分；创建后尽量保持稳定，避免管理器把更新当成新脚本。 |
| `@version` | 每次发布行为或修复变化时递增；版本不变可能导致更新不拉取或难以确认是否生效。 |
| `@description` | 简明说明脚本改什么、不改什么。 |
| `@match` | 最小化匹配范围。优先写明确协议、域名和路径，不要无必要使用 `<all_urls>`。 |
| `@exclude` | 从宽泛的 `@match` 中排除不应运行的页面；能用更窄 `@match` 时优先收窄 `@match`。 |
| `@run-at` | 控制注入时机，常用 `document-start`、`document-end`、`document-idle`。不要用过早时机替代正确的 DOM 生命周期处理。 |
| `@noframes` | 不希望在 iframe 中运行时添加；否则要明确判断 `window.top === window.self`，避免重复处理。 |
| `@grant` | 只声明实际使用的 GM API；不需要 GM API 时使用 `@grant none`。 |
| `@connect` | 仅配合 `GM.xmlHttpRequest` 等跨域请求声明允许的目标域名；不应把无关域名加入白名单。 |
| `@require` | 外部依赖；必须固定可信来源和版本，并考虑依赖加载失败及供应链风险。 |
| `@updateURL` / `@downloadURL` | 发布到脚本托管站点时再配置，先确认地址返回的是对应元数据或脚本，不要填写失效链接。 |

`@match` 不是权限声明：它决定在哪些页面注入；`@grant` 决定脚本能调用哪些管理器 API；`@connect` 只影响跨域请求白名单。三者不要混为一谈。

### `@run-at` 选择

- `document-start`：需要尽早改写页面或监听早期事件时使用；此时 `document.body` 可能不存在，不能直接依赖 body。
- `document-end`：DOM 已解析但资源可能仍在加载，适合需要早于图片/广告加载的初始化。
- `document-idle`：默认优先选择，适合普通 DOM 增强；仍必须处理 SPA 和后续动态渲染。

`@run-at` 只保证大致注入时机，不保证目标组件已经出现。对 Vue、React、Discourse 等站点，仍需使用站点事件、MutationObserver、路由事件或延迟扫描。

## GM API 与兼容性

### 现代异步 API 优先

新脚本优先使用现代 Promise API，并兼容实际脚本管理器能力：

```js
const value = await GM.getValue('key', defaultValue)
await GM.setValue('key', value)
await GM.deleteValue('key')
await GM.xmlHttpRequest({
  method: 'GET',
  url: 'https://api.example.com/data',
})
```

如果需要兼容较旧的 Tampermonkey、Violentmonkey 或 Greasemonkey，应在运行时检测 API 是否存在，不要假设所有管理器都提供相同接口：

```js
const getValue = async (key, fallback) => {
  if (typeof GM !== 'undefined' && typeof GM.getValue === 'function') {
    return GM.getValue(key, fallback)
  }
  return fallback
}
```

常见旧式 API 与现代 API 的对应关系：

| 旧式 API | 现代 API | 说明 |
| --- | --- | --- |
| `GM_getValue` | `GM.getValue` | 旧式通常是同步调用，现代 API 返回 Promise。 |
| `GM_setValue` | `GM.setValue` | 保存前先规范化数据，避免循环引用或不可序列化对象。 |
| `GM_deleteValue` | `GM.deleteValue` | 删除不存在的 key 应视为成功。 |
| `GM_xmlhttpRequest` | `GM.xmlHttpRequest` | 需要对应 `@connect`；不要用页面 `fetch` 代替需要特权的跨域请求。 |
| `GM_addStyle` | `GM.addStyle` | 也可自行管理固定 `<style>` 节点，以便更新和清理。 |
| `GM_registerMenuCommand` | `GM.registerMenuCommand` | 不同管理器对返回值、快捷键参数和异步回调支持可能不同。 |
| `GM_setClipboard` | `GM.setClipboard` | 写入剪贴板可能受浏览器权限或用户手势限制。 |

兼容策略：

1. 只选定脚本实际支持的管理器和 API，不为不存在的需求堆叠兼容层。
2. 必须跨管理器时，集中封装 API 适配层，业务逻辑不要到处判断 `GM` 和旧式全局函数。
3. API 不可用时提供无特权降级路径，或明确提示用户安装要求；不要静默造成部分功能看似成功。
4. 使用 `GM.info.scriptHandler` 等信息时也要做存在性检测，避免 `GM.info` 缺失导致脚本启动失败。

## 安全、权限与数据边界

- 默认把页面输入当作不可信内容；插入用户或远程文本时优先使用 `textContent`，确需 HTML 时进行严格白名单清理。
- 不要把 token、Cookie、密码或完整页面内容写入日志、URL、剪贴板或共享存储。
- `GM.xmlHttpRequest` 的响应要验证状态码、内容类型和 JSON 结构；不能仅凭 HTTP 请求成功就信任响应。
- `@connect`、`@require` 和远程配置都是脚本供应链边界，变更时记录原因并审查域名与版本。
- localStorage、GM 存储和 BroadcastChannel 都是同源脚本之间可见的通信面；key 使用稳定前缀，值采用版本化结构，并限制数据量。
- 脚本只修改需求范围内的 DOM，不读取或改写无关表单、账号设置和站点业务状态。

## 安装、更新与调试基础流程

1. 保存完整的元数据块和脚本代码，文件名使用 `.user.js` 后缀。
2. 在 Tampermonkey、Violentmonkey 或兼容管理器中安装；核对脚本是否启用、当前页面是否命中 `@match`。
3. 打开管理器的脚本编辑器或浏览器 DevTools，先确认脚本确实执行，再检查目标 DOM 是否存在。
4. 修改功能或修复问题后递增 `@version`；刷新脚本管理器缓存或重新安装，避免把旧版本误判为新代码未生效。
5. 在目标页面、刷新、SPA 路由切换、动态加载、后退/前进和新标签页场景分别验证。
6. 交付前至少执行 `node --check <script>.user.js`；有测试时执行针对性测试并记录结果。

开发期可以临时加入带脚本前缀的日志，例如 `console.debug('[my-script]', state)`；确认问题后删除敏感数据和无必要的调试输出。不要用 `console.clear()` 干扰用户或其他脚本的诊断。

## 帖子标题和已读状态匹配

### 以链接 ID 匹配，不以标题文本匹配

帖子标题可能改名、包含重复文本或被多语言渲染，因此不要用 `textContent` 作为帖子身份。

推荐流程：

```js
const links = [...document.querySelectorAll('a.title')]
const topicId = extractTopicId(link.href)
const isRead = readIds.has(topicId)
```

必须先验证链接是目标站点同源的 `/t/` 话题链接，再提取数字 ID。Discourse 常见形式包括：

```text
/t/<slug>/<topic-id>
/t/<slug>/<topic-id>/<post-number>
/t/<topic-id>
```

例如真实页面中的：

```html
<a href="/t/topic/2775566/13" class="title raw-link raw-topic-link">
  <span dir="auto">抽20袋上好佳可可甜心</span>
</a>
```

其话题 ID 是 `2775566`，不是标题文本，也不是最后的帖子编号 `13`。提取逻辑不能只读取第二个路径片段：`/t/topic/2775566/13` 的数字在第三个片段。

站点提供的 `data-topic-id` 可以作为结构校验或明确的备用来源，但仍应验证链接路径和同源性，避免把普通链接误判成帖子。

### 识别站点原生已读状态

仅保存脚本自己的点击记录会漏掉用户在安装脚本前已经读过的帖子。Linux DO/Discourse 列表可能通过父容器标记已读：

```css
.topic-list-item.visited
.latest-topic-list-item.visited
.category-topic-link.visited
```

已读判断应合并两类来源：

```js
const isRead = storedIds.has(topicId) || isSiteVisitedTitle(link)
```

不要只写 CSS 覆盖 `.visited` 规则而不把链接加入脚本自己的标记流程，否则旧已读帖子可能没有行内样式或私有类，后续重渲染时仍会丢失效果。

## 点击事件和即时反馈

### 站点可能阻止或接管点击

Discourse、Vue/React 等站点可能在冒泡阶段调用 `preventDefault()`、`stopPropagation()` 或启动 SPA 导航。如果 Userscript 只在文档冒泡阶段监听，并且看到 `event.defaultPrevented` 就直接返回，脚本可能完全没有记录点击。

对于只需要记录和视觉反馈、不能阻止原站导航的功能，使用捕获阶段的事件委托：

```js
document.addEventListener('click', handleClick, true)
```

处理顺序应为：

1. 只接受左键；
2. 从 `event.target.closest('a.title')` 找到标题链接；
3. 用 `href` 提取并校验话题 ID；
4. 写入 `localStorage`；
5. 立即添加私有类和行内颜色；
6. 不调用 `preventDefault()`，不改变原站导航。

除非产品明确要求，否则不要因为 `event.defaultPrevented` 而跳过记录。应通过测试覆盖“站点已将事件标记为 prevented，但脚本仍完成记录和上色”的场景。

右键、中键和辅助键行为要根据需求明确处理；只要求普通打开链接时，至少不要把非左键事件误记为已读。

## 动态内容、SPA 和历史导航

### MutationObserver 不是全部生命周期

论坛列表经常由无限滚动、局部刷新或 SPA 重渲染产生新标题。初始化扫描一次不够，应观察：

```js
new MutationObserver(scheduleApply).observe(document.body, {
  childList: true,
  subtree: true,
})
```

回调要合并到微任务或短 debounce，避免一次渲染触发大量全量扫描。初始化、菜单、样式和事件监听必须幂等，不能重复安装。

### 处理后退、前进和 BFCache

浏览器后退可能从历史缓存直接恢复页面，此时脚本不会重新执行初始化，DOM 新增观察器也不一定触发；站点还可能清掉原来节点上的行内样式。要在初始化时注册：

```js
const reapplyAfterHistoryNavigation = () => {
  installStyle()
  applyReadTitles(document)
}

window.addEventListener('pageshow', reapplyAfterHistoryNavigation)
window.addEventListener('popstate', reapplyAfterHistoryNavigation)
```

`pageshow` 覆盖 BFCache 恢复，`popstate` 覆盖 SPA 历史状态切换。回调必须从持久化状态重新读取颜色和话题 ID，不能只依赖当前 DOM 上残留的类。

### 多标签同步

同源标签页之间可以监听 `storage` 事件重新应用话题 ID 和颜色。事件处理只消费目标 key；无效 JSON 应按空集合处理，不能让异常存储内容中断页面。

## 样式注入和作用域

页面视觉增强只修改目标元素需要的属性。为私有类注入样式，并使用 `!important` 覆盖站点同级或更高优先级的已读规则：

```js
link.classList.add('my-userscript-read-title')
link.style.setProperty('color', color, 'important')
```

注意事项：

- 样式节点使用固定 ID，重复运行时更新 `textContent`，不要重复追加。
- 类名、ID 和设置面板选择器使用私有前缀，避免污染站点页面。
- 如果站点 CSS 使用 `.visited a.title`、CSS 变量或高 specificity，必须在真实 DOM 上确认最终规则；不要只检查脚本是否成功插入 `<style>`。
- 只改标题文字时，不要顺手修改父容器背景、边框、布局、正文、标签、用户名或分类。
- 设置面板可以使用 `prompt()` 以外的侧边栏或内嵌控件，避免阻塞页面；颜色输入需做格式校验并与颜色选择器同步。

## 持久化和 GM 权限

简单的同源页面状态优先使用 `localStorage`，并定义稳定版本化的 key。读取和写入都要处理隐私模式、禁用存储和无效 JSON：

```js
try {
  const raw = localStorage.getItem(KEY)
  // parse and normalize
} catch {
  // keep the page usable
}
```

只有确有需要时才声明 `@grant` 和 `@connect`。不需要跨域请求时不要新增 `@connect`；不要把原脚本中的无关图床、签到或过滤能力带入一个窄功能 Userscript。

## 排障检查表

遇到“有时不变色”时按以下顺序检查：

1. **匹配范围**：元素是否确实为 `a.title`，`href` 是否同源，是否能提取正确话题 ID。
2. **状态来源**：ID 是否已写入脚本自己的存储；站点父级是否有 `.visited`；是否使用了错误的帖子编号。
3. **事件入口**：点击是否只在冒泡监听；是否因 `defaultPrevented` 过早返回；是否误处理了非左键。
4. **渲染时机**：点击后节点是否被 SPA 替换；新节点是否触发 MutationObserver；后退是否只触发 `pageshow`/`popstate`。
5. **样式最终值**：链接是否有私有类或行内 `color!important`；站点 `.visited a.title` 是否通过 specificity/CSS 变量覆盖；检查 DevTools 的最终 computed style。
6. **更新生效**：脚本管理器是否已加载新版本；浏览器是否仍运行旧脚本缓存；元数据版本是否递增。

## 最低测试集合

至少覆盖：

- `/t/slug/123`、`/t/topic/2775566/13` 和 `/t/123` 能提取正确话题 ID；
- 用户链接、外站链接、无数字 ID 链接不会被选为帖子标题；
- 标题文本改变不影响同一话题的已读匹配；
- 站点父容器 `.visited` 能触发已读上色；
- 点击事件 `defaultPrevented: true` 时仍记录并上色；
- 点击处理不调用 `preventDefault()`，不阻断原站导航；
- MutationObserver 处理动态新增标题；
- `pageshow` 和 `popstate` 后重新应用持久化颜色和已读状态；
- `storage` 事件同步不同标签页；
- 初始化重复执行不会重复安装 observer、监听器或 style 节点；
- `node --check` 和项目现有测试通过。

## 交付报告

完成 Userscript 修改后报告：

- 修改的脚本和测试文件；
- 实际使用的匹配来源和生命周期入口；
- 运行过的命令及结果；
- 是否在真实登录页面验证；如果没有，明确说明未进行实机验证。
