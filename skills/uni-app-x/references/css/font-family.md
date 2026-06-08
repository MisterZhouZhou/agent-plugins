---
name: css-font-family
description: uni-app x 字体、font-family、@font-face、自定义字体、uni-icon 与平台差异
---

# uni-app x 字体

## 何时使用

读取本文件处理以下问题：
- 设置系统字体或自定义字体。
- 使用 `@font-face` 加载本地字体、远程字体或 iconfont。
- 排查 App、HarmonyOS、Web 字体显示不一致。
- 使用内置 `uni-icon` 字体图标。

## font-family 基本规则

- `font-family` 用来为元素指定字体；uni-app x 支持常见字体族：`cursive`、`fantasy`、`monospace`、`sans-serif`、`serif`。
- 官方文档列出的适用组件包括 `text`、`button`、`input`、`textarea`。
- 系统已有字体可直接在 `font-family` 中写字体名称。
- 系统不存在的字体需要先用 `@font-face` 定义，再在组件样式中引用定义的 `font-family` 名称。
- 在 App 端，`font-family` 样式不继承；需要使用字体的每一层组件都要显式设置。
- 在 App 端，`font-family` 不支持用逗号分隔多个字体做 fallback；一次只设置一个字体名。

## @font-face 自定义字体

推荐把本地字体放到项目 `/static/` 或 `uni_modules/*/static/` 目录，再通过 `url()` 引用：

```css
@font-face {
  font-family: AlimamaDaoLiTiOTF;
  src: url('/static/font/AlimamaDaoLiTi.otf');
}

.title-text {
  font-family: AlimamaDaoLiTiOTF;
}
```

关键规则：
- App 平台指定自定义字体路径时必须用 `url()` 包裹。
- 字体路径支持本地路径和网络地址；App 4.33+ 开始支持 base64 格式数据。
- 本地字体应放在项目或 `uni_modules` 的 `static` 目录下；不要放到普通源码目录后期待所有平台都能稳定加载。
- `@font-face` 可用于加载远程字体或本地字体；如果项目要求离线运行，优先使用 `/static/` 下的本地字体。

## 字体格式平台差异

- App Android：支持 `ttf`、`otf`；不支持 `woff`、`woff2` 和可变字体。
- App iOS：支持 `ttf`、`otf`、`woff`、`woff2`。
- HarmonyOS：支持 `ttf`、`otf`，底层通过 `@ohos.font` 实现。
- Web：支持情况取决于浏览器。

iOS 注意点：
- CSS 中 `font-family` 的声明名可以自定义，但字体注册时还会读取字体二进制内部真实名称。
- iconfont 等字体的真实名称要足够特殊；过于通用的名称如 `iconfont` 容易冲突并导致注册失败或字符显示异常。

## 内置字体图标 uni-icon

App 平台 HBuilderX 4.33+ 可使用内置 `uni-icon` 字体。适合调用官方内置图标码点，不适合替代业务自定义图标体系。

```vue
<template>
  <text class="uni-icon-text">{{ '\ue601' }}</text>
</template>

<style>
.uni-icon-text {
  font-family: uni-icon;
  font-size: 64px;
}
</style>
```

使用约束：
- `uni-icon` 是 App 平台内置能力；跨 Web 或小程序时不要默认可用。
- 业务自定义 iconfont 仍应通过 `@font-face` 加载自己的字体文件，并使用独立、不冲突的 `font-family` 名称。

## 排查清单

- 字体没生效：确认目标组件本身设置了 `font-family`，不要依赖父级继承。
- 字体回退没生效：确认是否在 App 端写了逗号分隔 fallback；App 端只支持一个字体。
- HarmonyOS 字体没生效：确认字体格式是 `ttf` 或 `otf`。
- Android 字体没生效：确认不是 `woff`、`woff2` 或可变字体。
- iOS iconfont 异常：确认字体文件内部真实 family name 不与系统或其他字体冲突。
- 本地字体没加载：确认字体位于 `/static/` 或 `uni_modules/*/static/`，并且 `src` 使用 `url()`。

## 官方文档来源

- https://doc.dcloud.net.cn/uni-app-x/css/font-family.html#font-family
- https://doc.dcloud.net.cn/uni-app-x/css/common/at-rules.html#font
