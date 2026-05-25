# Custom Theme

Use `uni.scss`, `App.uvue`, and component classes to keep visual tokens consistent across pages.

## Global variables

Define shared variables in `uni.scss`:

```scss
$uni-color-primary: #007AFF;
$uni-color-success: #22C55E;
$uni-color-warning: #F59E0B;
$uni-color-error: #EF4444;
$uni-text-color: #111827;
$uni-bg-color: #F6F7F9;
```

## Use variables in pages

```vue
<style lang="scss">
.button {
  background-color: $uni-color-primary;
  color: #ffffff;
  border-radius: 8rpx;
}
</style>
```

## Global styles

Put app-level styles in `App.uvue`, but remember App rendering does not inherit all web CSS behavior. Give important child elements their own classes.

```vue
<style>
.page {
  width: 750rpx;
  min-height: 100%;
  background-color: #f6f7f9;
}
</style>
```

## Platform-specific theme differences

```scss
/* #ifdef WEB */
$uni-color-primary: #2563EB;
/* #endif */

/* #ifdef MP-WEIXIN */
$uni-color-primary: #07C160;
/* #endif */

/* #ifdef APP-ANDROID */
$uni-color-primary: #007AFF;
/* #endif */
```

## Checklist

- Keep token names stable.
- Avoid relying on CSS inheritance for App layout.
- Use class selectors only in App-facing styles.
- Test color contrast and spacing on each target platform.
- Use `rpx` for responsive dimensions and reserve `px` for fixed physical sizes.
