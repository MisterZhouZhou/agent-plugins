---
name: react-skill
description: React 专项开发技能。用于构建、维护、迁移或排查 React 与 React Native 应用，覆盖 React 18/19、Hooks、组件、React Router、Redux Toolkit、TanStack Query、Next.js、React Native、TypeScript、测试、性能、可访问性与工程化；详细文档按 React 生态模块存放在 references/。
---

# React Skill

## 使用场景

当用户需要处理 React 项目时使用本技能，尤其是：

- 新建或改造 React 组件、页面、Hook、Context、表单或交互逻辑。
- 配置或排查 React Router、Redux Toolkit、TanStack Query、Next.js、Vite、TypeScript、测试。
- 创建或维护 React Native / Expo 移动端项目、导航、列表、平台差异和原生依赖。
- 在 CSR、SSR、SSG、React Server Components、客户端组件之间做技术判断。
- 需要符合 React 生态常见工程规范、状态边界、性能实践和可访问性要求。

## 工作流

1. 先识别项目版本和技术栈：查看 `package.json`、入口文件、路由、状态管理、数据请求和测试配置。
2. 优先沿用项目已有模式：组件写法、目录结构、命名、UI 库、请求封装、状态管理、测试工具。
3. 根据任务读取最相关的引用文档，避免一次加载所有内容。
4. 实现时保持改动聚焦，组件逻辑优先放在已有组件、Hook、store、router、query 或框架约定目录的自然边界内。
5. 完成后运行项目已有的类型检查、lint、单测或构建命令；前端界面改动要本地预览并检查关键视口。

## 文档结构

详细文档按 React 生态模块沉淀在 `references/`：

```text
references/
  react/
  react-hooks/
  react-router/
  redux-toolkit/
  tanstack-query/
  nextjs/
  react-native/
  react-native-project-creator/
  testing/
  build-tooling/
```

## 引用文档导航

先读对应子目录的 `overview.md`，再按它的映射继续读取 `examples/`、`api/`、`templates/` 中的细分文档。

- React 组件、JSX、props、Context、Refs、性能、可访问性、TypeScript：读 [references/react/overview.md](references/react/overview.md)。
- React Hooks、`useState`、`useEffect`、`useReducer`、`useMemo`、`useCallback`、自定义 Hook：读 [references/react-hooks/overview.md](references/react-hooks/overview.md)。
- React Router 路由、嵌套路由、loader/action、权限守卫、懒加载：读 [references/react-router/overview.md](references/react-router/overview.md)。
- Redux Toolkit、slice、async thunk、RTK Query、store 结构：读 [references/redux-toolkit/overview.md](references/redux-toolkit/overview.md)。
- TanStack Query、服务端状态、缓存、mutation、乐观更新：读 [references/tanstack-query/overview.md](references/tanstack-query/overview.md)。
- Next.js、App Router、Server/Client Components、Route Handlers、缓存和部署：读 [references/nextjs/overview.md](references/nextjs/overview.md)。
- React Native 组件、导航、样式、平台差异、Metro、性能和原生能力：读 [references/react-native/overview.md](references/react-native/overview.md)。
- React Native / Expo 新项目创建、初始化命令和目录结构：读 [references/react-native-project-creator/overview.md](references/react-native-project-creator/overview.md)。
- React Testing Library、Vitest/Jest、组件测试、Hook 测试、E2E 边界：读 [references/testing/overview.md](references/testing/overview.md)。
- Vite、TypeScript、ESLint、构建、环境变量、代码分割：读 [references/build-tooling/overview.md](references/build-tooling/overview.md)。

## 决策规则

- 新代码默认使用函数组件、Hooks、TypeScript 和明确的 props 类型。
- 局部 UI 状态留在组件内；跨组件但轻量的状态用 Context 或局部 store；复杂客户端状态用 Redux Toolkit；服务端状态优先用 TanStack Query 或框架数据层。
- 不把远程数据复制进全局 store，除非确实需要离线编辑、跨页面持久草稿或复杂协同状态。
- Effect 只处理同步外部系统、订阅、计时器、DOM 或网络副作用；派生数据优先在 render 或 memo 中计算。
- 表单、路由、数据请求、权限、错误边界和加载态要放在用户能理解的流程边界上，不要散落在多个无关组件里。
- Next.js App Router 项目中默认保持组件为 Server Component；只有需要浏览器 API、事件处理、状态或客户端 Hook 时才加 `"use client"`。
- React Native 新项目先判断 Expo 还是 bare React Native CLI；优先从能运行的默认模板开始，再逐步加入导航、状态和原生依赖。
- 不要为了“更现代”而重写大块旧代码；迁移要分层推进，并保留可验证的行为等价。
- 当参考目录里已有更细的 `api/`、`examples/` 或 `templates/` 文档时，优先使用这些材料，不要只凭记忆实现。

## 常用核查

- 组件契约：props 类型清晰，children/slot-like API 明确，受控和非受控模式不要混用。
- Hooks：只在组件或自定义 Hook 顶层调用；依赖数组真实反映闭包使用；避免用 Effect 修补可在 render 阶段完成的计算。
- 状态：避免重复来源；服务端状态、URL 状态、表单状态、客户端 UI 状态分别放到合适位置。
- 路由：懒加载页面组件；权限跳转避免循环；URL 参数和 query 需要校验和类型转换。
- 性能：先测量再优化；谨慎使用 `memo`、`useMemo`、`useCallback`，优先减少不必要的状态提升和过宽 Context。
- 质量：优先运行 `npm run type-check`、`npm run lint`、`npm test`、`npm run build` 中项目已定义的命令。
