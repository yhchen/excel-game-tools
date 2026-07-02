# 项目知识库

## Purpose

这是 `excel-game-tools` 的 AI/Codex 长期项目记忆入口。它记录后续开发最常用、最容易遗忘、最需要验证的事实，不替代 `README.md`、`README_CN.md`、`AGENTS.md` 或 `CLAUDE.md`。

## Read when

- 新会话需要快速理解项目用途和修改入口。
- 准备修改 loader、parser、TypeDef、exporter 或配置模板。
- 需要确认构建、fixture 运行和文档维护规则。

## Reading order

1. `architecture.md`：先理解项目用途、数据流和模块边界。
2. `common-tasks.md`：按任务查找最小编辑面。
3. `validation.md`：执行构建和 fixture 验证。
4. `pitfalls.md`：修改前检查高风险约束。

## Facts

本知识库只记录能从仓库文件、配置、README 或维护者确认中追溯的事实。推断内容必须写明依据，不能写成确定事实。

## Update triggers

- 修改 `src/index.ts`、`src/works.ts`、`src/excel_utils.ts`、`src/TypeDefParser.ts`、`src/TypeDefLoader.ts`、`src/export/*` 或 `src/config_tpl.json` 时，检查相关页面是否需要更新。
- 新增导出格式、表格语义、TypeDef DSL 能力、验证命令或打包约束时，更新对应页面。
- 如果 README 与知识库事实冲突，先核对源码，再同时修正文档。
