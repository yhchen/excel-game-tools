# 项目知识库设计

## 目标

为 `excel-game-tools` 建立一个面向 AI/Codex 长期使用的项目知识库，沉淀架构事实、常见任务、风险坑点和验证命令，减少后续重复探索。知识库使用中文维护，代码符号、路径和命令保留英文。

## 非目标

首版不替代 `README.md`、`README_CN.md`、`AGENTS.md`、`CLAUDE.md` 或 `GEMINI.md`。它不重写完整用户手册，不展开所有模块细节，也不引入新的测试框架或运行时逻辑。

## 存放位置

知识库正文位于：

```text
docs/knowledge-base/
```

入口文件为：

```text
docs/knowledge-base/index.md
```

需要在 `AGENTS.md` 和 `CLAUDE.md` 中加入短指针，说明长期项目记忆位于 `docs/knowledge-base/index.md`。入口文件只负责发现知识库，不复制正文内容，避免多处内容漂移。首版暂不修改 `GEMINI.md`。

## 首版文件结构

首版采用任务导向结构：

- `index.md`：知识库入口，说明用途、阅读顺序和维护原则。
- `architecture.md`：记录项目数据流和核心模块职责。
- `common-tasks.md`：记录常见开发任务的入口和检查清单。
- `validation.md`：记录构建、fixture 运行和手动验证方式。
- `pitfalls.md`：记录高风险约束和容易破坏的行为。

## 内容模型

每个主题页采用短小、稳定的结构：

- `Purpose`：这一页解决什么问题。
- `Read when`：什么时候应该读这一页。
- `Facts`：只记录从仓库确认的稳定事实。
- `Workflow / Checklist`：可执行步骤。
- `Validation`：相关命令和验收证据。
- `Update triggers`：哪些改动发生时必须更新本页。

## 需要记录的关键事实

架构页记录真实数据流：CLI 参数解析进入 `src/index.ts`，配置由 `src/config.ts` 基于 `src/config_tpl.json` 初始化，Excel/CSV 由 `src/loader/*` 读取，表格处理集中在 `src/excel_utils.ts` 的三步流程，类型解析和校验由 `src/TypeDefParser.ts` 执行，输出由 `src/export/export_to_*.ts` 实现。

常见任务页至少覆盖新增导出格式、修改类型解析、调整 Excel/CSV 读取、更新配置模板和维护 fixtures。每个任务应指向相关文件、最小编辑面和验证步骤。

验证页明确记录：`npm test` 当前是默认失败脚本；主要验证路径是 `npm run build`，以及构建后运行 `node dist/index.js -c src/config_tpl.json -t testcase/typeDef.js` 检查 fixtures 输出。

坑点页保留 `TypeDefLoader.ts` 动态加载用户 `typeDef.js` 的约束，避免后续为了静态导入或清理代码破坏 `pkg` 打包后的外部类型加载场景。还应记录 Excel 行语义、`GroupMap`/`GroupFilter`、数组分隔符、生成输出和本地实验文件的提交风险。

## 验收标准

- `docs/knowledge-base/index.md` 能让新 AI 会话快速找到应该阅读的页面。
- 每个主题页都避免复制 README 大段教程，只记录开发记忆和维护操作。
- `AGENTS.md` 与 `CLAUDE.md` 都包含知识库短指针。
- 所有事实都能从当前仓库文件、配置或 README 中追溯。
- 文档创建后运行至少一次 Markdown/文本检查，并确认没有未完成标记、矛盾或未确认的承诺。

## 后续实施边界

实施阶段只创建知识库文档和入口指针，不修改 TypeScript 源码，不改变构建脚本，不新增依赖，不补充自动化测试框架。
