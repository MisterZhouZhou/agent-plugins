---
name: uni-app-x
description: "Develop, debug, migrate, and structure uni-app x projects using UTS, UVue, UCSS, pages.json, manifest.json, uni APIs, platform conditional compilation, and UTS plugins. Use this skill whenever the user mentions uni-app x, .uvue, .uts, UTS, UVue, DCloud, HBuilderX, native cross-platform apps, or needs Android/iOS/HarmonyOS/Web/Mini Program behavior handled in one codebase."
---

# uni-app x Development Skill

Expert guidance for building uni-app x applications: DCloud's next-generation cross-platform engine using UTS and UVue.

## When to use this skill

Use this skill when the user wants to:
- Create, inspect, debug, or refactor a uni-app x project
- Work with `.uvue`, `.uts`, `main.uts`, `App.uvue`, `pages.json`, or `manifest.json`
- Fix UTS type errors, null handling, native imports, or cross-platform compilation failures
- Build UVue pages/components and configure easycom components
- Implement platform-specific logic for Android, iOS, HarmonyOS, Web, or Mini Programs
- Use uni APIs for navigation, storage, networking, UI feedback, or system information
- Develop or consume UTS plugins in `uni_modules`
- Migrate habits from Vue/TypeScript/uni-app to uni-app x safely

## How to use this skill

Choose the smallest relevant reference file before editing code:

1. **Project recognition and setup**
   - Load `references/guides/getting-started/installation.md` for HBuilderX, CLI, plugin, dependency, and verification workflow.
   - Load `references/guides/getting-started/project-setup.md` for project structure, required files, and `manifest.json` marker.
   - Load `references/guides/getting-started/easycom-config.md` for auto component registration and custom component path rules.
   - Load `templates/basic-uni-app-x-project.md` when scaffolding a minimal project or explaining expected files.

