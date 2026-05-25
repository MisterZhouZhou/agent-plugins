---
name: uts-native-hybrid
description: UTS 原生混编、Kotlin/Java/Swift/ArkTS/JS 混合、包名、原生代码验证、UTS 内置对象
---

# UTS 原生混编

## 定位

- UTS 插件的 `utssdk` 分平台目录支持直接放置 Kotlin、Java、Swift、ArkTS、JS 代码，并和 UTS 代码混合使用。
- UTS 插件入口仍然是 UTS 代码，但 UTS 代码可以直接调用插件目录中的原生函数和对象。
- UTS 本身会编译为 Kotlin、Swift 或 ArkTS，所以调用原生混编代码时本质是同一平台语言内部调用，没有跨语言序列化损耗。
- HBuilderX 真机运行时可整体联编 UTS 与 Kotlin / Swift / ArkTS 代码；Java 代码仍需云打包自定义基座后生效。
- 原生代码中也可以使用 `console.log` 输出到 HBuilderX 控制台。

## 适用场景

- 原生代码数量较多，手工翻译为 UTS 成本高。
- 遇到 UTS 暂不支持的语法或平台特性。
- 不想每次把代码封装为 aar / framework 后再接入调试。
- 需要复用已有 Kotlin、Swift、ArkTS、Java 或 JS 代码片段。

## 前置条件

- HBuilderX 4.25+。
- 已理解 UTS 插件基本结构和开发方式。
- 大段原生代码建议先在 Android Studio、Xcode、DevEco Studio 等原生 IDE 中验证，再放入 UTS 插件目录联调。
- 小代码片段可直接放入 UTS 插件目录，依靠 HBuilderX 本地编译和日志验证。

## Android 混编

- Kotlin / Java 存在包名概念；原生代码要能被 UTS 使用，包名必须正确。
- 推荐让混编代码包名与 UTS 插件默认包名保持一致，可减少手动 import。
- 如果原生代码包名与默认包名不同，需要在 UTS 中按原生对象方式 import。
- Kotlin 代码可直接参与标准基座真机运行。
- Java 代码需要云打包自定义基座后生效。

## iOS 混编

- Swift 代码可放在 `app-ios` 目录中，供 UTS 调用。
- Objective-C 源码不能直接混编为源码使用；需要封装为库后接入。
- iOS 原生依赖可通过 Frameworks、Libs、Resources、info.plist、UTS.entitlements、config.json 等目录或文件配置。

## HarmonyOS 混编

- HarmonyOS 原生 API 通过 ArkTS 调用。
- UTS 可编译为 ArkTS，因此 UTS 插件可调用 HarmonyOS 原生 API。
- 只有 UTS 插件支持混编 ets。

## 原生代码调用 UTS 内置对象

- 原生混编代码可调用 UTS 内置对象，但需手动导入对应平台类名。
- Android/Kotlin 中常见导入形如 `io.dcloud.uts.console`。
- 使用内置对象时要注意原生对象与 UTS 内置对象的转换。
- 如果需要在原生环境与 UTS / UVue 环境互传数据，建议转换为标准 UTS 内置对象后再传递。

## 实践建议

- 先用原生 IDE 验证大段平台代码，再迁入 UTS 插件目录。
- 保持混编包名、插件 ID、目录命名一致，减少 import 和路径问题。
- 平台专用代码只放在对应平台目录，避免污染共享实现。
- 对外接口仍由 `interface.uts` 统一声明，降低使用者感知成本。

<!--
Official sources:
- https://doc.dcloud.net.cn/uni-app-x/plugin/uts-plugin-hybrid.html
-->

