# Platform Conditions

Use conditional compilation for platform-only code, imports, and behavior.

## Common conditions

```uts
// #ifdef APP-ANDROID
console.log("Android App")
// #endif

// #ifdef APP-IOS
console.log("iOS App")
// #endif

// #ifdef APP-HARMONY
console.log("HarmonyOS App")
// #endif

// #ifdef WEB
console.log("Web")
// #endif

// #ifdef MP-WEIXIN
console.log("WeChat Mini Program")
// #endif
```

## Native imports

Native imports must stay inside their matching platform block.

```uts
// #ifdef APP-ANDROID
import Build from 'android.os.Build'
console.log(Build.MODEL)
// #endif

// #ifdef APP-IOS
import { UIDevice } from 'UIKit'
console.log(UIDevice.current.name)
// #endif
```

## Platform support baseline

| Platform | Minimum version |
| --- | --- |
| Android | Android 5+ |
| iOS | iOS 12+ |
| HarmonyOS | API 14+ |
| Web release | Chrome 64, Safari 11.1, Firefox 62, Edge 79 |
| Mini Programs | WeChat supported |

## Cross-platform checklist

- Verify UI on every declared target platform.
- Keep native APIs isolated behind conditional compilation.
- Avoid assuming Web CSS support applies to App.
- Handle iOS page runtime differences separately from Android native compilation behavior.
- Keep Mini Program restrictions in mind for APIs, package size, and asset paths.
