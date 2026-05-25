---
name: plugin-ecosystem
description: uni-app x 插件生态、插件市场、uni_modules、付费插件、插件安装更新发布
---

# 插件生态与插件市场

## 插件生态

- uni-app x 使用开放、兼容的插件系统，官方插件生态集中在 DCloud 插件市场：https://ext.dcloud.net.cn/
- 插件市场支持前端组件、UTS SDK、页面模板、项目模板、UTS 插件等类型。
- 优先从 DCloud 官方插件市场寻找插件；npm 等三方市场通常缺少 uni-app / uni-app x 兼容性描述，容易下载到仅适配 Web、无法跨平台的包。
- 在插件市场搜索栏下方勾选 uni-app x checkbox，可浏览适配 uni-app x 的插件。
- UTS 插件分类适合封装原生能力；UTS 插件同时支持 uni-app 和 uni-app x，并支持计费。

## 平台生态使用原则

uni-app 兼容多平台，常用能力由 uni 统一，不常用的平台特色能力不限制使用，可通过条件编译调用：

- Web：可调用浏览器 API，可混合使用 JS，可使用 npm 等 Web 生态库。
- 小程序：可调用小程序 API，可混合使用 JS，可使用小程序自定义组件生态和小程序 npm 库。
- Android：可调用 Android OS API，可混合 Kotlin、Java，可使用 Android SDK、so、Gradle 仓储。
- iOS：可调用 iOS API，可混合 Swift；Objective-C 需封装为库后使用，不能直接使用 OC 源码；可使用 CocoaPods。
- HarmonyOS：可调用鸿蒙 API，可混合 ArkTS，可使用鸿蒙 SDK 和 ohpm。

编译到不支持 Web 的平台时，如需使用 Web 生态内容，可考虑：

1. 在 uni-app x 的 `web-view` 组件中使用 Web 库，并通过 web-view 内 JS 与 UTS 通信。
2. 集成 uni 小程序 SDK，或集成 V8 / QuickJS 等库调用 JS 生态。
3. 将面向 Web 的 TypeScript 库适配为 UTS 库。

## 插件市场分类

DCloud 插件市场提供变现、评价、优秀作者和热门插件排行榜等机制。

常见插件分类包括：

| 一级分类 | 二级分类示例 |
| --- | --- |
| 前端组件 | 通用组件、nvue 组件、小程序组件、DataCom 组件 |
| JS SDK | 通用 SDK、微信小程序 SDK、Native.js |
| UTS 插件 | API 插件、组件插件 |
| uni-app 前端模板 | 页面模板、nvue 页面模板、项目模板 |
| App 原生插件 | App 原生插件 |
| Web 项目 | Web 项目模板 |
| uniCloud | 云函数模板、云端一体页面/项目模板、Admin 插件、DB Schema 及验证函数 |
| HBuilderX | HBuilderX 插件、语言包 |

## 付费插件

- 插件市场付费插件支持 UTS 插件、App 原生插件、uniCloud、前端组件等分类。
- UTS 插件、App 原生插件、前端组件属于客户端插件，购买时通常需绑定项目 appid 和包名。
- UTS 插件和 App 原生插件的付费插件仅支持购买后提交云端打包；前端组件还支持发行 Web。
- uniCloud 插件是云端插件，绑定 uniCloud 服务空间 spaceId。
- uniCloud、UTS 插件、前端组件支持普通授权版和源码授权版。

| 版本 | 代码可见性 | 授权侧重点 | 交易特点 |
| --- | --- | --- | --- |
| 普通授权版 | 部分或全部源码不可见 | 提供项目或服务空间使用权，以及未加密部分二次开发权 | 自助下单，即买即用 |
| 源码授权版 | 所有源码可见 | 提供完整二次开发权，便于源码审查和安全控制 | 需签署电子协议，作者可拒绝交易 |

付费插件试用要点：

- UTS 插件：按项目申请试用，插件内容对试用者不可见，只能用于打包自定义基座，不能正式发布。
- App 原生插件：按项目申请试用，插件不下载，只能用于云端打包自定义基座，不能正式发布。
- uniCloud 插件：按服务空间申请试用，加密云函数对试用者不可见；试用结束后加密云函数会被删除。
- 前端组件：按项目申请试用，内容对试用者不可见，只能本地运行或打包自定义基座，不能正式发布。

UTS 插件相比 App 原生插件的优势：

- 更小巧。
- 插件作者更新 UTS 插件免审核。
- 天然支持多版本，使用者可继续使用本地旧版。
- 支持源码版计费，使用者可审查源码并二次开发。

## uni_modules

`uni_modules` 是 uni-app 的跨平台包管理方案（HBuilderX 3.1.0+），可容纳 JS/UTS 库、组件、页面、uniCloud 云函数、公共模块、项目模板，以及 npm、Gradle、CocoaPods、ohpm 等依赖。

