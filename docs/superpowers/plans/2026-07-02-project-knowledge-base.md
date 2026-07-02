# Project Knowledge Base Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create a Chinese project knowledge base for AI/Codex long-term memory, with discoverability links from assistant entry files.

**Architecture:** Add focused Markdown pages under `docs/knowledge-base/` and short pointers from `AGENTS.md` and `CLAUDE.md`. Keep the knowledge base task-oriented, factual, and separate from README-style user documentation.

**Tech Stack:** Markdown documentation, existing TypeScript/Node.js project facts, shell verification with `rg`, `find`, and `git diff`.

---

## File Structure

- Create: `docs/knowledge-base/index.md` — entry point, reading order, maintenance rules.
- Create: `docs/knowledge-base/architecture.md` — confirmed project purpose, data flow, module responsibilities.
- Create: `docs/knowledge-base/common-tasks.md` — common AI/Codex modification checklists.
- Create: `docs/knowledge-base/validation.md` — build and fixture validation commands.
- Create: `docs/knowledge-base/pitfalls.md` — high-risk constraints and known sharp edges.
- Modify: `AGENTS.md` — add a short knowledge base discovery pointer.
- Modify: `CLAUDE.md` — add the same discovery pointer for Claude Code.

## Task 1: Create Knowledge Base Entry And Architecture Pages

**Files:**
- Create: `docs/knowledge-base/index.md`
- Create: `docs/knowledge-base/architecture.md`

- [ ] **Step 1: Confirm files do not exist yet**

Run:

```bash
test ! -e docs/knowledge-base/index.md
test ! -e docs/knowledge-base/architecture.md
```

Expected: both commands exit `0`.

- [ ] **Step 2: Create `docs/knowledge-base/index.md`**

Write exactly:

```markdown
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
```

- [ ] **Step 3: Create `docs/knowledge-base/architecture.md`**

Write exactly:

```markdown
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
```

- [ ] **Step 4: Verify created pages**

Run:

```bash
rg -n "Purpose|Read when|Update triggers|TypeDef" docs/knowledge-base/index.md docs/knowledge-base/architecture.md
```

Expected: matches appear in both files.

- [ ] **Step 5: Commit task 1**

Run:

```bash
git add docs/knowledge-base/index.md docs/knowledge-base/architecture.md
git commit -m "docs: add knowledge base entry and architecture"
```

Expected: commit succeeds with two new files.

## Task 2: Add Task, Validation, And Pitfall Pages

**Files:**
- Create: `docs/knowledge-base/common-tasks.md`
- Create: `docs/knowledge-base/validation.md`
- Create: `docs/knowledge-base/pitfalls.md`

- [ ] **Step 1: Create `docs/knowledge-base/common-tasks.md`**

Write exactly:

```markdown
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
npm run build
node dist/index.js -c src/config_tpl.json -t testcase/typeDef.js
```

## Update triggers

新增常见任务、改动导出注册方式、改动 TypeDef DSL、改动 loader 接口或新增 fixture 流程时更新本页。
```

- [ ] **Step 2: Create `docs/knowledge-base/validation.md`**

Write exactly:

```markdown
# 验证手册

## Purpose

记录当前仓库可用的构建和手动验证路径，避免把不可用命令误当成测试套件。

## Read when

- 修改 TypeScript 源码后准备验证。
- 修改 fixtures、导出格式、TypeDef 或配置模板后准备验收。
- 需要判断能否声称“测试通过”。

## Facts

`npm test` 当前是默认失败脚本：

```bash
npm test
```

预期结果是输出 `Error: no test specified` 并退出失败。不要把它当作可用测试套件。

## Workflow / Checklist

### 构建验证

运行：

```bash
npm run build
```

预期行为：先进入 `TypeDef/` 执行 `tsc`，再回到仓库根目录执行 `tsc`，生成或更新 `dist/`。

### Fixture CLI 验证

构建后运行：

```bash
node dist/index.js -c src/config_tpl.json -t testcase/typeDef.js
```

预期行为：读取 `testcase/` 中 Excel/CSV fixtures，执行 TypeDef 校验，并按 `src/config_tpl.json` 的 `Export` 配置写入 `testcase/exports/`。

### 打包验证

需要验证 standalone binary 时运行：

```bash
npm run pkg
```

