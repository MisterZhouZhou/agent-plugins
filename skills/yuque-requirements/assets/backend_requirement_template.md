# 参考上下文

暂无

# 技术栈与规范

## 1、技术栈使用（必须）

- 强制使用 Java 8 版本
- 数据库连接池使用 HikariCP
- 数据库持久层使用 MyBatis-Flex
- 工具类使用 Hutool 工具类
- Vo、Bo、Dto、Do 等实体对象映射采用 MapStruct
- 使用 Lombok 的 @Data 和 @Slf4j 处理 get、set 和日志注解
- 统一唯一 ID 生成通过使用内部分布式 ID 生成器 `com.example.generate` 实现，Maven 版本为 `2.0.1.RELEASE`

## 2、规范要求

- 使用阿里巴巴 Java 开发手册作为基础编码规范
- 不明确的调用都需要查阅官方文档之后再做判断
- 使用 DDD 领域驱动设计思想组织业务逻辑
- 接口传递参数禁止使用 Map 对象类，必须封装实体类对象
- Controller 接口请求对象类尾缀名称是 Query，响应对象类尾缀名称是 Vo
- Dubbo 接口请求对象类尾缀是 Qo，响应对象类尾缀名称是 Dto
- Dubbo 接口注解不添加任何版本号
- Service 业务层之间调用使用对象类尾缀名称是 Bo
- 持久层 Repository 调用返回封装对象类尾缀名称是 Do
- Controller 层接口方法内容不做业务处理，业务处理工作交给 Service，Controller 只做数据类型转换和组合以及异常的处理
- MyBatis-Flex 的接口 xml 文件放到 resources 中 sqlmap 文件夹内
- application 的配置参数配置在 resources 中的 config/application.properties 文件中
- 完善的注释描述，包括类注释、接口注释、字段注释
- 项目内工具类统一存放在 utils 包路径下
- 项目文件结构规范：
  - api 模块包含 model（存放 Qo、Dto）、service（存放 Dubbo 接口）
  - server 模块包含 model（存放 Do、Bo、Query、Vo、Enum）
- Controller 使用 Get 和 Post 请求类型，当请求参数超过 3 个之后使用 Post 请求
- Vo 和 Query 的对象类中：
  - 禁止使用 Long 字段类型，统一转换 String 类型
  - 日期类型采用 String 类型，格式是 `yyyy-MM-dd HH:mm:ss`
  - 关于钱相关的字段都必须是 String 类型，单位元
  - Dubbo 接口中的 Dto 和 Qo 都必须 Long 类型，单位分
- 接口方法都添加调用日志 `log.info`，异常使用 `log.error` 记录异常日志
- 业务方法中避免出现显示变量，都统一存放在常量类中并且有详细的注释或者存放在枚举类型中方便描述和类型转换
- 字典类型字段封装成枚举类型便于业务使用
- Controller 层返回结构禁止使用 Map，通过 `com.example.optimus.webmvc.WebResult` 包装 Vo 实体返回
- Service 层业务类需定义 Interface，在 impl 具体实现 Interface 中业务内容
- Bo、Vo、Qo、Dto、Query 等实体对象类的转换映射都使用 MapStruct 映射类进行对象的转换
- 打印日志都采用中文内容输出，标注出当前日志在什么类和方法内打印的
- 接口和实现类文件位置需要分开，不要混在一个包文件中
- 接口、实体类、实体类字段参数、实现类方法都需要添加注释，在一些方法内业务逻辑中也标注注释描述
- 第三方组件的使用都需要查看官方文档之后才能进行使用
- Controller 添加 Swagger 文档的注解配置
- Spring 容器内的实例变量注入采用 `private final 属性` 构造方法注入形式
- 事务注解 `@Transactional` 以及缓存注解都需要穿透接口调用，禁止在本类间调用导致代理不生效
- Controller 返回分页接口中使用 `com.example.common.base.share.toolkit.web.page.WebPage` 类进行封装分页结果数据
- Http 请求实体中包含钱的字段都采用 String 类型，单位分
- example 包是仿照示例文件夹，示例代码可以参照此包，但是不要将项目业务代码也在其中
- 禁止在同一类内部直接调用带有 `@Transactional` 注解的方法，必须通过注入的 Service 接口调用
- api 层使用 `optimus-dubbo-doc-annotation` 工具包增加 Dubbo 接口出入参注解及类注释，包括 InterfaceDesc、MethodDesc、MethodParamDesc、MethodRetDesc、ParamDesc
- HttpApi 接口、DubboApi 接口（包含 Pom 坐标和版本）、MQ 消息都需要记录在 Api 接口文档中，修改、添加、删除都需要更新接口文档保证项目和文档的一致性
- 及时进行 mvn 编译验证当前阶段编码是否错误，编译错误及时纠正
- **枚举字段映射检查规则**：当检查或修改枚举类型字段（如 status、paymentFlag、paymentMethod、paymentChannel 等）时，必须检查完整的映射链路：枚举定义（Enum）→ 持久层对象（Do）→ Mapper 映射（MapStruct）→ 展示层对象（Vo）。Vo 对象中需要同时提供 code 字段（标识值，用于前端判断）和 desc 字段（描述值，用于前端展示），参考 status/statusDesc、paymentFlag/paymentFlagDesc 的模式。Mapper 映射中需要确保 code 字段返回枚举的 getCode() 值，desc 字段返回枚举的 getDesc() 值，不能只返回 desc 而遗漏 code 字段。检查时不能仅验证枚举定义层，必须验证到 Vo 展示层的完整映射逻辑。

# 功能需求

## 原需求标题1

1. 后端模块位置与职责。

2. 业务逻辑与处理流程。
   - 场景1。
   - 场景2。

3. 数据模型与字段定义。

4. 待确认项：暂无。

## 原需求标题2

1. 后端模块位置与职责。

2. 业务逻辑与处理流程。
   - 场景1。
   - 场景2。

3. 数据模型与字段定义。

4. 待确认项：暂无。

## 接口描述

1. 接口路径：暂无

2. 请求方法：暂无

3. 请求参数：暂无

4. 请求示例：暂无

5. 响应结构：暂无

6. 响应示例：暂无

7. 异常处理：暂无

8. 响应码说明：暂无

> 未提供额外上下文时请填写：暂无。

> 无接口数据时请填写：暂无。

> 用户明确提供的包名、类名、接口路径、现有实现方式，应优先放入"参考上下文"。

> "功能需求"下的二级标题应尽量复用原始需求标题，不要统一改成"需求描述"。

> 一个编号点下如果有多种类型、多种状态或多条处理分支，优先用次级短横线列表展开。

## 数据库设计

1. 表结构：暂无

2. 字段说明：暂无

3. 索引设计：暂无

4. 关联关系：暂无

> 无数据库设计信息时请填写：暂无。

## 工作流程

- 先不要着急开发，你先尝试理解需求，有任何问题都可以问我
- 待我确定无误后再进行任务拆分
- 我确定任务无误后再进行开发