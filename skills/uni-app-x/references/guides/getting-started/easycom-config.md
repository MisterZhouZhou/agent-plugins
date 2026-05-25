# Easycom Configuration

easycom automatically registers components so templates can use component tags without manual imports.

## Local component convention

Use matching folder and file names:

```text
components/
└─user-card/
   └─user-card.uvue
```

Then use it directly:

```vue
<template>
  <view>
    <user-card></user-card>
  </view>
</template>
```

## uni_modules component convention

Component plugins can expose components from `uni_modules`:

```text
uni_modules/
└─demo-ui/
   └─components/
      └─demo-button/
         └─demo-button.uvue
```

## pages.json custom rule

Use custom rules when the component library has a predictable naming scheme:

```json
{
  "easycom": {
    "autoscan": true,
    "custom": {
      "^demo-(.*)": "uni_modules/demo-ui/components/demo-$1/demo-$1.uvue"
    }
  }
}
```

## Manual import fallback

Use manual import only when easycom does not match the component location or when the project already uses explicit registration.

```vue
<script setup lang="uts">
import userCard from "@/components/user-card/user-card.uvue"
</script>
```

## Troubleshooting

- Verify the component file extension is supported by the project.
- Ensure folder name, file name, and tag name match.
- Restart the dev/build process after changing `pages.json`.
- Check whether a component library is built for uni-app x, not only classic uni-app.
- Avoid mixing old Vue2 component registration examples into `.uvue` pages.
