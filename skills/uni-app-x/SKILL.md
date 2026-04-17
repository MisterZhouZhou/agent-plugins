# uni-app-x Development Skill

Expert AI assistant for developing uni-app x applications — the next-generation cross-platform app development engine by DCloud.

## Trigger Conditions

Use this skill when:
- User asks to create, develop, or debug a uni-app x project
- Code contains `.uvue` files or `uni-app-x` in manifest.json
- User mentions uni-app x, uts language, uvue, or DCloud HBuilderX
- Files import from `@dcloudio/uni-app` or use `uni.` APIs
- User asks about cross-platform development targeting Android/iOS/HarmonyOS/Web/Mini Programs with uni-app x

## What is uni-app x

uni-app x is a cross-platform application development engine. It includes:
- **UTS language**: A TypeScript-like strongly-typed language that compiles to Kotlin (Android), Swift (iOS), ArkTS (HarmonyOS), and JavaScript (Web/Mini Programs)
- **uvue rendering engine**: A Vue3-compatible, UTS-based, cross-platform native rendering engine
- **Components**: Built-in UI components + custom vue components + UTS component plugins
- **APIs**: UTS APIs + uni.xxx built-in APIs + platform native APIs
- **Plugin ecosystem**: UTS plugins published on DCloud plugin market

### Key Architecture
- Android: Entire project compiles to Kotlin — native performance, no JS engine
- iOS: Currently uses JS-driven mode for pages (Swift for UTS plugins)
- HarmonyOS: Compiles to ArkTS
- Web: Compiles to JavaScript, uses Vue.js
- Mini Programs: Compiles to JavaScript

## Project Structure

```
├─components/           Vue components (easycom supported)
├─pages/                Page files (.uvue)
│  ├─index/
│  │  └─index.uvue
│  └─list/
│     └─list.uvue
├─static/               Static assets (images, fonts, media) - MUST go here
├─uni_modules/          UTS plugins and uni_modules packages
├─platforms/            Platform-specific pages
├─nativeResources/      Native resources (Android/iOS)
│  ├─android/
│  └─ios/
├─harmonyConfig/        HarmonyOS native resources
├─hybrid/               Local HTML for web-view component
├─main.uts              Vue initialization entry
├─App.uvue              App-level config, global styles, lifecycle
├─pages.json            Page routing, navigation bar, tabBar config
├─manifest.json         App name, appid, version, packaging info
├─AndroidManifest.xml   Android manifest
├─Info.plist            iOS config
└─uni.scss              Built-in style variables
```

### manifest.json Marker
uni-app x projects MUST have `"uni-app-x": {}` in manifest.json:
```json
{
  "name": "my-app",
  "appid": "__UNI__XXXXXX",
  "description": "",
  "versionName": "1.0.0",
  "versionCode": "100",
  "uni-app-x": {}
}
```

## UTS Language

UTS (uni type script) is a strongly-typed, cross-platform language similar to TypeScript but with important differences.

### Variable Declaration
```uts
let str: string = "hello"        // mutable variable
const num: number = 42           // immutable constant
let nullable: string | null = null  // nullable type (NO undefined!)
```

### Functions
```uts
function test(score: number): boolean {
  return score >= 60
}

function add(x: string, y: string): void {
  console.log(x + " " + y)
}
```

### Critical Differences from TypeScript

1. **No `undefined`** — Use `null` instead. All variables must be initialized.
```uts
// WRONG:
let value: string | undefined
// CORRECT:
let value: string | null = null
```

2. **Boolean conditions required** — No truthy/falsy values
```uts
// WRONG:
if (str) { }
if (arr.length) { }
// CORRECT:
if (str != null) { }
if (arr.length > 0) { }
```

3. **Nominal type system** — Not structural typing. Types must match by name, not shape.

4. **No `any` like TS** — `any` in UTS is a platform-adapted type, requires type casting before use.

5. **No `undefined` checks** — Use `== null` instead of `== undefined`

6. **Strong typing everywhere** — All variables, function parameters, and return values need type annotations (or must be inferrable).

7. **No dynamic types** — Cannot use dynamic property access like `obj[dynamicKey]` freely.

