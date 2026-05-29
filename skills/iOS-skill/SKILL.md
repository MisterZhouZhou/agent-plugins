---
name: iOS-skill
description: iOS Swift 专项开发技能。用于构建、维护、迁移或排查 iOS 应用，覆盖 Swift、SwiftUI、UIKit、导航、async/await、Combine、URLSession、Core Data、SwiftData、Xcode 配置、签名、TestFlight、App Store 发布、测试、性能和 Apple 平台能力；详细文档按主题存放在 references/。
---

# iOS Skill

## 使用场景

当用户需要处理 iOS Swift 项目时使用本技能，尤其是：

- 新建或改造 SwiftUI 视图、UIKit ViewController、导航结构、表单、列表、详情页。
- 配置或排查 async/await、Combine、URLSession、数据解码、错误处理和取消逻辑。
- 使用 Core Data、SwiftData、UserDefaults、Keychain 或本地文件做持久化。
- 调整 Xcode project、Package.swift、签名、Capabilities、Info.plist、Entitlements、TestFlight 或 App Store 发布流程。
- 编写 XCTest、XCUITest、SwiftUI 预览、快照测试或排查真机/模拟器问题。
- 处理权限、推送通知、后台任务、Widget、深链、Universal Links 等 Apple 平台能力。

## 工作流

1. 先识别项目形态和最低系统版本：查看 `.xcodeproj`、`.xcworkspace`、`Package.swift`、`Podfile`、`project.yml`、`Info.plist`、deployment target 和入口 `App`/`SceneDelegate`。
2. 优先沿用项目已有模式：SwiftUI/UIKit 混用方式、架构分层、导航方案、依赖注入、网络层、持久化、测试工具和命名约定。
3. 根据任务读取最相关的引用文档，避免一次加载所有内容。
4. UI 改动遵守 Apple Human Interface Guidelines，并在动态字体、深色模式、安全区域、横竖屏、可访问性下保持可用。
5. 并发、网络、持久化和权限相关改动要显式处理错误、取消、主线程更新和用户授权状态。
6. 完成后运行项目已有的 build、test、lint、format 或 `xcodebuild` 命令；UI 改动尽量用模拟器或预览验证关键路径。

## 文档结构

详细文档按 `vue-skill` 的目录风格沉淀在 `references/`：

```text
references/
  apple-platform/
  concurrency-networking/
  persistence/
  swiftui/
  testing/
  uikit/
  xcode-release/
```

## 引用文档导航

先读对应子目录的 `overview.md`，再结合当前项目代码实现。

- SwiftUI 视图、状态、导航、列表、表单、预览、UIKit 互操作：读 [references/swiftui/overview.md](references/swiftui/overview.md)。
- UIKit ViewController、Auto Layout、UITableView/UICollectionView、导航、SwiftUI 嵌入：读 [references/uikit/overview.md](references/uikit/overview.md)。
- async/await、Task、MainActor、Combine、URLSession、Codable、取消和重试：读 [references/concurrency-networking/overview.md](references/concurrency-networking/overview.md)。
- SwiftData、Core Data、UserDefaults、Keychain、文件存储、迁移：读 [references/persistence/overview.md](references/persistence/overview.md)。
- Xcode 工程、Swift Package、签名、Capabilities、Info.plist、Archive、TestFlight、App Store：读 [references/xcode-release/overview.md](references/xcode-release/overview.md)。
- XCTest、XCUITest、异步测试、ViewModel 测试、预览和 CI：读 [references/testing/overview.md](references/testing/overview.md)。
- 权限、推送、后台任务、深链、Widget、App Intents、可访问性和隐私：读 [references/apple-platform/overview.md](references/apple-platform/overview.md)。

## 决策规则

- 新 SwiftUI 代码优先使用 `NavigationStack`、`@Observable`/`ObservableObject`、`@State`、`@Binding`、`@Environment` 等 SwiftUI 原生状态模型；旧项目保持已有 minimum OS 和状态方案。
- UI 状态更新必须在主线程语义下完成；ViewModel 暴露给 UI 时优先标注 `@MainActor`。
- UIKit 维护代码优先保持 MVC/MVVM、storyboard/xib 或纯代码布局的一致性，不为了现代化而大规模重写。
- 网络层要把 request 构造、transport、decoding、domain error 分清；不要在 View 里直接散落 URLSession 调用。
- 持久化选择从需求出发：简单偏好用 UserDefaults，敏感小数据用 Keychain，关系型/查询/同步数据用 SwiftData 或 Core Data，临时缓存用文件或 URLCache。
- 权限能力必须包含 Info.plist usage description、授权状态检查、拒绝后的 UI 路径和真机验证说明。
- 发布相关问题优先检查 bundle id、team、provisioning profile、entitlements、capabilities、build number、privacy manifest 和 App Store Connect 配置。
- 当参考仓库 `ios-swift` 的简要实践与 Apple 官方文档或当前项目约定冲突时，以当前项目约定和 Apple 官方要求为准。

## 常用核查

- Swift：值类型/引用类型边界清晰，避免强引用循环，闭包中按需使用 `[weak self]`。
- SwiftUI：避免把副作用放进 `body`；长耗时操作放进 `.task`、ViewModel 或服务层；预览提供稳定 mock 数据。
- 并发：处理取消、错误和重入；不要在非主线程修改 UI 可观察状态。
- UIKit：Auto Layout 约束完整，cell 复用状态重置，delegate/dataSource 生命周期不泄漏。
- 数据：schema 变更要考虑迁移；敏感信息不写入普通日志或 UserDefaults。
- 质量：优先运行 `xcodebuild test`、`xcodebuild build`、`swift test`、`swiftlint`、`swiftformat` 中项目已定义或显然适用的命令。
