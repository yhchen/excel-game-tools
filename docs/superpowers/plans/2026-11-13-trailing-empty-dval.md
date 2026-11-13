# Trailing Empty DVAL Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make a trailing run of empty `TObject` field tokens use `DVAL`, including the merged `ItemData[]` cell that is parsed with a `;;` suffix.

**Architecture:** The rule lives in the `TObject` parse callback in `TypeDef/index.ts`. `TStruct` already calls `TObject`, so it follows the same rule. Merged-cell joining and `splitArray` stay as they are. Fixtures go through `test/fixtures/scripts/generate-fixtures.js`.

**Tech Stack:** TypeScript, CommonJS, Node.js built-in test runner, existing CLI fixture runner.

**Spec:** `docs/superpowers/specs/2026-11-13-trailing-empty-dval-design.md`

## Global Constraints

- Edit `TypeDef/index.ts` only. `npm run build` emits the runtime into `node_modules/def`. Do not hand-edit `TypeDef/index.js`.
- Do not change `MergeArrayCells` or `TypeDefParser.splitArray`.
- A token is empty only when it is exactly `""`. Whitespace stays a real value.
- A hole before a later non-empty token is parsed as that token. It does not use `DVAL`.
- A field uses this rule only when `__inner_has_default_value` is true.
- Tokens past the last field stay ignored.
- Whole-cell `<!N>` stays unchanged.
- No new dependencies.
- Keep the ItemData reproduction config `ArraySpliter` as `[";", "/", "#"]`.
- Add XLSX and CSV fixtures through `test/fixtures/scripts/generate-fixtures.js`, then run that script. Do not hand-edit generated JSON, JS, or XLSX.

## Review Focus

- Middle empty before a later value: `1,,5` on `{ v1: int, v2: string.DVAL("x"), v3: int.DVAL(0) }` exports `v2` as `""` and `v3` as `5`.
- Whitespace on an `int.DVAL` field: `1, ` on `{ v1: int, v2: int.DVAL(0) }` fails with the int range error.
- Trailing empty on a required int: `1,` on `{ v1: int, v2: int }` fails with the int range error.
- Blank array cell: an empty `ItemData[]<!N>` cell fails with `value can not be empty!`.
- Explicit value plus merged empty suffix: `82000005;30;2` in the 3-column merged `Cost` column exports `Level` `2`.

---

### Task 1: Trailing empty TObject fields use DVAL

**Files:**
- Modify: `TypeDef/index.ts` (`TObject` parse callback, around lines 93-106)
- Modify: `test/fixtures/scripts/generate-fixtures.js`
- Modify: `test/integration/cli-fixtures.test.js`
- Test: `test/fixtures/positive/ItemDataMergedOmittedLevel.xlsx`
- Test: `test/fixtures/positive/TailDefaultObjects.csv`
- Test: `test/fixtures/negative/RequiredPairTrailingEmpty.csv`
- Test: `test/fixtures/negative/DvalWhitespaceNotDefault.csv`
- Test: `test/fixtures/negative/ItemDataBlank.csv`
- Generated: `test/fixtures/typeDefs/positive-typeDef.js` and the matching configs under `test/fixtures/configs/`

**Interfaces:**
- Consumes: `TypeDef.__inner_has_default_value` and `TypeDef.__inner__defaultval__abcxyz__`, set by `DVAL`.
- Produces: `TObject` parse result. No new exported function.

- [ ] **Step 1: Confirm the existing reproduction fails**

Run:

```bash
node --test --test-name-pattern "merged ItemData" test/integration/cli-fixtures.test.js
```

Expected: FAIL. The output contains `82000005;18350/82000006;400/82000002;36700;;` and `value:  is not a number or between [-2147483648, 2147483647]`.

- [ ] **Step 2: Add the edge fixtures and assertions**

`ItemData` and the `positive-itemdata-merged-omitted-level` config override `ArraySpliter: [";", "/", "#"]` are already in `generate-fixtures.js`. Leave both in place.

In `writeTypeDefs()` inside `test/fixtures/scripts/generate-fixtures.js`, add:

```javascript
typeDefs.TailDefaultObject = def.TObject({
	v1: int,
	v2: string.DVAL('x'),
	v3: int.DVAL(0)
});
typeDefs.RequiredPair = def.TObject({
	v1: int,
	v2: int
});
typeDefs.IntTailDefault = def.TObject({
	v1: int,
	v2: int.DVAL(0)
});
```

Add a fourth data row to the `EquipLevelUpCostConfig` sheet:

