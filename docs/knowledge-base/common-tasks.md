# 常见任务

## Purpose

记录 AI/Codex 修改本项目时最常见任务的入口文件、最小编辑面和验证要求。

## Read when

- 准备新增导出格式。
- 准备修改类型解析或表格读取规则。
- 准备调整配置模板或 fixtures。

## Facts

新增能力时优先沿用现有模式，避免引入新依赖。核心修改通常落在 `src/export/*`、`src/excel_utils.ts`、`src/TypeDefParser.ts`、`src/config_tpl.json` 或 `testcase/`。

## Workflow / Checklist

### 新增导出格式

1. 新建 `src/export/export_to_<name>.ts`。
2. 实现 `utils.IExportWrapper` 兼容类，提供单表导出和全局导出行为。
3. 在 `src/utils.ts` 的 `ExportWrapperMap` 注册新 `type`。
4. 在 `src/config_tpl.json` 增加示例配置。
5. 用 `testcase/` fixture 运行 CLI，确认输出路径和内容。
6. 更新 README 或知识库中支持格式列表。

### 修改类型解析

1. 先读 `TypeDef/index.ts`、`src/TypeDefParser.ts` 和 `src/TypeUtils.ts`。
2. 判断变化属于基础类型、数组/对象结构、列引用、自定义校验还是导出结构信息。
3. 保持 `TypeDef` 作为类型系统和校验 DSL 的定位。
4. 更新 `testcase/typeDef.ts` 和 `testcase/typeDef.js` 中对应示例。
5. 运行 `npm run build` 和 fixture CLI。

### 修改 Excel/CSV 读取

1. 先读 `src/loader/idata_loader.ts`，保持 `IDataLoader` 接口稳定。
2. Excel 行/列语义优先在 `src/excel_utils.ts` 处理，不把业务规则塞进 loader。
3. CSV 与 Excel 应尽量走相同 `HandleDataTable` 流程。
4. 涉及合并单元格时检查 `MergeArrayCells` 和 header `colspan` 行为。

### 更新配置模板

1. 修改 `src/config_tpl.json`。
2. 检查 `src/config.ts` 的结构校验是否仍然适用。
3. 更新 README 中对应配置说明。
4. 在 `validation.md` 记录新的验证命令或输出位置。

## Validation

任务完成后至少运行：

```bash
npm test
```

`npm test` wraps `npm run build` and `node dist/index.js -c src/config_tpl.json -t testcase/typeDef.js`, then checks representative generated outputs.

## Update triggers

新增常见任务、改动导出注册方式、改动 TypeDef DSL、改动 loader 接口或新增 fixture 流程时更新本页。
