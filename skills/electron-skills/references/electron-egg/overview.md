## When to use this reference

Use this reference whenever the user wants to:

- Create, maintain, or debug an electron-egg application.
- Understand electron-egg project structure and configuration.
- Implement main-process, renderer-process, IPC, or window features in electron-egg.
- Build or package an electron-egg project.
- Reference electron-egg configuration or framework APIs.

## How to use this reference

This reference follows the `electron-egg` section from `skills/electron-skills` in the upstream full-stack-skills repository. Identify the user's topic, then load only the matching file.

### Guide

- `examples/guide/intro.md` - framework introduction and use cases.
- `examples/guide/installation.md` - installation notes.
- `examples/guide/quick-start.md` - quick-start workflow.
- `examples/guide/project-structure.md` - directory structure and responsibilities.
- `examples/guide/configuration.md` - configuration patterns.
- `examples/guide/build.md` - build and packaging guidance.

### Features

- `examples/features/main-process.md` - main-process feature patterns.
- `examples/features/renderer-process.md` - renderer-process feature patterns.
- `examples/features/ipc-communication.md` - IPC communication in electron-egg.

### API reference

- `api/main-api.md` - main process API.
- `api/renderer-api.md` - renderer API.
- `api/ipc-api.md` - IPC API.
- `api/window-api.md` - window API.
- `api/config-api.md` - configuration API.

### Templates

- `templates/project-setup.md` - project setup template.
- `templates/configuration.md` - configuration template.
- `templates/installation.md` - installation template.

## Practical rules

- Follow electron-egg conventions first; avoid bypassing framework lifecycle and config unless the project already does.
- Keep app-level configuration centralized and environment-aware.
- Use the framework's IPC and window abstractions where available.
- Preserve the existing front-end stack and build command layout.
- Validate development and packaged runtime behavior, because paths and resource loading often differ.

## Keywords

electron-egg, Electron framework, desktop app framework, configuration, IPC, window, main process, renderer process, build, package, 桌面应用框架, 配置, 窗口管理
