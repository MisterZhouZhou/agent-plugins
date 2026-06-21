---
name: features-pdf-export
description: 离线 PDF 导出方案 — Hybrid WebView + jsPDF + canvas，支持中文、跨平台（含 HarmonyOS）
---

# 离线 PDF 导出（Hybrid WebView + jsPDF）

uni-app x **没有内置 PDF 生成 API**。需要在应用内导出 PDF（特别是 HarmonyOS）时，**最稳的方案是用本地 Hybrid HTML 页面 + jsPDF**：不依赖原生 UTS 插件，跨 Android / iOS / 鸿蒙一致工作，完全离线。

## 架构

```
UVUE 页面 → 构造 payload JSON
        → uni.navigateTo('/pages/webview/index?url=' + 编码后的本地 HTML 路径)
        → WebView 加载 /hybrid/html/your_pdf_generator.html
        → HTML 从 query 读取 payload
        → jsPDF + canvas 渲染 → pdf.output('datauristring')
        → <a download href="data:..."> 触发下载
```

## 目录约定

```
your-project/
├── hybrid/
│   └── html/
│       ├── lib/
│       │   └── jspdf.umd.min.js          # 本地离线库，约 356KB
│       └── your_pdf_generator.html       # 生成器页面
└── pages/
    └── webview/
        └── index.uvue                    # 通用 webview 壳
```

通用 webview 壳页面（多数项目隐私协议等场景已有）：

```uvue
<template>
  <web-view class="webview" :src="webviewUrl"></web-view>
</template>
<script setup lang="uts">
const webviewUrl = ref('')
onLoad((options: any) => {
  if (options.url != null) webviewUrl.value = decodeURIComponent(options.url)!
  if (options.title != null) uni.setNavigationBarTitle({ title: decodeURIComponent(options.title)! })
})
</script>
```

jsPDF 下载：`https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js`（仅一次性下载到本地，不可使用 CDN 在线引用）。

## UVUE 页面端调用

```typescript
type CompactRow = { i: number; c: string; p: string }

const buildPayload = (): string => {
  // 字段名尽量短 — URL 会被三层编码，% 会膨胀为 %2525，每多一个字符放大约 3 倍
  const exportRows: CompactRow[] = []
  for (let i = 0; i < rows.value.length; i++) {
    const r = rows.value[i]
    if (r.char.length > 0 || r.pinyin.length > 0) {
      exportRows.push({ i, c: r.char, p: r.pinyin })  // 只传非空行，HTML 端补齐
    }
  }
  return JSON.stringify({ n: cols.value, t: rows.value.length, r: exportRows })
}

const onExport = () => {
  const payload = buildPayload()
  const url = '/hybrid/html/your_pdf_generator.html?d=' + encodeURIComponent(payload)
  uni.navigateTo({
    url: '/pages/webview/index?url=' + encodeURIComponent(url) + '&title=' + encodeURIComponent('导出 PDF')
  })
}
```

