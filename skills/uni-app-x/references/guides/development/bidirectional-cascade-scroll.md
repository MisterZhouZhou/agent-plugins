# 双向级联滚动：导航 Tab 与内容章节联动

适用于左侧/顶部分类导航与右侧/下方内容章节的双向联动：

- 点击导航 Tab，内容区滚动到对应章节；
- 手势滚动内容区，导航自动切换选中项；
- 当前选中 Tab 离开导航可视区域时，导航自身同步滚动。

在 uni-app x 中，优先以两个独立 `scroll-view`、稳定的元素 ID、`scroll-into-view` 和内容区 `@scroll` 事件实现。不要让核心逻辑依赖 Web DOM API，也不要把 `SelectorQuery.scrollOffset()` 作为跨端唯一滚动位置来源。

## 推荐结构

为导航项和内容锚点使用不同 ID 前缀，且 ID 不要以数字开头：

```vue
<template>
  <view class="cascade">
    <scroll-view
      class="cascade__nav"
      direction="vertical"
      :show-scrollbar="false"
      :scroll-with-animation="true"
      :scroll-into-view="navScrollIntoView"
    >
      <view
        v-for="(section, index) in sections"
        :id="'nav-section-' + section.id"
        :key="section.id"
        class="cascade__nav-item"
        :class="{ 'cascade__nav-item--active': index == activeIndex }"
        @click="selectSection(section.id, index)"
      >
        <text>{{ section.title }}</text>
      </view>
    </scroll-view>

    <scroll-view
      class="cascade__content"
      direction="vertical"
      :show-scrollbar="false"
      :scroll-with-animation="true"
      :scroll-into-view="contentScrollIntoView"
      @scroll="onContentScroll"
    >
      <view
        v-for="section in sections"
        :id="'content-section-' + section.id"
        :key="section.id"
        class="cascade__anchor"
      >
        <!-- 章节内容 -->
      </view>
    </scroll-view>
  </view>
</template>
```

两个 `scroll-view` 都必须获得明确、可计算的尺寸。左右布局通常让外层 `flex: 1; height: 100%; flex-direction: row;`，两个滚动区设置 `height: 100%` 或通过 flex 分配高度。

## 状态职责

将状态分为四类，避免两个滚动区互相覆盖控制值：

```uts
const instance = getCurrentInstance()!.proxy!
const activeIndex = ref(0)

// 左侧导航和右侧内容必须使用独立目标。
const navScrollIntoView = ref('')
const contentScrollIntoView = ref('')

// 内容锚点在内容滚动坐标系中的顶部位置。
const sectionTops = ref<Array<number>>([])

// 始终从内容区 @scroll 事件维护真实滚动位置。
let currentContentScrollTop = 0
let measureVersion = 0
```

不要共用一个 `scrollIntoView` ref。导航滚动只负责让激活 Tab 可见，内容滚动只负责定位章节；两者职责分离后不会形成滚动反馈环。

## 测量章节位置

章节 `boundingClientRect().top` 是视口坐标。将它转换为内容滚动坐标时，使用：

```text
章节内容坐标 = 章节视口 top - 内容容器视口 top + 当前 scrollTop
```

推荐实现：

```uts
function measureSections(version: number): void {
  const query = uni.createSelectorQuery().in(instance)
  query.select('.cascade__content').boundingClientRect()
  query.selectAll('.cascade__anchor').boundingClientRect()
  query.exec((results: Array<any>) => {
    if (version != measureVersion) return
    if (results.length < 2 || results[0] == null || results[1] == null) return

    const containerRect = results[0] as NodeInfo
    const anchorRects = results[1] as Array<NodeInfo>
    if (containerRect.top == null) return

    const containerTop = containerRect.top as number
    const measuredTops: Array<number> = []

    anchorRects.forEach((rect: NodeInfo) => {
      if (rect.top != null) {
        measuredTops.push(
          (rect.top as number) - containerTop + currentContentScrollTop
        )
      }
    })

    // 缺失任一锚点时不要写入，避免索引与章节错位。
    if (measuredTops.length != anchorRects.length) return
    if (measuredTops.length != props.sections.length) return
    sectionTops.value = measuredTops
  })
}
```

### HarmonyOS 兼容要点

部分 HarmonyOS uni-app x 运行时中，`SelectorQuery.scrollOffset()` 通过 `exec()` 返回的节点信息可能只有 `id/dataset/left/top/right/bottom/width/height`，没有预期的 `scrollTop`。如果代码执行以下判断：

```uts
if (scrollOffset.scrollTop == null) return
```

章节位置会始终无法写入，表现为 H5 联动正常、鸿蒙真机滚动内容时导航不切换。

因此：

- 将 `@scroll` 的 `event.detail.scrollTop` 作为滚动位置事实来源；
- `SelectorQuery` 只负责测量容器和锚点矩形；
- 即使测量发生在页面已经滚动之后，也用 `currentContentScrollTop` 转换到稳定的内容坐标。

这是基于部分 HarmonyOS 运行时行为的兼容策略，不代表所有版本都缺少 `scrollTop`；但事件驱动方式跨端更稳，不需要按平台分支。

## 内容滚动驱动导航

只在章节索引真正变化时更新导航目标，避免每个 `@scroll` 事件都触发左栏动画：

