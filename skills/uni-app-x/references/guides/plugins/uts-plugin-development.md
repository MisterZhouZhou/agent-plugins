# UTS Plugin Development

UTS plugins live under `uni_modules` and can provide API capabilities, component capabilities, or both.

## Directory structure

```text
uni_modules/
└─ my-plugin/
   ├─ package.json
   ├─ index.uts
   ├─ utssdk/
   │  ├─ interface.uts
   │  ├─ app-android/
   │  │  └─ index.uts
   │  ├─ app-ios/
   │  │  └─ index.uts
   │  ├─ app-harmony/
   │  │  └─ index.uts
   │  ├─ web/
   │  │  └─ index.uts
   │  └─ mp-weixin/
   │     └─ index.uts
   └─ components/
      └─ my-plugin/
         └─ my-plugin.uvue
```

## Plugin types

1. API plugin: extends callable APIs used in `<script>`.
2. Component plugin: extends UI components used in `<template>`.

## Implementation guidance

- Put shared type declarations in `utssdk/interface.uts`.
- Put each platform implementation in its own platform directory.
- Keep platform-only imports out of shared files.
- Export a stable cross-platform interface even when some platforms provide limited behavior.
- Use component plugins when the user-facing surface is a template component rather than a script API.

## Review checklist

- `package.json` metadata matches the plugin name and entry.
- Public API names are consistent across platform implementations.
- Platform directories only contain code valid for that platform.
- Shared interface uses UTS-compatible types and avoids `undefined`.
- Example usage demonstrates both success and failure paths where relevant.
