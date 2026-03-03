# 🤖 AI Assistant Guidelines for Excel Game Tools

This document provides system instructions for AI assistants (like Gemini) working on the `excel-game-tools` project.

## 🎯 Project Overview
`excel-game-tools` is an advanced Node.js + TypeScript CLI utility for exporting game configuration data from Excel (.xlsx, .xls) and CSV files into various programming languages and data formats (JSON, JS, Lua, Go, Proto2, Proto3, C#). It features a robust type-checking and validation system to ensure configuration correctness.

## 🏗️ Architecture Pipeline
1. **Entry Point (`src/index.ts`, `src/works.ts`)**: Parses CLI arguments (`-c`, `-t`, `--debug-output`), initializes the environment, and orchestrates the workflow.
2. **Data Loading (`src/loader/*`)**: Abstracts reading from Excel (`excel_loader.ts`) and CSV (`csv_loader.ts`), standardizing the data interface (`idata_loader.ts`).
3. **Data Parsing (`src/excel_utils.ts`)**: Processes the worksheet rows progressively:
   - **Step 1**: Header Name parsing (Row 1).
   - **Step 2**: Type Definition parsing (Row 4).
   - **Step 3**: Data Collection and Validation (Row 5+).
4. **Type System & Validation (`src/TypeDefParser.ts` & `src/TypeUtils.ts`)**: The core engine. Parses the type strings defined in Excel (e.g., `int<!!;!0>`), links them to programmatic definitions in the `typeDef.ts` file provided by the user, and validates data entries against rules (unique, not null, custom logic).
5. **Exporting (`src/export/*`)**: Takes the validated `SheetDataTable` objects and generates the target language code or serialized data files (e.g., `export_to_go.ts`, `export_to_lua.ts`, etc.).

## 📝 Key Excel Format Rules to Remember
- **Row 1**: Table Name
- **Row 2 (Optional)**: Group Filter (Starts with `$`), values like `*`, `S` (Server), `C` (Client) map to the config `GroupMap`.
- **Row 3**: Column Names
- **Row 4**: Data Types (Starts with `*` in column A). Uses complex type syntax like `int[]`, `string<!N;!!>`.
- **Row 5+**: Config Data

## 💡 Guidelines for Modifying Code
1. **Adding New Exporters**:
   - Create a new file in `src/export/export_to_[lang].ts`.
   - Implement a class conforming to the `IExportWrapper` interface (defined in `src/utils.ts`).
   - Register it via `utils.ExportWrapperMap.set('your_type_name', YourClass)`.
   - Check `src/export/export_to_json.ts` for a minimal example.
2. **Testing Changes**:
   - The primary test cases and examples live in `testcase/`.
   - `testcase/typeDef.ts` defines the types and custom validators used in tests.
   - When modifying `TypeDefParser.ts`, ensure compatibility with the complex nested types and array format (`;`, `/`, `\n`) defined in the `testcase` and `README`.
3. **Logging & Errors**:
   - Use `utils.logger()` for normal output, `utils.debug()` for trace information (controlled by `--debug-output`).
   - For fatal errors during parsing/exporting that should halt the process, use `utils.exception()` or `utils.exceptionRecord()`.

## 📌 Coding Standards
- **Language**: TypeScript (`.ts`).
- **Style**: Use exact ES6 imports (e.g., `import * as fs from 'fs'`) and explicit typing.
- **Paths**: Node's `path` module is mandatory for all file operations to ensure cross-platform compatibility (Windows/Linux/Mac). 

Keep these guidelines active in your context when modifying or expanding this repository!
