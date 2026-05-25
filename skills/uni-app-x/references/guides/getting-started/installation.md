# Installation and Environment

uni-app x projects are usually created and run through HBuilderX, with optional CLI/package-manager support depending on the project template.

## Recommended setup path

1. Install a recent HBuilderX version with uni-app x support.
2. Create or open a uni-app x project.
3. Confirm the project has `manifest.json` with `"uni-app-x": {}`.
4. Confirm the entry files are `main.uts` and `App.uvue`.
5. Run the project on the target platform before making large edits.

## Plugin installation

Prefer DCloud plugin market or `uni_modules` packages when adding uni-app x plugins:

```text
uni_modules/
└─plugin-id/
   ├─package.json
   ├─index.uts
   ├─utssdk/
   └─components/
```

When a plugin includes components, check whether it provides `.uvue` components and whether it supports the target platforms.

## npm dependencies

Use npm dependencies only when they are compatible with the target runtime. A package that works on Web may not work in App native compilation, Mini Programs, or HarmonyOS.

Before adding a package:

- Check whether it depends on browser-only globals such as `window` or `document`.
- Check whether it depends on Node.js built-ins.
- Check whether it has platform-specific native code.
- Prefer UTS plugins for native App functionality.

## Verification page

Create a minimal page to verify runtime, styles, and API access:

```vue
<template>
  <view class="page">
    <text class="title">{{ title }}</text>
    <button class="button" @click="test">Test</button>
  </view>
</template>

<script setup lang="uts">
const title = ref<string>("uni-app x ready")

const test = (): void => {
  uni.showToast({
    title: "OK",
    icon: "success"
  })
}
</script>

<style>
.page {
  width: 750rpx;
  padding: 32rpx;
  box-sizing: border-box;
}

.title {
  font-size: 32rpx;
  color: #111111;
}

.button {
  margin-top: 24rpx;
}
</style>
```

## Common setup failures

- Missing `"uni-app-x": {}` in `manifest.json`.
- Using `.vue` or JavaScript patterns from classic uni-app in a `.uvue`/UTS file.
- Adding Web-only npm packages to App-targeted code.
- Putting source files in `/static/`.
- Using CSS selectors or layout modes unsupported by UCSS App rendering.
