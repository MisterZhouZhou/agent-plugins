# Mini Program Platform

Mini Program targets have appid, package size, API, and platform permission constraints.

## manifest target

```json
{
  "mp-weixin": {
    "appid": "your-appid",
    "setting": {
      "urlCheck": false,
      "minified": true,
      "postcss": true
    }
  }
}
```

## Conditional code

```uts
// #ifdef MP-WEIXIN
console.log("WeChat Mini Program")
// #endif
```

## Login

```uts
// #ifdef MP-WEIXIN
uni.login({
  provider: "weixin",
  success: (res) => {
    console.log(res.code)
  }
})
// #endif
```

## Share

```uts
// In page options style when the project uses Options API
onShareAppMessage() {
  // #ifdef MP-WEIXIN
  return {
    title: "Share title",
    path: "/pages/index/index",
    imageUrl: "/static/share.png"
  }
  // #endif
}
```

## Pull-down refresh

```uts
onPullDownRefresh(() => {
  refresh()
  uni.stopPullDownRefresh()
})
```

## Checklist

- Configure the correct appid for each Mini Program platform.
- Keep package size under platform limits.
- Put share images and tab icons in `/static/`.
- Avoid unsupported browser and native App APIs.
- Test with the target Mini Program developer tool.
