---
name: chrome-extension-icon-generator
description: 生成标准的 Chrome 浏览器扩展插件图标 (16x16, 48x48, 128x128)。当用户要求为 Chrome 扩展、浏览器插件创建图标，或需要生成标准的 Web 扩展尺寸图标时，请使用此技能。
---

# Chrome Extension Icon Generator

此技能可帮助您生成 Chrome 扩展程序所需的标准图标。Chrome 扩展要求提供特定尺寸的图标：16x16, 48x48 和 128x128 像素。

## 工作流 (Workflow)

当用户要求生成 Chrome 扩展图标时，请遵循以下步骤：

1. **识别或创建源图像**:
   - 如果用户提供了一个现有的 SVG 或高分辨率 PNG，请使用它。
   - 如果用户描述了一个图标（例如：“一个天气应用图标”），请使用您的代码能力生成一个干净、现代的 SVG 文件（通常命名为 `icon.svg`），并使其符合用户的描述。
   - 默认不保留为本次生成临时创建的源文件；只有用户明确要求保留源文件时，才保留 SVG 或中间素材。

2. **生成所需尺寸**:
   - 使用 macOS 的 `sips` 命令行工具将源图像转换为三种必需的 PNG 尺寸。
   - 在源图像所在的目录中运行以下命令（假设源文件为 `icon.svg`）：
     ```bash
     sips -s format png icon.svg --out icon-128.png -z 128 128
     sips -s format png icon.svg --out icon-48.png -z 48 48
     sips -s format png icon.svg --out icon-16.png -z 16 16
     ```
   - *注意：您可以根据用户的指定或项目需求（例如 `logo-128.png`、`qrcode-16.png`）更改输出前缀。*

3. **验证并清理**:
   - 使用 `ls` 等命令确保文件（`icon-16.png`, `icon-48.png`, `icon-128.png`）已成功创建。
   - 提醒用户可以在其扩展的 `manifest.json` 中引用这些生成的文件。
   - 如果源图是为本次任务临时创建的，默认在验证完成后删除；仅当用户明确要求保留源文件时才保留。

## 注意事项 (Important Notes)
- 始终使用 `sips -s format png <source> --out <dest> -z <height> <width>` 进行可靠的格式转换和调整尺寸（在 macOS 环境下）。
- 确保生成的 SVG 宽高比为 1:1（正方形），这样生成的 PNG 就不会看起来被拉伸。
- 如果是从头开始创建 SVG，请使用 `viewBox="0 0 128 128"` 或类似的正方形尺寸，并保证设计在正方形画布居中显示。
- 默认交付物应只保留最终 PNG 文件；除非用户明确要求，否则不要保留源 SVG、临时 PNG 或测试文件。