## 生成器 HTML 模板

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
  <script src="./lib/jspdf.umd.min.js"></script>
  <style>
    .preview { max-width: 720px; margin: 0 auto; }
    .preview img { width: 100%; height: auto; display: block; }
    .btn { display: block; width: 100%; padding: 14px; background: #4BAEE8; color: #fff; border-radius: 14px; text-align: center; }
  </style>
</head>
<body>
  <div id="loading">正在生成 PDF…</div>
  <div class="preview" id="preview"></div>
  <a class="btn" id="downloadLink" download="out.pdf" href="#" style="display:none">下载 PDF</a>
  <button class="btn" id="retryBtn" style="display:none" onclick="onRetry()">重新生成</button>

  <script>
    var payload = null
    var lastDataUri = ''

    function parseQuery() {
      var s = window.location.search.replace(/^\?/, '')
      var p = {}
      s.split('&').forEach(function (kv) {
        var pair = kv.split('=')
        if (pair.length === 2) p[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1])
      })
      return p
    }

    function normalizePayload(p) {
      // 把紧凑格式 { n, t, r: [{i, c, p}] } 还原为完整 rows
      var cols = p.n || 8
      var total = p.t || (p.r ? p.r.length : 0)
      var rows = []
      for (var i = 0; i < total; i++) rows.push({ char: '', pinyin: '' })
      if (p.r) {
        for (var j = 0; j < p.r.length; j++) {
          var it = p.r[j]
          var idx = it.i != null ? it.i : j
          if (idx >= 0 && idx < rows.length) rows[idx] = { char: it.c || '', pinyin: it.p || '' }
        }
      }
      return { cols: cols, rows: rows }
    }

    function drawPageCanvas(data) {
      var dpi = 2
      var canvas = document.createElement('canvas')
      canvas.width = 794 * dpi; canvas.height = 1123 * dpi  // A4 in px at 96dpi × dpi
      var ctx = canvas.getContext('2d')
      ctx.fillStyle = '#FFFFFF'; ctx.fillRect(0, 0, canvas.width, canvas.height)

      // 用 canvas 画中文（jsPDF 内置字体不支持中文！）
      ctx.fillStyle = '#080808'
      ctx.font = 'bold ' + (60 * dpi) + 'px "PingFang SC","Microsoft YaHei","SimHei",sans-serif'
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
      ctx.fillText('中文内容', canvas.width / 2, 200 * dpi)

      return canvas
    }

    function buildAndExport(data) {
      try {
        document.getElementById('preview').innerHTML = ''
        var jsPDF = window.jspdf.jsPDF
        var pdf = new jsPDF({ unit: 'pt', format: 'a4', orientation: 'portrait' })
        var pageW = pdf.internal.pageSize.getWidth()
        var pageH = pdf.internal.pageSize.getHeight()

        var canvas = drawPageCanvas(data)
        var jpeg = canvas.toDataURL('image/jpeg', 0.9)
        pdf.addImage(jpeg, 'JPEG', 0, 0, pageW, pageH)

        lastDataUri = pdf.output('datauristring', { filename: 'out.pdf' })
        var link = document.getElementById('downloadLink')
        link.href = lastDataUri
        link.style.display = 'block'
        document.getElementById('retryBtn').style.display = 'block'

        // 预览：从 canvas 取 jpeg 转 img，不要用 raw canvas（鸿蒙 WebView 不会按 CSS 缩放）
        var img = document.createElement('img')
        img.src = canvas.toDataURL('image/jpeg', 0.85)
        document.getElementById('preview').appendChild(img)

        document.getElementById('loading').style.display = 'none'
      } catch (e) {
        document.getElementById('loading').textContent = '生成失败: ' + (e.message || e)
      }
    }

    function onRetry() { if (payload) buildAndExport(payload) }

    var q = parseQuery()
    if (q.d) {
      payload = normalizePayload(JSON.parse(q.d))
      setTimeout(function () { buildAndExport(payload) }, 120)
    }
  </script>