预期行为：使用 `pkg` 生成 Linux、macOS、Windows 可执行文件到 `bin/`。

## Validation

文档改动至少运行：

```bash
rg -n "TB[D]|TO[D]O|FIX[M]E|[待]定|[占]位|\\?\\?" docs/knowledge-base AGENTS.md CLAUDE.md
find docs/knowledge-base -maxdepth 1 -type f | sort
```

预期结果：第一条命令无输出并退出 `1`；第二条命令列出 5 个知识库 Markdown 文件。

## Update triggers

新增真实测试脚本、改动构建命令、改变 fixture 路径、改变导出输出目录或调整打包方式时更新本页。
```

- [ ] **Step 3: Create `docs/knowledge-base/pitfalls.md`**

Write exactly:

```markdown
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
```

- [ ] **Step 4: Verify task pages**

Run:

```bash
rg -n "Purpose|Read when|Workflow / Checklist|Validation|Update triggers" docs/knowledge-base/common-tasks.md docs/knowledge-base/validation.md docs/knowledge-base/pitfalls.md
```

Expected: each page has the standard sections.

- [ ] **Step 5: Commit task 2**

Run:

```bash
git add docs/knowledge-base/common-tasks.md docs/knowledge-base/validation.md docs/knowledge-base/pitfalls.md
git commit -m "docs: add knowledge base task and validation guides"
```

Expected: commit succeeds with three new files.

## Task 3: Add Discovery Pointers

**Files:**
- Modify: `AGENTS.md`
- Modify: `CLAUDE.md`

- [ ] **Step 1: Add pointer to `AGENTS.md`**

Insert this section after the opening project structure section or before build commands:

```markdown
## Project Knowledge Base

Long-term project memory for Codex/AI work lives in `docs/knowledge-base/index.md`. Read it before changing loaders, parsers, TypeDef behavior, exporters, validation flows, or generated-output rules.
```

- [ ] **Step 2: Add pointer to `CLAUDE.md`**

Insert this section after `## Project Overview`:

```markdown
## Project Knowledge Base

Long-term project memory for AI-assisted development lives in `docs/knowledge-base/index.md`. Read it before changing loaders, parsers, TypeDef behavior, exporters, validation flows, or generated-output rules.
```

- [ ] **Step 3: Verify pointers**

Run:

```bash
rg -n "docs/knowledge-base/index.md" AGENTS.md CLAUDE.md
```

Expected: one match in `AGENTS.md` and one match in `CLAUDE.md`.

- [ ] **Step 4: Commit task 3**

Run:

```bash
git add AGENTS.md CLAUDE.md
git commit -m "docs: link assistant guides to knowledge base"
```

Expected: commit succeeds with entry-file pointer updates. If `AGENTS.md` is currently untracked, this command intentionally adds it because the approved spec requires an `AGENTS.md` discovery pointer.

## Task 4: Final Documentation Verification

**Files:**
- Verify: `docs/knowledge-base/*.md`
- Verify: `AGENTS.md`
- Verify: `CLAUDE.md`

- [ ] **Step 1: Verify file set**

Run:

```bash
find docs/knowledge-base -maxdepth 1 -type f | sort
```

Expected:

```text
docs/knowledge-base/architecture.md
docs/knowledge-base/common-tasks.md
docs/knowledge-base/index.md
docs/knowledge-base/pitfalls.md
docs/knowledge-base/validation.md
```

- [ ] **Step 2: Scan for unfinished markers**

Run:

```bash
rg -n "TB[D]|TO[D]O|FIX[M]E|[待]定|[占]位|\\?\\?" docs/knowledge-base AGENTS.md CLAUDE.md
```

Expected: no output; command exits `1`.

- [ ] **Step 3: Verify required facts are present**

Run:

```bash
rg -n "TypeDef.*DSL|TypeDefLoader|npm test|node dist/index.js -c src/config_tpl.json -t testcase/typeDef.js|GroupMap|GroupFilter" docs/knowledge-base
```

Expected: matches for TypeDef DSL, TypeDefLoader, npm test, fixture CLI, GroupMap, and GroupFilter.

- [ ] **Step 4: Review final diff**

Run:

```bash
git status --short
git log --oneline -n 4
```

Expected: no unstaged knowledge-base changes remain; recent commits include the task commits above.
