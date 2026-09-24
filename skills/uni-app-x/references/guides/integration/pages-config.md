# Pages Configuration

`pages.json` registers routes and controls navigation bars, pull-down refresh, reach-bottom distance, and tabBar.

## Basic configuration

```json
{
  "pages": [
    {
      "path": "pages/index/index",
      "style": {
        "navigationBarTitleText": "Home"
      }
    }
  ],
  "globalStyle": {
    "navigationBarTextStyle": "black",
    "navigationBarTitleText": "uni-app x",
    "navigationBarBackgroundColor": "#ffffff",
    "backgroundColor": "#f6f7f9"
  }
}
```

## Native navigation bar

```json
{
  "pages": [
    {
      "path": "pages/index/index",
      "style": {
        "navigationBarTitleText": "Home",
        "navigationBarBackgroundColor": "#007AFF",
        "navigationBarTextStyle": "white"
      }
    }
  ]
}
```

## Custom navigation

Use custom navigation when the page implements its own header component:

```json
{
  "pages": [
    {
      "path": "pages/index/index",
      "style": {
        "navigationStyle": "custom",
        "navigationBarTitleText": "Home"
      }
    }
  ]
}
```

When custom navigation is used, handle safe-area spacing and status bar differences per platform.

## Navigation bar buttons

uni-app x has no pages.json config for navigation bar buttons. `app-plus.titleNView.buttons` was removed together with all other app-plus-only config, and the remaining `h5.titleNView.buttons` works on Web only. Do not use either one, including on Web-only pages; use the same custom navigation approach on every platform.

For a header action button on any platform, combine `navigationStyle: "custom"` with the uni-nav-bar component and its `#right` slot:

```vue
<template>
  <view class="page">
    <uni-nav-bar title="Home" fixed left-icon="left" @clickLeft="goBack">
      <template #right>
        <text class="nav-btn" @click="onAction">Button</text>
      </template>
    </uni-nav-bar>

    <scroll-view class="content" direction="vertical">
      <!-- page content -->
    </scroll-view>
  </view>
</template>

<script setup lang="uts">
const onAction = () => {
  console.log("right button clicked")
}

const goBack = () => {
  uni.navigateBack()
}
</script>

<style>
.content {
  flex: 1;
}

.nav-btn {
  font-size: 14px;
  color: #007AFF;
  padding: 0 8px;
}
</style>
```

Notes:

- Pair the page with `"disableScroll": true` and scroll inside `<scroll-view>` so bounce or pull-down does not shift the fixed bar.
- `fixed` on uni-nav-bar handles the status-bar height automatically; no manual `--status-bar-height` padding is needed.
- On MP-WEIXIN, keep `#right` content clear of the capsule button: read `uni.getMenuButtonBoundingClientRect()` and offset the slot with `margin-right`.

## tabBar

```json
{
  "tabBar": {
    "color": "#777777",
    "selectedColor": "#007AFF",
    "borderStyle": "black",
    "backgroundColor": "#ffffff",
    "list": [
      {
        "pagePath": "pages/index/index",
        "iconPath": "static/tab/home.png",
        "selectedIconPath": "static/tab/home-active.png",
        "text": "Home"
      },
      {
        "pagePath": "pages/profile/profile",
        "iconPath": "static/tab/profile.png",
        "selectedIconPath": "static/tab/profile-active.png",
        "text": "Profile"
      }
    ]
  }
}
```

## Pull-down refresh and reach bottom

```json
{
  "pages": [
    {
      "path": "pages/list/list",
      "style": {
        "navigationBarTitleText": "List",
        "enablePullDownRefresh": true,
        "onReachBottomDistance": 80
      }
    }
  ]
}
```

```vue
<script setup lang="uts">
onPullDownRefresh(() => {
  refreshList()
  uni.stopPullDownRefresh()
})

onReachBottom(() => {
  loadMore()
})

function refreshList(): void {
  console.log("refresh")
}

function loadMore(): void {
  console.log("load more")
}
</script>
```

## Conditional page config

Use conditional configuration only when the platform behavior genuinely differs:

```json
{
  "pages": [
    {
      "path": "pages/index/index",
      "style": {
        "navigationBarTitleText": "Home",
        "// #ifdef WEB": {
          "navigationStyle": "custom"
        },
        "// #ifdef MP-WEIXIN": {
          "navigationBarTitleText": "WeChat Home"
        }
      }
    }
  ]
}
```

## Checklist

- Every `pages[].path` has a matching page file.
- tabBar page paths are registered in `pages`.
- tabBar icon paths point to files in `/static/`.
- Custom navigation handles safe area and back behavior.
- Pull-down refresh calls `uni.stopPullDownRefresh()` when work completes.
