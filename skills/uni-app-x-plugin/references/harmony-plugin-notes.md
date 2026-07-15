# HarmonyOS 插件开发要点

## 1. 什么时候必须专项考虑 HarmonyOS

出现以下任一情况就读取本文件：

- `app-harmony`
- `@ohos.*`
- `@kit.*`
- `ArkTS`
- `ohpm`
- `.har`
- `.ets`
- `module.json5`
- `resources`
- 权限声明
- `getContext` / `getHostContext`
- `overrides`

## 2. 基本判断

- `UTS` 会编译为 `ArkTS`
- `uni-app x` 页面虽然运行在 ArkTS 引擎环境，但完整原生能力和混编能力仍常通过 `uts` 插件承载
- 只有 `uts` 插件支持混编 `ets`
- 如果页面代码不能直接满足 `@kit` 库、多线程或完整 ets 能力，优先封装为 `uts` 插件

## 3. 类型与语法注意点

- `any` 在 ArkTS 侧不应当作为可随意扩散的类型依赖
- 无类型对象字面量要谨慎，尽量显式标注类型
- 写插件时优先显式接口、类型别名、返回类型
- 对象字面量不要依赖 TypeScript 式隐式结构推断；需要传入原生 API 时先定义 interface/type

## 4. `app-harmony/config.json`

典型用途：

- 配置 `ohpm` 依赖
- 引用本地 `.har`

示例形态：

```json
{
  "dependencies": {
    "@scope/pkg": "1.0.0",
    "local-sdk": "./libs/local-sdk.har"
  }
}
```

规则：

- `config.json` 不能有注释
- 本地相对路径相对于 `utssdk/app-harmony/config.json`
- `.har` 建议放在 `utssdk/app-harmony/libs/`

## 5. `module.json5`

适用场景：

- 声明权限
- 指定设备类型
- 绑定资源文案

常见字段：

- `module.name`
- `module.type`，固定 `har`
- `module.deviceTypes`
- `module.requestPermissions`

权限原因文案可引用 `resources` 中的字符串资源。

模块名规则：

- 对 `uni-getBatteryInfo` 这样的插件，`packageName` 形如 `@uni_modules/uni-getbatteryinfo`
- `moduleName` 在 `packageName` 基础上生成：移除 `@`，把 `/` 替换成两个下划线，把 `-` 替换成一个下划线
- 示例：`uni-getBatteryInfo` 的 `moduleName` 为 `uni_modules__uni_getbatteryinfo`

## 6. `resources`

放置位置：

- `utssdk/app-harmony/resources/`

适合放：

- 字符串
- 图片
- 字体
- 权限说明文案关联资源

## 7. 特殊文件拷贝心智模型

插件编译到鸿蒙端后，会被当成一个鸿蒙 module 处理。开发时可以默认认为以下文件会被带入对应 module：

- `utssdk/app-harmony/module.json5`
- `utssdk/app-harmony/resources/`
- `utssdk/app-harmony/*.ets`
- `utssdk/app-harmony/libs/*.har`

## 8. `.ets` 文件

- `utssdk/app-harmony/*.ets` 会原样拷贝到产物内
- 需要 ArkUI 声明式界面或复杂 ArkTS 原生能力时，可以在 `.ets` 文件中写，再从 `index.uts` 引用
- 不要把 `.ets` 当作跨平台文件；它属于 `app-harmony` 平台实现

## 9. Context 获取

- 新代码避免继续依赖已废弃的 `getContext`
- 需要上下文时，优先确认当前 API 版本是否应使用 `UIContext` 的 `getHostContext`
- 如果参考旧示例用了 `getContext()`，实现前先按当前 HarmonyOS API 版本复核

## 10. overrides 限制

- 鸿蒙工程中的 `overrides` 只能在根目录 `oh-package` 生效
- UTS 插件通过 `config.json` 配置出来的依赖不是根目录依赖，`overrides` 不会在插件内直接生效
- 需要 overrides 时，通常要改项目侧 `harmony-configs/oh-package`，不要只改插件内 `config.json`

## 11. 编码偏好

- 平台导入写在 `app-harmony/index.uts`
- 不把 HarmonyOS 专属导入泄漏到跨平台根入口
- 需要权限时，把权限声明、权限请求、失败返回三件事一起补齐
