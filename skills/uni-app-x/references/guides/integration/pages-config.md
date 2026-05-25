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
