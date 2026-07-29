# 语雀前端可替换 Mock 策略实施计划

**Goal:** 更新 `yuque-develop-requirements` 的规则、前端模板和使用说明，使接口文档缺失时明确先通过独立 API 层 Mock，并保证后续可低成本替换真实接口。

**Architecture:** 保留现有 `<接口路径>`、`<请求参数>`、`<响应字段>` 和 `<字段名>` 占位机制。新增的是文档约束而非具体运行时实现：生成的前端开发提示词要求页面只依赖统一 API 方法，Mock 与真实请求使用同一异步边界，真实接口接入时只替换 API 实现和字段适配。具体 Mock 工具、目录名和框架由目标项目决定，不在 Skill 中硬编码。

**Tech Stack:** Markdown Skill 文档、Markdown 前端需求模板、Markdown 使用说明；Shell 文本检查与 Git 差异校验。

## 全局约束

- 只修改以下三个文件：
  - `skills/yuque-develop-requirements/SKILL.md`
  - `skills/yuque-develop-requirements/assets/frontend_requirement_template.md`
  - `skills/yuque-develop-requirements/references/usage_guide.md`
- 不修改后端模板、脚本或其他工作区已有变更。
- 不新增“是否使用 Mock”的强制询问；接口缺失仍属于提醒类信息，不阻塞文档产出。
- 不臆造真实接口路径、请求参数、响应字段或后端命名。
- 不规定具体 Mock 工具、目录结构或项目框架。

---

### Task 1: 更新 Skill 的接口占位与可替换 Mock 规则

**Files:**
- Modify: `skills/yuque-develop-requirements/SKILL.md:127-133`（端过滤中的接口占位规则）
- Modify: `skills/yuque-develop-requirements/SKILL.md:约 190-210`（视觉物料分析中的接口占位说明，按实际行号定位）
- Modify: `skills/yuque-develop-requirements/SKILL.md:约 315-340`（前端占位标签与接口处理规则，按实际行号定位）
- Test: 无独立测试文件；使用后续文本断言验证

**Interfaces:**
- Consumes: 当前 Skill 中的前端接口动作、接口占位标签和真实接口上下文规则
- Produces: 供 Agent 遵循的可替换 Mock 约束，包括独立 API 层、统一异步调用、状态处理和替换边界

- [x] **Step 1: 建立修改前基线**

运行：

```bash
grep -n -E '接口占位|接口路径|暂时定一个|真实接口|参考上下文|字段名' skills/yuque-develop-requirements/SKILL.md
```

预期：确认需要更新的现有规则位置，并记录旧的“返回假数据”表述仅作为待替换基线。

- [x] **Step 2: 更新接口占位规则**

在 Skill 的接口占位规则中保留现有占位标签和真实接口例外，同时补充以下明确要求：

```md
- 真实接口文档未提供时，根据页面动作识别查询、详情、提交、删除、上传等接口调用场景，但不猜测正式接口契约。
- Mock 必须放在独立 API 请求层，页面和组件只能调用统一 API 方法，禁止直接写死 Mock 业务数据。
- Mock 与未来真实请求保持一致的 Promise/异步调用形式，并要求页面处理 loading、成功、空数据和失败状态。
- 后续接入真实接口时，原则上仅替换 API 实现、请求参数和响应字段适配，不修改页面交互和业务流程。
```

将单纯的“暂时定一个，返回假数据”改成包含上述边界的文案，避免只表达临时假数据而没有表达可替换设计。

- [x] **Step 3: 验证 Skill 文本约束**

运行：

```bash
grep -n -E '独立 API|统一 API|Mock|loading|空数据|失败|仅替换|字段适配|禁止.*写死' skills/yuque-develop-requirements/SKILL.md
```

预期：所有关键约束至少在接口占位/前端提炼相关章节出现；真实接口上下文例外和占位标签规则仍然存在。

---

### Task 2: 更新前端需求模板的全局约束和页面接口示例

**Files:**
- Modify: `skills/yuque-develop-requirements/assets/frontend_requirement_template.md:1-18`（参考上下文后的全局说明区）
- Modify: `skills/yuque-develop-requirements/assets/frontend_requirement_template.md:约 70、105`（页面和组件接口占位示例，按实际行号定位）
- Test: 无独立测试文件；使用模板文本断言验证

**Interfaces:**
- Consumes: Task 1 定义的接口占位和 Mock 策略
- Produces: 生成给前端开发 Agent 的全局“接口与 Mock 约束”以及页面级接口调用描述

- [x] **Step 1: 更新模板顶部的规则说明**

在 `# 功能需求` 前加入全局章节：

```md
## 接口与 Mock 约束

- 真实接口文档未提供时，先在独立 API 层提供 Mock 实现；页面和组件只能通过统一 API 方法获取或提交数据，禁止直接写死 Mock 业务数据。
- Mock 与真实接口保持相同的 Promise/异步调用方式，并完整处理 loading、成功、空数据和失败状态。
- 后续接入真实接口时，原则上只替换 API 实现、请求参数和响应字段映射，不修改页面交互和业务流程。
- 未确认的接口路径、请求参数、响应字段和后端命名使用 `<接口路径>`、`<请求参数>`、`<响应字段>`、`<字段名>` 占位，不臆造真实接口契约。
```

