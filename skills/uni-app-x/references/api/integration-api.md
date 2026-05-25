# Integration API

Compact reference for the configuration and APIs most often combined in uni-app x work.

## easycom

Local components can be resolved automatically when they follow directory naming conventions:

```text
components/
└─user-card/
   └─user-card.uvue
```

Use directly:

```vue
<template>
  <view>
    <user-card></user-card>
  </view>
</template>
```

For custom component libraries, declare path rules in `pages.json`:

```json
{
  "easycom": {
    "autoscan": true,
    "custom": {
      "^x-(.*)": "uni_modules/x-ui/components/x-$1/x-$1.uvue"
    }
  }
}
```

## pages.json shape

```json
{
  "pages": [
    {
      "path": "pages/index/index",
      "style": {
        "navigationBarTitleText": "Home",
        "navigationStyle": "default",
        "navigationBarBackgroundColor": "#ffffff",
        "navigationBarTextStyle": "black",
        "enablePullDownRefresh": true,
        "onReachBottomDistance": 50
      }
    }
  ],
  "globalStyle": {
    "navigationBarTextStyle": "black",
    "navigationBarTitleText": "uni-app x",
    "navigationBarBackgroundColor": "#ffffff",
    "backgroundColor": "#f6f7f9"
  },
  "tabBar": {
    "color": "#777777",
    "selectedColor": "#007AFF",
    "borderStyle": "black",
    "backgroundColor": "#ffffff",
    "list": [
      {
        "pagePath": "pages/index/index",
        "text": "Home",
        "iconPath": "static/tab/home.png",
        "selectedIconPath": "static/tab/home-active.png"
      }
    ]
  }
}
```

## manifest.json shape

```json
{
  "name": "my-uni-app-x",
  "appid": "__UNI__XXXXXX",
  "versionName": "1.0.0",
  "versionCode": "100",
  "uni-app-x": {},
  "h5": {
    "router": {
      "mode": "hash",
      "base": "/"
    }
  },
  "mp-weixin": {
    "appid": "",
    "setting": {
      "urlCheck": false,
      "minified": true
    }
  }
}
```

## Common uni APIs

```uts
uni.navigateTo({ url: "/pages/detail/detail?id=1" })
uni.switchTab({ url: "/pages/index/index" })
uni.navigateBack({ delta: 1 })

uni.request({
  url: "https://api.example.com/data",
  method: "GET",
  success: (res) => {
    console.log(res.data)
  }
})

uni.setStorageSync("token", "value")
let token = uni.getStorageSync("token") as string
```

## Conditional compilation

```uts
// #ifdef APP-ANDROID
console.log("Android only")
// #endif

// #ifdef APP-IOS
console.log("iOS only")
// #endif

// #ifdef WEB
console.log("Web only")
// #endif

// #ifdef MP-WEIXIN
console.log("WeChat Mini Program only")
// #endif
```

Use this file for quick shape recall. Load the deeper topic files when implementation details matter.
