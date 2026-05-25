# Common uni APIs

## Navigation

```uts
uni.navigateTo({ url: "/pages/detail/detail?id=1" })
uni.redirectTo({ url: "/pages/login/login" })
uni.navigateBack({ delta: 1 })
uni.switchTab({ url: "/pages/index/index" })
uni.reLaunch({ url: "/pages/index/index" })
```

## UI interaction

```uts
uni.showToast({ title: "Success", icon: "success" })
uni.showLoading({ title: "Loading..." })
uni.hideLoading()

uni.showModal({
  title: "Confirm",
  content: "Are you sure?",
  success: (res) => {
    if (res.confirm) {
      console.log("confirmed")
    }
  }
})

uni.showActionSheet({
  itemList: ["Option A", "Option B"],
  success: (res) => {
    console.log(res.tapIndex)
  }
})
```

## Storage

```uts
uni.setStorageSync("key", "value")
let value = uni.getStorageSync("key") as string
uni.removeStorageSync("key")

uni.setStorage({ key: "key", data: "value" })
uni.getStorage({
  key: "key",
  success: (res) => {
    console.log(res.data)
  }
})
```

## Network

```uts
uni.request({
  url: "https://api.example.com/data",
  method: "GET",
  success: (res) => {
    console.log(res.data)
  },
  fail: (err) => {
    console.error(err)
  }
})
```

## System info

```uts
let sysInfo = uni.getSystemInfoSync()
console.log(sysInfo.platform)
console.log(sysInfo.screenWidth)
console.log(sysInfo.deviceModel)
```

`platform` may identify targets such as `android`, `ios`, `harmonyos`, or `web`.

## getApp and getCurrentPages

```uts
let app = getApp()
let pages = getCurrentPages()
let currentPage = pages[pages.length - 1]
```

## API usage checklist

- Cast storage or network data before using it as a specific type.
- Check array length before indexing if the array may be empty.
- Use `switchTab` only for pages declared in `tabBar`.
- Keep platform-only APIs behind conditional compilation.
