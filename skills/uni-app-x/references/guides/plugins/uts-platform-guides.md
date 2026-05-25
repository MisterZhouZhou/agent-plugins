---
name: uts-platform-guides
description: Android/iOS/HarmonyOS UTS 插件开发要点、平台类型差异、CocoaPods/SPM 依赖
---

# UTS 平台开发要点

## Android

- 面向 Android 开发者的 UTS 插件开发，需要具备 Android 原生应用开发经验。
- HBuilderX 4.81 起 Kotlin 统一升级为 2.2.0。
- 编译时保存 UTS 源码后，IDE 会同步编译为 Kotlin 代码。
- 运行时，编译后的 Kotlin 源码会作为 APK 的一部分参与真机运行或云打包。
- UTS 语法与 Kotlin 较相似；掌握 Kotlin 有助于排查问题和实现复杂能力。
- 数据类型原则上以 UTS 内置类型为准，平台会自动适配。
- 当 Android API 明确要求具体原生类型时，应使用对方要求的类型，例如重写系统方法时使用 `Int`。

## iOS

- 面向 iOS 开发者的 UTS 插件开发，需要具备 iOS 原生应用开发经验。
- 保存 UTS 源码后，IDE 会同步编译为 Swift 代码，并生成插件 Framework 工程和对应 framework 依赖库。
- 真机运行或云打包时，framework 会被加入打包工程，生成最终 IPA。
- UTS 语法与 Swift 较类似；掌握 Swift 有助于排查问题和实现复杂能力。
- UTS 中没有 `Int`、`Float`、`Double` 类型时，通常用 `Number` 覆盖 iOS 平台数值场景。
- 当系统方法或第三方协议明确要求 `Int` 等原生类型时，应按原生 API 类型声明。
- Objective-C 代码需要封装为库后使用，不适合直接写 OC 源码混编。

## HarmonyOS

- HarmonyOS 原生 API 通过 ArkTS 调用，UTS 可编译为 ArkTS。
- UTS 插件编译到 HarmonyOS 端时会变成 ArkTS 代码，应同时遵循 UTS 和 ArkTS 规范。
- uni-app 普通页面编译为 JS，无法直接调用 HarmonyOS 原生 API；需封装为 UTS 插件。
- uni-app x 页面和 UTS 插件都运行在 ArkTS 引擎下，但页面中目前不具备完整 ets 能力。
- 需要调用 `@kit` 库、多线程能力或混编 ets 时，应放到 UTS 插件中。
- ArkTS 不允许 `any` 类型；UTS 编译到 ArkTS 时会将 `any` 转为 `Object`。
- ArkTS 不允许无类型对象字面量；需要时显式声明类型或转为 `UTSJSONObject`。

## CocoaPods 依赖

- UTS 插件中使用 CocoaPods 依赖需要 HBuilderX 3.8.5+。
- 在 iOS 平台 `config.json` 中通过 `dependencies-pods` 配置 pod 依赖。
- 可通过 `deploymentTarget` 配置插件支持的最低 iOS 版本。
- HBuilderX 4.61+ 支持 `dependencies-pod-sources` 指定 specs source。
- HBuilderX 3.8.10+ 支持 `repo` 指定 pod 库 git、tag、branch、commit 等仓库信息。
- 若同时配置 `source` 和 `repo`，以 `repo` 为准。
- Mac 标准基座真机运行需要本机配置 CocoaPods；自定义调试基座云端打包可不配置本地 CocoaPods。
- Windows 不支持 CocoaPods 环境，只能提交云端打包使用自定义调试基座。

## CocoaPods 环境排查

- 正常安装：`gem install cocoapods`。
- 安装后用 `pod --version` 或 `which pod` 验证。
- 如果 pod 搜索失败，通常与 GitHub/CDN 网络或 specs 源有关。
- Ruby 或 Gem 版本过低会导致安装失败，可升级 Gem / Ruby 后重新安装。
- 如果已安装 CocoaPods 但 HBuilderX 仍提示未安装，可能是编译插件未识别到 pod 路径，常见处理是用 RVM 管理 Ruby 后重新安装 CocoaPods。

## Swift Package Manager 依赖

- UTS 插件中使用 Swift Package Manager 依赖需要 HBuilderX 5.0+。
- 在 iOS 平台 `config.json` 中通过 `dependencies-spms` 配置 SPM 依赖。
- `deploymentTarget` 可配置插件支持的最低 iOS 版本，默认 `12.0`。
- `deploymentTarget` 应满足所有依赖库的最低版本要求；同时使用 CocoaPods 和 SPM 时，取所有依赖最低支持 iOS 版本中的最高值。
- Xcode 默认支持 Swift Package Manager，不需要像 CocoaPods 一样单独配置环境。
- GitHub、GitLab、Bitbucket 等国外代码托管服务访问较慢或受限时，下载 SPM 依赖可能需要网络代理。

`dependencies-spms` 基本字段：

| 字段 | 类型 | 必需 | 说明 |
| --- | --- | --- | --- |
| `name` | String | 是 | SPM 库的产品名称，对应 `Package.swift` 中 `products` 数组里的 library name；不是包名。 |
| `url` | String | 是 | SPM 库的 Git 仓库地址。 |
| `kind` | String | 是 | 依赖类型，支持 `exactVersion`、`upToNextMajorVersion`、`upToNextMinorVersion`、`versionRange`、`branch`、`revision`。 |

`name` 字段配置错误会导致 UTS 插件编译失败。应查看三方库根目录的 `Package.swift`，取 `products` 数组中 `.library(name: ...)` 的产品名，而不是 `Package(name: ...)` 的包名。

常见 `kind`：

| kind | 版本字段 | 说明 |
| --- | --- | --- |
| `exactVersion` | `version` | 精确版本匹配。 |
| `upToNextMajorVersion` | `minimumVersion` | 从最低版本起，到下一个主版本前；最常用。 |
| `upToNextMinorVersion` | `minimumVersion` | 从最低版本起，到下一个次版本前。 |
| `versionRange` | `minimumVersion`、`maximumVersion` | 指定版本区间。 |
| `branch` | `branch` | 跟踪指定分支。 |
| `revision` | `revision` | 锁定指定提交。 |

示例：

```json
{
  "deploymentTarget": "12.0",
  "dependencies-spms": [
    {
      "name": "Alamofire",
      "url": "https://github.com/Alamofire/Alamofire.git",
      "kind": "upToNextMajorVersion",
      "minimumVersion": "5.7.1"
    }
  ]
}
```

<!--
Official sources:
- https://doc.dcloud.net.cn/uni-app-x/plugin/uts-for-android.html
- https://doc.dcloud.net.cn/uni-app-x/plugin/uts-for-ios.html
- https://doc.dcloud.net.cn/uni-app-x/plugin/uts-for-harmony.html
- https://doc.dcloud.net.cn/uni-app-x/plugin/uts-ios-cocoapods.html
- https://doc.dcloud.net.cn/uni-app-x/plugin/uts-ios-spms.html
-->
