---
name: threejs-skill
description: Three.js 专项开发技能。用于创建、维护、调试或优化 three.js / WebGL / WebGPU 3D 应用，覆盖项目搭建、场景、相机、灯光、材质、纹理、几何体、对象层级、Raycaster 交互、动画、加载器、渲染器、后期处理、辅助调试、控件、音频、WebXR、Node/TSL 与性能排查；详细文档按 threejs-skills 原目录结构存放在 references/。
---

# Three.js Skill

## 使用场景

当用户需要处理 three.js 或浏览器 3D 项目时使用本技能，尤其是：

- 新建 three.js / Vite / TypeScript 3D 项目，修复 `three/addons/...`、ESM、导入路径或 bundler 问题。
- 实现场景、相机、灯光、阴影、材质、贴图、几何体、模型加载、动画、交互拾取和控件。
- 调试颜色空间、PBR 观感、透明排序、阴影瑕疵、DPR、resize、渲染循环、VRAM 泄漏和性能瓶颈。
- 集成 glTF、Draco、KTX2、HDR/EXR、PMREM、EffectComposer、WebXR、空间音频或 TSL/NodeMaterial。
- 在 Vue、React、原生 HTML 或其他前端项目中嵌入 three.js，并需要符合现有项目结构。

## 工作流

1. 先识别项目技术栈和 three.js 版本：查看 `package.json`、锁文件、入口文件、渲染循环、canvas 挂载位置和构建工具。
2. 判断任务主题，先读对应 `references/<topic>/overview.md`，只在需要时继续读取该主题的 `examples/` 或 `references/`。
3. 优先沿用项目已有模式：框架组件生命周期、资源目录、状态管理、UI 控件、调试开关、构建命令和代码风格。
4. 对 3D 改动保持可验证：先用最小场景或最小复现确认 renderer、camera、light、mesh、asset pipeline 正常，再叠加复杂效果。
5. 实现时明确资源生命周期：替换或删除 geometry、material、texture、render target、composer pass 时处理 `dispose()`。
6. 完成后运行项目已有的 lint、type-check、test 或 build；界面改动要本地预览并检查桌面/移动视口、canvas 非空、交互有效。

## 文档结构

详细文档来自参考仓库 `skills/threejs-skills`，按原主题沉淀在 `references/`：

```text
references/
  threejs-animation/
  threejs-audio/
  threejs-camera/
  threejs-controls/
  threejs-dev-setup/
  threejs-geometries/
  threejs-helpers/
  threejs-lights/
  threejs-loaders/
  threejs-materials/
  threejs-math/
  threejs-node-tsl/
  threejs-objects/
  threejs-postprocessing/
  threejs-renderers/
  threejs-scenes/
  threejs-textures/
  threejs-webxr/
```

每个主题目录都保留原始 `SKILL.md`，并复制为 `overview.md` 以匹配本地 skill 的引用习惯。先读 `overview.md`，再按其中指向读取 `examples/workflow-*.md`、`references/official-*.md` 等细分材料。

## 引用文档导航

