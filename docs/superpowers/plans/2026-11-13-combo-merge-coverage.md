# Combo And Merge Coverage Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Lock translate/custom/json/default combinations and same-sheet merges with fixture rows the existing `npm test` run executes.

**Architecture:** Success data is sheets in `testcase/`, exported by `src/config_tpl.json` and checked in `scripts/verify-fixtures.js`. Failures are generated into `test/fixtures/negative/` and asserted by the existing `negativeCases` loop. No product source changes.

**Tech Stack:** TypeScript CLI, Node 22 `node:test`, SheetJS `xlsx`, existing fixture generator.

**Spec:** `docs/superpowers/specs/2026-11-13-combo-merge-coverage-design.md`

## Global Constraints

- Do not modify `src/` or `TypeDef/`.
- Do not add a test runner, coverage dependency, or npm script.
- Keep `testcase/typeDef.js` hand-synced with `testcase/typeDef.ts`. Do not emit `tsc` over `testcase/`.
- A failing workbook must not live in `testcase/`.
- After `node test/fixtures/scripts/generate-fixtures.js`, run `git checkout -- test/fixtures/positive/XlsxMergedArrays.xlsx`.
- Names starting with `Custom` load `coverage-typeDef.js`. Merge failures use `positive-typeDef.js`.

## Review Focus

- `ThenTranslate<!N>` empty exports `5`. A reader may expect `50` because the translator multiplies by 10. Task 1 asserts export `5`.
- `WrapTranslate<!N>` empty throws `value can not be empty` even though the inner default is `5`. Task 2 asserts that fragment.
- `MergeRows._ids` is `[2, 1]`, and row 2 `buddy` is `1` from the other file. A reader may expect include order or file A first. Task 3 asserts both.
- `MergeUniqueDup` reports `duplicate value: 1` for the same id in two files. A reader may expect uniqueness to reset per file. Task 3 asserts that fragment.
- `JsonMix` value `{}` exports `{tag:5}` with no `nums` key. A reader may expect `nums: []` or a checker failure. Task 1 asserts the omission. Task 2 asserts `{"tag":-1}` throws `json tag is negative`.

---

### Task 1: Mix success sheet

**Files:**
- Modify: `testcase/typeDef.ts`
- Modify: `testcase/typeDef.js`
- Modify: `test/fixtures/scripts/generate-fixtures.js` (`writeTypeMatrixWorkbook`)
- Modify: `scripts/verify-fixtures.js`
- Create: sheet `Mix` inside `testcase/TypeMatrix.xlsx` (via the generator)

**Interfaces:**
- Consumes: existing `int` and `string` inside `initialize`.
- Produces: type names `WrapTranslate`, `ThenTranslate`, `CustomOfTranslate`, `TranslateOfCustom`, `AllDefaultPair`, `JsonMix`, `ParityUnique`, `DoubledNonZero`.

- [ ] **Step 1: Write the failing assertion**

Add `expectMix()` and call it from the check phase in `scripts/verify-fixtures.js`. Read `global.json` sheet `Mix`. Assert `_ids` is `[1, 2]` and these rows:

```js
expectEqual(row1.wrapTranslate, 30, 'Mix 1.wrapTranslate');
expectEqual(row1.thenTranslate, 30, 'Mix 1.thenTranslate');
expectEqual(row1.thenTranslateRequired, 40, 'Mix 1.thenTranslateRequired');
expectEqual(row1.customOfTranslate, 30, 'Mix 1.customOfTranslate');
expectEqual(row1.translateOfCustom, 30, 'Mix 1.translateOfCustom');
expectEqual(row1.allRequired, { a: 8, b: 'y' }, 'Mix 1.allRequired');
expectEqual(row1.jsonMix, { nums: [1, 2], tag: 5 }, 'Mix 1.jsonMix');
expectEqual(row1.parity, 1, 'Mix 1.parity');
expectEqual(row1.doubled, 30, 'Mix 1.doubled');
expectEqual(row2.wrapTranslate, 5, 'Mix 2.wrapTranslate');
expectEqual(row2.thenTranslate, 5, 'Mix 2.thenTranslate');
expectEqual(row2.thenTranslateRequired, 5, 'Mix 2.thenTranslateRequired');
expectEqual(row2.customOfTranslate, 20, 'Mix 2.customOfTranslate');
expectEqual(row2.translateOfCustom, 0, 'Mix 2.translateOfCustom');
expectEqual(row2.allRequired, { a: 3, b: 'z' }, 'Mix 2.allRequired');
expectEqual(row2.jsonMix, { tag: 5 }, 'Mix 2.jsonMix');
expectEqual(Object.prototype.hasOwnProperty.call(row2.jsonMix, 'nums'), false, 'Mix 2.jsonMix.nums');
expectEqual(row2.parity, 0, 'Mix 2.parity');
expectEqual(row2.doubled, 40, 'Mix 2.doubled');
```

