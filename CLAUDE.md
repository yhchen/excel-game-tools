# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Excel-game-tools is a TypeScript/Node.js CLI tool that exports Excel/CSV game configuration data to multiple output formats (JSON, JS, Lua, Go, Proto2, Proto3, C#) with a powerful type-checking system.

## Build & Run

```bash
npm install                # Install dependencies
npm run build              # Compile TypeDef/ first, then src/ → dist/
npm run pkg                # Package standalone binaries to bin/
```

Run the tool:
```bash
node dist/index.js -c config.json -t typeDef.js
```

CLI flags: `-c <config>` (required), `-t <typeDef>` (required), `--debug-output [0|1]`

No automated test suite exists. Use `testcase/` directory with sample Excel/CSV files for manual verification.

## Architecture

**Data flow:** Excel/CSV files → Loader → 3-step pipeline → TypeDef validation → Exporters → output files

### Entry & Orchestration
- `src/index.ts` — CLI entry point, argument parsing
- `src/works.ts` — Workflow orchestration, manages async execution via `AsyncWorkMonitor`
- `src/config.ts` — Loads and validates JSON config against `src/config_tpl.json`

### Loader System (`src/loader/`)
- `idata_loader.ts` — `IDataLoader` interface (defines `getData()`, `getMerges()`)
- `excel_loader.ts` — XLSX parsing via `xlsx` library
- `csv_loader.ts` — CSV parsing via `csv-parse`

### Core Processing (`src/excel_utils.ts`)
Three-step pipeline, each a separate function:
1. **HandleDataTableStep1** — Parse header rows: table name, column names, group filters
2. **HandleDataTableStep2** — Parse type rows, validate against TypeDef definitions
3. **HandleDataTableStep3** — Parse data rows, apply type checking, handle merged cells

### Type System
- `TypeDef/index.ts` — Type definition DSL with factory functions: `TArray`, `TObject`, `TStruct`, `TJson`, `TEnum`, `TCustom`, `TTranslate`. Compiled to `TypeDef/index.js` for runtime use.
- `src/TypeDefParser.ts` — Parses and validates type strings from Excel columns against TypeDef definitions
- `src/TypeDefLoader.ts` — Dynamically `require()`s user-provided typeDef JS files
- `src/TypeUtils.ts` — Helper functions for type parsing

### Export System (`src/export/`)
All exporters extend `IExportWrapper` (defined in `src/utils.ts`) with two methods:
- `ExportTo()` — Per-sheet export
- `ExportGlobal()` — Combined/global export

Seven exporters: JSON, JS, Lua, Proto2, Proto3, Go, C# (protobuf-net)

## Key Conventions

- Column names must match `/^[a-zA-Z0-9_]+$/`
- Files/sheets starting with `!`, `#`, `.`, or `~$` are skipped
- Columns prefixed with `#` are treated as comments
- Rows with `#` in the first cell are comment rows
- Array separators: `,` (level 0), `;` (level 1), `\n` (level 2)
- Type metadata uses obfuscated keys (`__inner__*__abcxyz__`) to avoid name collisions
- Config uses `GroupMap`/`GroupFilter` for selective column export (e.g., Server vs Client)
