---
name: core-page
description: uni-app x 页面文件、构成、pages.json 与页面实例
---

# 页面与 uvue

## 页面文件

- 页面文件后缀为 **`.uvue`**，每个 uvue 文件均为符合 Vue SFC 规范的 Vue 文件。
- uni-app x 仅支持 `.uvue` 页面，不支持与老版 vue 页面混用（因 App 端无 JS 引擎、为原生渲染）。
- uni-app x 项目中看到的 `.vue` 文件通常不是页面：可能是条件编译兼容 uni-app 的组件，或 UTS 组件插件兼容模式的 `index.vue` 入口。
- UTS 组件插件的 `index.vue` 不是普通页面，而是参考 Vue 规范定义的原生组件入口文件，可同时兼容 uni-app 和 uni-app x。
- 页面必须在 **`pages.json`** 中注册，否则不会被打包；第一个页面为首页（启动页）。

## 页面内容构成

一个 uvue 页面包含三个根节点：

- **`<template>`**：模板，使用 uni 内置组件或自定义组件。
- **`<script>`**：逻辑，仅能写 UTS；支持 `<script setup>`（组合式）或 `export default {}`（选项式）。
- **`<style>`**：样式，App 端为 ucss 子集（见 [css-ucss](css-ucss.md)）。

示例（组合式）：

```vue
<template>
  <view class="content">
    <button @click="buttonClick">{{ title }}</button>
  </view>
</template>

<script setup>
  let title = ref("Hello world")
  const buttonClick = () => {
    title.value = "按钮被点了"
  }
  onLoad(() => {})
</script>

<style>
  .content {
    width: 750rpx;
    background-color: white;
  }
</style>
```

## 页面管理

- 新建页面默认放在工程根目录的 `pages` 目录下。
- 每次新建页面都要在 `pages.json -> pages` 中注册；未注册页面会在编译阶段被忽略，不进入编译产物。
- HBuilderX 右键新建页面时会自动注册 `pages.json`，可选择是否创建同名目录。
- 页面较复杂、需要拆分附属 `.uts`、`.css`、组件等文件时，建议创建同名目录；只有单个页面文件时可不多加目录。
- 删除页面需要删除 `.uvue` 文件，并删除 `pages.json -> pages` 中对应配置。
- 页面改名需要同步修改文件名和 `pages.json` 中的页面路径。
- 普通页面和 dialogPage 页面都需要在 `pages.json` 中注册。

## pages.json

- 配置**首页**、页面路径、窗口样式、原生导航栏、tabBar 等。
- 新建/删除页面时需同步增删 `pages` 中的项；HBuilderX 新建页面会自动注册。
- 首页由 `pages` 数组**第一项**决定；每个页面可有 `style`（如 `navigationBarTitleText`）。

示例：

```json
{
  "pages": [
    {
      "path": "pages/index/index",
      "style": {
        "navigationBarTitleText": "首页"
      }
    },
    {
      "path": "pages/my",
      "style": {
        "navigationBarTitleText": "我的"
      }
    }
  ]
}
```

## 页面滚动

- Web 和 WebView 小程序页面通常默认可滚动；uni-app x 原生页面的默认滚动能力取决于平台和渲染模式。
- vdom 模式 App 平台出于性能考虑，默认不隐式给页面套 `scroll-view`；需要滚动时应显式使用 `scroll-view`、`list-view`、`waterflow` 等滚动容器。
- 蒸汽模式从 5.11 起，App 平台在符合条件时会由编译器自动套一层 `scroll-view`，页面默认可滚动。
- 以下情况蒸汽模式不会自动套 `scroll-view`：
  - 页面 `style` 配置了 `disableScroll: true`。
  - 页面单根节点且根节点已经是 `scroll-view`、`list-view` 或 `waterflow`。
  - 页面多根节点且其中一个根节点是 `scroll-view`、`list-view` 或 `waterflow`。
- 编译器对根节点滚动容器的分析是静态的，不判断 `v-if`，也无法识别包装成其他名称的自定义滚动组件。
- 若追求严格多端一致性，可在 `pages.json` 中用 `disableScroll: true` 禁用页面滚动，并全平台自行使用 `scroll-view` 控制滚动。

## 页面对象与栈

- 运行时每个打开页面对应一个 **UniPage** 实例。
- **`getCurrentPages()`** 返回当前页面栈（UniPage 数组）。
- 页面内可通过 `this.$page` 或 `getCurrentInstance()` 获取当前页面实例。
- `UniPage` 可用于获取/设置页面样式、获取子弹窗页面（dialogPages）和页面元素（UniElement）等。

## 弹窗页

