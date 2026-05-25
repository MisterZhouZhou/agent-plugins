---
name: core-app
description: App.uvue 应用入口、应用生命周期、globalData、全局样式
---

# App.uvue

## 作用

`App.uvue` 是应用入口主组件，所有页面在其下切换。**没有 `<template>`**，不能写视图，仅用于：

1. 监听**应用生命周期**
2. 配置 **globalData** 全局变量
3. 编写全局可用的 **method**
4. 配置**全局样式**

应用生命周期**仅能在 App.uvue 中监听**，在页面中监听无效。

## 写法

- **仅支持选项式**，暂不支持组合式。
- `App.uvue` 本身不是页面，不能编写视图元素，也不应包含 `<template>`。
- `<style>` 中定义的全局 class 可在每个页面直接使用。

## 应用生命周期

| 生命周期 | 说明 | 平台要点 |
|----------|------|----------|
| **onLaunch(options)** | 应用初始化完成时触发，全局只触发一次。 | Web 4.0+、微信小程序 4.41+、Android 3.9+、iOS 4.0+、HarmonyOS 4.61+。 |
| **onShow(options)** | 应用启动，或从后台进入前台显示时触发。 | Web 4.0+、微信小程序 4.41+、Android 3.9+、iOS 4.0+、HarmonyOS 4.61+。 |
| **onHide()** | 应用从前台进入后台时触发。 | Web 4.0+、微信小程序 4.41+、Android 3.9+、iOS 4.0+、HarmonyOS 4.61+。 |
| **onExit()** | 监听应用退出。 | Android 3.9+、HarmonyOS 4.72+。 |
| **onError(error)** | 应用发生脚本错误或 API 调用报错时触发。 | Web 4.0+、微信小程序 4.41+、Android/iOS 4.21+、HarmonyOS 4.61+。 |
| **onLastPageBackPress()** | 最后一个页面按下 Android back 键，常用于自定义退出。 | Android 3.9+、HarmonyOS 4.71+。 |
| **onPageNotFound(options)** | 应用要打开的页面不存在时触发。 | Web 4.0+、微信小程序 4.41+。 |
| **onUnhandledRejection()** | 未处理的 Promise 拒绝事件监听函数。 | Web 4.0+、微信小程序 4.41+。 |
| **onThemeChange()** | 监听系统主题变化。 | 微信小程序 4.41+；主题变化更推荐使用 uni API。 |

### onLaunch

- `onLaunch` 在应用初始化完成时触发，全局只触发一次。
- `options.path` 是应用启动页面路径。
- `options.appScheme` 和 `options.appLink` 可用于获取首次启动时的 scheme 或 applink。
- scheme 或 applink 需在 AndroidManifest.xml 或 info.plist 中配置，并在打包后生效。

### onShow

- `onShow` 在应用启动，或从后台进入前台显示时触发。
- `options.path` 是应用启动页面路径。
- `options.appScheme` 和 `options.appLink` 可获取本次启动或后台激活到前台时的 scheme/applink。
- App 页面直达通常在 `App.onShow` 中解析 scheme/applink 参数，然后自行使用 `navigateTo` 等路由 API 跳转。初次启动时仍会先打开 App 首页，再执行开发者路由代码。
- Web 页面直达无需 scheme 或通用链接，页面地址可直接在浏览器地址栏访问。
- 微信小程序下，关闭部分弹出的原生窗体也会触发应用 `onShow`，如 chooseImage、chooseVideo、chooseMedia、previewImage、chooseLocation、openLocation、scanCode 等。

### onHide

- `onHide` 在应用从前台进入后台时触发。
- 微信小程序下，打开全屏原生窗体也会触发应用 `onHide`，如 chooseImage、chooseVideo、chooseMedia、previewImage、chooseLocation、openLocation、scanCode 等。

### onError

- `onError` 可监听组件渲染器、事件处理器、生命周期钩子、setup 函数、侦听器中的同步错误。
- 4.33+ App 端支持监听异步逻辑中的错误。
- 无法监听应用初始化之前的错误、App 崩溃等错误；部分异步错误也不保证被捕获。

### onPageNotFound

- 未添加 `onPageNotFound` 时，跳转不存在页面会进入平台默认的页面不存在提示。
- 如果 `onPageNotFound` 回调中又重定向到另一个不存在页面，不会再次回调 `onPageNotFound`。
- `options.path` 为不存在页面路径，`options.query` 为 query 参数，`options.isEntryPage` 表示是否本次启动的首个页面。

### onExit 与热退出

- Android 的 `uni.exit()` 是热退出，很多代码逻辑仍可能运行。
- 如果在 `onLaunch` 中注册了事件监听，应在 `onExit` 中取消监听，否则反复热退出和启动可能出现多次监听和内存泄露。

## globalData

在 `App.uvue` 的 `globalData` 中定义的数据，可在任意页面或组件通过 `getApp().globalData` 读写。注意：修改后界面不会自动更新，若需响应式可配合专用 store 模块（见 [features-global-state](features-global-state.md)）。

选项式示例：

```ts
<script lang="uts">
export default {
  globalData: {
    str: 'global data str',
    num: 123,
    bool: true
  }
}
</script>
```

页面或组件中访问：

```ts
const app = getApp()
const str = app.globalData.str
```

注意：

- `globalData` 的数据结构和类型由 `App.uvue` 中的初始值定义，后续只能读取或修改，不能新增或删除字段。
- 在组合式写法中通过 `defineOptions({ globalData: ... })` 定义时，不能像选项式那样通过 `this.globalData` 访问，需要使用 `getApp().globalData`。
- 部分生命周期中 App 实例尚未初始化，访问 `getApp().globalData` 时要注意时机。

## 全局方法

在 `App.uvue` 的 `methods` 中可定义全局方法，项目中通过 `getApp().vm?.methodName()` 调用。

```ts
<script lang="uts">
export default {
  methods: {
    increaseLifeCycleNum() {
      // ...
    }
  }
}
</script>
```

调用：

```ts
getApp().vm?.increaseLifeCycleNum()
```

HBuilderX 4.31 起，`getApp()` 返回值调整为 `UniApp` 类型，调用 `App.uvue` 中定义的全局方法，应从旧写法 `getApp().methodName()` 调整为 `getApp().vm?.methodName()`。

## 全局样式

在 `App.uvue` 的 `<style>` 中可定义全局通用样式，页面可直接使用这些 class。

## 注意

- 最早在 **onLaunch** 里做初始化、拉取配置、打开 dialogPage 等；**不要在 main.uts 中**调用 openDialogPage 等依赖页面的 API。
- 应用生命周期仅可在 `App.uvue` 中监听，在其他页面监听无效。
- 应用启动参数也可以通过 `uni.getLaunchOptionsSync()` 获取。

<!--
Source references:
- docs/collocation/app.md
- docs/readme.md
-->