主要优势：

- 支持在插件市场计费销售，由 DCloud 提供商业插件代码加密和版权保护。
- HBuilderX 可对 `uni_modules` 执行上传、更新、安装依赖，并在版本更新时展示新旧代码对比。
- 插件文件位置统一，删除插件时可直接删除对应 `uni_modules/<plugin_id>` 目录。
- 支持依赖配置。
- 可作为大型工程模块拆分方案。

## 目录结构

项目类型插件只需在项目根目录放符合 `uni_modules` 规范的 `package.json`，右键该文件即可更新或发布到插件市场。

非项目插件通常放在项目根目录的 `uni_modules` 下：

```text
uni_modules/
└── plugin_id/
    ├── uniCloud/
    ├── components/
    ├── utssdk/
    ├── hybrid/
    ├── pages/
    ├── static/
    ├── wxcomponents/
    ├── license.md
    ├── package.json
    ├── readme.md
    ├── changelog.md
    └── menu.json
```

注意：

- 插件目录不支持 `pages.json`、`App.vue` / `App.uvue`、`main.js` / `main.uts`、`manifest.json`、`uni.scss`。
- 如果需要插件使用者修改这些项目级文件，应在插件 `readme.md` 中说明。
- 插件目录支持 `pages_init.json`，用于在导入插件时辅助注册页面到项目 `pages.json`。
- 插件内引用资源或跳转页面时，尽量使用相对路径。
- 插件内 `components` 目录同样支持 easycom；组件命名冲突时编译会提示。

## UTS 插件

- UTS 插件放在 `uni_modules/<plugin_id>/utssdk` 目录。
- UTS 插件支持 API 插件和组件插件，可封装原生能力并给 uni-app / uni-app x 扩展 API 和组件。
- `utssdk` 下可按平台放置 `app-android`、`app-ios`、`app-harmony`、`web`、`mp-weixin` 等目录。
- Android / iOS / HarmonyOS 平台目录可放原生 aar、so、framework、har，或配置 Gradle、CocoaPods、ohpm。
- Web 和小程序平台目录可放 npm 库。
- `utssdk/interface.uts` 用于声明统一接口，将不同平台原生能力转换为统一 API 或组件。
- import UTS 插件时仅支持导入插件根目录，不支持导入插件内部文件。

```ts
// 正确
import { test } from "@/uni_modules/uts-osapi"

// 错误
import { test } from "@/uni_modules/uts-osapi/index.uts"
```

## 使用 uni_modules 插件

### 下载

1. 在插件市场查找 uni_modules 插件。
2. 在插件详情页确认是否支持 uni_modules。
3. 点击「使用 HBuilderX 导入插件」，选择要导入的 uni-app 项目。

Tips：

- uni_modules 支持组件 easycom，插件内符合 easycom 规范的组件可直接使用。
- 图片、JS 等资源可按目录结构直接引入。
- 加密插件中的加密文件不支持单独对外导出；UTS 加密插件应导入插件根目录。
- uni-app 项目下，UTS 插件不支持导入非 `utssdk` 以外的 UTS 文件。
- 导入 uni_modules 插件需要 HBuilderX 3.1.0+。

### 依赖

- 导入插件时，HBuilderX 会自动安装当前插件的三方依赖。
- 也可以在插件目录右键执行「安装插件三方依赖」。

### 更新与卸载

- 可通过插件目录右键「从插件市场更新」检查更新，并对比确认更新内容。
- 卸载插件时可直接删除独立的 `uni_modules/<plugin_id>` 目录。

## 插件配置

每个 `uni_modules` 插件都必须有 `package.json`。

常见必填或常用字段：

- `id`：插件 ID，格式通常为 `作者ID-插件英文名称`，只能包含英文和数字，作者 ID 不能使用 `DCloud`、`uni` 等关键字。
- `displayName`：插件市场显示名称。
- `version`：插件版本。
- `description`：插件描述。
- `keywords`：插件关键词，最多 5 个。
- `engines`：最低兼容版本，如 HBuilderX、uni-app、uni-app-x。
- `dcloudext`：插件市场配置，如分类、类型、销售、联系方式、隐私权限和商业化声明。
- `uni_modules.dependencies`：依赖的其他 uni_modules 插件 ID 列表。
- `uni_modules.encrypt`：需要加密的云函数、公共模块、clientDB Action 等文件。
- `uni_modules.platforms`：平台兼容性。
- `uni_modules.treeShaking`：摇树配置。

HBuilderX 4.71 起，平台兼容性拆分为 uni-app 和 uni-app x 两个维度，并新增 `darkmode`、`i18n`、`widescreen` 定义：

