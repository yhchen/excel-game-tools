# Dependency Safety, Node 22, and pkg Migration Design

## Context

`excel-game-tools` is a TypeScript CLI that reads Excel/CSV game configuration tables, validates and transforms them through the TypeDef DSL, then exports JSON, JS, Lua, Go, proto2, proto3, and protobuf-net/C# outputs.

The previous optimization phase added a real validation command:

```bash
npm test
```

That command builds `TypeDef/`, builds the main TypeScript project, runs the fixture CLI, checks representative generated outputs, parses JSON outputs, and verifies proto syntax markers.

The current dependency audit shows the next optimization should address dependency safety and reproducibility:

- `protobufjs@8.0.0` has critical and high advisories.
- `lodash@4.17.21` has high and moderate advisories.
- `pkg@5.8.1` has a moderate advisory with no fix in the original package line.
- `package-lock.json` exists locally but is ignored by `.gitignore`, so installs are not reproducible from version control.
- The project currently advertises `engines.node >=12.0.0` and packages `node12-*` binaries.

The approved project direction is to raise the project baseline to Node 22, preserve `npm run pkg`, and bring `package-lock.json` under version control.

## Goal

Upgrade the project to a reproducible Node 22 dependency and packaging baseline while preserving the existing CLI behavior and standalone binary workflow.

## Success Criteria

- `package.json` declares `engines.node >=22.0.0`.
- `package-lock.json` is tracked by git and no longer ignored.
- Development documentation tells contributors to use `npm ci` for reproducible installs.
- Direct production dependency risks are addressed by upgrading:
  - `protobufjs` to the current safe 8.x line.
  - `lodash` to the current safe 4.x line.
  - `@types/lodash` to match the upgraded lodash line.
- The obsolete `pkg` dev dependency is replaced with `@yao-pkg/pkg`.
- `npm run pkg` remains the packaging command.
- The package script uses real Node 22 Linux, macOS, and Windows targets supported by `@yao-pkg/pkg`.
- `npm test` passes on Node 22.
- `npm audit --omit=dev` is clean, or any remaining production advisory is explicitly documented with a reason it cannot be fixed in this phase.
- Full `npm audit` output is reviewed and any remaining dev-only advisory is reported separately.
- `npm run pkg` produces non-empty Linux, macOS, and Windows standalone binaries.
- The macOS binary can run the fixture CLI with external `testcase/typeDef.js`, preserving the dynamic TypeDef loading behavior.

## Non-Goals

- Do not refactor loaders, parsers, TypeDef behavior, exporters, or generated output formats.
- Do not change the fixture data model or table semantics.
- Do not replace the dynamic `typeDef.js` loading flow.
- Do not add unit, snapshot, or exporter comparison tests in this phase.
- Do not upgrade unrelated dependencies such as TypeScript, chalk, csv-parse, moment, or SheetJS unless a selected dependency upgrade requires a minimal compatibility adjustment.
- Do not remove `npm run pkg` or drop standalone binary packaging.

## Dependency Baseline

The project baseline becomes Node 22 for development, validation, and packaging.

`package.json` should update:

- `engines.node` from `>=12.0.0` to `>=22.0.0`.
- `protobufjs` from `^8.0.0` to the current safe `8.6.x` line.
- `lodash` from `^4.17.21` to the current safe `4.18.x` line.
- `@types/lodash` to the current compatible line.
- `pkg` to `@yao-pkg/pkg`.

The implementation should prefer exact discovered versions from npm metadata at implementation time. Based on the current audit and npm metadata during design, the expected target versions are:

- `protobufjs@8.6.5`
- `lodash@4.18.1`
- `@types/lodash@4.17.24`
- `@yao-pkg/pkg@6.21.0`

Because `@yao-pkg/pkg@6.21.0` requires Node `>=22.0.0`, Node 22 is not only a runtime preference. It is also a packaging toolchain requirement.

## Lockfile Policy

`package-lock.json` should be committed.

`.gitignore` should stop ignoring the root lockfile. This makes dependency changes reviewable and makes installs reproducible across machines and CI.

Contributor guidance should distinguish install commands:

- Use `npm ci` for normal setup, validation, and CI-like local checks.
- Use `npm install` only when intentionally adding, removing, or upgrading dependencies.
- Commit `package.json` and `package-lock.json` together for dependency changes.

## Packaging Design

The user-facing packaging command remains:

```bash
npm run pkg
```

The package script should continue to call the `pkg` binary because `@yao-pkg/pkg` exposes a `pkg` CLI bin. The script should keep the same high-level behavior:

- Build standalone executables for Linux, macOS, and Windows.
- Compress with GZip if supported.
- Write output to `bin/`.

The implementation must first confirm the exact target names supported by the installed `@yao-pkg/pkg` version, then update the script from the old `node12-*` targets to Node 22 targets. The expected shape is:

```bash
pkg -t <node22-linux-target>,<node22-macos-target>,<node22-win-target> --compress GZip . --out-path=bin/
```

The precise target names belong in the implementation plan after the package has been installed and inspected.

## Validation Design

Validation should run in this order:

1. Install with `npm ci` on Node 22.
2. Run `npm test`.
3. Run `npm audit --omit=dev`.
4. Run full `npm audit`.
5. Run `npm run pkg`.
6. Check that the expected Linux, macOS, and Windows binaries exist and are non-empty.
7. Run the macOS binary against the bundled fixtures:

```bash
./bin/<macos-binary> -c src/config_tpl.json -t testcase/typeDef.js
```

The macOS binary fixture run is required because `TypeDefLoader.ts` dynamically loads an external `typeDef.js`, and that behavior is a known packaging constraint.

Linux and Windows binaries should be checked for presence and non-empty content on macOS. Cross-platform runtime execution is outside this phase unless a CI runner or platform-specific host is added later.

## Documentation Updates

Update these documents if their current text conflicts with the new baseline:

- `README.md`
- `README_CN.md`
- `docs/knowledge-base/validation.md`
- `docs/knowledge-base/common-tasks.md`
- `docs/knowledge-base/pitfalls.md`

Documentation should cover:

- Node 22 requirement.
- `npm ci` as the normal reproducible install command.
- `package-lock.json` being intentionally tracked.
- `npm run pkg` still being the standalone packaging command.
- Dynamic external `typeDef.js` loading remaining supported for packaged binaries.
- Audit expectations, including the distinction between production and dev-only advisories.

## Risks And Mitigations

Raising the Node baseline is a breaking development environment change. The mitigation is to document Node 22 clearly and keep CLI behavior unchanged.

Switching from `pkg` to `@yao-pkg/pkg` may change supported target names or binary output names. The mitigation is to inspect supported targets during implementation and verify generated binaries before updating docs.

Dependency upgrades may change protobuf encoding or object conversion behavior. The mitigation is to rely on the existing fixture validation and additionally run the packaged macOS binary against the same fixtures.

`package-lock.json` can change when `npm install` is used. The mitigation is to document `npm ci` for routine setup and reserve `npm install` for intentional dependency updates.

## Follow-Up Work

After this phase, good next optimization candidates are:

1. Shared exporter helpers for JSON, JS, and Lua row-to-object behavior.
2. Proto2/proto3 exporter deduplication.
3. Focused parser and loader boundary cleanup with fixture-backed regression coverage.