- 项目搭建、安装、Vite/Webpack/Rollup、import map、TypeScript、`three/addons` 导入：读 [references/threejs-dev-setup/overview.md](references/threejs-dev-setup/overview.md)。
- `Scene`、背景、雾、环境基础：读 [references/threejs-scenes/overview.md](references/threejs-scenes/overview.md)。
- 透视/正交相机、resize、投影矩阵、视锥：读 [references/threejs-camera/overview.md](references/threejs-camera/overview.md)。
- `WebGLRenderer`、`WebGPURenderer`、DPR、颜色空间、tone mapping、render target、性能统计：读 [references/threejs-renderers/overview.md](references/threejs-renderers/overview.md)。
- 灯光、阴影、bias、RectAreaLight、LightProbe、IESSpotLight：读 [references/threejs-lights/overview.md](references/threejs-lights/overview.md)。
- 经典材质、PBR、透明、`ShaderMaterial` / `RawShaderMaterial`：读 [references/threejs-materials/overview.md](references/threejs-materials/overview.md)。
- TSL、NodeMaterial、WebGPU-first shader graph、节点化后期：读 [references/threejs-node-tsl/overview.md](references/threejs-node-tsl/overview.md)。
- 纹理参数、colorSpace、mipmap、anisotropy、CubeTexture、PMREM：读 [references/threejs-textures/overview.md](references/threejs-textures/overview.md)。
- 几何体、BufferGeometry、曲线、Shape、ExtrudeGeometry：读 [references/threejs-geometries/overview.md](references/threejs-geometries/overview.md)。
- Vector、Matrix、Quaternion、Box3、Ray、Frustum、空间查询：读 [references/threejs-math/overview.md](references/threejs-math/overview.md)。
- Object3D 层级、Mesh、InstancedMesh、SkinnedMesh、Layers、Raycaster 拾取：读 [references/threejs-objects/overview.md](references/threejs-objects/overview.md)。
- AnimationMixer、AnimationClip、KeyframeTrack、骨骼动画混合：读 [references/threejs-animation/overview.md](references/threejs-animation/overview.md)。
- glTF、Draco、KTX2、HDR/EXR、AudioLoader、Exporter、LoadingManager：读 [references/threejs-loaders/overview.md](references/threejs-loaders/overview.md)。
- EffectComposer、RenderPass、Bloom、SSAO、SSR、Outline、ShaderPass：读 [references/threejs-postprocessing/overview.md](references/threejs-postprocessing/overview.md)。
- OrbitControls、MapControls、FlyControls、TransformControls、DragControls、PointerLockControls：读 [references/threejs-controls/overview.md](references/threejs-controls/overview.md)。
- AxesHelper、GridHelper、CameraHelper、光源辅助、骨骼/法线/包围盒调试：读 [references/threejs-helpers/overview.md](references/threejs-helpers/overview.md)。
- AudioListener、PositionalAudio、AudioAnalyser、浏览器音频解锁：读 [references/threejs-audio/overview.md](references/threejs-audio/overview.md)。
- WebXR、XRButton、VR/AR session、手柄、沉浸式渲染循环：读 [references/threejs-webxr/overview.md](references/threejs-webxr/overview.md)。

## 分流规则

- 项目无法启动、模块找不到、addon 导入失败：先看 `threejs-dev-setup`，不要直接改运行时 API。
- 颜色不对、材质发灰、PBR 金属感异常：同时检查 `threejs-renderers`、`threejs-textures`、`threejs-materials`。
- HDR、KTX2、Draco、glTF 加载失败：先看 `threejs-loaders`；纹理采样和 PMREM 再看 `threejs-textures`。
- 经典 PBR、透明、`ShaderMaterial` 属于 `threejs-materials`；TSL、NodeMaterial、WebGPU shader graph 属于 `threejs-node-tsl`。
- `EffectComposer` 和屏幕空间 pass 属于 `threejs-postprocessing`；renderer 的 size、DPR、tone mapping 属于 `threejs-renderers`。
- `Raycaster` 拾取、Layers、场景图属于 `threejs-objects`；纯向量、包围盒、矩阵计算属于 `threejs-math`。
- 桌面相机导航和 transform gizmo 属于 `threejs-controls`；XR 设备、session、controller 属于 `threejs-webxr`。
- 骨骼、clip、mixer 更新属于 `threejs-animation`；SkinnedMesh 结构和对象层级属于 `threejs-objects`。

## 常用核查

- Renderer：canvas CSS 尺寸、drawing buffer、`setPixelRatio(Math.min(devicePixelRatio, 2))`、resize 时 camera aspect 和 composer size 同步。
- Render loop：优先使用 `renderer.setAnimationLoop()`；使用 controls damping、mixer、video texture、composer 时确认每帧更新顺序。
- Color：albedo/baseColor 使用 sRGB；normal、roughness、metalness、ao 等数据贴图不要当颜色贴图处理。
- Lighting：阴影需要 renderer、light、caster、receiver 四处同时配置；用 CameraHelper 检查 shadow camera 视锥。
- Assets：glTF 与 texture 路径基于 public/base URL；Draco/KTX2 decoder 路径与部署路径一致。
- Interaction：Raycaster 坐标要归一化到 NDC；处理高 DPR、canvas offset、递归拾取和交互层过滤。
- Performance：关注 draw calls、triangles、材质/纹理数量、DPR、阴影灯数量、post pass 数量和透明重叠。
- Cleanup：组件卸载、热更新、路由切换时清理事件监听、controls、composer、render target、geometry、material、texture。

## 官方资源

- three.js Docs: https://threejs.org/docs/
- three.js Manual: https://threejs.org/manual/
- three.js Examples: https://threejs.org/examples/
- three.js GitHub: https://github.com/mrdoob/three.js/