```json
{
  "engines": {
    "HBuilderX": "^3.1.0",
    "uni-app": "^4.1.0",
    "uni-app-x": "^4.2.0"
  },
  "dcloudext": {
    "darkmode": "x",
    "i18n": "√",
    "widescreen": "√"
  },
  "uni_modules": {
    "platforms": {
      "client": {
        "uni-app-x": {
          "web": {
            "safari": "-",
            "chrome": "-"
          },
          "app": {
            "android": {
              "minVersion": "5.0",
              "extVersion": "1.1.0"
            },
            "ios": "-",
            "harmony": "-"
          },
          "mp": {
            "weixin": "-"
          }
        }
      }
    }
  }
}
```

平台兼容性符号：`√` 表示支持，`x` 表示不支持，`-` 表示不确定。

## 插件市场分类 type

常见 `package.json -> dcloudext -> type`：

| 一级分类 | 二级分类 | type |
| --- | --- | --- |
| 前端组件 | 通用组件 | `component-vue` |
| 前端组件 | 小程序组件 | `component-mp` |
| JS SDK | 通用 SDK | `sdk-js` |
| UTS 插件 | API 插件 | `uts` |
| UTS 插件 | uni-app 兼容模式组件 | `component-uts` |
| UTS 插件 | 标准模式组件 | `uts-vue-component` |
| uni-app 前端模板 | 前端页面模板 | `uniapp-template-page` |
| uni-app 前端模板 | 项目模板 | `uniapp-template-project` |
| uniCloud | 云函数模板 | `unicloud-template-function` |
| uniCloud | 云端一体页面模板 | `unicloud-template-page` |
| uniCloud | 云端一体项目模板 | `unicloud-template-project` |
| uniCloud | Admin 插件 | `unicloud-admin` |
| uniCloud | DB Schema 及验证函数 | `unicloud-database` |

## 其他配置文件

### uni_modules.config.json

`uni_modules.config.json` 位于项目根目录，可配置插件更新/上传后的触发脚本，以及插件 uniCloud 资源所属服务空间。

```json
{
  "scripts": {
    "postupdate": "node scripts/upgrade.js",
    "preupload": "node scripts/preupload.js",
    "postupload": "node scripts/postupload.js"
  },
  "uni_modules": {
    "uni-id": {
      "uniCloud": ["aliyun", "tcb"]
    }
  }
}
```

### .npmignore

发布 uni_modules 插件到插件市场时，可用 `.npmignore` 忽略不需要上传的目录和文件：

```text
.hbuilderx
unpackage
node_modules
package-lock.json
```

项目根目录 `.npmignore` 对发布项目和插件模板生效；`uni_modules/<plugin_id>/.npmignore` 对发布该插件生效。

### pages_init.json

`pages_init.json` 用于插件导入项目时合并页面路由到 `pages.json`。

- 文件最终不会导入工程。
- 暂不支持注释或条件编译。
- HBuilderX 低于 3.5，或插件未提供 `pages_init.json` 时，仍需手动编辑 `pages.json` 注册页面。

## 开发与发布 uni_modules 插件

新建插件：

1. 在项目根目录创建 `uni_modules` 目录，HBuilderX 可通过项目右键菜单创建。
2. 在 `uni_modules` 目录右键「新建 uni_modules 插件」。
3. 填写插件 ID，选择插件分类。

插件 ID 命名：

- 格式为 `作者ID-插件英文名称`。
- 作者 ID 和插件英文名称只能包含英文、数字。
- 作者 ID 不能使用 `DCloud`、`uni` 等关键字，长度至少 2 位。
- 插件名称应直观表达插件作用。

发布到插件市场：

1. 插件开发完毕后，在 HBuilderX 中插件目录右键「发布到插件市场」。
2. 填写插件信息。
3. 如需发布为项目模板，在项目根目录创建 `package.json`，然后右键发布。
4. 发布插件时可选择上传当前项目作为示例工程，便于用户快速上手。

修改基本信息：

- 发布后如需调整插件中文名称、描述、关键词、readme.md 等，可在插件目录右键「修改插件基本信息」。

发布新版本：

- 新增功能或修复 Bug 后，仍通过插件目录右键「发布到插件市场」发布。
- 发布窗口中的更新日志会自动与根目录 `changelog.md` 保持同步。

## 迁移已有插件为 uni_modules

1. 将插件内容迁移到示例项目根目录 `uni_modules/<plugin_id>`。
2. 运行示例项目，验证功能是否正常。
3. 尽量将资源引用改为相对路径。
4. 插件内 uniCloud 目录不能带厂商后缀。
5. 插件目录不支持项目级文件；需要使用者修改项目级文件时，在 `readme.md` 中说明。
6. 在插件根目录创建 `package.json`，至少填写插件 ID。
7. 将插件文档迁移到插件根目录 `readme.md`。
8. 右键 `package.json` 或插件目录发布到插件市场。

