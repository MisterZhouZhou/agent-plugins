# UCSS Layout and Styling

uni-app x App rendering implements a subset of web CSS. Code that works in Web may fail or render differently on App.

## Layout support

- App supports flex layout and absolute positioning.
- Default `flex-direction` is `column`, different from the W3C default `row`.
- Do not rely on `block`, `inline-block`, or `grid` layouts on App.
- Grid is only available in specific contexts such as the waterflow component.

## Critical CSS rules

1. Use class selectors only.
2. Do not use tag selectors, id selectors, or attribute selectors.
3. Parent styles do not cascade to children like normal web CSS inheritance.
4. Class names may contain only `A-Z`, `a-z`, `0-9`, `_`, and `-`.
5. Use `rpx` for responsive sizing: `750rpx` equals screen width.
6. Text styles (color, font-size, etc.) must be written on `<text>` elements, not parent containers.
7. Pages do not scroll by default. Wrap scrollable content in `<scroll-view>`.

## Supported property subset

```css
/* Layout */
display: flex;
flex-direction: row;
flex-direction: column;
flex-wrap: nowrap;
justify-content: center;
align-items: center;
flex: 1;
position: relative;
position: absolute;
position: fixed;
position: sticky;

/* Box model */
width: 750rpx;
height: 100rpx;
min-width: 0;
max-width: 750rpx;
margin: 0;
padding: 24rpx;
border: 1px solid #dddddd;
border-radius: 8rpx;
box-sizing: border-box;

/* Visual */
background-color: #ffffff;
background-image: linear-gradient(180deg, #ffffff, #f6f7f9);
color: #111111;
opacity: 1;
visibility: visible;
box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.08);
overflow: hidden;

/* Text */
font-size: 28rpx;
font-weight: 600;
font-family: sans-serif;
font-style: normal;
text-align: center;
text-decoration: none;
text-overflow: ellipsis;
line-height: 40rpx;
letter-spacing: 0;
white-space: nowrap;

/* Transform and animation */
transform: translateX(20rpx);
transform-origin: center;
transition-property: opacity;
transition-duration: 200ms;

/* Positioning */
top: 0;
right: 0;
bottom: 0;
left: 0;
z-index: 10;
```

## Common flex patterns

```css
.row {
  flex-direction: row;
}

.column {
  flex-direction: column;
}

.center {
  justify-content: center;
  align-items: center;
}

.full-width {
  width: 750rpx;
}
```

## Styling checklist

- Give every styled element its own class when inheritance would matter.
- Use `flex-direction: row` explicitly for horizontal layouts.
- Avoid web-only selectors and layout modes in shared App code.
- Keep text overflow behavior explicit for fixed-width text containers.
- Test App rendering separately from Web rendering.
