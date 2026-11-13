# Combo And Merge Coverage Design

## Intent

Add fixture rows for type combinations whose result is different from the pieces already tested, and lock same-`SheetName` merges. A cell has to execute the combination. Declaring the type is not enough.

## Goals

- Add sheet `Mix` to `testcase/TypeMatrix.xlsx` and assert it from `scripts/verify-fixtures.js`.
- Add one failure file per combination that must throw.
- Lock the existing `ItemConfig1.xlsx` + `ItemConfig2.xlsx` merge of `ItemTable`.
- Add `testcase/MergeA.xlsx` and `testcase/MergeB.xlsx`, both sheet `MergeRows`, and assert the merged rows.
- Add two merge failures: same header width with a different type, and a unique id duplicated across the two files.

## Non-goals

- No changes under `src/` or `TypeDef/`.
- No new test runner, coverage dependency, or npm script.
- Do not re-test `DupHeader` (different header length), `PointStruct[]`, or a two-dimensional object array.
- A failing workbook must not live in `testcase/`.

## Constraints

- `src/config_tpl.json` includes `./testcase`. New workbooks there export through the existing CLI run. `global.json` uses `UseDefaultValueIfEmpty: false`, so an `undefined` field is omitted.
- The CLI loads `testcase/typeDef.js`. Keep it in sync with `testcase/typeDef.ts` by hand. Do not run `tsc` emit over `testcase/`, because that rewrites every compiled file there.
- Failure files stay in `test/fixtures`. Names starting with `Custom` load `coverage-typeDef.js`. Merge failures use builtin types and `positive-typeDef.js`.
- `TTranslate` and `TCustom` copy `__inner__defaultval__abcxyz__` and do not copy `__inner_has_default_value`. `DVAL` sets that flag only when it is called on the outer type, and only when that type's otype is `base` or `enum`.
- An empty cell returns the default and skips the parser when the flag is set. `<!N>` throws `value can not be empty!` only when the flag is absent. `<!0>` and `<!!>` run on the parsed result, which for `TTranslate` is the translated value.
- `TJson` assigns `__inner__defaultval__abcxyz__` for a missing key and does not look at the flag. A `TArray` default is `undefined`, so the key is omitted. A present key runs the parser and the checker.
- `TObject` sets its own default and the flag only when every field has a default. `AllDefaultPair<!N>` therefore accepts an empty cell. A struct whose first field has no default does not.
- Two xlsx files with the same sheet name merge when name, type string, column index, comment, and group all match. Step 2 sorts by full `fileName` ascending and then reads from the end, so the later filename's rows come first. CSV sheet names are the file name, so two CSV files cannot share a sheet name.
- `IsSheetHeaderSame` failure text is `different header [id]`. A different header length is already tested and is not this case.
- After `node test/fixtures/scripts/generate-fixtures.js`, restore `test/fixtures/positive/XlsxMergedArrays.xlsx` with `git checkout -- test/fixtures/positive/XlsxMergedArrays.xlsx`. The generator rewrites its date cells.

## Approaches

1. **Chosen.** Success rows go through `testcase/` and `verify-fixtures.js`. Failures go through the existing `negativeCases` loop. Combination types used by failures live in `coverage-typeDef.js`.
2. Assert only the existing `ItemTable` merge. Rejected. That sheet does not share a unique id or a cross-file column reference, and it cannot show a same-width type mismatch.
3. Put `MergeRows` under `test/fixtures` and export JSON only. Rejected. The success rule for this batch is the same full export already used by `TypeMatrix`.

## Mix sheet

Group `*`. Two data rows. Types live in `testcase/typeDef.ts` and `testcase/typeDef.js`.

```ts
typeDefs.WrapTranslate = def.TTranslate(int.DVAL(5), (data: number) => data * 10);
typeDefs.ThenTranslate = def.TTranslate(int, (data: number) => data * 10).DVAL(5);
typeDefs.CustomOfTranslate = def.TCustom(def.TTranslate(int, (data: number) => data * 10), (data: number) => {
	if (data < 20) throw new Error('translated below 20');
});
typeDefs.TranslateOfCustom = def.TTranslate(def.TCustom(int, (data: number) => {
	if (data < 0) throw new Error('raw below zero');
}), (data: number) => data * 10);
typeDefs.AllDefaultPair = def.TObject({
	a: int.DVAL(3),
	b: string.DVAL('z'),
});
typeDefs.JsonMix = def.TJson({
	nums: def.TArray(int),
	tag: def.TCustom(int.DVAL(5), (data: number) => {
		if (data < 0) throw new Error('json tag is negative');
	}),
});
typeDefs.ParityUnique = def.TTranslate(int, (data: number) => data % 2);
typeDefs.DoubledNonZero = def.TTranslate(int, (data: number) => data * 10);
```

