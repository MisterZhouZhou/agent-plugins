# Build Optimization

uni-app x optimization usually means reducing platform-specific code, choosing native-friendly components, and avoiding expensive rendering patterns.

## Conditional code reduction

Use platform conditions to keep target builds clean:

```vue
<template>
  <view>
    <!-- #ifdef WEB -->
    <text>Web-only content</text>
    <!-- #endif -->

    <!-- #ifdef APP-ANDROID -->
    <text>Android-only content</text>
    <!-- #endif -->
  </view>
</template>
```

## Long-list performance

Use `<list-view>` for large lists instead of rendering many items in a `<scroll-view>`.

```vue
<template>
  <list-view class="list">
    <list-item v-for="item in items" :key="item.id">
      <text class="name">{{ item.name }}</text>
    </list-item>
  </list-view>
</template>
```

## Asset optimization

- Store images, fonts, audio, and video in `/static/`.
- Use appropriately sized images per platform.
- Prefer WebP only for platforms that support it.
- Avoid dynamic image paths when the compiler needs to discover assets.

```vue
<template>
  <!-- #ifdef WEB -->
  <image src="/static/images/banner.webp" class="banner"></image>
  <!-- #endif -->

  <!-- #ifndef WEB -->
  <image src="/static/images/banner.png" class="banner"></image>
  <!-- #endif -->
</template>
```

## Reactivity optimization

- Use `ref()` only for data that changes and affects rendering.
- Keep derived values simple.
- Avoid storing large static datasets in reactive state.
- Paginate or virtualize large data where possible.

## Build checklist

- Remove unused platform branches.
- Verify Mini Program package size.
- Test App layout on real devices.
- Confirm native permissions match actual API usage.
- Profile long lists and image-heavy pages on the slowest target device.
