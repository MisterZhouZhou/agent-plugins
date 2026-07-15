# uni-app x UTS 插件快速参考

## 1. 默认目录

优先使用 `uni_modules/<plugin-id>/`：

```text
uni_modules/
└─ <plugin-id>/
   ├─ package.json
   ├─ readme.md                    # 推荐，插件文档
   ├─ changelog.md                 # 推荐，更新日志
   ├─ license.md                   # 可选，授权说明
   ├─ components/                  # 可选，组件插件
   │  └─ component-name/
   │     ├─ component-name.vue     # 可选，老版 uni-app
   │     └─ component-name.uvue    # 可选，uni-app x
   ├─ pages/                       # 可选，页面插件/示例页面
   │  └─ page-name/
   │     ├─ page-name.vue          # 可选，老版 uni-app
   │     └─ page-name.uvue         # 可选，uni-app x
   ├─ static/                      # 可选，静态资源
   └─ utssdk/
      ├─ interface.uts             # API 声明入口，常见为必需
      ├─ index.uts                 # 可选，跨平台入口
      ├─ protocol.uts              # 可选，参数协议和默认值
      ├─ unierror.uts              # 可选，错误码映射
      ├─ app-android/
      │  ├─ index.uts
      │  └─ config.json
      ├─ app-ios/
      │  ├─ index.uts
      │  └─ config.json
      ├─ app-harmony/
      │  ├─ index.uts
      │  ├─ config.json
      │  ├─ module.json5
      │  ├─ resources/
      │  └─ libs/
      └─ web/
         ├─ index.uts
         └─ package.json
```

`components/`、`pages/`、`static/`、`utssdk/` 都是 `uni_modules/<plugin-id>/` 下的平级目录。不要把页面放到 `utssdk` 里，也不要把平台原生实现放到 `pages` 里。

## 2. 最小职责划分

- `package.json`
  - 插件清单
  - 描述 `id`、显示名、版本、`uni_modules` 元数据
- `utssdk/interface.uts`
  - 对外 API、类型、回调、错误码声明
- `components/`
  - 放组件；同时支持两类项目时，可并列提供 `.vue` 与 `.uvue`
- `pages/`
  - 放插件页面、示例页或可被项目注册/跳转的业务页面
- `static/`
  - 放图片、字体、音视频等静态资源
- `utssdk/index.uts` 或 `utssdk/<platform>/index.uts`
  - 具体实现
- `protocol.uts`
  - `defineAsyncApi` 的协议、参数格式化、校验
- `unierror.uts`
  - 错误码到错误消息的聚合

## 3. 创建流程

1. 新建 `uni_modules/<plugin-id>/`
2. 先写 `package.json`
3. 如果是组件/页面插件，先补 `components/` 或 `pages/`
4. 如果是 API/原生能力插件，再写 `utssdk/interface.uts`
5. 再决定是否需要根 `utssdk/index.uts`
6. 按平台补 `app-android` / `app-ios` / `app-harmony` / `web`
7. 如果使用 `defineAsyncApi`，再补 `protocol.uts`
8. 如果需要统一错误返回，再补 `unierror.uts`

## 4. package.json 最小建议

至少包含：

```json
{
  "id": "your-plugin-id",
  "displayName": "你的插件名",
  "version": "1.0.0",
  "description": "插件说明",
  "uni_modules": {}
}
```

常见追加字段：

- `uni_modules.dependencies`
- `uni_modules.uni-ext-api`
- `uni_modules.platforms`
- `uni_modules.encrypt`
- `dcloudext`

只有当任务明确要求插件市场元数据或兼容性矩阵时，再补这些扩展字段。

## 5. 实现选择规则

- 同时有根 `index.uts` 和平台 `index.uts` 时，优先平台实现
- 只做单平台插件时，可不写根 `index.uts`
- 需要共享逻辑时，可在根入口中 `#ifdef` 分发或抽公共文件

## 6. API 插件常见模式

### 直接导出函数

- 在 `interface.uts` 中导出函数类型
- 在平台 `index.uts` 中实现并 `export`

### defineAsyncApi

- 适合异步 uni API 风格
- 通常配合 `protocol.uts`
- 结果通过 `ApiExecutor` 的 `resolve/reject` 返回

### Provider 模式

- 在实现中通过 `getUniProvider(service, provider)` 找到真正提供者
- 适合支付、登录、地图等服务型插件

## 7. 命名建议

- 插件 id 使用稳定前缀，避免和市场已有插件冲突
- `API_XXX` 常量集中放在 `protocol.uts`
- `interface.uts` 内类型名与导出函数名保持一一对应

## 8. 修改已有插件时

- 先看 `package.json` 的 `uni-ext-api` 是否已经定义能力
- 再看 `interface.uts` 的签名能否承载新增参数
- 最后补平台实现，不要先改实现再反推声明