- 非小程序平台支持 **dialogPage**：在主页面上弹出的全屏、背景透明的模态子页面。
- App-Android 下每个页面为全屏 activity，不支持透明；需透明时使用 dialogPage。
- dialogPage 是一种页面，仍需在 `pages.json` 中注册。

## 页面生命周期

常用页面生命周期对应关系：

| 组合式 | 选项式 | 描述 |
| --- | --- | --- |
| `onLoad` | `onLoad` | 页面加载时触发，一个页面只调用一次，可接收页面 URL 参数。 |
| `onPageShow` | `onShow` | 页面显示/切入前台时触发。 |
| `onReady` | `onReady` | 页面初次渲染完成时触发，一个页面只调用一次，可与视图层交互。 |
| `onPageHide` | `onHide` | 页面隐藏/切入后台时触发，如 `navigateTo`、tab 切换、应用切后台。 |
| `onUnload` | `onUnload` | 页面卸载时触发，如 `redirectTo` 或 `navigateBack`。 |
| `onPullDownRefresh` | `onPullDownRefresh` | 监听下拉刷新；需在页面配置中开启 `enablePullDownRefresh`。 |
| `onReachBottom` | `onReachBottom` | 页面触底事件，可在页面配置中设置 `onReachBottomDistance`。 |
| `onPageScroll` | `onPageScroll` | 页面滚动事件。 |
| `onBackPress` | `onBackPress` | 监听页面返回；返回 `true` 可阻止默认返回。 |
| `onTabItemTap` | `onTabItemTap` | 当前页面是 tab 页时，点击 tab 触发。 |

### onLoad

- 页面初始化时触发，DOM 尚未构建渲染完成，同步使用 `ref` 或 `getElementById` 拿不到 DOM，应等 `onReady` 或异步获取。
- 常用于接收 URL 参数、发起联网请求，并在异步结果返回后更新 data 或响应式变量。
- 不适合做大量同步耗时计算，尤其 App-Android 上容易阻塞入场动画。
- App-iOS 上窗体动画异步，`onLoad` 中修改 pageStyle 可能闪烁。
- App-Android 如需获取当前页面 activity，应在 `onShow` 或 `onReady` 中获取。

### onShow / onPageShow

- `onShow` 在 `onLoad` 之后触发；`onLoad` 只在页面创建时触发一次，页面隐藏后再次显示只会触发 `onShow`。
- tabBar 切换时，旧 tabBar 页面会 hide，新 tabBar 页面会 show。
- `onShow` 和 `onHide` 成对出现。
- 组合式 API 中应用和页面都有 onShow/onHide，为避免重名，监听页面显示/隐藏使用 `onPageShow` / `onPageHide`。
- 微信小程序下关闭部分原生全屏窗体也会触发页面 `onShow`，如 chooseImage、previewImage、chooseLocation、scanCode 等。

### onHide / onPageHide

- 页面被隐藏或遮挡时触发，如跳转到下一个页面。
- 微信小程序下打开部分全屏原生窗体也会触发页面 `onHide`。

### onBackPress

- 返回 `true` 可阻止页面默认返回。
- 不可使用 `async`，否则无法阻止默认返回。
- iOS 侧滑返回不会触发 `onBackPress`。

## 生命周期流程

新页面创建时的典型顺序：

1. 根据 `pages.json` 创建页面，页面 style 最早生效。
2. 根据 template 创建首批静态 DOM；通过响应式数据再生成的列表不在首批。
3. 触发 `onLoad`，此时页面还未显示，真实 DOM 不存在。
4. 触发页面 `onShow`，发生在 `onLoad` 之后、转场动画开始后。
5. 触发 `onReady`，UI 层完成真实元素创建，可以操作 ref，首批界面已渲染。
6. 转场动画结束；`onReady` 和转场动画结束没有固定先后，取决于 DOM 数量和复杂度。

## 页面参数与页面作为组件

- HBuilderX 4.71+ 全平台支持通过 props 接收页面参数。
- 页面也可以作为组件渲染，常用于宽屏适配等场景，需要手动引入 `.uvue` 页面文件。
- 页面作为组件渲染时，页面特有生命周期不再对它自身生效，仅支持组件生命周期；页面组合式生命周期 API 监听到的是所在页面，而不是该组件化页面自身。
- 页面作为组件时建议用 props 传参，不要依赖 `onLoad`。
- 可通过 `this.$page.vm === this` 判断当前实例是作为页面渲染还是作为组件渲染。

## 关键点

- 仅 `.uvue` 可作为页面；script 仅支持 UTS。
- 页面即组件 + pages.json 注册 + 页面生命周期（onLoad、onShow、onReady 等）。
- 通过 props 接收页面参数（HBuilderX 4.71+）；页面也可作为组件嵌入（宽屏适配等）。

<!--
Source references:
- docs/page.md
- docs/readme.md
- docs/vue/README.md
-->