</body>
</html>
```

## 关键踩坑点（按惨痛程度排序）

### 1. jsPDF 内置字体不支持中文
- ❌ 不要用 `pdf.text('中文', ...)` —— 输出乱码或空白
- ✅ 用 `<canvas>` 配合系统中文字体（PingFang SC、Microsoft YaHei、SimHei）渲染整页，再 `pdf.addImage(jpeg, 'JPEG', 0, 0, pageW, pageH)`

### 2. 三层 URL 编码会让 payload 膨胀约 9 倍
链路：`HTML query → webview ?url= → navigateTo` 三层 encodeURIComponent，每层 `%` 变成 `%25`，连续乘以 3 倍。350 字符的 JSON 容易变成 2700+ 字符的 URL。

**优化策略**（实测可降到 ~280 字符）：
- 字段名简写：`char` → `c`、`pinyin` → `p`、`rows` → `r`、`cols` → `n`、`total` → `t`
- 只传非空数据 + 行索引 `i`，HTML 端补齐空行
- 不在文件名里塞时间戳

### 3. 鸿蒙 WebView 的兼容性陷阱

| 问题 | 原因 | 解决 |
|------|------|------|
| `blob:` URL 下载无反应 | 鸿蒙 WebView 对 blob 下载支持不稳 | 改用 `data:application/pdf;base64,...` 作为 `<a download>` 的 href |
| `pdf.save()` JS 触发下载没反应 | 鸿蒙 WebView 拦截 JS 下载 | 显式展示 `<a>` 按钮让用户手动点 |
| `<canvas>` CSS `width: 100%` 不生效 | 鸿蒙 WebView 不按 CSS 缩放 canvas | 用 canvas 渲染后 `toDataURL()` 转成 `<img>` 展示 |
| `addEventListener('click')` 不响应 | 部分嵌入场景被吞掉 | 改用 inline `onclick="..."`，handler 挂在 `window` 上 |

### 4. PDF 分页：必须 precompute 并按比例缩放
固定 N 行内容塞 A4 时，宽度算出 cellSize 后**还要校验总高**：

```javascript
var rowH = cellSize + extras
var contentH = rowsCount * rowH
var usableH = pageH - marginTop - marginBottom
if (contentH > usableH) {
  var scale = usableH / contentH
  cellSize = Math.floor(cellSize * scale)   // 等比缩小
  rowH = cellSize + Math.floor(extras * scale)
  marginX = Math.floor((pageW - cellSize * cols) / 2)  // 重新居中
}
```
否则最后几行会被静默裁掉（不会自动分页）。

### 5. 资源路径写法
- HTML 路径用绝对路径 `/hybrid/html/foo.html`（项目根开始）
- HTML 内引 jsPDF 用相对路径 `./lib/jspdf.umd.min.js`
- HarmonyOS 打包会把 `/hybrid/` 作为应用内置资源，无需网络

## Canvas 田字格 / 四线三格 等网格绘制

UVUE `<view>` 边框无法避免相邻格双线（uvue 不支持 `border-collapse`）。**在 PDF 端用 canvas 是唯一像素完美的方案**：

```javascript
function drawCell(ctx, x, y, size, dpi) {
  // 外框：单条 strokeRect，永远 1px 宽
  ctx.strokeStyle = '#9FCDDC'; ctx.lineWidth = 1 * dpi
  ctx.strokeRect(x, y, size, size)

  // 对角线 X（浅）— 先画
  ctx.strokeStyle = '#D4ECF2'; ctx.lineWidth = 0.6 * dpi
  ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + size, y + size); ctx.stroke()
  ctx.beginPath(); ctx.moveTo(x + size, y); ctx.lineTo(x, y + size); ctx.stroke()

  // 横竖十字（深）— 最后画在最上层
  ctx.strokeStyle = '#BFEAF2'; ctx.lineWidth = 1 * dpi
  ctx.beginPath(); ctx.moveTo(x, y + size / 2); ctx.lineTo(x + size, y + size / 2); ctx.stroke()
  ctx.beginPath(); ctx.moveTo(x + size / 2, y); ctx.lineTo(x + size / 2, y + size); ctx.stroke()
}
```

关键：每条线一个 `beginPath()` + `stroke()`，不依赖 CSS 盒模型，永远 1px 单线。

## UVUE 端同步渲染网格（用于可编辑预览）

如果 UVUE 页面需要展示**同一张网格**让用户可点击编辑，注意 uvue 边框去重和样式系统的限制：

### 策略：按下标决定每格画哪些边
每个 cell 通过函数返回 class 字符串（**对象绑定 `:class="{}"` 在某些 uvue 版本不稳定**）：

```uvue
<view class="cell" :class="getBorderClass(rIdx, cIdx)">…</view>
```

```typescript
const getBorderClass = (r: number, c: number): string => {
  const parts: string[] = []
  if (r == 0) parts.push('cell-top')   // 第 1 行才画顶
  if (c == 1) parts.push('cell-left')  // 第 1 列才画左
  return parts.join(' ')
}
```

```css
.cell {
  border-style: solid;
  border-color: #9FCDDC;
  border-top-width: 0;        /* 顶边由上一行的下边提供 */
  border-left-width: 0;       /* 左边由左侧列的右边提供 */
  border-right-width: 1rpx;   /* 自带 */
  border-bottom-width: 1rpx;  /* 自带 */
}
.cell-top  { border-top-width: 1rpx; }
.cell-left { border-left-width: 1rpx; }
```

效果：每条网格线**只被一个 cell 画一次**，相邻格之间 0 双线。外框由首行/首列自带 + 每格自带的右/下闭合。

### uvue 样式系统坑
- ❌ **后代选择器无效**：`.row-first .cell { ... }` 在 uvue 里被忽略
- ❌ **半透明 rgba 不稳定**：用实色 hex（如 `#BFEAF2` 替代 `rgba(91,196,223,0.45)`）
- ❌ **`:class` 对象语法**部分版本不可靠：改用函数返回字符串
- ✅ **绝对定位 + 固定宽高**：在 uvue 上稳定可用

<!--
Source: 实战项目沉淀 — 田字格 PDF 导出（kindergarten 项目）
File ref: pages/tianzi/index.uvue, hybrid/html/tianzi_pdf_generator.html
-->
