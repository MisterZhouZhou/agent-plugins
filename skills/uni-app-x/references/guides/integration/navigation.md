# Navigation

Use uni navigation APIs for routing. Keep tab pages, normal pages, and replacement navigation separate.

## Page navigation

```uts
uni.navigateTo({
  url: "/pages/detail/detail?id=1&name=test"
})

uni.redirectTo({
  url: "/pages/login/login"
})

uni.navigateBack({
  delta: 1
})
```

## tabBar navigation

Use `switchTab` only for pages listed in `tabBar`.

```uts
uni.switchTab({
  url: "/pages/index/index"
})
```

## Relaunch

Use `reLaunch` when resetting the whole page stack:

```uts
uni.reLaunch({
  url: "/pages/index/index"
})
```

## Passing query params

```uts
uni.navigateTo({
  url: "/pages/detail/detail?id=1&name=test"
})
```

Receive params in `onLoad`:

```vue
<script setup lang="uts">
const id = ref<string>("")

onLoad((options) => {
  if (options["id"] != null) {
    id.value = options["id"] as string
  }
})
</script>
```

## Custom header back behavior

```vue
<template>
  <view class="header">
    <button class="back" @click="goBack">Back</button>
    <text class="title">Detail</text>
  </view>
</template>

<script setup lang="uts">
const goBack = (): void => {
  const pages = getCurrentPages()
  if (pages.length > 1) {
    uni.navigateBack({ delta: 1 })
  } else {
    uni.reLaunch({ url: "/pages/index/index" })
  }
}
</script>
```

## Checklist

- `navigateTo` target must be in `pages.json`.
- `switchTab` target must be in `tabBar.list`.
- Query values are strings; cast and validate before use.
- Custom navigation should handle empty page stack fallback.
- Use absolute paths beginning with `/` in navigation calls.
