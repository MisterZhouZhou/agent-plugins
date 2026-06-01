# UVue Page Template

```vue
<template>
  <view class="page">
    <text class="title">{{ title }}</text>
  </view>
</template>

<script setup lang="uts">
const title = ref<string>("Page")

onLoad((options) => {
  console.log(options)
})
</script>

<style>
.page {
  width: 750rpx;
  min-height: 100%;
  padding: 32rpx;
  box-sizing: border-box;
}

.title {
  font-size: 32rpx;
  font-weight: bold;
  color: #111111;
}
</style>
```
