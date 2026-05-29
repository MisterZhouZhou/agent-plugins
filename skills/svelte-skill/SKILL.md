---
name: svelte-skill
description: Svelte/SvelteKit 专项开发技能。用于构建、维护、迁移或排查 Svelte 4/5 与 SvelteKit 应用，覆盖组件、runes、legacy 响应式语法、stores、路由、load、form actions、SSR/SSG、Vite、TypeScript、测试、性能与部署；详细文档按 svelte-skills 原内容和本地 vue-skill 风格存放在 references/。
---

# Svelte Skill

## 使用场景

当用户需要处理 Svelte 或 SvelteKit 项目时使用本技能，尤其是：

- 新建或改造 Svelte 组件、页面、布局、actions、stores、模块和工具函数。
- 配置或排查 SvelteKit 路由、`load`、form actions、server routes、hooks、adapters、SSR/SSG。
- 在 Svelte 4 legacy 语法和 Svelte 5 runes 语法之间做版本判断、迁移或兼容维护。
- 配置 Vite、TypeScript、Vitest、Playwright、ESLint、Prettier、svelte-check。
- 需要符合 Svelte 生态常见工程规范、响应式约束、可访问性和性能实践。

## 工作流

1. 先识别项目版本和技术栈：查看 `package.json`、`svelte.config.*`、`vite.config.*`、`src/routes`、`src/lib`、测试配置。
2. 判断语法模式：Svelte 5 新代码优先 runes；既有 legacy 项目保持 `$:`、`export let`、`createEventDispatcher` 等一致性，除非用户明确要求迁移。
3. 优先沿用项目已有模式：文件路由组织、组件写法、store 类型、UI 库、请求封装、测试工具和命名风格。
4. 根据任务读取最相关的引用文档，避免一次加载所有内容。
5. 实现时保持改动聚焦，组件逻辑优先放在已有组件、`src/lib` 模块、store 或 SvelteKit route 边界内。
6. 完成后运行项目已有的 `check`、`lint`、测试或构建命令；前端界面改动要本地预览并检查关键视口。

## 文档结构

详细文档按参考仓库 `skills/svelte-skills/svelte` 的主题内容，并参考本地 `vue-skill` 的目录结构沉淀在 `references/`：

```text
references/
  svelte/
  sveltekit/
  svelte-stores/
  tooling-testing/
  deployment-migration/
```

## 引用文档导航

先读对应子目录的 `overview.md`，再按其中的官方链接或项目文件继续确认细节。

- Svelte 组件、模板、runes、legacy 响应式、事件、props、slots、actions、生命周期、动画：读 [references/svelte/overview.md](references/svelte/overview.md)。
- SvelteKit 路由、布局、`load`、form actions、server routes、hooks、错误处理、SSR/SSG：读 [references/sveltekit/overview.md](references/sveltekit/overview.md)。
- Svelte stores、跨组件状态、上下文、派生状态、持久化、本地与服务端状态边界：读 [references/svelte-stores/overview.md](references/svelte-stores/overview.md)。
- Vite、TypeScript、svelte-check、lint、Vitest、Testing Library、Playwright、项目脚本：读 [references/tooling-testing/overview.md](references/tooling-testing/overview.md)。
- adapters、部署、预渲染、性能、安全、Svelte 4 到 5 迁移：读 [references/deployment-migration/overview.md](references/deployment-migration/overview.md)。

## 决策规则

- Svelte 5 新代码优先使用 `$state`、`$derived`、`$effect`、`$props`、callback props 和明确的 `$bindable`。
- 维护 Svelte 4 或 legacy 组件时，优先保持现有 `$:`、`export let`、`on:event`、dispatcher/store 写法一致。
- 组件内短生命周期状态留在组件内；跨组件共享状态用 stores、context 或 SvelteKit `load` 数据，不要把所有状态都全局化。
- SvelteKit 数据获取优先放在合适的 `+page(.server).ts`、`+layout(.server).ts`、`+server.ts` 或 form action 中；涉及 secrets、cookies、数据库的逻辑必须在 server-only 边界。
- 页面级 URL 状态优先用 params、search params 和 route data；不要用全局 store 偷渡可分享的导航状态。
- 组件 API 保持小而清晰：props 类型明确，双向绑定只用于真正需要父子协作修改的值。
- 不要为了“更现代”而重写大块旧代码；迁移要分层推进，并保留可验证的行为等价。
- 当用户请求最新 Svelte/SvelteKit 行为、API 或版本差异时，查询官方文档或 Context7 后再下结论。

## 常用核查

- 响应式：runes 中派生值用 `$derived`，副作用用 `$effect`；legacy 中 `$:` 依赖要清晰，避免隐藏依赖导致 stale 数据。
- SSR：浏览器 API 要放在 `onMount`、`browser` 判断或 client-only 边界；server load 不要访问 `window`、`document`。
- 数据安全：`+page.server.ts`、`+layout.server.ts`、`+server.ts` 中返回给客户端的数据要经过筛选；不要泄露 token、session 或内部错误。
- 表单：SvelteKit form actions 要处理验证、失败状态、重定向和 progressive enhancement。
- 路由：动态参数、可选参数、layout 继承、error boundaries、404/redirect 要符合 SvelteKit 文件约定。
- 可访问性：交互元素优先用语义 HTML；键盘、焦点、ARIA 和表单 label 要可用。
- 质量：优先运行 `npm run check`、`npm run lint`、`npm test`、`npm run build` 中项目已定义的命令。
