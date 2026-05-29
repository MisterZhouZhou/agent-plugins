# Three.js References Overview

本目录整合自参考仓库 `skills/threejs-skills`，采用与 `vue-skill` 类似的渐进式披露结构：先从根目录 `SKILL.md` 判断主题，再读取对应 `references/threejs-*/overview.md`。

## 主题索引

| 目录 | 主题 |
| --- | --- |
| `threejs-dev-setup` | 构建、导入、Manual、TypeScript、`three/addons` |
| `threejs-scenes` | `Scene`、`Fog`、`background` |
| `threejs-camera` | 相机与投影 |
| `threejs-lights` | 光源与阴影 |
| `threejs-materials` | 经典材质和 GLSL 材质 |
| `threejs-node-tsl` | Nodes、TSL、`NodeMaterial` |
| `threejs-textures` | 纹理、采样、PMREM、颜色空间 |
| `threejs-geometries` | 几何体、Buffer、曲线、挤出 |
| `threejs-math` | 数学类型与空间查询 |
| `threejs-objects` | 场景图、Mesh、Raycaster、Layers |
| `threejs-animation` | 动画混合、clip、track |
| `threejs-audio` | 空间音频和分析器 |
| `threejs-loaders` | 资源加载、解码、导出 |
| `threejs-renderers` | WebGL/WebGPU、RenderTarget、DPR、颜色输出 |
| `threejs-postprocessing` | EffectComposer 和后期 pass |
| `threejs-helpers` | 调试辅助体 |
| `threejs-controls` | Orbit / Transform / Drag / PointerLock 等控件 |
| `threejs-webxr` | WebXR、VR/AR session、controller |

## 使用方式

1. 根据用户任务从上表选择主题。
2. 打开对应 `overview.md`，读取触发条件、工作流、官方文档映射和易错点。
3. 如果需要可执行流程，再读取该主题的 `examples/workflow-*.md`。
4. 如果主题有更长的官方链接表或概念对照，再读取该主题的 `references/*.md`。

## 来源

- https://github.com/partme-ai/full-stack-skills/tree/main/skills/threejs-skills
- https://threejs.org/docs/
- https://threejs.org/manual/
