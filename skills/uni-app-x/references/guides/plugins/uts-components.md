---
name: uts-components
description: UTS 组件、标准模式组件、uni-app 兼容模式组件、native-view、组件 props/events/methods
---

# UTS 组件

## 组件与 API 的区别

- UTS 组件是 UTS 插件的一个分支，用于封装原生 UI 组件。
- 组件以标签形式对外提供 UI，可在页面 template 中使用，嵌入页面成为一个区域。
- API 可以无 UI，也可以有 UI；涉及 UI 时通常是全屏界面或弹窗，不嵌入页面文档流。
- 组件适合封装非全屏 UI；全屏界面更适合用 API 弹出 Activity / ViewController，但要处理好与 UniPage 页面栈的关系。
- 一个 UTS 组件作为一个 `uni_modules`，可同时支持 App Android、App iOS、App HarmonyOS、Web 和小程序组件。

## 两种开发模式

| 模式 | 支持平台 | 组件规范 | 是否使用 native-view | 建议 |
| --- | --- | --- | --- | --- |
| 标准模式 | 仅 uni-app x；App/Web/小程序全平台方向 | 完全 Vue 组件规范，标准 easycom | 是 | 推荐优先使用 |
| uni-app 兼容模式 | uni-app app-nvue 与 uni-app x app-uvue；不支持 HarmonyOS | 类 Vue 的子集和扩展，不支持组合式 API | 否 | 只在需要兼容 uni-app app-nvue 且无法用 Web 组件实现时使用 |

## 标准模式组件

- HBuilderX 4.31+ 支持 App Android、App iOS；HBuilderX 4.61+ 支持 App HarmonyOS。
- 标准模式用于把 App 平台原生 view 封装成 uni-app x 可在 uvue template 中调用的 UTS 组件。
- 核心思路：将平台原生 view 关联到内置 `native-view` 组件。
- `native-view` 作为占位 view 参与页面排版布局。
- 在 UTS 插件中可通过 `uni.getElementById` 获取 `native-view` 的 `UniElement`，再通过 `getAndroidView` / `getIOSView` 等方法获取原生 view。
- 拿到原生 view 后，可用 UTS 或原生混编代码操作它，比如地图、摄像头、原生按钮等。
- 对外封装属性、方法、事件时，按标准 Vue 组件写法，把 `native-view` 包在一个符合 easycom 的 `.uvue` 组件中。

## 标准模式目录结构

```text
uni_modules/
└─ native-button/
   ├─ components/
   │  └─ native-button/
   │     └─ native-button.uvue
   ├─ static/
   ├─ utssdk/
   │  ├─ app-android/
   │  ├─ app-ios/
   │  ├─ app-harmony/
   │  ├─ web/
   │  └─ interface.uts
   └─ package.json
```

## 标准模式实现要点

- HBuilderX 新建分类选择“UTS 插件-标准模式组件”后会生成模板文件。
- 组件入口是 `components/<name>/<name>.uvue`，是标准 uvue 组件，符合 easycom 规范。
- 在 `<template>` 中放置 `<native-view @init="...">`。
- `native-view` 初始化触发 `@init`，回调中可拿到 `UniNativeViewElement`。
- 在组件中 import 插件根目录导出的原生对象，把 `UniNativeViewElement` 传给该对象完成绑定。
- 组件方法中通常继续调用原生对象方法，例如 `button?.updateText(value)`。
- props 更新时，按 Vue 规范监听并驱动原生 view 更新。
- 事件暴露按 Vue 组件事件写法处理，再由原生对象回调触发组件事件。

## uni-app 兼容模式组件

- HBuilderX 3.6.18+ 支持，App HarmonyOS 不支持。
- 兼容模式用于在 App Android / App iOS 上把原生 UI 封装为兼容 uni-app 项目的 UTS 组件。
- 使用者可在 nvue / uvue 页面 template 中以组件方式调用。
- 目录结构与普通 UTS 插件基本相同，但组件入口文件有两个：
  - 必选 `index.vue`：组件入口。
  - 可选 `index.uts`：函数能力入口。
- 大多数情况下只需要开发 `index.vue`；如果同时有与组件无关的能力要暴露，可放到 `index.uts`。
- 兼容模式组件目前仅支持 `export default {}` 选项式 API，不支持 Vue 3 组合式 API。

## 兼容模式生命周期与暴露

- `expose` 可控制哪些 data 或 methods 对外暴露；如果未配置 expose，methods 中方法默认对外暴露。
- `created()`：组件创建时触发，可做初始化。
- `NVBeforeLoad()`：原生 view 载体创建前触发。
- `NVLoad()`：必须实现，用于创建并返回原生 View，且必须声明返回值类型。
- `NVLoaded()`：原生 View 创建完成后触发。

## 选择建议

- 新的 uni-app x 组件优先使用标准模式。
- 需要 HarmonyOS 支持时，不要选择 uni-app 兼容模式。
- 需要兼容老的 uni-app app-nvue，且原生组件无法用 Web 实现时，才考虑兼容模式。
- 只封装全屏 UI 时，优先考虑 API 插件而不是组件插件。

<!--
Official sources:
- https://doc.dcloud.net.cn/uni-app-x/plugin/uts-component.html
- https://doc.dcloud.net.cn/uni-app-x/plugin/uts-component-vue.html
- https://doc.dcloud.net.cn/uni-app-x/plugin/uts-component-compatible.html
-->