| Column | Type | Row 1 | Row 2 | Export 1 | Export 2 |
| --- | --- | --- | --- | --- | --- |
| id | `int<!!>` | 1 | 2 | 1 | 2 |
| wrapTranslate | `WrapTranslate` | 3 | empty | 30 | 5 |
| thenTranslate | `ThenTranslate` | 3 | empty | 30 | 5 |
| thenTranslateRequired | `ThenTranslate<!N>` | 4 | empty | 40 | 5 |
| customOfTranslate | `CustomOfTranslate` | 3 | 2 | 30 | 20 |
| translateOfCustom | `TranslateOfCustom` | 3 | 0 | 30 | 0 |
| allRequired | `AllDefaultPair<!N>` | `8,y` | empty | `{a:8,b:'y'}` | `{a:3,b:'z'}` |
| jsonMix | `JsonMix` | `{"nums":[1,2]}` | `{}` | `{nums:[1,2],tag:5}` | `{tag:5}` |
| parity | `ParityUnique<!!>` | 1 | 2 | 1 | 0 |
| doubled | `DoubledNonZero<!0>` | 3 | 4 | 30 | 40 |

`_ids` is `[1, 2]`. Row 2 `jsonMix` has no `nums` key.

## Combination failures

Each file is one CSV, one failing cell, and uses `coverage-typeDef.js`. Repeat the Mix translators there, plus:

```js
typeDefs.PartialStruct = def.TStruct({ x: typeDefs.int, y: typeDefs.int.DVAL(7) });
typeDefs.ZeroTranslate = def.TTranslate(typeDefs.int, () => 0);
```

| File | Type | Value | Error fragment |
| --- | --- | --- | --- |
| `CustomWrapTranslateEmpty.csv` | `WrapTranslate<!N>` | empty | `value can not be empty` |
| `CustomTranslateBelow.csv` | `CustomOfTranslate` | 1 | `translated below 20` |
| `CustomRawBelow.csv` | `TranslateOfCustom` | -1 | `raw below zero` |
| `CustomPartialRequired.csv` | `PartialStruct<!N>` | empty | `value can not be empty` |
| `CustomJsonTag.csv` | `JsonMix` | `{"tag":-1}` | `json tag is negative` |
| `CustomParityDup.csv` | `ParityUnique<!!>` | rows 1 and 3 | `duplicate value: 1` |
| `CustomTranslatedZero.csv` | `ZeroTranslate<!0>` | 4 | `value can not be Zero` |

`CustomParityDup` ids are 1 and 3. The duplicated value is the translated `1`, from cells `1` and `3`.

## Merge

`ItemTable` from the current sample export:

- `_ids` is `[5, 6, 7, 8, 1, 2, 3, 4]`.
- Row `n` has `Id === n` and `Name === "name" + n` for `n` from 1 through 8.

`MergeA.xlsx` and `MergeB.xlsx` use the same header grid:

```text
# | merge rows |        |
  | id         | name   | buddy
$ | *          | *      | *
* | int<!!>    | string | MergeRows.id
```

`MergeA` data is `1, alpha, 1`. `MergeB` data is `2, beta, 1`. Sheet name is `MergeRows`.

Exported `MergeRows`: `_ids` is `[2, 1]`. Row 2 is `{id:2, name:'beta', buddy:1}`. Row 1 is `{id:1, name:'alpha', buddy:1}`. `buddy` on row 2 points at an id that exists only in `MergeA.xlsx`.

Failures, with the companion excluded from the negative scan and listed first in `IncludeFilesAndPath`:

| Case file | Companion | Difference | Error fragment |
| --- | --- | --- | --- |
| `MergeTypeMismatch.xlsx` | `MergeTypeSource.xlsx` | sheet `MergeType`, same columns `id, name`; source type `int<!!>`, case type `string` | `different header [id]` |
| `MergeUniqueDup.xlsx` | `MergeDupSource.xlsx` | sheet `MergeDup`, both headers `int<!!>, string`, both ids `1` | `duplicate value: 1` |

The `#` row, names, groups, and column positions of each pair are identical. Only the listed difference changes.

## Calls

- `SheetList.ts` stays unchanged. `MergeRows.id` is a type string in the workbook, not a `Sheets` binding.
- Success merge files are written by `generate-fixtures.js` into `testcase/`, next to the `TypeMatrix.xlsx` write. The generator does not wipe `testcase/`.
