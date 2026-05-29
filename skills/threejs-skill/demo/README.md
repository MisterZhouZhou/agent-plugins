# Three.js Skill Demo

这是一个用于验证 `threejs-skill` 指导效果的静态 demo。它不需要构建器，使用 importmap 从 CDN 加载 `three` 和 `three/addons`。

## 运行

在 `threejs-skill` 根目录执行：

```bash
python3 -m http.server 4173
```

然后打开：

```text
http://127.0.0.1:4173/demo/
```

## 覆盖的 skill 路径

- `threejs-dev-setup`：无构建器 importmap、`three/addons/...` 导入。
- `threejs-renderers`：`WebGLRenderer`、DPR 限制、resize、`setAnimationLoop`、颜色输出。
- `threejs-controls`：`OrbitControls`、阻尼、每帧 `update()`、清理。
- `threejs-lights`：DirectionalLight、HemisphereLight、阴影。
- `threejs-materials`：`MeshStandardMaterial`、PBR 参数、状态高亮。
- `threejs-objects`：Object3D 分组、Raycaster hover/click 拾取。
- `threejs-helpers`：GridHelper、AxesHelper 调试显示。