- [ ] **Step 2: Run the fixture check and confirm it fails**

Run: `node scripts/verify-fixtures.js`
Expected: FAIL because `global.json` has no `Mix` sheet.

- [ ] **Step 3: Add the types and the sheet**

Add the eight types from the spec's Mix section to `testcase/typeDef.ts` before the end of `initialize`. Mirror them in `testcase/typeDef.js` with `def_1.def` before the end of `initialize`.

In `writeTypeMatrixWorkbook`, append sheet `Mix` with group `*` and the spec table's columns, types, and two data rows. Leave `RefTarget`, `TypeMatrix`, and `Combo` rows unchanged.

Run: `node test/fixtures/scripts/generate-fixtures.js`
Then: `git checkout -- test/fixtures/positive/XlsxMergedArrays.xlsx`

Run: `npx tsc -p testcase/tsconfig.json --noEmit --strict`
Expected: exit 0.

- [ ] **Step 4: Run the fixture check and confirm it passes**

Run: `node scripts/verify-fixtures.js`
Expected: `[verify-fixtures] All checks passed.`

- [ ] **Step 5: Commit**

```bash
git add testcase/typeDef.ts testcase/typeDef.js testcase/TypeMatrix.xlsx test/fixtures/scripts/generate-fixtures.js scripts/verify-fixtures.js
git commit -m "test: lock translate and json combination rows"
```

### Task 2: Combination failure fixtures

**Files:**
- Modify: `test/fixtures/scripts/generate-fixtures.js` (`coverage-typeDef.js` template and `cases`)
- Modify: `test/integration/cli-fixtures.test.js` (`negativeCases`)
- Create: the seven `test/fixtures/negative/Custom*.csv` files and their configs, via the generator

**Interfaces:**
- Consumes: type names from Task 1, repeated in `coverage-typeDef.js`, plus `PartialStruct` and `ZeroTranslate` from the spec.
- Produces: cases `negative-custom-wrap-translate-empty`, `negative-custom-translate-below`, `negative-custom-raw-below`, `negative-custom-partial-required`, `negative-custom-json-tag`, `negative-custom-parity-dup`, `negative-custom-translated-zero`.

- [ ] **Step 1: Write the failing cases**

Append these pairs to `negativeCases`:

```js
['negative-custom-wrap-translate-empty', /value can not be empty/],
['negative-custom-translate-below', /translated below 20/],
['negative-custom-raw-below', /raw below zero/],
['negative-custom-partial-required', /value can not be empty/],
['negative-custom-json-tag', /json tag is negative/],
['negative-custom-parity-dup', /duplicate value: 1/],
['negative-custom-translated-zero', /value can not be Zero/],
```

- [ ] **Step 2: Run the new cases and confirm they fail**

Run: `node --test --test-name-pattern "negative-custom-wrap-translate-empty|negative-custom-translate-below|negative-custom-raw-below|negative-custom-partial-required|negative-custom-json-tag|negative-custom-parity-dup|negative-custom-translated-zero" test/integration/cli-fixtures.test.js`
Expected: FAIL because the configs do not exist yet.

- [ ] **Step 3: Generate the files**

Add the Mix types, `PartialStruct`, and `ZeroTranslate` to the `coverage-typeDef.js` template. Add the seven CSV files from the spec table to `cases`. `CustomParityDup.csv` has two data rows, ids `1` and `3`, values `1` and `3`. The other files have one data row. Column names are `id` and `value`, with `id` typed `int<!!>`.

Run: `node test/fixtures/scripts/generate-fixtures.js`
Then: `git checkout -- test/fixtures/positive/XlsxMergedArrays.xlsx`

The generator rewrites `testcase/TypeMatrix.xlsx`. Leave it unstaged in this task. Task 1 already recorded the `Mix` sheet.

- [ ] **Step 4: Run the new cases and confirm they pass**

