# Safari Web Extension 工作流

## 适用范围

用于处理以下任务：

- 新建 Safari Web Extension
- 修改 Safari Web Extension 的 popup、manifest、storage、tabs、scripting 逻辑
- 将标准 Web 扩展转为 Xcode 工程
- 调试 Safari Web Extension 与 Safari Web 检查器相关的边界问题

## 标准执行顺序

## 1. 先判断真实运行目标

优先分清用户面对的是哪一种对象：

1. 普通 Safari 标签页
2. 本机 `file:///` 页面
3. iOS 真机上的 Safari 页面
4. Mac 上的 Safari Web 检查器窗口
5. iOS App 内嵌 `WKWebView` 的远程调试目标

如果是 4 或 5，必须先说明限制：

- 扩展无法直接控制 Web 检查器窗口
- 扩展无法直接读取远程调试目标 URL

## 2. 先维护 Web 源码，再考虑 Xcode 工程

始终优先修改 Web 端标准资源：

- `manifest.json`
- popup 页面
- 后台脚本或内容脚本
- icon 资源

不要一开始就把逻辑直接写进原生壳代码。

## 3. 对 URL 处理逻辑进行场景分支

### http/https

只替换域名部分，保留：

- path
- query
- hash

### file:///

不要机械保留本地文件路径。  
要根据真实业务判断：

- 是保留 hash 路由
- 还是需要把文件页映射到固定入口

对真机调试类需求，通常应：

- 丢弃本地文件路径
- 保留 `#...` 路由

## 4. 对 Safari 的权限和能力做保守设计

常用权限：

- `activeTab`
- `tabs`
- `storage`
- `scripting`

读取当前页 URL 时：

1. 先尝试 `tabs.query`
2. 再尝试 `scripting.executeScript(() => window.location.href)`

## 5. 对剪贴板交互做兜底

在 Safari popup 中：

- 不要假设 `navigator.clipboard.writeText()` 一定成功
- 不要把生成和复制放进同一条长异步链路

推荐交互：

1. 点击“生成”
2. 展示结果
3. 点击“复制”
4. 失败时自动选中文本

## 6. 再决定是否需要 Xcode converter

仅在以下场景使用 converter：

- 初始化工程
- 明确要生成一个全新的原生壳

不要在已有大量原生改动的工程上直接重复执行 converter。

## 建议输出物

交付时优先给用户以下内容：

1. `WebExtensionSource` 源码
2. `xcrun safari-web-extension-converter` 命令
3. Xcode 签名与运行步骤
4. Safari 中启用扩展的路径
5. 如果涉及远程调试，再补充能力边界说明

