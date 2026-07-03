# 验证手册

## Purpose

记录当前仓库可用的构建和手动验证路径，避免把不可用命令误当成测试套件。

## Read when

- 修改 TypeScript 源码后准备验证。
- 修改 fixtures、导出格式、TypeDef 或配置模板后准备验收。
- 需要判断能否声称“测试通过”。

## Facts

`npm test` is the primary fixture validation command:

```bash
npm test
```

Expected behavior: build `TypeDef/`, build the main TypeScript project, run the fixture CLI against `testcase/`, and check representative generated outputs under `testcase/exports/`.

## Workflow / Checklist

### Install dependencies

Use Node.js 22 or newer.

Run:

```bash
npm ci
```

Expected behavior: installs exactly the dependency tree recorded in `package-lock.json`.

### Primary fixture validation

Run:

```bash
npm test
```

Expected behavior: executes `scripts/verify-fixtures.js`, which runs `npm run build`, runs the fixture CLI, checks representative generated outputs, parses JSON outputs, and verifies proto syntax markers.

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

### Package artifact validation

After `npm run pkg`, run:

```bash
npm run verify:pkg
```

Expected behavior: verifies non-empty Linux, macOS, and Windows package artifacts under `bin/` and, on macOS, runs the packaged binary against the bundled fixtures with external `testcase/typeDef.js`.

## Validation

文档改动至少运行：

```bash
rg -n "TB[D]|TO[D]O|FIX[M]E|[待]定|[占]位|\\?\\?" docs/knowledge-base AGENTS.md CLAUDE.md
find docs/knowledge-base -maxdepth 1 -type f | sort
```

预期结果：第一条命令无输出并退出 `1`；第二条命令列出 5 个知识库 Markdown 文件。

## Update triggers

新增真实测试脚本、改动构建命令、改变 fixture 路径、改变导出输出目录或调整打包方式时更新本页。