```uts
function setActiveSection(index: number): void {
  if (index < 0 || index >= props.sections.length) return
  if (activeIndex.value == index) return

  activeIndex.value = index
  const targetId = `nav-section-${props.sections[index].id}`

  // 先清空再在下一帧赋值，确保目标命令能被重新触发。
  navScrollIntoView.value = ''
  nextTick(() => {
    navScrollIntoView.value = targetId
  })
}

function onContentScroll(event: UniScrollEvent): void {
  const scrollTop = event.detail.scrollTop
  currentContentScrollTop = scrollTop

  const tops = sectionTops.value
  if (tops.length == 0) return

  // 让标题越过内容区顶部 28px 时切换；按页面视觉调整。
  const markerTop = scrollTop + 28
  let nextIndex = 0

  for (let index = 0; index < tops.length; index++) {
    if (tops[index] <= markerTop) {
      nextIndex = index
    } else {
      break
    }
  }

  setActiveSection(nextIndex)
}
```

章节数量为几十项时，线性扫描足够简单可靠。达到数百项且滚动事件出现性能压力时，再改成二分查找，不要提前复杂化。

`scroll-into-view` 通常会把目标项滚动到导航区边缘，而不是精确居中。如果希望激活项前面保留一个 Tab 的上下文，可定位 `Math.max(0, index - 1)` 对应的导航 ID；只有确实需要居中效果时，才测量导航项并控制 `scroll-top`。

## 导航点击驱动内容

点击时先更新选中状态和导航可见性，再独立设置内容目标：

```uts
function selectSection(sectionId: string, index: number): void {
  setActiveSection(index)

  const targetId = `content-section-${sectionId}`
  contentScrollIntoView.value = ''
  nextTick(() => {
    contentScrollIntoView.value = targetId
  })
}
```

内容滚动动画期间，`@scroll` 可能依次经过中间章节。默认让激活状态反映真实视口位置，不额外加“程序化滚动锁”；这样用户中途打断动画时不会留下错误锁状态。只有产品明确要求点击后始终保持目标 Tab 高亮，才增加可取消的程序化滚动状态。

## 初始化、重置与重测

详情数据、窗口尺寸或紧凑布局变化后，旧锚点位置会失效。使用版本号让过期的异步测量结果自动作废：

```uts
function resetAndMeasureSections(): void {
  const version = ++measureVersion

  activeIndex.value = 0
  navScrollIntoView.value = ''
  contentScrollIntoView.value = ''
  sectionTops.value = []
  currentContentScrollTop = 0

  nextTick(() => {
    if (version != measureVersion) return

    if (props.sections.length > 0) {
      const firstId = props.sections[0].id
      navScrollIntoView.value = `nav-section-${firstId}`
      contentScrollIntoView.value = `content-section-${firstId}`
    }

    nextTick(() => {
      if (version != measureVersion) return
      measureSections(version)
    })
  })
}

function remeasureSections(): void {
  const version = ++measureVersion
  nextTick(() => {
    if (version != measureVersion) return
    measureSections(version)
  })
}

onUnmounted(() => {
  measureVersion++
})
```

在以下时机重测：

- 组件挂载完成；
- 章节数组或详情对象变化；
- 窗口尺寸、横竖屏、紧凑/窄屏布局变化；
- 未固定尺寸的图片加载完成并改变章节高度。

如果图片已有固定宽高或容器提前占位，不必对每张图片重复测量。

## 常见失败模式

1. **H5 正常，HarmonyOS 不切换 Tab**：检查是否依赖 `scrollOffset.scrollTop`；改为从 `@scroll` 持续维护 `currentContentScrollTop`。

2. **Tab 能选中，但滚到后面看不到激活项**：左侧导航缺少自己的 `scroll-into-view`，或导航项没有稳定唯一 ID。

3. **左侧导航不停抖动**：每个滚动事件都重设导航目标。先比较 `activeIndex`，仅在索引变化时滚动导航。

4. **点击同一个 Tab 第二次不滚动**：相同字符串不会触发更新。先把目标 ref 清空，再在 `nextTick()` 中设置目标 ID。

5. **切换详情后激活章节错位**：没有清空旧的 `sectionTops/currentContentScrollTop`，或异步测量结果串到新详情。重置状态并使用 `measureVersion`。

6. **图片加载后章节切换提前或滞后**：初次测量后内容高度发生变化。固定媒体占位尺寸，或在最终布局稳定后重测。

7. **真机 `scroll-into-view` 找不到目标**：检查 ID 是否以数字开头、是否重复、是否位于对应 `scroll-view` 内；仍失败时减少不必要的中间包装，让锚点更接近 `scroll-view` 的直接子节点。

## 验证清单

- 从顶部连续滚到底部，激活索引按章节顺序变化；
- 从底部快速反向滚动，索引能正确回退；
- 激活后部章节时，导航自动滚动且当前 Tab 可见；
- 点击首项、中间项、末项，内容均到达正确章节；
- 连续点击同一项仍可重新定位；
- 切换详情数据、改变窗口尺寸后没有沿用旧锚点；
- 分别在 H5 和目标 App/HarmonyOS 真机验证，不以 H5 结果替代真机结果。
