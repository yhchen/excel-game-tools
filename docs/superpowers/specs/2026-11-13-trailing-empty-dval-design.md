# Trailing Empty Object Fields Use DVAL

## Intent

`ItemData.Level` is `int.DVAL(0)`. Designers omit it, and a merged `ItemData[]` header also appends empty field separators, so a cell written as `82000002;36480` is parsed as `82000002;36480;;`. The empty token is parsed as `int` and the export fails. A trailing run of empty field tokens should take the same path as omitting those fields.

## Goal

In `TObject` and `TStruct`, a field whose token is `""`, and whose every following token is also `""`, uses its `DVAL` when the field has one.

## Non-Goals

- Do not change merged-cell joining in `MergeArrayCells`.
- Do not strip separators in `splitArray`.
- Do not treat a hole as omitted. `1,,5` on `{ v1: int, v2: string.DVAL("x"), v3: int.DVAL(0) }` keeps `v2` as `""` and `v3` as `5`.
- Do not treat whitespace as empty. `" "` is parsed as a value.
- Do not give a default to a field that has no `DVAL`. `TCustom(int.DVAL(0), ...)` still has no `__inner_has_default_value`, so it stays required.
- Do not change whole-cell `<!N>`. A blank `ItemData[]<!N>` cell still fails with `value can not be empty!`.
- Do not change `TJson`.

## Constraints

- Field order stays the `TObject` key order.
- Tokens past the last field stay ignored, including extra empty tokens.
- `ArraySpliter` stays config-driven. The Equip reproduction uses `[";", "/", "#"]`.
- Edit `TypeDef/index.ts`. `npm run build` emits `node_modules/def`. Do not hand-edit `TypeDef/index.js`.
- No new dependencies.

## Approaches

1. **TObject parse.** When the current token is `""` and every later token is `""`, and the field has `__inner_has_default_value`, assign `__inner__defaultval__abcxyz__`. This covers handwritten `id;count;` and the merged `;;` suffix. Chosen.
2. **Strip trailing separators while splitting.** That also changes required fields. A required `int` would change from a number error to an element-count error, and a required `string` would change from `""` to missing.
3. **Stop joining empty merged cells.** Handwritten `id;count;` would still fail, and a blank cell inside a real per-field merge would no longer reach `DVAL`.

## Behavior

- `82000005;18350/82000006;400/82000002;36700` in a 3-column merged `ItemData[]<!N>` cell exports three objects whose `Level` is `0`.
- `82000005;30;2` in that same merged column exports `Level` `2`.
- `{ v1: int, v2: string.DVAL("x"), v3: int.DVAL(0) }` with `1,` exports `{ v1: 1, v2: "x", v3: 0 }`.
- The same type with `1,,5` exports `{ v1: 1, v2: "", v3: 5 }`.
- The same type with `1, ,` exports `{ v1: 1, v2: " ", v3: 0 }`.
- `{ v1: int, v2: int.DVAL(0) }` with `1, ` fails because the token is whitespace.
- `{ v1: int, v2: int }` with `1,` fails because `v2` has no `DVAL`.
- A blank `ItemData[]<!N>` cell fails with `value can not be empty!`.

## Acceptance

`merged ItemData array fills an omitted Level from DVAL` passes, and the edge rows above pass or fail as written. `npm test` passes.
