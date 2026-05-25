# Multi-Platform Strategy

uni-app x can target Android, iOS, HarmonyOS, Web, and Mini Programs, but shared code still needs explicit platform boundaries.

## Organize platform differences

Prefer small conditional blocks near platform-specific behavior:

```uts
const getPlatformName = (): string => {
  // #ifdef APP-ANDROID
  return "android"
  // #endif

  // #ifdef APP-IOS
  return "ios"
  // #endif

  // #ifdef WEB
  return "web"
  // #endif

  return "unknown"
}
```

For larger differences, use platform-specific files or UTS plugin platform directories.

## Shared request wrapper

```uts
type RequestOptions = {
  url: string
  method: string
  data: any | null
}

function request(options: RequestOptions): void {
  uni.request({
    url: options.url,
    method: options.method,
    data: options.data,
    success: (res) => {
      console.log(res.data)
    },
    fail: (err) => {
      console.error(err)
    }
  })
}
```

## Environment selection

Keep environment data typed and centralized:

```uts
type EnvConfig = {
  baseUrl: string
}

const env: EnvConfig = {
  // #ifdef WEB
  baseUrl: "https://web-api.example.com"
  // #endif

  // #ifndef WEB
  baseUrl: "https://api.example.com"
  // #endif
}
```

## Release checklist

- Build and run every declared target platform.
- Verify permissions and privacy descriptions.
- Verify navigation and tabBar behavior.
- Verify static asset paths and package size.
- Verify platform-specific API branches compile only on intended targets.
- Record known platform differences in project docs.