8. **Array type specifics** — Use typed arrays: `let arr: number[] = [1, 2, 3]`

### Platform-Specific Code (Conditional Compilation)
```uts
// #ifdef APP-ANDROID
import Build from 'android.os.Build'
console.log(Build.MODEL)
// #endif

// #ifdef APP-IOS
// iOS specific code
// #endif

// #ifdef WEB
// Web specific code
// #endif

// #ifdef MP-WEIXIN
// WeChat Mini Program specific code
// #endif
```

### Calling Native APIs
```uts
// Android - import and use Kotlin/Java APIs directly
// #ifdef APP-ANDROID
import Build from 'android.os.Build'
console.log(Build.MODEL)
// #endif

// iOS - import and use Swift APIs directly
// #ifdef APP-IOS
import { UIDevice } from 'UIKit'
// #endif
```

## Vue in uni-app x

uni-app x supports Vue 3 syntax only (both Composition API and Options API). Pages use `.uvue` extension.

### Composition API (Recommended)
```vue
<template>
  <view class="content">
    <button @click="buttonClick">{{title}}</button>
  </view>
</template>

<script setup lang="uts">
  let title = ref("Hello world")

  const buttonClick = () => {
    title.value = "Clicked!"
  }

  onLoad(() => {
    console.log('Page loaded')
  })

  onReady(() => {
    console.log('Page ready')
  })
</script>

<style>
  .content {
    width: 750rpx;
    background-color: #ffffff;
  }
</style>
```

### Options API
```vue
<template>
  <view class="content">
    <button @click="buttonClick">{{title}}</button>
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
      console.log('onLoad')
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

### Page Lifecycle
- `onInit()` — Page init (before data)
- `onLoad(options)` — Page load with query parameters
- `onShow()` — Page shown
- `onReady()` — Page first render complete
- `onHide()` — Page hidden
- `onUnload()` — Page unloaded
- `onResize()` — Window resize
- `onBackPress()` — Back button press (Android)
- `onPageScroll(e)` — Page scroll
- `onReachBottom()` — Scroll to bottom
- `onPullDownRefresh()` — Pull-down refresh

### Component Lifecycle
- `beforeCreate()`, `created()`
- `beforeMount()`, `mounted()`
- `beforeUpdate()`, `updated()`
- `beforeUnmount()`, `unmounted()`

### Component System — easycom
Components placed in `components/comp-name/comp-name.uvue` or `uni_modules/plugin-id/components/plugin-id/plugin-id.uvue` are auto-registered and can be used directly in templates without import.

```vue
<template>
  <view>
    <!-- Auto-imported via easycom, no manual import needed -->
    <uni-loading></uni-loading>
  </view>
</template>
```

### Manual Component Import
```vue
<script setup lang="uts">
import child from './child.vue'
const component1 = ref<ComponentPublicInstance | null>(null)
</script>
```

### Component Type Convention
Component tag `<test/>` → type `TestComponentPublicInstance`
Component tag `<uni-data-checkbox/>` → type `UniDataCheckboxComponentPublicInstance`

## CSS in uni-app x (ucss)

uni-app x on App implements a **subset** of web CSS. Key rules:

### Layout
- **ONLY flex layout and absolute positioning** are supported on App
- **Default flex-direction is `column`** (vertical) — different from W3C default of `row`
- No `block`, `inline-block`, `grid` layouts on App (grid only in waterflow component)
- When compiled to Web, full CSS is supported

### Critical CSS Rules
1. **Only class selectors** — No tag selectors, #id selectors, or [attr] selectors
2. **No style inheritance** — Parent styles do NOT cascade to children
3. **Class names**: Only A-Z, a-z, 0-9, _, - characters allowed
4. **rpx unit**: 750rpx = screen width (responsive pixel unit, works across all platforms)

### Supported CSS Properties (Key Subset)
```css
/* Layout */
display: flex;
flex-direction: row | column;
flex-wrap: wrap | nowrap;
justify-content: flex-start | flex-end | center | space-between | space-around;
align-items: flex-start | flex-end | center | stretch;
flex: <number>;
flex-grow: <number>;
flex-shrink: <number>;
flex-basis: <length>;
position: relative | absolute | fixed | sticky;

