# App Platform

App targets need extra care around native permissions, safe area, native resources, and UTS plugin boundaries.

## Platform conditions

```uts
// #ifdef APP-ANDROID
console.log("Android App")
// #endif

// #ifdef APP-IOS
console.log("iOS App")
// #endif
```

## Native resources

Common locations:

```text
nativeResources/
├─android/
└─ios/
AndroidManifest.xml
Info.plist
```

Keep Android permissions in Android-specific configuration and iOS privacy descriptions in iOS-specific configuration.

## Android native API

```uts
// #ifdef APP-ANDROID
import Build from 'android.os.Build'

const model = Build.MODEL
console.log(model)
// #endif
```

## iOS native API

```uts
// #ifdef APP-IOS
import { UIDevice } from 'UIKit'

const name = UIDevice.current.name
console.log(name)
// #endif
```

## Safe area and custom navigation

When `navigationStyle` is `custom`, account for status bar and safe area on devices with notches.

```vue
<template>
  <view class="header">
    <text class="title">Home</text>
  </view>
</template>
```

Prefer project-provided safe-area helpers if present.

## Checklist

- Native imports are guarded by `APP-ANDROID` or `APP-IOS`.
- Permissions match actual API usage.
- Real-device testing covers Android and iOS separately.
- App layout uses UCSS-compatible flex and class selectors.
- UTS plugins expose stable shared interfaces across platforms.