Run the same `node --test --test-name-pattern` command from Step 2.
Expected: 7 pass.

- [ ] **Step 5: Commit**

```bash
git add test/fixtures/scripts/generate-fixtures.js test/fixtures/typeDefs/coverage-typeDef.js test/fixtures/negative/Custom*.csv test/fixtures/configs/negative-custom-wrap-translate-empty.json test/fixtures/configs/negative-custom-translate-below.json test/fixtures/configs/negative-custom-raw-below.json test/fixtures/configs/negative-custom-partial-required.json test/fixtures/configs/negative-custom-json-tag.json test/fixtures/configs/negative-custom-parity-dup.json test/fixtures/configs/negative-custom-translated-zero.json test/integration/cli-fixtures.test.js
git commit -m "test: add combination failure fixtures"
```

### Task 3: Same-sheet merge

**Files:**
- Modify: `scripts/verify-fixtures.js`
- Modify: `test/fixtures/scripts/generate-fixtures.js`
- Modify: `test/integration/cli-fixtures.test.js`
- Create: `testcase/MergeA.xlsx`, `testcase/MergeB.xlsx`
- Create: `test/fixtures/negative/MergeTypeMismatch.xlsx`, `MergeTypeSource.xlsx`, `MergeUniqueDup.xlsx`, `MergeDupSource.xlsx`, and the two case configs

**Interfaces:**
- Consumes: builtin `int` and `string`. No new type names.
- Produces: `global.json` sheets `ItemTable` and `MergeRows`. Cases `negative-merge-type-mismatch` and `negative-merge-unique-dup`.

- [ ] **Step 1: Write the failing assertions**

In `scripts/verify-fixtures.js`, assert `ItemTable._ids` is `[5, 6, 7, 8, 1, 2, 3, 4]` and that row `n` has `Id === n` and `Name === "name" + n` for `n` from 1 through 8.

Assert `MergeRows._ids` is `[2, 1]`, row `2` is `{id:2, name:'beta', buddy:1}`, and row `1` is `{id:1, name:'alpha', buddy:1}`.

Append:

```js
['negative-merge-type-mismatch', /different header \[id\]/],
['negative-merge-unique-dup', /duplicate value: 1/],
```

- [ ] **Step 2: Run the checks and confirm they fail**

Run: `node scripts/verify-fixtures.js`
Expected: FAIL on missing `MergeRows` or a wrong `ItemTable` assertion. `ItemTable` already has this `_ids` order in the current export, so only `MergeRows` should be missing.

Run: `node --test --test-name-pattern "negative-merge-type-mismatch|negative-merge-unique-dup" test/integration/cli-fixtures.test.js`
Expected: FAIL because the configs do not exist yet.

- [ ] **Step 3: Generate the workbooks**

Write `testcase/MergeA.xlsx` and `testcase/MergeB.xlsx` from `generate-fixtures.js` using one shared header grid from the spec and the two data rows. Sheet name `MergeRows`.

Write the two failure pairs from the spec. Exclude `MergeTypeSource.xlsx` and `MergeDupSource.xlsx` in `isNegativeCaseFile`. In `negativeIncludePath`, include the companion first, then the case file.

Run: `node test/fixtures/scripts/generate-fixtures.js`
Then: `git checkout -- test/fixtures/positive/XlsxMergedArrays.xlsx`

- [ ] **Step 4: Run the checks and the full suite**

Run: `node scripts/verify-fixtures.js`
Expected: `[verify-fixtures] All checks passed.`

Run: `node --test --test-name-pattern "negative-merge-type-mismatch|negative-merge-unique-dup" test/integration/cli-fixtures.test.js`
Expected: 2 pass.

Run: `npm test`
Expected: `[run-tests] All checks passed.`

- [ ] **Step 5: Commit**

```bash
git add scripts/verify-fixtures.js test/fixtures/scripts/generate-fixtures.js test/integration/cli-fixtures.test.js testcase/MergeA.xlsx testcase/MergeB.xlsx test/fixtures/negative/MergeTypeMismatch.xlsx test/fixtures/negative/MergeTypeSource.xlsx test/fixtures/negative/MergeUniqueDup.xlsx test/fixtures/negative/MergeDupSource.xlsx test/fixtures/configs/negative-merge-type-mismatch.json test/fixtures/configs/negative-merge-unique-dup.json
git commit -m "test: lock same-sheet merges"
```
