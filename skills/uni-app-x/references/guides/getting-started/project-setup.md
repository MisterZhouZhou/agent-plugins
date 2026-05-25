# Project Setup

## uni-app x 项目识别

uni-app x 项目通常包含：

```
├─components/           Vue/UVue components, easycom supported
├─pages/                Page files, usually .uvue
│  ├─index/
│  │  └─index.uvue
│  └─list/
│     └─list.uvue
├─static/               Static assets: images, fonts, media
├─uni_modules/          UTS plugins and uni_modules packages
├─platforms/            Platform-specific pages
├─nativeResources/      Native resources
│  ├─android/
│  └─ios/
├─harmonyConfig/        HarmonyOS native resources
├─hybrid/               Local HTML for web-view
├─main.uts              Vue initialization entry
├─App.uvue              App-level lifecycle and global styles
├─pages.json            Routing, navigation bar, tabBar
├─manifest.json         App name, appid, version, packaging info
├─AndroidManifest.xml   Android manifest
├─Info.plist            iOS config
└─uni.scss              Built-in style variables
```

## Required manifest marker

Treat a project as uni-app x only when `manifest.json` contains `"uni-app-x": {}`.

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

## Architecture summary

- Android: project code compiles to Kotlin, with native performance and no JS engine for App runtime.
- iOS: pages currently use JS-driven mode, while UTS plugins can compile to Swift.
- HarmonyOS: compiles to ArkTS.
- Web: compiles to JavaScript and uses Vue.js.
- Mini Programs: compiles to JavaScript for target mini-program runtimes.

## Working approach

1. Inspect `manifest.json`, `pages.json`, `main.uts`, and `App.uvue` first.
2. Check whether the failing code is page code, component code, a UTS API plugin, or platform-native code.
3. Keep fixes compatible with the declared target platforms.
4. Use conditional compilation for platform-only APIs.
5. Prefer project-local patterns over introducing new architecture.

## Common project checks

- `pages.json` paths must match actual page directories.
- Static resources referenced by template paths should live under `/static/`.
- App-facing styles should avoid unsupported CSS selectors and layout modes.
- UTS files should not rely on `undefined`, truthy/falsy checks, or untyped dynamic objects.
