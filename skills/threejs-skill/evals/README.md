# Three.js Skill Evals

这些用例用于人工或自动化评估 `threejs-skill` 是否能正确触发并分流到对应参考目录。

## 覆盖范围

- 静态 demo 搭建：`threejs-dev-setup`、`threejs-renderers`、`threejs-controls`、`threejs-lights`、`threejs-materials`。
- 颜色/PBR 排查：`threejs-renderers`、`threejs-textures`、`threejs-materials`。
- Raycaster 交互：`threejs-objects`、`threejs-math`。
- addon 导入排障：`threejs-dev-setup`、`threejs-controls`。
- 性能与清理：`threejs-renderers`、`threejs-lights`、`threejs-postprocessing`、`threejs-loaders`。

## 人工验收要点

每个回答至少应做到：

1. 识别相关 three.js 主题，而不是只给泛泛代码。
2. 使用 `three/addons/...` canonical import。
3. 在涉及 canvas 时说明 resize、DPR 和渲染循环。
4. 在涉及视觉问题时区分 renderer、texture、material 的职责。
5. 在涉及交互时正确处理 NDC、Raycaster、递归拾取和状态还原。
6. 在涉及性能或卸载时提到 `dispose()` 与事件/controls 清理。

## Demo 对照

`../demo` 是第 1 个用例的落地样例，可作为 skill 输出质量的视觉参考。
