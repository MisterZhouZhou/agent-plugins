# UVue Pages and Components

uni-app x supports Vue 3 syntax. Pages typically use the `.uvue` extension and `<script lang="uts">` or `<script setup lang="uts">`.

## Composition API page

```vue
<template>
  <view class="content">
    <button @click="buttonClick">{{ title }}</button>
  </view>
</template>

<script setup lang="uts">
const title = ref<string>("Hello world")

const buttonClick = (): void => {
  title.value = "Clicked!"
}

onLoad(() => {
  console.log("Page loaded")
})

onReady(() => {
  console.log("Page ready")
})
</script>

<style>
.content {
  width: 750rpx;
  background-color: #ffffff;
}
</style>
```

## Options API page

```vue
<template>
  <view class="content">
    <button @click="buttonClick">{{ title }}</button>
  </view>
</template>

<script lang="uts">
export default {
  data() {
    return {
      title: "Hello world" as string
    }
  },
  onLoad() {
    console.log("onLoad")
  },
  methods: {
    buttonClick: function () {
      uni.showModal({
        showCancel: false,
        content: "Button clicked"
      })
    }
  }
}
</script>
```

## Page lifecycle

- `onInit()` - page init before data
- `onLoad(options)` - page load with query parameters
- `onShow()` - page shown
- `onReady()` - first render complete
- `onHide()` - page hidden
- `onUnload()` - page unloaded
- `onResize()` - window resize
- `onBackPress()` - Android back button press
- `onPageScroll(e)` - page scroll
- `onReachBottom()` - scroll reaches bottom
- `onPullDownRefresh()` - pull-down refresh

## Component lifecycle

- `beforeCreate()`, `created()`
- `beforeMount()`, `mounted()`
- `beforeUpdate()`, `updated()`
- `beforeUnmount()`, `unmounted()`

## easycom component system

Components placed in either of these locations can be auto-registered:

```
components/comp-name/comp-name.uvue
uni_modules/plugin-id/components/plugin-id/plugin-id.uvue
```

Use easycom components directly in templates:

```vue
<template>
  <view>
    <uni-loading></uni-loading>
  </view>
</template>
```

## Manual component import

```vue
<script setup lang="uts">
import child from './child.vue'

const component1 = ref<ComponentPublicInstance | null>(null)
</script>
```

## Component instance type convention

- Component tag `<test/>` maps to `TestComponentPublicInstance`
- Component tag `<uni-data-checkbox/>` maps to `UniDataCheckboxComponentPublicInstance`

## Practical guidance

- Prefer Composition API for new pages unless the project already standardizes on Options API.
- Keep reactive values typed: `ref<string>("")`, `ref<number>(0)`, `ref<User | null>(null)`.
- Do not rely on truthy checks in templates or handlers when UTS typing requires explicit null/length checks.
