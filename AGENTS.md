# Repository Guidelines

## Project Structure & Module Organization

This repository is a TypeScript CLI for exporting Excel/CSV game configuration data. Source lives in `src/`, with loaders in `src/loader/`, exporters in `src/export/`, and shared parsing/config utilities at the top of `src/`. `TypeDef/` is a companion type-definition package compiled before the main project. `testcase/` contains sample spreadsheets, CSV files, and type definitions used as fixtures. `dist/` and `bin/` contain generated build and packaged CLI output.

## Project Knowledge Base

Long-term project memory for Codex/AI work lives in `docs/knowledge-base/index.md`. Read it before changing loaders, parsers, TypeDef behavior, exporters, validation flows, or generated-output rules.

## Build, Test, and Development Commands

- `npm install` installs project dependencies, including the SheetJS tarball dependency.
- `npm run build` compiles `TypeDef/` and then the main TypeScript project into `dist/`.
- `npm run pkg` packages standalone executables into `bin/`.
- `./build.sh` runs install, build, and packaging in sequence.
- `node dist/index.js -c src/config_tpl.json -t testcase/typeDef.js` runs the compiled CLI against the included fixtures.

Note that `npm test` is currently a placeholder and exits with an error.

## Coding Style & Naming Conventions

Use TypeScript with CommonJS modules and strict type checking. Existing code uses tabs for indentation, single quotes for imports/strings in TypeScript, and semicolons. Keep file names descriptive and follow the current pattern: loader files use `*_loader.ts`, exporters use `export_to_*.ts`, and core parser/utility classes use PascalCase where already established, such as `TypeDefParser.ts`.

## Testing Guidelines

There is no automated test framework configured. For behavioral changes, rebuild with `npm run build`, then run the CLI against `testcase/` fixtures and inspect generated output under `testcase/exports/`. Add or update fixture spreadsheets, CSV files, and `typeDef` definitions when changing parser, loader, validation, or exporter behavior.

## Commit & Pull Request Guidelines

Recent commits are short and often use `feat:` for feature work, with occasional plain refactor messages. Prefer concise, imperative commit subjects such as `feat: add CSV merge validation` or `refactor: simplify type parsing`. Pull requests should describe the changed export behavior, list validation commands run, mention fixture updates, and include before/after output examples when generated formats change.

## Security & Configuration Tips

The CLI reads local config and dynamically loads type checker JavaScript via `-t` or `TypeCheckerJSFilePath`. Use trusted fixture files only, avoid committing local generated experiments, and document any new config keys in both `src/config_tpl.json` and `README.md`.
