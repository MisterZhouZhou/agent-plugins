# 真实插件模式参考

以下模式来自本地实际插件示例，不是抽象猜测。

## 1. `uni-actionSheet`

适合：

- 封装一个 `uni.xxx()` API
- 需要页面/弹层桥接
- 需要按平台分别实现

结构特征：

- `package.json` 的 `uni_modules.uni-ext-api.uni` 中声明 `showActionSheet`、`hideActionSheet`
- `utssdk/interface.uts` 定义详细参数、成功/失败回调、错误码
- `utssdk/app-harmony/index.uts` 通过 `uni.$on / uni.$emit / uni.openDialogPage` 串联页面和回调
- 实现文件末尾通常 `export * from '../interface.uts'`

使用这个模式时：

- 先把接口声明写完整
- 页面桥接事件名尽量唯一
- 平台实现负责把底层行为转回 `success/fail/complete`
- 调用侧如果是业务页或 demo 页，优先写 `uni.showActionSheet(...)` 这类 `uni.xxx(...)` 形态；不要直接从 `@/uni_modules/<plugin>/utssdk/index.uts` 导入实现函数，除非该插件没有在 `uni-ext-api` 中注册为 `uni` API
- 需要强类型回调时，可从 `@/uni_modules/<plugin>/utssdk/interface.uts` 导入类型声明

## 2. `uni-clipboard`

适合：

- 纯系统能力封装
- 需要 HarmonyOS 权限或 `@ohos.*` 原生 API
- 需要标准异步 API 形态

结构特征：

- `interface.uts` 中直接扩展 `Uni` 接口并声明 API
- `protocol.uts` 中定义 `API_*` 常量、`ProtocolOptions`、`ApiOptions`
- `app-harmony/index.uts` 中导入 `@ohos.pasteboard`
- 使用 `UTSHarmony.requestSystemPermission(...)`
- 使用 `defineAsyncApi<Options, Success>()`

使用这个模式时：

- 原生权限流程放在平台实现中
- 参数校验和默认值放在 `protocol.uts`
- 失败信息统一通过 `reject()` 返回

## 3. `uni-payment`

适合：

- 服务提供者模式
- 一个统一 API 背后有多个 provider
- 需要错误码映射

结构特征：

- `package.json` 的 `uni-ext-api.provider.service` 标识服务名，例如 `payment`
- `interface.uts` 中定义 `UniPaymentProvider`
- `protocol.uts` 只保留 API 名常量时也可很轻
- `app-harmony/index.uts` 中通过 `getUniProvider<UniPaymentProvider>('payment', options.provider)` 获取实现
- `unierror.uts` 维护错误码到消息的映射

使用这个模式时：

- 对外 API 尽量保持薄，核心分发走 provider
- 先判空 provider，再调用
- 业务错误统一做一次翻译，避免每个平台各自拼错误文案

## 4. 这三种模式如何选

- 封装单个标准 API：先看 `uni-actionSheet`
- 封装系统能力并需要校验：先看 `uni-clipboard`
- 对接多家支付/登录/地图服务：先看 `uni-payment`

## 5. 落地偏好

- 优先复用已有文件名：`interface.uts`、`protocol.uts`、`unierror.uts`
- 优先复用已有控制流：声明 -> 协议 -> 平台实现
- 不要把所有逻辑都堆到一个 `index.uts`