- [x] **Step 2: 替换页面级接口占位示例**

将组件、页面中的旧示例：

```md
调用 <接口路径> 接口（暂时定一个，返回假数据）
```

替换为能同时说明调用动作、独立 API 层 Mock、真实异步边界和后续替换范围的文案。至少覆盖查询/提交类动作中的一个通用示例，并保持接口位于实际使用它的页面或组件下。

- [x] **Step 3: 验证模板结构和后端边界**

运行：

```bash
grep -n -E '接口与 Mock 约束|独立 API|统一 API|禁止.*写死|Promise|loading|空数据|失败|仅替换|字段映射' skills/yuque-develop-requirements/assets/frontend_requirement_template.md
git diff -- skills/yuque-develop-requirements/assets/backend_requirement_template.md
```

预期：前端模板包含完整约束；后端模板无差异输出。

---

### Task 3: 同步更新使用说明并清理冲突表述

**Files:**
- Modify: `skills/yuque-develop-requirements/references/usage_guide.md:约 90-100`（输出内容说明）
- Modify: `skills/yuque-develop-requirements/references/usage_guide.md:约 140-145`（接口缺失说明，按实际行号定位）
- Test: `skills/yuque-develop-requirements/SKILL.md`
- Test: `skills/yuque-develop-requirements/assets/frontend_requirement_template.md`

**Interfaces:**
- Consumes: Skill 和前端模板中已确定的可替换 Mock 规则
- Produces: 面向用户的准确说明，解释接口缺失时会生成什么，以及为什么不需要额外确认

- [x] **Step 1: 更新使用说明中的实际输出描述**

将“没有接口信息时明确写 `暂无`”改为：

- 不猜测正式接口路径和字段；
- 输出接口占位和独立 API 层 Mock 约束；
- 页面可以先按真实异步流程完成开发；
- 真实接口提供后，尽量只替换 API 层和字段映射。

同时保留文档中对业务状态含义和参考上下文的现有说明。

- [x] **Step 2: 做全局冲突搜索**

运行：

```bash
grep -RIn --exclude-dir=.git -E '没有接口信息.*暂无|暂无.*接口|返回假数据|暂时定一个' skills/yuque-develop-requirements/SKILL.md skills/yuque-develop-requirements/assets/frontend_requirement_template.md skills/yuque-develop-requirements/references/usage_guide.md
```

预期：不再存在只表达“返回假数据”而未说明独立 API 层和可替换边界的旧文案；若保留某个短语，必须处于明确解释其不足或迁移规则的上下文中。

- [x] **Step 3: 验证三文件策略一致**

运行：

```bash
grep -RIn --exclude-dir=.git -E '独立 API|统一 API|Mock|loading|空数据|失败|仅替换|字段映射|接口路径|请求参数|响应字段' skills/yuque-develop-requirements/SKILL.md skills/yuque-develop-requirements/assets/frontend_requirement_template.md skills/yuque-develop-requirements/references/usage_guide.md
```

预期：三文件对“先 Mock、后续可替换”的关键语义一致，且占位标签仍保留。

---

### Task 4: 执行最终差异和文档质量检查

**Files:**
- Test: `skills/yuque-develop-requirements/SKILL.md`
- Test: `skills/yuque-develop-requirements/assets/frontend_requirement_template.md`
- Test: `skills/yuque-develop-requirements/references/usage_guide.md`
- Test: `skills/yuque-develop-requirements/assets/backend_requirement_template.md`

**Interfaces:**
- Consumes: 三个已更新的 Markdown 文档
- Produces: 可审阅的最小差异和验证结果

- [x] **Step 1: 检查 Markdown 文档不存在未决占位**

运行：

```bash
grep -nE 'TBD|TODO|待定|未决' skills/yuque-develop-requirements/SKILL.md skills/yuque-develop-requirements/assets/frontend_requirement_template.md skills/yuque-develop-requirements/references/usage_guide.md
```

预期：无输出；现有业务占位标签如 `<接口路径>` 不属于未决设计标记，不应被删除。

- [x] **Step 2: 检查空白错误和目标文件差异**

运行：

```bash
git diff --check
git diff --stat -- skills/yuque-develop-requirements/SKILL.md skills/yuque-develop-requirements/assets/frontend_requirement_template.md skills/yuque-develop-requirements/references/usage_guide.md
git diff -- skills/yuque-develop-requirements/SKILL.md skills/yuque-develop-requirements/assets/frontend_requirement_template.md skills/yuque-develop-requirements/references/usage_guide.md
```

预期：`git diff --check` 通过；差异只涉及三个目标文件，并且包含独立 API 层、不可写死、异步状态处理和后续替换边界。

- [x] **Step 3: 检查工作区保护**

运行：

```bash
git status --short
```

预期：确认已有工作区变更仍保留；本次新增/修改仅为三个目标文件及已批准的设计、计划文档，不触碰其他无关变更。

---

## Checkpoint

完成 Task 4 后创建一个清晰的审阅检查点：三份目标文档的可替换 Mock 策略已同步，后端模板未改动，`git diff --check` 通过，随后再向用户汇报差异和验证结果。
