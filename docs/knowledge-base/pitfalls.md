# 风险坑点

## Purpose

记录容易被误改的设计约束，降低 AI/Codex 在清理、重构或新增功能时破坏现有行为的风险。

## Read when

- 准备重构 `TypeDefLoader.ts`、`TypeDefParser.ts`、`excel_utils.ts` 或 exporter。
- 准备清理动态 `require`、全局状态、生成输出或 fixture。
- 构建能过但 fixture 输出异常。

## Facts

`src/TypeDefLoader.ts` 的动态加载是设计约束。它临时改写 `global.require`，让用户提供的 `typeDef.js` 在运行时仍可加载 `def` 和相对路径模块。不要为了静态分析或表面清理把它直接改成静态 `import`，否则可能破坏 `pkg` 打包后的外部类型加载场景。

表格行语义很重要：项目依赖约定的表头、可选分组行、类型行和数据行。修改跳行、注释行或首列判断时，要同步检查 Excel 和 CSV fixtures。

`GroupMap` 和 `GroupFilter` 决定列是否进入某个导出目标。导出结果缺列时，先检查分组配置和表格 `$` 行，不要直接改 exporter。

数组分隔符来自 `gCfg.ArraySpliter`。多维数组、对象数组和合并单元格数组列会经过 `MergeArrayCells` 和 `TypeDefParser.splitArray`，改动时必须用 fixtures 覆盖。

`dist/`、`bin/` 和 `testcase/exports/` 是生成输出或打包输出。提交前检查 diff，避免混入本地实验产物。

## Workflow / Checklist

修改高风险区域前：

1. 读对应源码和本页。
2. 写下预期不变行为。
3. 运行 `npm run build`。
4. 运行 fixture CLI。
5. 对比生成输出是否符合预期。

## Validation

运行：

```bash
npm run build
node dist/index.js -c src/config_tpl.json -t testcase/typeDef.js
git status --short
```

预期结果：构建和 CLI 成功；`git status --short` 中只出现本次预期修改。

## Update triggers

动态加载、表格行语义、分组过滤、数组分隔、合并单元格、生成输出路径或打包策略变化时更新本页。
