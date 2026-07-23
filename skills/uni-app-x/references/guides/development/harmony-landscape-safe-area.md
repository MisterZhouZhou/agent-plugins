# HarmonyOS 横屏状态栏、安全区与冷启动布局恢复

在固定横屏的 uni-app x 应用中，状态栏间距、安全区、有效内容宽度和冷启动首帧尺寸必须分别处理。优先使用 `pages.json` 静态横屏、官方预置变量和 `uni.getWindowInfo()`；只有运行时证据确认窗口坐标或 UVue 根节点尺寸异常时，才添加平台补偿。

官方参考：

- [CSS 预置变量](https://doc.dcloud.net.cn/uni-app-x/css/common/function.html#preset-var)
- [`uni.getWindowInfo()` 与 safeArea](https://doc.dcloud.net.cn/uni-app-x/api/get-window-info.html#safearea)
- [`pages.json` 页面方向配置](https://doc.dcloud.net.cn/uni-app-x/collocation/pagesjson.html)
- [`UniPage.setPageStyle`](https://doc.dcloud.net.cn/uni-app-x/api/unipage.html)

## 先区分四个问题

1. **顶部状态栏间距**：决定自定义导航栏是否从状态栏下方开始。
2. **横屏左右安全区**：避让摄像头、圆角、挖孔或系统手势区域。
3. **有效内容宽度**：响应式列数和卡片宽度必须按扣除左右安全区后的真实横屏宽度计算。
4. **冷启动首帧尺寸**：状态栏已横屏，但 UVue 根节点仍可能沿用竖屏阶段的旧宽度，表现为半屏内容和半屏白色。

不要用同一个 `padding-top` 解决所有问题，也不要把冷启动根节点尺寸错误误判成安全区问题。

## 优先使用官方变量

自定义导航栏确实从状态栏下方开始时，可先尝试：

```css
.app-header {
  padding-top: var(--status-bar-height);
  padding-left: var(--uni-safe-area-inset-left);
  padding-right: var(--uni-safe-area-inset-right);
}
```

使用前确认：

- 页面内容是否已经由原生窗口或父容器避让状态栏；
- `padding-top` 是否在其他容器中已经应用；
- 真机横屏时预置变量的方向和值是否正确。

如果导航栏与状态栏之间出现额外空隙，先排查“原生窗口偏移 + CSS 状态栏高度”或“父子两层 padding”的重复避让，不要连续试探硬编码高度。固定横屏设备若返回了竖屏坐标信息，`--status-bar-height` 也不应被直接当成横屏左侧摄像头安全区。

## 识别竖屏坐标信息

某些 HarmonyOS 真机在应用已经横屏时，可能出现类似结果：

```text
windowWidth  = 362
windowHeight = 804
safeAreaInsets = { top: 36, bottom: 28, left: 0, right: 0 }
```

如果设备物理方向确定为横屏，但 `windowHeight > windowWidth`，这通常表示 API 仍按竖屏坐标系描述窗口：

- 竖屏 `top` 对应横屏左侧；
- 竖屏 `bottom` 对应横屏右侧；
- 横屏总宽度应取 `max(windowWidth, windowHeight)`。

这是一条基于运行时证据的兼容规则，不是所有 HarmonyOS 设备的固定行为。若 API 已返回正确横屏坐标，则直接使用 `left/right`。

## 固定横屏页面的推荐计算

```vue
<script setup lang="uts">
const safeAreaLeft = ref(0)
const safeAreaRight = ref(0)
const effectiveWidth = ref(0)

function updateLandscapeLayout(): void {
  const windowInfo = uni.getWindowInfo()
  const insets = windowInfo.safeAreaInsets
  const usesPortraitCoordinates =
    windowInfo.windowHeight > windowInfo.windowWidth
  const landscapeWidth = Math.max(
    windowInfo.windowWidth,
    windowInfo.windowHeight
  )

  safeAreaLeft.value = insets == null
    ? 0
    : (usesPortraitCoordinates ? insets.top : insets.left)

  safeAreaRight.value = insets == null
    ? 0
    : (usesPortraitCoordinates ? insets.bottom : insets.right)

  effectiveWidth.value = Math.max(
    0,
    landscapeWidth - safeAreaLeft.value - safeAreaRight.value
  )
}

onReady(() => {
  updateLandscapeLayout()
})

onResize(() => {
  updateLandscapeLayout()
})
</script>
```

仅在项目明确锁定横屏时使用上述方向判断。支持自由旋转的项目应以当前实际方向和 resize 事件参数设计状态，不要无条件把“高大于宽”解释成错误坐标。

## 冷启动时状态栏横屏但页面半屏

### 识别特征

同时满足以下特征时，优先判断为“原生窗口方向已生效，但 UVue 首帧根节点尺寸陈旧”：

- 用户竖持手机冷启动固定横屏 App；
- 状态栏已经是横屏方向；
- 页面只占横屏的一部分，剩余区域为白色；
- 晃动或旋转手机没有恢复，说明未产生有效的 `onResize`；
- 切换 Tab、切换数据或点击触发组件更新后恢复正常。

最后一条很关键：普通交互能恢复，通常说明页面内容本身没有缺失，而是后续 VNode 更新触发了重新布局。仅重复计算响应式变量可能无效，因为新旧值相同不会强制重建根节点。

### 先收敛修复范围

按实际复现入口做最小修改：

- 只在 App 冷启动首页出现：只修首页；
- 锁屏时停留在二级页面，解锁后该页也能独立复现：再修对应页面；
- 不要因为多个页面都配置了横屏，就把恢复逻辑复制到所有页面。

页面导航本身会创建新的页面节点。如果进入二级页面后已经正常，没有证据表明二级页面需要同样补偿。

### 不要依赖动态修改页面方向

固定横屏应在 `pages.json` 配置：

```json
{
  "style": {
    "pageOrientation": "landscape"
  }
}
```

HarmonyOS 不应使用下面的代码作为恢复手段：

```uts
currentPage.setPageStyle({
  pageOrientation: 'landscape'
})
```

`UniPage.setPageStyle` 的动态 `pageOrientation` 在 HarmonyOS 不受支持。反复调用不会可靠地修复已按旧尺寸创建的 UVue 根节点，还会掩盖真正的首帧布局问题。

### 仅在检测到异常宽度时重建根节点

给目标页面根节点绑定一个 key：

```vue
<template>
  <view :key="pageRenderKey" class="page-root">
    <!-- 页面内容 -->
  </view>
</template>
```

在 HarmonyOS 测量根节点宽度。横屏预期宽度使用窗口长边；仅当根节点明显不足时递增 key：

```uts
const pageRenderKey = ref(0)

// #ifdef APP-HARMONY
const instance = getCurrentInstance()!.proxy!
let landscapeRestoreVersion = 0

function checkLandscapeLayout(version: number): void {
  if (version != landscapeRestoreVersion) return

  updateLandscapeLayout()
  nextTick(() => {
    if (version != landscapeRestoreVersion) return

    const query = uni.createSelectorQuery().in(instance)
    query.select('.page-root').boundingClientRect()
    query.exec((results: Array<any>) => {
      if (version != landscapeRestoreVersion) return
      if (results.length == 0 || results[0] == null) return

      const rootRect = results[0] as NodeInfo
      if (rootRect.width == null) return

      const info = uni.getWindowInfo()
      const expectedWidth = Math.max(info.windowWidth, info.windowHeight)
      const rootWidth = rootRect.width as number

      if (rootWidth < expectedWidth * 0.75) {
        pageRenderKey.value++
      }
    })
  })
}
// #endif
```

`0.75` 是异常检测阈值，不是布局尺寸：半屏通常约为横屏长边的 50%，正常根节点应接近长边。该阈值允许安全区、状态栏和设备差异存在一定误差。应以真机日志校准，不要用它替代正常响应式布局。

### 在窗口稳定阶段做有限复查

HarmonyOS 冷启动时，原生窗口和 UVue 节点可能分阶段稳定。使用有限延迟复查，并用版本号使旧任务失效：

```uts
// #ifdef APP-HARMONY
function restoreLandscapeLayout(): void {
  const version = ++landscapeRestoreVersion
  checkLandscapeLayout(version)

  setTimeout(() => {
    checkLandscapeLayout(version)
  }, 120)
  setTimeout(() => {
    checkLandscapeLayout(version)
  }, 400)
  setTimeout(() => {
    checkLandscapeLayout(version)
  }, 900)
}

onReady(() => {
  restoreLandscapeLayout()
})

onPageShow(() => {
  restoreLandscapeLayout()
})

onPageHide(() => {
  landscapeRestoreVersion++
})
// #endif

onResize(() => {
  updateLandscapeLayout()
  // #ifdef APP-HARMONY
  pageRenderKey.value++
  // #endif
})
```

注意：

- `onPageShow` 可能早于 `onReady`，版本号可以让较早批次的延迟检查自然失效；
- 正常显示时不要无条件递增 key，否则会丢失滚动位置和组件内部状态；
- `onResize` 代表真实窗口变化，可直接重建目标页；
- 页面隐藏时必须使未执行的定时检查失效；
- 如果页面包含地图、Canvas 等尺寸敏感组件，根节点恢复后再按需重建该组件，不要只重建地图而忽略页面根节点。

## 将安全区应用到布局

由页面级容器统一拥有左右安全区，再把计算后的可用宽度用于响应式布局：

```vue
<template>
  <view
    class="page-content"
    :style="{
      paddingLeft: safeAreaLeft + 'px',
      paddingRight: safeAreaRight + 'px'
    }"
  >
    <!-- 页面内容 -->
  </view>
</template>

<style>
.page-content {
  flex: 1;
  width: 100%;
  box-sizing: border-box;
}
</style>
```

注意：

- 共享导航栏如果也会被左侧摄像头遮挡，应接收并应用同一组页面计算值，或由包含导航栏的唯一外层统一避让；不要与页面主体重复叠加。
- 列数、卡片宽度和断点判断应使用 `effectiveWidth`，不要继续使用可能仍是竖屏短边的 `windowWidth`。
- `safeAreaInsets` 可能为 `null`，必须提供 `0` 回退。
- 折叠屏、展开屏和窗口尺寸变化必须在 `onResize` 后重算；这也适用于 Pura X 一类形态变化设备。
- 页面建议在 `onReady` 后读取窗口信息。若必须提前计算首帧布局，也要保留 `onReady`/`onResize` 的最终校正。

## 调试流程

遇到“导航栏太低”“状态栏下有额外空隙”“左侧被摄像头遮挡”或“状态栏已横屏但页面半屏”时，按顺序检查：

1. 真机记录 `windowWidth`、`windowHeight`、`screenWidth`、`screenHeight`、`statusBarHeight`、`safeArea` 和 `safeAreaInsets`。
2. 确认应用物理方向是否与 API 坐标方向一致。
3. 检查状态栏高度是否被原生窗口、父容器和导航栏重复应用。
4. 检查左右安全区是否只读取了 `insets.left/right`，而忽略了竖屏坐标映射。
5. 检查响应式宽度是否错误使用了横屏状态下的短边。
6. 测量页面根节点实际宽度，并与 `max(windowWidth, windowHeight)` 比较。
7. 确认普通交互恢复时，是响应式变量变化、组件重建还是整个页面根节点重排。
8. 在摄像头侧、导航栏顶部、页面主体和最后一行流式布局上分别做真机验收。

建议临时输出：

```uts
const info = uni.getWindowInfo()
console.log(JSON.stringify({
  windowWidth: info.windowWidth,
  windowHeight: info.windowHeight,
  screenWidth: info.screenWidth,
  screenHeight: info.screenHeight,
  statusBarHeight: info.statusBarHeight,
  safeArea: info.safeArea,
  safeAreaInsets: info.safeAreaInsets
}))
```

定位完成后删除临时日志。

## 常见错误

- 无条件给导航栏添加 `padding-top: var(--status-bar-height)`，造成重复避让。
- 横屏固定应用只读取 `safeAreaInsets.left/right`，导致摄像头侧仍为 `0`。
- 使用 `windowWidth` 计算横屏列表列数，而该值实际仍是竖屏短边。
- 用固定的 `20px`、`36px` 修复所有设备，掩盖坐标方向或重复 padding 问题。
- 只在初始化时计算一次，折叠、展开或窗口变化后不重算。
- 在导航栏和页面主体各自独立推断方向，产生不一致或双重安全区。
- 在 HarmonyOS 反复调用 `setPageStyle({ pageOrientation })`，误以为能重新创建 UVue 根节点。
- 未测量根节点就无条件刷新整个页面，造成正常返回页面时滚动位置和组件状态丢失。
- 只刷新地图、Canvas 或响应式变量，没有处理仍按旧窗口宽度创建的页面根节点。
- 冷启动问题只在首页复现，却把补偿逻辑复制到所有横屏页面。
