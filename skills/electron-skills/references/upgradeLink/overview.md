## When to use this reference

Use this reference whenever the user wants to:

- Add or maintain upgradeLink in an Electron-style desktop application.
- Implement application update checks, downloads, or upgrade prompts.
- Understand basic upgradeLink usage and integration flow.

## How to use this reference

This reference follows the `upgradeLink` section from `skills/electron-skills` in the upstream full-stack-skills repository. Identify the user's topic, then load only the matching file.

### Getting started

- `examples/getting-started/introduction.md` - what upgradeLink is and when to use it.
- `examples/getting-started/basic-usage.md` - basic usage and integration pattern.

## Practical rules

- Confirm how the current app stores version metadata and update endpoints before changing code.
- Make update checks explicit about current version, target version, platform, architecture, and channel.
- Handle failure paths: network errors, checksum mismatch, canceled downloads, insufficient permissions, and install restart flow.
- Keep user-facing update prompts consistent with the host app's UI conventions.
- Test update logic with mock metadata before pointing to production update feeds.

## Keywords

upgradeLink, auto update, updater, version check, desktop update, Electron update, 自动更新, 版本检测, 下载升级