/* Box Model */
width; height; min-width; max-width; min-height; max-height;
margin; padding; (and directional variants)
border; border-radius; (and directional variants)
box-sizing: border-box | content-box;

/* Visual */
background-color; background-image;
color; opacity; visibility;
box-shadow; overflow;

/* Text */
font-size; font-weight; font-family; font-style;
text-align; text-decoration; text-overflow;
line-height; letter-spacing; white-space;

/* Transform & Animation */
transform; transform-origin;
transition; transition-property; transition-duration;

/* Positioning */
top; right; bottom; left; z-index;
```

### Common Flex Patterns
```css
/* Horizontal layout */
.row {
  flex-direction: row;
}

/* Vertical layout (default in uni-app x) */
.column {
  flex-direction: column;
}

/* Center content */
.center {
  justify-content: center;
  align-items: center;
}

/* Full width */
.full-width {
  width: 750rpx;
}
```

## pages.json Configuration

```json
{
  "globalStyle": {
    "navigationBarTextStyle": "black",
    "navigationBarTitleText": "My App",
    "navigationBarBackgroundColor": "#F8F8F8",
    "backgroundColor": "#F8F8F8"
  },
  "pages": [
    {
      "path": "pages/index/index",
      "style": {
        "navigationBarTitleText": "Home"
      }
    },
    {
      "path": "pages/my/my",
      "style": {
        "navigationBarTitleText": "Profile"
      }
    }
  ],
  "tabBar": {
    "color": "#999999",
    "selectedColor": "#007AFF",
    "borderStyle": "black",
    "backgroundColor": "#ffffff",
    "list": [
      {
        "pagePath": "pages/index/index",
        "text": "Home",
        "iconPath": "static/tab/home.png",
        "selectedIconPath": "static/tab/home-active.png"
      },
      {
        "pagePath": "pages/my/my",
        "text": "Profile",
        "iconPath": "static/tab/my.png",
        "selectedIconPath": "static/tab/my-active.png"
      }
    ]
  }
}
```

## Built-in Components

### Core Components
- `<view>` — Container (like div), default flex column layout
- `<text>` — Text display (inline layout internally)
- `<image>` — Image display
- `<scroll-view>` — Scrollable container
- `<list-view>` — Optimized list for large datasets
- `<swiper>` — Swipeable container
- `<button>` — Button
- `<input>` — Text input
- `<textarea>` — Multi-line text input
- `<checkbox>` / `<radio>` — Selection controls
- `<switch>` — Toggle switch
- `<slider>` — Slider
- `<picker>` — Picker
- `<navigator>` — Page navigation
- `<web-view>` — Embedded web content
- `<video>` — Video player
- `<rich-text>` — Rich text display (block layout internally)
- `<match-media>` — Media query component
- `<page-container>` — Page container for popup pages
- `<animation-view>` — Lottie animation

### Common Component Attributes
All components support: `id`, `class`, `style`, `ref`, `@click`, `@touchstart`, `@touchmove`, `@touchend`, `@longpress`

## uni API (Common APIs)

### Navigation
```uts
uni.navigateTo({ url: '/pages/detail/detail?id=1' })
uni.redirectTo({ url: '/pages/login/login' })
uni.navigateBack({ delta: 1 })
uni.switchTab({ url: '/pages/index/index' })
uni.reLaunch({ url: '/pages/index/index' })
```

### UI Interaction
```uts
uni.showToast({ title: 'Success', icon: 'success' })
uni.showLoading({ title: 'Loading...' })
uni.hideLoading()
uni.showModal({
  title: 'Confirm',
  content: 'Are you sure?',
  success: (res) => {
    if (res.confirm) { /* confirmed */ }
  }
})
uni.showActionSheet({
  itemList: ['Option A', 'Option B'],
  success: (res) => { console.log(res.tapIndex) }
})
```

### Storage
```uts
uni.setStorageSync('key', 'value')
let value = uni.getStorageSync('key') as string
uni.removeStorageSync('key')

