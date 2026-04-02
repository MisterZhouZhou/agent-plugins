# Safari Web Extension 常见坑

## 1. 把 Web 检查器当作普通页面处理

错误认知：

- 认为扩展可以直接拿到 Safari Web 检查器当前调试目标的 URL
- 认为扩展可以直接修改 Web 检查器窗口中的地址

正确理解：

- 扩展运行于页面或浏览器环境
- Web 检查器是调试工具界面，不在常规 Web Extension API 控制范围内

## 2. 把 `file:///` 当成普通域名替换

错误做法：

```text
file:///var/mobile/.../index.html#/a
=> http://localhost:8080/var/mobile/.../index.html#/a
```

更合理的做法通常是：

```text
file:///var/mobile/.../index.html#/a
=> http://localhost:8080/#/a
```

## 3. 自动复制长期不稳定

典型原因：

- Safari popup 限制剪贴板能力
- 用户手势在多次 `await` 后丢失
- 旧式 `execCommand('copy')` 不可靠

更稳妥的设计：

- 生成与复制分离
- 文本框始终可见
- 失败时选中文本并提示手动复制

## 4. 重跑 converter 覆盖原生工程

不要默认认为以下操作是安全增量：

```bash
xcrun safari-web-extension-converter ./WebExtensionSource
```

在已有原生修改的情况下，更稳的做法是：

- 初始化时执行一次 converter
- 之后手动同步资源
- 或生成到新目录再比对合并

## 5. 改了 Web 源码但没同步到 Xcode

常见现象：

- Safari 中仍显示旧 UI
- manifest 权限似乎没生效
- 新图标未显示

常见原因：

- 当前运行的仍是 Xcode 工程中的旧资源
- 没重新运行宿主 App
- 没重新启用更新后的扩展

## 6. 只声明 manifest，不准备真实 icon 文件

Safari 扩展图标要同时满足：

1. `manifest.json` 中声明 `icons`
2. 实际 PNG 文件存在
3. 资源被打进扩展

仅修改 manifest 通常不够。