2. **UTS language and typing**
   - Load `references/uts-language.md` for UTS syntax, null rules, boolean conditions, type casting, and native API imports (English quick-ref).
   - Load `references/uts/overview.md` for UTS compilation targets and type system overview.
   - Load `references/uts/data-type.md` for data types (boolean, number, string, UTSJSONObject, Map, Set, platform types).
   - Load `references/uts/function-module.md` for function declaration, exception handling, and module export/import.
   - Load `references/uts/conditional.md` for conditional compilation directives (#ifdef, #ifndef).
   - Prefer explicit types and `null` over TypeScript habits like `undefined`, truthy checks, or structural duck typing.

3. **UVue pages and components**
   - Load `references/guides/development/uvue-pages-components.md` for page/component lifecycle, Composition API, Options API, refs, and easycom (English quick-ref).
   - Load `references/vue/uvue.md` for uvue file format, three root nodes, and API injection rules.
   - Load `references/vue/component.md` for easycom, ref types, calling child methods, and defineExpose.
   - Load `references/vue/composition-api.md` for reactive core (ref, reactive, computed generic types, watch).
   - Load `references/vue/data-bind-modifier.md` for event modifiers (.stop, .prevent, etc.) and v-model modifiers.
   - Load `references/core/lifecycle.md` for page lifecycle order and composition API lifecycle hooks.
   - Load `references/core/app.md` for App.uvue lifecycle, globalData, and global methods.
   - Use `.uvue` for pages and components unless the existing project clearly uses another supported convention.

4. **UCSS and layout**
   - Load `references/guides/development/ucss-layout.md` for App-safe CSS rules, flex layout, rpx, selector limits, and supported properties.
   - Load `references/css/ucss.md` for UCSS constraints summary (flex/absolute only, no style inheritance, text styles on text element, page scroll behavior).
   - Load `references/css/font-family.md` for `font-family`, `@font-face`, custom font formats, `uni-icon`, and App/HarmonyOS font differences.
   - Design layouts with flex and absolute positioning because App rendering supports a web-CSS subset.

5. **Configuration and project structure**
   - Load `references/api/config-api.md` for `pages.json`, `manifest.json`, `tabBar`, lifecycle-related style options, and static resource rules.
   - Load `references/api/integration-api.md` for compact API-shaped examples of easycom, pages, manifest, uni APIs, and conditional compilation.
   - Load `references/core/project.md` for project directory structure and run/publish workflow.
   - Load `references/core/page.md` for page file format, pages.json registration, and dialogPage.
   - Load `references/core/compiler.md` for compiler behavior, static resources, and build cache.
   - Always confirm `manifest.json` contains `"uni-app-x": {}` before treating a project as uni-app x.

6. **uni APIs and built-in components**
   - Load `references/api/uni-api.md` for navigation, UI feedback, storage, network, system info, `getApp`, and `getCurrentPages` quick reference.
   - Load `references/api/navigation.md` for detailed page routing API parameters and platform notes.
   - Load `references/api/network.md` for detailed `uni.request`, `uni.uploadFile`, WebSocket API parameters.
   - Load `references/api/storage.md` for detailed storage API parameters and sync/async variants.
   - Load `references/api/ui.md` for detailed UI interaction API (toast, modal, actionSheet, loading, navigationBar).
   - Load `references/api/device.md` for system info and network status APIs.
   - Load `references/api/components-api.md` when selecting built-in components such as `list-view`, `scroll-view`, `swiper`, `image`, `video`, or form controls.
   - Load `references/components/built-in/<component>.md` for detailed component attributes, events, and platform compatibility.
   - For horizontal `scroll-view` issues, load `references/components/built-in/scroll-view.md` and prefer the App/HarmonyOS pattern there: `direction="horizontal"`, `flex-direction: row`, direct fixed-width child cells, and spacing embedded in child cell width.
   - Load `references/features/navigation.md` for navigation usage patterns, URL params, props passing, and tabBar constraints.
   - Load `references/features/storage.md` for storage App vs H5 differences and sync/async usage.
   - Load `references/features/api-request.md` for request data handling with UTSJSONObject/type generics, streaming, and App limitations.
   - Load `references/features/api-event-system-info.md` for event bus (uni.$on/$emit), launch options, and system info.
   - Load `references/features/api-overview.md` for API source overview (UTS built-in, global, uni.xxx, DOM, Vue, native).
   - Load `references/guides/integration/navigation.md` for page routing, tabBar, query params, and custom navigation behavior.
   - Load `references/guides/integration/uni-api.md` for request/loading/storage/upload/location API flows with typed UVue state.

7. **Platform-specific behavior**
   - Load `references/guides/platform-specific/platform-conditions.md` for conditional compilation and platform support.
   - Load `references/guides/platform-specific/app.md` for Android/iOS App permissions, native resources, safe area, and native plugin boundaries.
   - Load `references/guides/platform-specific/h5.md` for Web router, browser APIs, responsive CSS, and Web-only code.
   - Load `references/guides/platform-specific/miniprogram.md` for Mini Program appids, package constraints, login/share, and target-specific APIs.
   - Load `references/guides/platform-specific/nvue.md` when migrating older nvue knowledge to uni-app x UVue/UCSS constraints.
   - Load `references/features/web.md` for Web vs App compilation differences and Web-specific limitations.
   - Load `references/features/adapt.md` for wide-screen adaptation (leftWindow/rightWindow for Web, component-level for all platforms).
   - Keep platform imports inside matching `#ifdef` blocks.

8. **UI features and interactions**
   - Load `references/features/list-scroll.md` for scroll-view vs list-view, sticky headers, pull-down refresh, and long list optimization.
   - Load `references/features/form.md` for form submit/reset, input/checkbox/radio/switch/slider usage.
   - Load `references/features/dom.md` for DOM API, UniElement, getElementById, and ref usage.
   - Load `references/features/idref.md` for id vs ref, component ref types, and dialogPage element access.
   - Load `references/features/dialog-page.md` for dialog page registration, openDialogPage/closeDialogPage, and differences from main pages.
   - Load `references/features/global-state.md` for globalData and reactive store module patterns (no pinia/vuex on App).
   - Load `references/features/get-current-pages.md` for getCurrentPages(), UniPage API, and $page usage.
   - Load `references/features/vue-directives.md` for v-if, v-show, v-for, v-model, v-bind, v-on usage and priority rules.
   - Load `references/features/theme-dark.md` for osTheme/hostTheme/appTheme, theme.json, and uni.setAppTheme.
   - Load `references/features/i18n.md` for internationalization approaches (lime-i18n for App, vue-i18n for Web).
   - Load `references/features/codegap.md` for JS-to-UTS migration: strong typing and native rendering differences.

9. **UTS plugin work**
   - Load `references/guides/plugins/plugin-ecosystem.md` for plugin market, uni_modules, paid plugins, plugin installation/update/publish flow, and package.json compatibility metadata.
   - Load `references/guides/plugins/plugin-publish-sell.md` for plugin publishing, paid plugin encryption, trial, revenue, and settlement rules.
   - Load `references/guides/plugins/uts-plugin-api.md` for UTS API plugin basics, interface.uts, platform directory priority, and native resource configuration.
   - Load `references/guides/plugins/uts-components.md` for UTS standard-mode components, uni-app compatible-mode components, native-view, props/events/methods, and component mode selection.
   - Load `references/guides/plugins/uts-native-hybrid.md` for Kotlin/Java/Swift/ArkTS/JS native hybrid coding inside UTS plugins.
   - Load `references/guides/plugins/uts-platform-guides.md` for Android/iOS/HarmonyOS UTS development, CocoaPods, and Swift Package Manager dependencies.
   - Load `references/guides/plugins/uts-plugin-development.md` for `uni_modules` plugin structure, API plugins, component plugins, and per-platform implementation directories.
   - Load `references/guides/advanced/native-sdk.md` for native SDK integration (iOS/Android/HarmonyOS hybrid development).

10. **Advanced work**
    - Load `references/guides/advanced/build-optimization.md` for package size, long-list performance, assets, and platform-specific builds.
    - Load `references/guides/advanced/custom-theme.md` for `uni.scss`, design tokens, global styles, and platform-specific themes.
    - Load `references/guides/advanced/multi-platform.md` for shared API wrappers, environment selection, and release checklists.
    - Load `references/best-practices/performance.md` for DOM optimization, animation, main thread, and long list best practices.
    - Load `references/best-practices/request.md` for request data handling patterns (UTSJSONObject vs type generics).
    - Load `references/best-practices/options-to-composition.md` when migrating Options API code to Composition API.
    - Load `references/tutorials/ls-ai-rules.md` for language service plugin setup, AI Rules, and MCP configuration.

## Important rules

- UTS has no `undefined`; initialize values and use `null`.
- Conditions must be boolean: write `if (value != null)` and `if (list.length > 0)`.
- App layout supports a restricted UCSS subset; use class selectors and flex layouts.
- Static images, fonts, and media belong in `/static/`; do not put `.uts` or `.css` files there.
- For custom fonts, prefer `/static/` or `uni_modules/*/static/` assets and load them with `@font-face { src: url(...) }`.
- App `font-family` does not inherit and does not support comma-separated fallback lists; set one font explicitly on each text-like component that needs it.
- HarmonyOS custom fonts support `ttf` and `otf`; avoid assuming `woff`, `woff2`, or variable fonts work on App targets.
- When images disappear only on HarmonyOS devices, first verify the asset exists, path case matches exactly, the path is absolute under `/static/`, and the compiler can discover it. Prefer static `src="/static/..."` for fixed UI assets instead of dynamic `:src` when possible.
- For critical local UI images on HarmonyOS, prefer normal PNG `8-bit RGB/RGBA` assets. Convert palette/PaletteAlpha PNGs and device-problematic WebP assets to PNG before debugging layout or color; confirm with `file` or PNG header checks.
- If a valid local `<image>` renders at first but disappears after tab switches, page show/hide, or repeated navigation on HarmonyOS, force remount the image node on `onPageShow`: gate it with `v-if`, increment a `:key`, and restore visibility in `setTimeout(..., 0)`. Keep the original static `src` when the asset is fixed.
- When an image is present but appears as blank space, distinguish decode failure from layout behavior: `aspectFit` may create visible padding in containers with different aspect ratios; use `aspectFill` plus `overflow: hidden` when the design requires the image to fill the hero/status-bar area.
- For opening external apps, browsers, maps, or app stores from uni-app x 4.75 App targets, prefer the `uts-openSchema` plugin (`https://ext.dcloud.net.cn/plugin?name=uts-openSchema`) and import `openSchema`/`canOpenURL` from `@/uni_modules/uts-openSchema`. It supports Android 5.0+, iOS 12+, and HarmonyOS 5.0+ in uni-app x, not Chrome/Safari/WeChat Mini Program.
- To open Huawei AppGallery on HarmonyOS, call `openSchema('store://appgallery.huawei.com/app/detail?id=' + appId)` inside the HarmonyOS/App platform branch. Use the real AppGallery app id or bundle id for the target app, not example ids.
- Provide a fallback when AppGallery schema opening fails, commonly `https://appgallery.huawei.com/app/detail?id=<appId>&channelId=SHARE&source=appshare`, opened through the project's webview page with `encodeURIComponent`. Use `canOpenURL()` when the UX needs a pre-check for a scheme.
- For Android app-store detail pages, `openSchema('market://details?id=' + packageName)` is the common form; keep platform-specific schema calls inside matching conditional compilation blocks such as `APP-HARMONY`, `APP-ANDROID`, or `APP-IOS`.
- For custom fonts, prefer `/static/` or `uni_modules/*/static/` assets and load them with `@font-face { src: url(...) }`.
- App `font-family` does not inherit and does not support comma-separated fallback lists; set one font explicitly on each text-like component that needs it.
- HarmonyOS custom fonts support `ttf` and `otf`; avoid assuming `woff`, `woff2`, or variable fonts work on App targets.
- Use `rpx` for responsive sizing and explicit fixed units only when a fixed physical size is intentional.
- Test target platforms separately because Android, iOS, HarmonyOS, Web, and Mini Programs do not share identical runtime behavior.
- Use `list-view` for large lists instead of rendering long `v-for` lists inside `scroll-view`.
- For uni-app x horizontal `scroll-view`, prefer `direction="horizontal"` over old `scroll-x`; set explicit width/height and `flex-direction: row` on the scroll-view; make fixed-width scroll items direct children; avoid relying on wrapper views, `inline-block`, `white-space`, trailing `margin-right`, or empty trailing spacer nodes for App/HarmonyOS horizontal measurement.
- When answering from this skill's bundled documentation, always append a short "文档引用" section listing the specific reference/template files and line numbers used, such as `references/core/lifecycle.md:23` or `references/core/lifecycle.md:34-37`. Check line numbers with `nl -ba`, `rg -n`, or an equivalent source view. Cite only the lines actually used as evidence. Do not cite `SKILL.md` in "文档引用"; it is an instruction/index file, not supporting product documentation. If no bundled reference/template document was needed, say so explicitly instead of inventing citations.

## References and templates

### Getting Started
- `references/guides/getting-started/installation.md` - setup, dependency/plugin installation, and verification workflow
- `references/guides/getting-started/project-setup.md` - uni-app x project structure and required markers
- `references/guides/getting-started/easycom-config.md` - easycom auto-registration and component path rules
- `references/core/project.md` - project directory structure and run/publish workflow
- `references/core/page.md` - page file format, pages.json registration, dialogPage
- `references/core/compiler.md` - compiler behavior, static resources, build cache
- `references/tutorials/ls-ai-rules.md` - language service plugin, AI Rules, MCP configuration

### UTS Language
- `references/uts-language.md` - UTS language rules and TypeScript differences (English quick-ref)
- `references/uts/overview.md` - UTS compilation targets and type system overview
- `references/uts/data-type.md` - data types (boolean, number, string, UTSJSONObject, Map, Set, platform types)
- `references/uts/function-module.md` - function declaration, exception handling, module export/import
- `references/uts/conditional.md` - conditional compilation directives (#ifdef, #ifndef)

### Vue / UVue
- `references/guides/development/uvue-pages-components.md` - UVue page/component examples and lifecycle (English quick-ref)
- `references/vue/uvue.md` - uvue file format, three root nodes, API injection
- `references/vue/component.md` - easycom, ref types, child method calls, defineExpose
- `references/vue/composition-api.md` - reactive core (ref, reactive, computed generic types, watch)
- `references/vue/data-bind-modifier.md` - event modifiers and v-model modifiers
- `references/core/lifecycle.md` - page lifecycle order and composition API lifecycle hooks
- `references/core/app.md` - App.uvue lifecycle, globalData, global methods
- `references/features/vue-directives.md` - v-if, v-show, v-for, v-model, v-bind, v-on
- `references/best-practices/options-to-composition.md` - Options API to Composition API migration guide

### UCSS / Styling
- `references/guides/development/ucss-layout.md` - UCSS layout and styling constraints (English, with property list)
- `references/css/ucss.md` - UCSS constraints summary (Chinese)
- `references/css/font-family.md` - font-family, @font-face, custom font formats, uni-icon, and platform differences
- `references/features/theme-dark.md` - dark theme, theme.json, uni.setAppTheme

### API Reference
- `references/api/README.md` - API category index and calling conventions
- `references/api/config-api.md` - `pages.json`, `manifest.json`, tabBar, and static resource configuration
- `references/api/integration-api.md` - compact integration API reference across config, APIs, and platform conditions
- `references/api/uni-api.md` - Common `uni.*` APIs quick reference
- `references/api/components-api.md` - Built-in component selection and common attributes
- `references/api/navigation.md` - page routing API (navigateTo, redirectTo, reLaunch, switchTab, navigateBack)
- `references/api/network.md` - network request API (request, uploadFile, downloadFile, WebSocket)
- `references/api/storage.md` - data storage API (setStorage, getStorage, removeStorage, clearStorage)
- `references/api/ui.md` - UI interaction API (showToast, showModal, showActionSheet, showLoading)
- `references/api/device.md` - device info API (getSystemInfo, getNetworkType)
- `references/api/media.md` - media API (chooseImage, previewImage, getImageInfo, etc.)
- `references/api/location.md` - location API (getLocation, openLocation, chooseLocation)
- `references/api/file.md` - file system API
- `references/api/payment.md` - payment API
- `references/api/share.md` - share API
- `references/api/other.md` - other miscellaneous APIs
- `references/features/api-overview.md` - API source overview (UTS built-in, global, uni.xxx, DOM, Vue, native)
- `references/features/api-request.md` - request data handling (UTSJSONObject vs type generics, streaming, App limits)
- `references/features/api-event-system-info.md` - event bus (uni.$on/$emit), launch options, system info
- `references/features/navigation.md` - navigation usage patterns, URL params, props, tabBar constraints
- `references/features/storage.md` - storage App vs H5 differences, sync/async usage
- `references/best-practices/request.md` - request data handling best practices

### Component Reference
- `references/components/README.md` - component index
- `references/components/built-in/<component>.md` - detailed attributes, events, and platform compatibility per component (40 components)
- `references/features/component-overview.md` - component classification (standard, ext, custom, native)

### UI Features
- `references/features/list-scroll.md` - scroll-view vs list-view, sticky headers, pull-down refresh
- `references/features/form.md` - form submit/reset, input/checkbox/radio/switch/slider
- `references/features/dom.md` - DOM API, UniElement, getElementById, ref
- `references/features/idref.md` - id vs ref, component ref types, dialogPage element access
- `references/features/dialog-page.md` - dialog page registration, openDialogPage/closeDialogPage
- `references/features/global-state.md` - globalData and reactive store module (no pinia/vuex on App)
- `references/features/get-current-pages.md` - getCurrentPages(), UniPage API, $page usage
- `references/features/i18n.md` - internationalization (lime-i18n for App, vue-i18n for Web)

### Integration Guides
- `references/guides/integration/pages-config.md` - page style, tabBar, pull-down refresh, and conditional page config
- `references/guides/integration/manifest-config.md` - H5, App, HarmonyOS, and Mini Program manifest fields
- `references/guides/integration/navigation.md` - navigation, tabBar routing, params, and back behavior
- `references/guides/integration/uni-api.md` - typed API flows for network, storage, upload, location, and UI state

### Platform and Plugins
- `references/guides/platform-specific/platform-conditions.md` - Conditional compilation and platform support
- `references/guides/platform-specific/app.md` - Android/iOS App-specific configuration and native boundaries
- `references/guides/platform-specific/h5.md` - Web/H5 routing, browser APIs, and responsive behavior
- `references/guides/platform-specific/miniprogram.md` - Mini Program configuration and API constraints
- `references/guides/platform-specific/nvue.md` - nvue-to-UVue migration notes and style compatibility
- `references/guides/plugins/plugin-ecosystem.md` - plugin market, uni_modules, paid plugins, publishing, and package metadata
- `references/guides/plugins/plugin-publish-sell.md` - plugin publishing, paid plugin encryption, trial, revenue, settlement
- `references/guides/plugins/uts-plugin-api.md` - UTS API plugin basics, interface.uts, platform directories, native resources
- `references/guides/plugins/uts-components.md` - UTS standard-mode and uni-app compatible-mode components
- `references/guides/plugins/uts-native-hybrid.md` - UTS native hybrid coding with Kotlin/Java/Swift/ArkTS/JS
- `references/guides/plugins/uts-platform-guides.md` - Android/iOS/HarmonyOS UTS platform notes, CocoaPods, SPM
- `references/guides/plugins/uts-plugin-development.md` - UTS plugin structure and implementation guidance
- `references/features/web.md` - Web vs App compilation differences and Web-specific limitations
- `references/features/adapt.md` - wide-screen adaptation (leftWindow/rightWindow for Web, component-level for all)
- `references/features/codegap.md` - JS-to-UTS migration: strong typing and native rendering differences

### Advanced and Best Practices
- `references/guides/advanced/build-optimization.md` - build, package size, asset, and runtime performance optimization
- `references/guides/advanced/custom-theme.md` - theme tokens and platform-specific styling
- `references/guides/advanced/multi-platform.md` - multi-platform release strategy and shared wrappers
- `references/guides/advanced/native-sdk.md` - native SDK integration for iOS/Android/HarmonyOS hybrid development
- `references/best-practices/performance.md` - DOM optimization, animation, main thread, long list best practices
- `references/best-practices/options-to-composition.md` - Options API to Composition API migration

### Templates
- `templates/basic-uni-app-x-project.md` - Minimal project template
- `templates/page-template.uvue.md` - Typed UVue page template
- `templates/pages-json-template.md` - Starter `pages.json`
- `templates/manifest-template.md` - Starter `manifest.json`

## Resources

- Official docs: https://doc.dcloud.net.cn/uni-app-x/
- UTS language: https://doc.dcloud.net.cn/uni-app-x/uts/
- Vue in uni-app x: https://doc.dcloud.net.cn/uni-app-x/vue/
- CSS reference: https://doc.dcloud.net.cn/uni-app-x/css/
- CSS font-family: https://doc.dcloud.net.cn/uni-app-x/css/font-family.html#font-family
- CSS at-rules font: https://doc.dcloud.net.cn/uni-app-x/css/common/at-rules.html#font
- Components: https://doc.dcloud.net.cn/uni-app-x/component/
- API reference: https://doc.dcloud.net.cn/uni-app-x/api/
- UTS plugin development: https://doc.dcloud.net.cn/uni-app-x/plugin/uts-plugin.html
- pages.json: https://doc.dcloud.net.cn/uni-app-x/collocation/pagesjson.html
- UTS vs TS differences: https://doc.dcloud.net.cn/uni-app-x/uts/uts_diff_ts.html
- Hello uni-app x source: https://gitcode.com/dcloud/hello-uni-app-x
- Hello UVue source: https://gitcode.com/dcloud/hello-uvue
- DCloud plugin market: https://ext.dcloud.net.cn/

## Keywords

uni-app-x, uniapp x, uni-app x, UTS, UVue, uvue, ucss, DCloud, HBuilderX, `main.uts`, `App.uvue`, `pages.json`, `manifest.json`, `uni_modules`, Android, iOS, HarmonyOS, Web, Mini Program, 小程序, 跨平台, 条件编译
