# Built-in Components

## Core components

- `<view>` - container, default flex column layout
- `<text>` - text display
- `<image>` - image display
- `<scroll-view>` - scrollable container
- `<list-view>` - optimized list for large datasets
- `<swiper>` - swipeable container
- `<button>` - button
- `<input>` - text input
- `<textarea>` - multi-line text input
- `<checkbox>` / `<radio>` - selection controls
- `<switch>` - toggle switch
- `<slider>` - slider
- `<picker>` - picker
- `<navigator>` - page navigation
- `<web-view>` - embedded web content
- `<video>` - video player
- `<rich-text>` - rich text display, with block layout internally
- `<match-media>` - media query component
- `<page-container>` - page container for popup pages
- `<animation-view>` - Lottie animation

## Common attributes

Most components support:

- `id`
- `class`
- `style`
- `ref`
- `@click`
- `@touchstart`
- `@touchmove`
- `@touchend`
- `@longpress`

## Selection guidance

- Use `<list-view>` for large datasets and long scrolling lists.
- Use `<scroll-view>` for smaller custom scroll areas.
- Use `<text>` for text nodes instead of relying on inherited text rendering from parent containers.
- Use `<image>` with static paths under `/static/` when possible.
- Use `<navigator>` for declarative navigation only when it matches the desired page transition behavior; otherwise use `uni.navigateTo`, `uni.switchTab`, or related APIs.
