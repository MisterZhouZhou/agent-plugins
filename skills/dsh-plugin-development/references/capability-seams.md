# 能力分层与可替换 Provider

当一个能力需要支持多个后端或实现时，使用三层 seam；小型一次性 Tool 不要为了形式而拆包。

## 三种角色

| 角色 | 放什么 | 依赖谁 |
|---|---|---|
| Service Definition | Service 名称、Request/Result、错误码、协议 schema | Cordis 基础包 |
| Service Provider | 本地、远程或具体厂商实现 | Definition |
| Consumer | Tool、命令、Agent 或 UI | Definition |

## 推荐仓库布局

```text
dsh-capability/       # Definition
  src/service.ts
  src/protocol.ts

dsh-capability-local/ # Provider
  src/index.ts

dsh-tool-capability/  # Consumer
  src/index.ts
  src/client/index.ts
```

Provider 和 Consumer 通过 `cordis.yml` 或 profile 组合：

```yaml
- name: '@scope/dsh-capability-local'
- name: '@scope/dsh-tool-capability'
```

## 设计约束

- Definition 拥有 Request/Result 类型和运行时校验；不要把 Provider 的实现细节放进协议。
- Provider 的 `resolve` 或等价步骤显式处理默认值和能力差异。
- Consumer 只调用 Definition 暴露的公共方法；不读取 Provider 私有字段。
- 用能力协商、可选字段或新操作演进协议；破坏性变更需迁移说明。
- 每个 Provider 都要独立测试，并至少跑一次“Provider + Consumer + patch/profile”的组合测试。
