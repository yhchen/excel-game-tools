# Validation-First Project Optimization Design

## Context

`excel-game-tools` is a TypeScript CLI that reads Excel/CSV game configuration tables, validates and transforms them through the project TypeDef DSL, then exports JSON, JS, Lua, Go, proto2, proto3, and protobuf-net/C# outputs.

The deep diagnosis found that the existing happy path is working:

- `npm run build` succeeds.
- `node dist/index.js -c src/config_tpl.json -t testcase/typeDef.js` succeeds against bundled fixtures.
- The fixture run generates expected output families under `testcase/exports/`.

The diagnosis also found that project optimization should start with verification:

- `npm test` is currently a placeholder that exits with an error.
- There are no JS/TS unit or integration test files.
- Core behavior lives in high-risk areas: `src/excel_utils.ts`, `src/TypeDefParser.ts`, `TypeDef/index.ts`, `src/utils.ts`, and `src/export/*`.
- `npm audit` reports dependency risks, including critical `protobufjs` advisories, but dependency upgrades are safer after a real regression command exists.

## Goal

Create a small, repeatable validation entry point before making behavior-changing cleanup, dependency upgrades, or exporter refactors.

The first optimization phase should make the current fixture workflow easy to run and easy to fail with useful messages. It should not alter table semantics, TypeDef behavior, dynamic type loading, exporter output shape, or dependency versions.

## Success Criteria

- `npm test` becomes a real validation command.
- The validation command runs the existing build and fixture CLI flow.
- The command checks that representative generated outputs exist and are non-empty.
- The command performs a small number of stable content checks:
  - JSON output can be parsed.
  - proto2 global output contains `syntax = "proto2"`.
  - proto3 global output contains `syntax = "proto3"`.
- Validation failures identify the failing command, missing file, empty file, or invalid content check.
- No new runtime or development dependency is added.
- Documentation describes the new validation command and the lower-level commands it wraps.

## Non-Goals

- Do not refactor loader, parser, TypeDef, exporter, or utility code in this phase.
- Do not upgrade dependencies in this phase.
- Do not change `.gitignore` generated-output policy unless a later implementation detail proves it necessary.
- Do not add snapshot testing in this phase.
- Do not change generated export formats.
- Do not replace the TypeDef dynamic `require` flow.

## Proposed Implementation Shape

Add a lightweight Node script such as `scripts/verify-fixtures.js`.

The script should:

1. Print clear phase headings.
2. Run `npm run build`.
3. Run `node dist/index.js -c src/config_tpl.json -t testcase/typeDef.js`.
4. Check representative output files under `testcase/exports/`.
5. Parse at least one JSON output file.
6. Check stable proto syntax markers.
7. Exit with code `1` on failure and `0` on success.

Representative output checks should cover the main output families without asserting every generated file:

- `testcase/exports/global.json`
- `testcase/exports/global.js`
- `testcase/exports/global.lua`
- `testcase/exports/global.cs`
- `testcase/exports/global_proto2.proto`
- `testcase/exports/global_proto3.proto`
- `testcase/exports/json/TypeHighChecker.json`
- `testcase/exports/js/Example1.js`
- `testcase/exports/lua/Example1.lua`
- `testcase/exports/proto2-data/Example1Category.bytes`
- `testcase/exports/proto3-data/Example1.bytes`
- `testcase/exports/protobuf-net/Example1.cs`

Update `package.json` so:

- `npm test` runs the fixture verification.
- An explicit `verify:fixtures` script can expose the same command for clarity.

Update documentation:

- `docs/knowledge-base/validation.md`: document `npm test` as the primary verification entry point and retain the underlying build and CLI commands.
- `docs/knowledge-base/common-tasks.md`: update the minimum validation guidance to prefer `npm test` for behavior changes.
- `README.md` and `README_CN.md`: add a short validation command note if the implementation changes the public development workflow.

## Error Handling

The validation script should fail fast for command failures and continue no further after a failed build or fixture run. File checks should report all missing or empty representative outputs in one error message where practical, because that makes export failures easier to diagnose.

Content checks should be intentionally narrow. They should verify stable invariants rather than compare complete generated files, avoiding platform-specific line ending or formatting noise.

## Risks And Mitigations

Fixture CLI execution rewrites `testcase/exports/`. This is already the documented validation path, and those generated outputs are not expected to appear in `git status` for this phase. The validation script should not require committing generated files.

Running `npm test` will be slower than a future unit test suite because it builds TypeDef, builds the main project, and runs the CLI. Current diagnosis showed this path is fast on bundled fixtures, and the stronger regression signal is worth the cost for now.

If a representative output file changes because fixture configuration changes, the expected file list should be updated in the same change that updates the fixture or config.

## Follow-Up Optimization Roadmap

After this phase lands, the next optimization phases should be:

1. Dependency safety and reproducibility: address `protobufjs` and `lodash` audit findings, decide whether the root lockfile should remain ignored, and verify packaged binary behavior if package changes affect `pkg`.
2. Shared exporter helpers: extract common row-to-object and template validation behavior from JSON, JS, and Lua exporters.
3. Focused parser/exporter refactors: only after the validation command protects the fixture workflow, consider proto2/proto3 deduplication and smaller `excel_utils.ts` boundaries.

