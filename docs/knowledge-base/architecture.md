# 架构记忆

## Purpose

记录 `excel-game-tools` 的核心用途、数据流和模块职责，帮助 AI/Codex 在改代码前建立正确边界。

## Read when

- 需要解释项目设计。
- 准备改 CLI、loader、表格解析、TypeDef 或 exporter。
- 需要判断某个行为属于输入语义、类型系统还是输出格式。

## Facts

项目是面向游戏配置生产流程的 TypeScript/Node.js CLI。它读取 Excel/CSV 配置表，按项目自定义 TypeDef 类型系统做校验、转换、引用检查和默认值处理，再导出 JSON、JS、Lua、Go、Proto2、Proto3、protobuf-net/C# 等目标格式。

核心设计不是把 Excel 原样转成数据，而是把表格当成配置 DSL。表头、分组行、类型行和数据行都有约定语义。

`TypeDef` 是项目的类型系统和校验 DSL：它既负责把 Excel 单元格字符串转换成强类型数据，也负责表达跨列/跨表引用、默认值、自定义校验和导出时需要的结构信息。

## Data flow

1. `src/index.ts` 解析 CLI 参数：`-c <config>`、`-t <typeDef>`、`--debug-output [0|1]`。
2. `src/config.ts` 读取配置，并用 `src/config_tpl.json` 的结构做基础格式校验。
3. `src/works.ts` 初始化 exporter，读取 `IncludeFilesAndPath`，协调读取、解析和导出流程。
4. `src/loader/excel_loader.ts` 和 `src/loader/csv_loader.ts` 通过 `IDataLoader` 提供统一读取接口。
5. `src/excel_utils.ts` 处理表格语义：表头、分组、类型行、基础数据行、高阶类型解析和合并单元格数组列。
6. `src/TypeDefParser.ts` 初始化用户 `typeDef.js`，解析类型字符串，执行默认值、唯一、非空、非零、自定义校验和引用检查。
7. `src/export/export_to_*.ts` 将 `SheetDataTable` 输出成目标格式。

## Module boundaries

- CLI 和流程编排：`src/index.ts`、`src/works.ts`。
- 配置和全局状态：`src/config.ts`、`src/config_tpl.json`。
- 输入抽象：`src/loader/*`、`IDataLoader`。
- 表格语义：`src/excel_utils.ts`。
- 类型系统：`TypeDef/index.ts`、`src/TypeDefParser.ts`、`src/TypeDefLoader.ts`、`src/TypeUtils.ts`。
- 输出格式：`src/export/export_to_*.ts` 和 `utils.ExportWrapperMap`。

## Update triggers

修改执行顺序、表格行语义、TypeDef 初始化、动态加载方式、导出注册方式或支持格式列表时更新本页。
