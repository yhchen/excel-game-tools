# Type Matrix Coverage Design

## Intent

Raise code coverage of the existing `npm test` run by adding fixture rows that actually execute parser and exporter branches. Declaring a type in `typeDef.ts` does not count. A cell has to use it, and the success path has to go through `testcase/` because that is the only run which exports JSON, JS, Lua, Proto2, Proto3, and C#.

## Goals

- Add `testcase/TypeMatrix.xlsx` plus the named types it needs in `testcase/typeDef.ts` and `testcase/typeDef.js`.
- Cover integer widths that no current sheet uses, `TStruct`, `TTranslate`, a flag enum, an enum array, both `DVAL`/`TCustom` orders, `SheetName.ColumnName`, an array of that reference, and `TCustom` wrapped around a column reference.
- Add failure fixtures under `test/fixtures` for throw sites the current negative CSV set does not hit.
- Keep `npm test` as the only command. `verify-fixtures.js` checks the new sheet's JSON values and the C# markers for `struct` and `Flags`.

## Non-goals

- No changes under `src/` or `TypeDef/`.
- No new test runner, coverage dependency, or `npm` script.
- Do not re-test rules already locked by existing CSV fixtures.
- A failing workbook must not live in `testcase/`. `verify-fixtures.js` requires the bundled CLI run to exit 0.

## Constraints

- `src/config_tpl.json` already includes `./testcase` and exports every format. A new workbook there is picked up without a config change.
- The CLI loads `testcase/typeDef.js`, so the compiled file stays in sync with `testcase/typeDef.ts`.
- `testcase/typeDef.js` binds `Sheets.Item` and `Sheets.Equip` during `initialize`. Negative cases keep their own typeDef and do not load that file.
- `ushort` accepts `[0, 32768]`. The comment in `TypeDef/index.ts` says 65535. The fixture locks the code.
- `TCustom` copies `__inner__defaultval__abcxyz__` and does not set `__inner_has_default_value`. `TCustom(int).DVAL(5)` does set the flag. Empty cells return the default without running the checker. Inside `TObject`, a trailing empty token uses that default only when the flag is set. `<!N>` rejects an empty cell only when the flag is absent.
- `TStruct` is exported as a C# `struct`. A flag enum is exported as `[ProtoContract, Flags]` when `ExportEnum` is true. That flag is set on the per-sheet protobuf-net export.

## Approaches

1. **Chosen.** Success cases go in `testcase/TypeMatrix.xlsx` and flow through the existing full export. Failure cases go in `test/fixtures` and the existing `negativeCases` list. New named types used only by those failures live in `coverage-typeDef.js`, so `positive-typeDef.js` stays as it is.
2. A separate matrix runner and `expect.json` files. Rejected. `npm test` already runs these fixtures.
3. Line-coverage chasing with a new tool, adding rows only for uncovered lines. Rejected. `DVAL` order and `TCustom` share the same lines. The cell values are what distinguish them. No coverage package is added. A before/after V8 sample during implementation is enough to see that new branches ran.

## Cases

`RefTarget` holds ids `1` and `2`. `TypeMatrix` uses group `*`.

Filled row `1`: `uchar` 255, `ushort` 32768, `uint` 4294967295, `int64` 3000000000, `uint64` 42, `TTranslate` input 3 exports 30, flag value 3, enum array `1,2`, struct `10,20`, both custom columns 6, `ThenTail` `8,4`, references to `RefTarget`.

Default row `2`: empty width and translate cells export `0`, flag name `Read` exports `1`, struct `4,` exports `y = 7`, both `DVAL`/`TCustom` columns and `CustomThenDval<!N>` export `5`, `ThenTail` `9,` exports `v2 = 5`.

Negative files, one failure each:

- `CharOutOfRange.csv`: `char` value 129.
- `BadSheetRef.csv`: type `A.B.C`.
- `UnknownSheet.csv`: type `MissingSheet.id`.
- `CustomCheckFail.csv`: `TCustom` rejects an even int.
- `CustomWrapRequiredEmpty.csv`: `TCustom(int.DVAL(5))<!N>` with an empty cell.
- `CustomWrapTrailingEmpty.csv`: `TObject` field `TCustom(int.DVAL(5))` with a trailing empty token.

## Remaining cases added in batches

Batch 1, type-string failures. Each file uses `positive-typeDef.js`.

- `UnknownType.csv`: type `NoSuchType`.
- `BadArrayBracket.csv`: type `int[`.
- `BadArrayCount.csv`: type `int[x]`.
- `BadTail.csv`: type `int<!Q>`.
- `UnclosedTail.csv`: type `int<!!`.
- `LeadingBracket.csv`: type `[int]`.
- `FixedArrayTooShort.csv`: `int[2]` with one element.
- `UniqueEmptyDuplicate.csv`: two empty `int<!!>` cells. One empty `int<!!>` exports `0` and does not fail.

Batch 2, range and date failures. Each file uses a builtin type.

- `UcharOutOfRange.csv`: `256`.
- `UshortOutOfRange.csv`: `32769`.
- `UintNegative.csv`: `-1`.
- `Uint64Negative.csv`: `-1`.
- `Int64NotNumber.csv`: `abc`.
- `InvalidDate.csv`: `not-a-date`.

Batch 3, combinations. Success rows are sheet `Combo` in `testcase/TypeMatrix.xlsx`. Failures use `coverage-typeDef.js` unless noted.

- `FlagsDefaultWrite`: `EItemFlags.DVAL(2)`, empty cell exports `2`.
- `CustomFlag`: `TCustom` on the flag enum. Content `1` passes. Content `0` fails.
- `TranslatedText`: `TTranslate` uppercases a string. An empty cell exports `""`.
- `ComboJson`: `TJson` with `int.DVAL`, `string.DVAL`, and an enum. `{}` fills every missing field from its default.
- `OddList`: `TArray` of a `TCustom` that rejects even numbers.
- `CheckedPair`: `TObject` checker rejects a sum above 10.
- `Combo.id`: a column on the same sheet.
- `EnumArrayBad.csv`: `TestEnum[]` contains `999`.
- `CustomLookupMissing.csv`: `getRowDataByColumnName('missingCol')`.
- `RefCustomColumn.csv`: reference a `TCustom` column. `CustomSource.csv` is only the referenced sheet.
- `InitDvalObject.csv`: `TObject(...).DVAL(1)` fails while loading its own typeDef.
- `InitEnumNoZero.csv`: `TEnum` without a `0` value fails while loading its own typeDef.

## Calls

- `RefTarget` is added to `testcase/SheetList.ts` so the new sheet reference typechecks.
- `TCustom` around `Sheets.RefTarget.id` goes through `Internal.TryColumnTypeTranslate`. `TCustom` does not translate a raw column binder itself. The translated column's `__inner__name__abcxyz__` is set to `int` before `TCustom` copies it, so proto encodes the numeric id. Leaving the name as `RefTarget.id` makes proto treat the field as a string and the export fails.
- Negative CSV stays CSV. These failures do not depend on Excel cell types, and the existing generator already wires `.csv` files into `npm test`.
