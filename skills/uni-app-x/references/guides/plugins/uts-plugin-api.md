---
name: uts-plugin-api
description: UTS 插件基础、API 插件、目录结构、interface.uts、平台目录、原生资源配置
---

# UTS 插件基础

## 定位

- UTS 插件使用 UTS 语法操作系统 API 或三方 SDK，并封装为 `uni_modules` 插件供前端调用。
- UTS 插件可同时支持 uni-app 和 uni-app x。
- UTS 插件可分平台编写代码，除 App 外也可支持 Web 和小程序。
- UTS 插件分为 API 插件和组件插件：
  - API 插件扩展 script 中调用的能力。
  - 组件插件扩展 template 中使用的 UI 组件能力。
- API 插件也可以操作 UI，但通常是全屏窗口、弹窗或独立页面，不适合嵌入 template 文档流。

## 与 App 原生语言插件 / Native.js 的区别

- UTS 插件在 App 平台最终编译为原生二进制代码，能力上相当于旧版 App 原生语言插件。
- UTS 插件用统一的 UTS 语言开发，减少 Java / Objective-C / Swift / Kotlin 多语言封装成本。
- UTS 插件可被普通函数或对象 import 调用，支持摇树优化。
- UTS 插件同时支持 uni-app 和 uni-app x，且插件市场支持源码版销售和源码保护。
- Native.js 运行在 JS 层，通过反射调用系统 API；UTS 在 App 上不运行在 JS 引擎中，是真正原生执行。
- 新增 App 原生语言插件已停止维护，插件作者应优先使用 UTS 插件。

## 创建方式

- 目前 UTS 插件主要通过 HBuilderX 创建和使用，不适合按普通 CLI/npm 包方式直接接入。
- 推荐使用 `uni_modules` 管理插件；先确保项目根目录存在 `uni_modules`。
- 在 HBuilderX 中右键 `uni_modules`，选择新建插件，类型选择 UTS 插件。
- 插件名称建议带自己的前缀，避免与插件市场其他插件冲突。

## 典型目录结构

```text
uni_modules/
└─ plugin-id/
   ├─ static/
   ├─ utssdk/
   │  ├─ app-android/
   │  │  ├─ assets/
   │  │  ├─ libs/
   │  │  ├─ res/
   │  │  ├─ AndroidManifest.xml
   │  │  ├─ config.json
   │  │  ├─ hybrid.kt
   │  │  └─ index.uts
   │  ├─ app-ios/
   │  │  ├─ Frameworks/
   │  │  ├─ Libs/
   │  │  ├─ Resources/
   │  │  ├─ EmbedResources/
   │  │  ├─ info.plist
   │  │  ├─ UTS.entitlements
   │  │  ├─ config.json
   │  │  ├─ hybrid.swift
   │  │  └─ index.uts
   │  ├─ app-harmony/
   │  ├─ web/
   │  ├─ mp-weixin/
   │  ├─ interface.uts
   │  ├─ unierror.uts
   │  └─ index.uts
   └─ package.json
```

## 入口与分平台优先级

- 根目录 `index.uts` 是跨平台插件入口，可选。
- 如果指定平台目录下存在 `index.uts`，优先使用具体平台目录的实现。
- 如果某平台没有自己的 `index.uts`，会回退使用根目录 `index.uts`。
- 常见组织方式：
  - 根目录 `index.uts` 写条件编译，适合简单业务。
  - 根目录 `index.uts` 写条件编译并 import 分平台文件。
  - 不写根目录 `index.uts`，直接在分平台目录写实现，适合只做单平台插件。

## interface.uts

- `interface.uts` 是插件对外暴露能力的声明入口，通常是必需文件。
- `interface.uts` 与 `index.uts` 的关系是“声明”和“实现”。
- 在 `interface.uts` 声明的类型和 API 可被 HBuilderX 识别，用于语法提示和类型校验。

## Android 原生配置

- `app-android/assets`：插件内置 Android assets 资源。
- `app-android/libs`：Android 三方 jar、aar、so。
- `app-android/res`：插件内置 Android res 资源。
- `app-android/AndroidManifest.xml`：插件内置 Android 清单配置。
- `app-android/config.json`：Android 原生层配置，可配置 Gradle 依赖仓储、NDK ABI、minSdkVersion、project plugins/dependencies 等。
- 插件内置资源和需要使用者配置的项目资源应区分；需要使用者配置的内容应写入插件文档，而不是直接放在插件目录中。
- 多个 UTS 插件引用相同原生 SDK 时可能冲突；如果 SDK 支持仓储，优先用仓储配置，少直接塞 jar/aar。

## iOS 原生配置

- `app-ios/Frameworks`：iOS 第三方 framework。
- `app-ios/Libs`：iOS `.a` 静态库。
- `app-ios/Resources`：合并到 App Main Bundle 的资源。
- `app-ios/EmbedResources`：合并到插件动态库 Framework Bundle 的资源。
- `app-ios/info.plist`：需要添加到主工程 Info.plist 的配置。
- `app-ios/UTS.entitlements`：需要添加到主工程 entitlements 的配置。
- `app-ios/config.json`：iOS 原生配置。
- `hybrid.swift` 可用于 iOS 原生混编。

## package.json

- `package.json` 是 `uni_modules` 插件清单文件，描述插件基本配置。
- 基础字段通常包括 `id`、`displayName`、`version`、`description`、`uni_modules`。
- 更完整的插件市场、平台兼容性和付费配置见 `references/guides/plugins/plugin-ecosystem.md`。

<!--
Official sources:
- https://doc.dcloud.net.cn/uni-app-x/plugin/uts-plugin.html
-->