```javascript
['', 3, '82000005;30;2', '', '']
```

Add `test/fixtures/positive/TailDefaultObjects.csv` through `tableRows`:

- headers `id`, `value`
- groups `*`, `*`
- types `int<!!>`, `TailDefaultObject`
- rows: `['1', '1,']`, `['2', '1,,5']`, `['3', '1,kept,4']`, `['4', '1, ,']`

Register it as positive case `positive-tail-default-objects` with the default `ArraySpliter`.

Add these negative cases to `writeNegativeCsvFixtures()`:

- `RequiredPairTrailingEmpty.csv`: one row, type `RequiredPair`, value `1,`
- `DvalWhitespaceNotDefault.csv`: one row, type `IntTailDefault`, value `1, `
- `ItemDataBlank.csv`: one row, type `ItemData[]<!N>`, value `''`

Run `node test/fixtures/scripts/generate-fixtures.js`.

In `test/integration/cli-fixtures.test.js`:

- Extend `merged ItemData array fills an omitted Level from DVAL` with:

```javascript
assert.deepEqual(data['3'].Cost, [
	{ Id: 82000005, Count: 30, Level: 2 }
]);
```

- Add `trailing empty object fields use DVAL and holes stay parsed`, case `positive-tail-default-objects`, sheet `TailDefaultObjects`:

```javascript
assert.deepEqual(data['1'].value, { v1: 1, v2: 'x', v3: 0 });
assert.deepEqual(data['2'].value, { v1: 1, v2: '', v3: 5 });
assert.deepEqual(data['3'].value, { v1: 1, v2: 'kept', v3: 4 });
assert.deepEqual(data['4'].value, { v1: 1, v2: ' ', v3: 0 });
```

- Add these entries to `negativeCases`:

```javascript
['negative-required-pair-trailing-empty', /not a number/i],
['negative-dval-whitespace-not-default', /not a number/i],
['negative-item-data-blank', /value can not be empty/i],
```

- [ ] **Step 3: Run the new edge commands before the parser change**

Run:

```bash
node --test --test-name-pattern "trailing empty object fields" test/integration/cli-fixtures.test.js
```

Expected: FAIL, because `1,` still parses `v2` as `""` rather than `"x"`.

Run:

```bash
node --test --test-name-pattern "negative-required-pair-trailing-empty|negative-dval-whitespace-not-default|negative-item-data-blank" test/integration/cli-fixtures.test.js
```

Expected: PASS. These three already fail the CLI for the spec's reasons.

- [ ] **Step 4: Teach `TObject` to default a trailing empty DVAL field**

In the `TObject` parse callback in `TypeDef/index.ts`, keep the `data.length < minCount` check. While walking fields, treat `data[index]` as absent when `index >= data.length`, or when `data[index] === ""` and every later token is `""`, and the field's `__inner_has_default_value` is true. Assign `__inner__defaultval__abcxyz__` in that case. Call the field parser for every other in-range token. Leave tokens past the last field unread.

- [ ] **Step 5: Build and run the focused tests**

Run:

```bash
npm run build && node --test --test-name-pattern "merged ItemData|trailing empty object fields|negative-required-pair-trailing-empty|negative-dval-whitespace-not-default|negative-item-data-blank" test/integration/cli-fixtures.test.js
```

Expected: PASS. `data['1'].Cost` has three objects with `Level` `0`. `data['3'].Cost[0].Level` is `2`. `TailDefaultObjects` row `1` has `v2` `"x"`.

- [ ] **Step 6: Run the full validation command**

Run:

```bash
npm test
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add TypeDef/index.ts test/fixtures/scripts/generate-fixtures.js test/fixtures/typeDefs/positive-typeDef.js test/fixtures/positive/ItemDataMergedOmittedLevel.xlsx test/fixtures/positive/TailDefaultObjects.csv test/fixtures/negative/RequiredPairTrailingEmpty.csv test/fixtures/negative/DvalWhitespaceNotDefault.csv test/fixtures/negative/ItemDataBlank.csv test/fixtures/configs/positive-itemdata-merged-omitted-level.json test/fixtures/configs/positive-tail-default-objects.json test/fixtures/configs/negative-required-pair-trailing-empty.json test/fixtures/configs/negative-dval-whitespace-not-default.json test/fixtures/configs/negative-item-data-blank.json test/integration/cli-fixtures.test.js docs/superpowers/specs/2026-11-13-trailing-empty-dval-design.md docs/superpowers/plans/2026-11-13-trailing-empty-dval.md
git commit -m "fix: apply DVAL to trailing empty object fields"
```
