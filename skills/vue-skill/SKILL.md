---
name: vue-skill
description: Vue.js 专项开发技能。用于构建、维护、迁移或排查 Vue 2/Vue 3 应用，覆盖 Vue 3、Vue 2、Vue Router 3/4、Pinia、Vuex、组件、路由、状态管理、TypeScript、测试、性能与迁移决策；详细文档按 vue-skills 原目录结构存放在 references/。
---

# Vue Skill

## 使用场景

当用户需要处理 Vue 项目时使用本技能，尤其是：

- 新建或改造 Vue 2 / Vue 3 组件、页面、插件、组合式函数。
- 配置或排查 Vue Router、Pinia、Vuex、Vite、TypeScript、测试。
- 在 Vue 2、Vue 3、Vue Router 3/4、Vuex、Pinia 之间做版本判断或迁移。
- 需要符合 Vue 生态常见工程规范、响应式约束和性能实践。

## 工作流

1. 先识别项目版本和技术栈：查看 `package.json`、入口文件、路由和状态管理目录。
2. 优先沿用项目已有模式：组件写法、目录结构、命名、UI 库、请求封装、测试工具。
3. 根据任务读取最相关的引用文档，避免一次加载所有内容。
4. 实现时保持改动聚焦，组件逻辑优先放在已有组件或 composable/store/router 模块的自然边界内。
5. 完成后运行项目已有的类型检查、lint、单测或构建命令；前端界面改动要本地预览并检查关键视口。

## 文档结构

详细文档按参考仓库 `skills/vue-skills` 的目录结构沉淀在 `references/`：

```text
references/
  pinia/
  vue-router-v3/
  vue-router-v4/
  vue-router/
  vue2/
  vue3/
  vuex-vue2/
```

## 引用文档导航

先读对应子目录的 `overview.md`，再按它的映射继续读取 `examples/`、`api/`、`templates/` 中的细分文档。

- Vue 3 组件、Composition API、`<script setup>`、响应式、SFC、内置组件、最佳实践：读 [references/vue3/overview.md](references/vue3/overview.md)。
- Vue 2、Options API、生命周期、组件通信、响应式限制、旧项目维护：读 [references/vue2/overview.md](references/vue2/overview.md)。
- 通用 Vue Router 判断和 Vue 2/Vue 3 路由快速配置：读 [references/vue-router/overview.md](references/vue-router/overview.md)。
- Vue 2 路由、Vue Router 3、`Vue.use(VueRouter)`、`next` 风格守卫：读 [references/vue-router-v3/overview.md](references/vue-router-v3/overview.md)。
- Vue 3 路由、Vue Router 4、`createRouter`、Composition API、typed routes：读 [references/vue-router-v4/overview.md](references/vue-router-v4/overview.md)。
- Vue 3 状态管理、Pinia store、插件、SSR、测试、Vuex 迁移：读 [references/pinia/overview.md](references/pinia/overview.md)。
- Vue 2 状态管理、Vuex 3、state/getters/mutations/actions/modules：读 [references/vuex-vue2/overview.md](references/vuex-vue2/overview.md)。

## 决策规则

- Vue 3 新代码优先使用 `<script setup>`、Composition API、TypeScript、Pinia、Vue Router 4。
- Vue 2 维护代码优先保持 Options API、Vue Router 3、Vuex 3 的一致性，除非用户明确要求迁移。
- 局部组件状态留在组件内；跨页面共享状态用 Pinia/Vuex；只读派生值用 computed/getters。
- 路由权限、布局、标题、缓存等横切信息放在 route `meta`，不要散落在多个页面组件里。
- 复杂复用逻辑优先抽成 composable；只有需要封装 UI、slot、props/emits 契约时才抽组件。
- 不要为了“更现代”而重写大块旧代码；迁移要分层推进，并保留可验证的行为等价。
- 当参考目录里已有更细的 `api/` 或 `examples/` 文档时，优先使用这些材料，不要只凭记忆实现。

## 常用核查

- 响应式：避免解构丢失响应性；Vue 2 新增对象属性和数组索引变更要用 `$set`/`splice`。
- 组件契约：props 单向流动，事件名清晰；Vue 3 用 `defineProps`、`defineEmits`、`defineModel` 时保持类型明确。
- 路由：懒加载页面组件；HTML5 history 模式确认服务端 fallback；守卫必须处理未登录、无权限、循环跳转。
- 状态：action 处理异步，mutation/Vuex 只做同步；Pinia action 可直接改 state，但仍要保持职责清楚。
- 质量：优先运行 `npm run type-check`、`npm run lint`、`npm test`、`npm run build` 中项目已定义的命令。
