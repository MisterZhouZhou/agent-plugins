# Basic uni-app x Project Template

## Project structure

```text
my-uni-app-x/
├─pages/
│  └─index/
│     └─index.uvue
├─static/
├─main.uts
├─App.uvue
├─pages.json
├─manifest.json
└─uni.scss
```

## main.uts

```uts
import App from './App.uvue'
import { createSSRApp } from 'vue'

export function createApp() {
  const app = createSSRApp(App)
  return {
    app
  }
}
```

## App.uvue

```vue
<script lang="uts">
export default {
  onLaunch: function () {
    console.log("App Launch")
  },
  onShow: function () {
    console.log("App Show")
  },
  onHide: function () {
    console.log("App Hide")
  }
}
</script>

<style>
/* Global styles */
</style>
```

## pages/index/index.uvue

```vue
<template>
  <view class="page">
    <text class="title">{{ title }}</text>
    <button class="button" @click="handleClick">Start</button>
  </view>
</template>

<script setup lang="uts">
const title = ref<string>("uni-app x")

const handleClick = (): void => {
  uni.showToast({
    title: "Hello",
    icon: "success"
  })
}
</script>

<style>
.page {
  width: 750rpx;
  min-height: 100%;
  padding: 32rpx;
  box-sizing: border-box;
}

.title {
  font-size: 36rpx;
  font-weight: 600;
  color: #111111;
}

.button {
  margin-top: 32rpx;
}
</style>
```
