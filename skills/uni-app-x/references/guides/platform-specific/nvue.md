# nvue Compatibility Notes

uni-app x uses UVue and UCSS rather than classic nvue as the primary model, but older UniApp/nvue knowledge is still useful when thinking about native-rendered constraints.

## What carries over

- Flex-first layout thinking.
- Restricted CSS expectations.
- Avoiding Web-only selectors and browser-only APIs in native pages.
- Testing native rendering separately from Web.

## What changes in uni-app x

- Pages generally use `.uvue`.
- Scripts use UTS, not JavaScript.
- There is no `undefined`; use `null`.
- Conditions must be boolean.
- Native API access should be written as guarded UTS code.

## Migration example

Old JS-style truthy checks should become typed UTS checks:

```uts
let content: string | null = null

if (content != null) {
  console.log(content)
}
```

## Style guidance

```css
.container {
  flex-direction: column;
  padding: 20rpx;
}

.row {
  flex-direction: row;
  align-items: center;
}
```

## Checklist

- Do not copy nvue examples blindly into `.uvue`.
- Replace JS with typed UTS.
- Replace `APP-PLUS-NVUE` assumptions with uni-app x target conditions where relevant.
- Recheck component compatibility in uni-app x.