// Async
uni.setStorage({ key: 'key', data: 'value' })
uni.getStorage({
  key: 'key',
  success: (res) => { console.log(res.data) }
})
```

### Network
```uts
uni.request({
  url: 'https://api.example.com/data',
  method: 'GET',
  success: (res) => {
    console.log(res.data)
  },
  fail: (err) => {
    console.error(err)
  }
})
```

### System Info
```uts
let sysInfo = uni.getSystemInfoSync()
console.log(sysInfo.platform)      // android | ios | harmonyos | web
console.log(sysInfo.screenWidth)
console.log(sysInfo.deviceModel)
```

### getApp & getCurrentPages
```uts
let app = getApp()
let pages = getCurrentPages()
let currentPage = pages[pages.length - 1]
```

## UTS Plugin Development

### Directory Structure (uni_modules)
```
uni_modules/
└─ my-plugin/
   ├─ package.json
   ├─ index.uts            // Plugin entry
   ├─ utssdk/
   │  ├─ interface.uts     // Cross-platform interface
   │  ├─ app-android/      // Android implementation (Kotlin)
   │  │  └─ index.uts
   │  ├─ app-ios/          // iOS implementation (Swift)
   │  │  └─ index.uts
   │  ├─ app-harmony/      // HarmonyOS implementation
   │  │  └─ index.uts
   │  ├─ web/              // Web implementation (JS)
   │  │  └─ index.uts
   │  └─ mp-weixin/        // WeChat Mini Program
   │     └─ index.uts
   └─ components/          // Component plugins
      └─ my-plugin/
         └─ my-plugin.uvue
```

### Plugin Types
1. **API Plugin**: Extends API capabilities, called in `<script>`
2. **Component Plugin**: Extends UI components, used in `<template>`

## Best Practices

### Code Quality
1. Always declare types explicitly — UTS is strictly typed
2. Use `null` instead of `undefined` everywhere
3. Use boolean expressions in conditions (`if (x != null)` not `if (x)`)
4. Use `as` for type casting when needed
5. Initialize all variables before use

### Performance
1. Use `<list-view>` for long lists instead of `v-for` in `<scroll-view>`
2. Put static assets in `/static/` directory
3. Use conditional compilation to optimize per-platform
4. Avoid unnecessary reactivity — only use `ref()` for data that changes

### Cross-Platform
1. Use `rpx` units for responsive layout (750rpx = screen width)
2. Test on all target platforms — behavior may differ
3. Use conditional compilation (`#ifdef`) for platform-specific code
4. Stick to ucss subset for consistent App rendering
5. Use flex layout exclusively on App platform

### Static Resources
- ALL static files (images, fonts, media) → `/static/` directory
- Do NOT put `.uts`, `.css` files in `/static/`
- Use absolute paths: `src="/static/images/logo.png"`
- Avoid variable paths for images (compiler can't detect them)

## Platform Support
| Platform | Min Version |
|----------|------------|
| Android | Android 5+ |
| iOS | iOS 12+ |
| HarmonyOS | API 14+ |
| Web (Release) | Chrome 64, Safari 11.1, Firefox 62, Edge 79 |
| Mini Programs | WeChat supported |

## Documentation Reference
- Official docs: https://doc.dcloud.net.cn/uni-app-x/
- UTS language: https://doc.dcloud.net.cn/uni-app-x/uts/
- Vue in uni-app x: https://doc.dcloud.net.cn/uni-app-x/vue/
- CSS reference: https://doc.dcloud.net.cn/uni-app-x/css/
- Components: https://doc.dcloud.net.cn/uni-app-x/component/
- API reference: https://doc.dcloud.net.cn/uni-app-x/api/
- Plugin development: https://doc.dcloud.net.cn/uni-app-x/plugin/uts-plugin.html
- pages.json: https://doc.dcloud.net.cn/uni-app-x/collocation/pagesjson.html
- UTS vs TS differences: https://doc.dcloud.net.cn/uni-app-x/uts/uts_diff_ts.html
- Hello uni-app x source: https://gitcode.com/dcloud/hello-uni-app-x
- Hello uvue source: https://gitcode.com/dcloud/hello-uvue
- Plugin market: https://ext.dcloud.net.cn/
