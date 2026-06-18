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

## 12. 系统打印专项经验

在 `uni-app x` 的 `UTS` 插件中封装 HarmonyOS 系统打印时，优先采用以下已验证组合：

```uts
import print from '@ohos.print'
import fileUri from '@ohos.file.fileuri'
import fs from '@ohos.file.fs'
```

不要直接照搬官方 ArkTS 示例中的：

```ts
import { print } from '@kit.BasicServicesKit'
import { fileUri } from '@kit.CoreFileKit'
```

在 `uni-app x` UTS 插件编译链中，`@kit.BasicServicesKit` 可能被映射成 `@ohos:BasicServicesKit`，运行时报 `does not provide an export name 'print'`。HBuilderX 类型声明中 `@kit.BasicServicesKit` 实际也是从 `@ohos.print` 聚合导出；插件内直接用底层默认导入更稳。

### 12.1 调用形态

在 Stage 模型和 uni-app x 插件环境里，打印调用使用：

```uts
const context = UTSHarmony.getUIAbilityContext()
print.print(files, context)
```

虽然官方最简示例常写 `print.print(files)`，但 HBuilderX 自带类型声明支持 `print(files, context): Promise<PrintTask>`。实测在插件环境中，单参数版本可能触发 `401` 参数错误；带 `UIAbilityContext` 后能调起系统打印面板。

### 12.2 文件路径处理

`uni.chooseFile` 在 HarmonyOS 上通过文档选择器返回的路径可能是：

```text
file://docs/storage/Users/currentUser/Download/xxx.pdf
```

这个 URI 能被 `fs.openSync(uri, fs.OpenMode.READ_ONLY)` 读取，但直接交给打印服务可能出现 `401` 或系统面板提示 `文件格式不支持`。稳妥做法：

1. 用 `fs.openSync` 打开选择器返回的外部 URI。
2. 复制到应用沙箱 `UTSHarmony.getUIAbilityContext().filesDir + '/<plugin-cache-dir>'`。
3. 用 `fileUri.getUriFromPath(cachedFilePath)` 生成打印 URI。
4. 调用 `print.print([printUri], UTSHarmony.getUIAbilityContext())`。

不要在插件里导入 `@dcloudio/uni-app-framework` 来取 `getEnv()`；普通插件侧可能报 `Could not resolve "@dcloudio/uni-app-framework"`。直接从 `UTSHarmony.getUIAbilityContext()` 取 `filesDir` / `tempDir`。

### 12.3 权限处理

`ohos.permission.PRINT` 需要进入最终 `entry` 模块的 `requestPermissions`。只写在插件自身 `utssdk/app-harmony/module.json5` 里，可能不会合并到最终主工程，运行时报 `201`。

处理方式：

- 插件侧 `utssdk/app-harmony/module.json5` 仍声明：

```json
{
  "name": "ohos.permission.PRINT"
}
```

- 如果最终产物 `unpackage/dist/dev/app-harmony/entry/src/main/module.json5` 里没有 `ohos.permission.PRINT`，在项目侧补 `harmony-configs/entry/src/main/module.json5`，确保 entry 的 `requestPermissions` 包含它。
- `PRINT` 不按 `READ_PASTEBOARD` 这类用户授权权限处理。不要调用 `UTSHarmony.requestSystemPermission(['ohos.permission.PRINT'], ...)`，否则可能直接得到 denied。
- 如果最终 entry 已有 `ohos.permission.PRINT` 但仍报 `201`，继续检查签名 profile/ACL 是否允许该权限。

不要用 `uni-clipboard` 的权限模式直接类推系统打印。`uni-clipboard` 的 `READ_PASTEBOARD` 是用户授权权限，插件侧 `module.json5` 会带 `reason` / `usedScene`，代码里还会调用 `UTSHarmony.requestSystemPermission(['ohos.permission.READ_PASTEBOARD'], ...)` 触发授权流程。`PRINT` 在当前 uni-app x HarmonyOS 打包与运行环境里更依赖主应用 `entry` 的能力声明；插件自身 `har module` 的 `requestPermissions` 不等于最终宿主 `entry` 已具备该权限。排查时必须检查最终产物 `entry/src/main/module.json5`，不要只检查 `uni_modules/<plugin>/utssdk/app-harmony/module.json5`。

### 12.4 常见错误判断

- `@ohos:BasicServicesKit does not provide an export name 'print'`
  - 改为 `import print from '@ohos.print'`
- `201`
  - 权限未进入最终 entry，或签名 profile/ACL 未授权
- `401`
  - 打印 API 参数形态不对；优先检查是否用 `print.print(files, UIAbilityContext)`，以及 `files` 是否为 `fileUri.getUriFromPath(cachedFilePath)` 后的 URI
- 系统打印面板显示 `文件格式不支持`
  - 文件内容已进入打印服务，但 URI/文件类型识别失败；优先把外部 URI 复制到 app `filesDir`，保留 `.pdf` 后缀，再用 `fileUri.getUriFromPath`
