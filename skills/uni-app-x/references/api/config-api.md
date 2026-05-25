# Configuration API

Project-level configuration reference for uni-app-x.

## pages.json

`pages.json` controls routing, navigation bar style, global page style, and tabBar.

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
    },
    {
      "path": "pages/my/my",
      "style": {
        "navigationBarTitleText": "Profile"
      }
    }
  ],
  "globalStyle": {
    "navigationBarTextStyle": "black",
    "navigationBarTitleText": "My App",
    "navigationBarBackgroundColor": "#F8F8F8",
    "backgroundColor": "#F8F8F8"
  },
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

## manifest.json

uni-app-x projects must include the `uni-app-x` marker.

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

## Static resources

- Put images, fonts, audio, and video in `/static/`.
- Do not put `.uts`, `.uvue`, `.css`, or source files in `/static/`.
- Prefer absolute static paths such as `/static/images/logo.png`.
- Avoid dynamic image paths when the compiler needs to discover assets.

```vue
<image src="/static/images/logo.png" class="logo"></image>
```

## Configuration checklist

- Page paths in `pages.json` match files under `pages/`.
- `tabBar.list[].pagePath` points to registered pages.
- Tab icons exist in `/static/`.
- App projects have `manifest.json.uni-app-x`.
- Platform packaging settings remain under their expected native/platform config files.
