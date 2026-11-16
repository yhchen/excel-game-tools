# C# Export Blank Lines Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stop the protobuf-net C# exporter from emitting whitespace-only lines, a blank line directly above `}`, or two blank lines in a row.

**Architecture:** The layout stays in `src/export/export_to_protobuf_net.ts`. Two helpers own indent and namespace wrapping. Enum and object tails share one length check. Fixture comments in `testcase/typeDef.js` pin the three tail states, and `scripts/verify-fixtures.js` checks every generated `.cs` file.

**Tech Stack:** TypeScript, CommonJS, Node.js, existing `testcase/` CLI fixture flow.

**Spec:** `docs/superpowers/specs/2026-11-16-csharp-blank-lines-design.md`

## Global Constraints

- Edit `src/export/export_to_protobuf_net.ts` only for the generator. `TypeDef` comment collection stays as it is.
- Empty `tail` is an empty array. It is truthy. Enum and object export both require `tail.length > 0`, and both put `}` on the line after a non-empty tail.
- Namespace indent must not turn an empty line into spaces. Indent each non-empty line. Leave empty lines empty.
- A type block already ends with a newline. Do not add another newline before the namespace `}`.
- The file banner keeps one blank line under the generated comment, not two.
- No new dependencies.
- Do not change JSON, JS, Lua, Go, or proto exporters.
- Do not remove a single blank line the generator already emits after `{` or between members.
- Do not add a blank line after the sheet list class `{` or the indexer `{`.
- `gCfg.LineBreak` is the only line separator. Do not hard-code `\n` in the new helpers.
- `testcase/exports/` is gitignored. Do not commit it.

## Review Focus

- `tail === undefined`: `EItemFlags` has no member comment, so nothing is written before the enum `}`.
- `tail.length === 0`: `AppType` has a member comment and no tail comment, so nothing is written before the enum `}`.
- Non-empty enum tail: `EItemType` writes `#endregion` on the line above the enum `}`.
- Non-empty object tail: `KVJson` writes `#endregion` on the line above the class `}`, not glued onto that brace.
- Sheet list class and indexer: `listExample` and `_v_int` keep `{` with no blank line after it.

---

### Task 1: C# layout conditions

**Files:**
- Modify: `testcase/typeDef.ts` (the `KVJson`, `EItemType`, and `AppType` literals)
- Modify: `testcase/typeDef.js` (the same three literals; the CLI loads this file)
- Modify: `scripts/verify-fixtures.js`
- Modify: `src/export/export_to_protobuf_net.ts`
- Test: `scripts/verify-fixtures.js` through `npm run verify:fixtures`

**Interfaces:**
- Consumes: `gCfg.LineBreak`, `typeDef.__inner__def_comment.tail`, `ExportCfg.Namespace`, `ExportCfg.UseNamespace`.
- Produces: `indentCsharp(text: string): string` and `wrapCsharpNamespace(namespaceName: string, body: string): string` in `src/export/export_to_protobuf_net.ts`. No new export.

- [ ] **Step 1: Pin the three tail states in the fixture the CLI loads**

In both `testcase/typeDef.ts` and `testcase/typeDef.js`, keep the runtime file and the TypeScript source on the same comments.

`KVJson`: after the `value` field, before `}`, add a line whose trimmed text is `//#endregion`. No blank line between that comment and `}`.

`EItemType`: after `Special: 104,`, before `}`, add a line whose trimmed text is `//#endregion`. No blank line between that comment and `}`.

`AppType`: add one member comment and no tail comment:

```javascript
const AppType = typeDefs.AppType = def.TEnum({
	// client host
	ClientH: 0,
	ClientM: 1,
	Gate: 2,
	Logic: 3,
});
```

Use the file's existing indent and, in `typeDef.js`, `def_1.def.TEnum`. Leave `EItemFlags` without comments so its `tail` stays `undefined`.

- [ ] **Step 2: Write the failing layout check**

Add `expectCsharpBlankLines()` to `scripts/verify-fixtures.js` and call it from the check phase after the proto syntax checks.

```javascript
function csharpLines(relativePath) {
	const lines = fs.readFileSync(absolute(relativePath), 'utf8').split('\n');
	if (lines.length > 0 && lines[lines.length - 1] === '') lines.pop();
	return lines;
}

function expectCsharpBlankLines() {
	const files = [];
	const walk = (dir) => {
		for (const name of fs.readdirSync(dir)) {
			const full = path.join(dir, name);
			if (fs.statSync(full).isDirectory()) walk(full);
			else if (name.endsWith('.cs')) files.push(full);
		}
	};
	walk(absolute('testcase/exports'));
	if (files.length === 0) fail('no generated C# files');
	const banner = '/** This is an automatically generated class by excel export tools. Please do not modify it. **/';
	for (const filePath of files) {
		const relativePath = path.relative(rootDir, filePath);
		const lines = csharpLines(relativePath);
		if (lines[0] !== banner) fail(`${relativePath} banner is ${JSON.stringify(lines[0])}`);
		if (lines[1] !== '') fail(`${relativePath} needs one blank line under the banner`);
		if (lines[2] === '' || !lines[2].startsWith('using ')) fail(`${relativePath} third line should be a using`);
		for (let i = 0; i < lines.length; i++) {
			if (/^[ \t]+$/.test(lines[i])) fail(`${relativePath}:${i + 1} is whitespace-only`);
			if (lines[i].trim() === '' && lines[i + 1] !== undefined && lines[i + 1].trim() === '') {
				fail(`${relativePath}:${i + 1} starts a double blank`);
			}
			if (lines[i].trim() === '}' && i > 0 && lines[i - 1].trim() === '') {
				fail(`${relativePath}:${i + 1} has a blank line above }`);
			}
		}
	}
	const chunk = (parts) => parts.join('\n');
	expectFileIncludes('testcase/exports/protobuf-net/EItemType.cs', chunk([
		'        [ProtoEnum]',
		'        Special = 104,',
		'        #endregion',
		'    }',
		'}',
	]));
	expectFileIncludes('testcase/exports/protobuf-net/EItemType.cs', 'player pet');
	expectFileIncludes('testcase/exports/protobuf-net/EItemFlags.cs', '[ProtoContract, Flags]');
	expectFileIncludes('testcase/exports/protobuf-net/EItemFlags.cs', chunk([
		'    public enum EItemFlags',
		'    {',
		'',
		'        [ProtoEnum]',
		'        None = 0,',
		'',
		'        [ProtoEnum]',
		'        Read = 1,',
	]));
	expectFileIncludes('testcase/exports/protobuf-net/EItemFlags.cs', chunk([
		'        ReadWrite = 3,',
		'    }',
		'}',
	]));
	expectFileIncludes('testcase/exports/protobuf-net/AppType.cs', chunk([
		'        // client host',
		'        [ProtoEnum]',
		'        ClientH = 0,',
		'',
		'        [ProtoEnum]',
		'        ClientM = 1,',
	]));
	expectFileIncludes('testcase/exports/protobuf-net/AppType.cs', chunk([
		'        Logic = 3,',
		'    }',
		'}',
	]));
	expectFileIncludes('testcase/exports/protobuf-net/KVJson.cs', chunk([
		'        // value',
		'        [ProtoMember(2)]',
		'        public int value { get; set; }',
		'        #endregion',
		'    }',
		'}',
	]));
	expectFileIncludes('testcase/exports/protobuf-net/Example.cs', chunk([
		'    public partial class ExampleCategory : ACategory<Example>{}',
		'',
		'    [ProtoContract]',
	]));
	expectFileIncludes('testcase/exports/protobuf-net/Example.cs', chunk([
		'    }',
		'',
		'    [ProtoContract]',
		'    public partial class listExample',
		'    {',
		'        [ProtoMember(1)]',
	]));
	expectFileIncludes('testcase/exports/protobuf-net/_v_int.cs', chunk([
		'    public partial class _v_int {',
		'',
		'        [ProtoMember(1)]',
		'        public int[] a { get; set; }',
		'',
		'        [ProtoIgnore]',
		'        public int this[int index]',
		'        {',
		'            get => this.a[index];',
		'            set => this.a[index] = value;',
		'        }',
		'    }',
		'}',
	]));
	expectFileIncludes('testcase/exports/global.cs', chunk([
		'        public float y { get; set; }',
		'    }',
		'',
		'    [Serializable]',
		'    [ProtoContract]',
		'    public partial class vector3',
	]));
	expectFileIncludes('testcase/exports/protobuf-net/PointStruct.cs', 'public partial struct PointStruct');
}
```

A line that is only `}` fails when the previous line is empty. A `{}` on the same line as a class does not match that check. A file that ends in one newline is not an extra blank line: `csharpLines` drops that final empty split entry.

- [ ] **Step 3: Run the check and confirm it fails**

Run: `npm run verify:fixtures`

Expected: FAIL. Current files have a whitespace-only line, a blank line above a `}`, two blank lines, or two blank lines under the banner. `EItemType` does not yet contain `#endregion` until the fixture from Step 1 is loaded; after Step 1 the current enum writer emits `#endregion` and still fails the whitespace and double-blank checks.

- [ ] **Step 4: Add `indentCsharp` and `wrapCsharpNamespace`**

Put both next to `GET_COMMON_USING_HEADER` in `src/export/export_to_protobuf_net.ts`.

`indentCsharp(text: string): string` splits on `gCfg.LineBreak`. A line whose length is 0 stays empty. Every other line gets the prefix `    `. Join with `gCfg.LineBreak`. Do not trim a line that already has spaces.

`wrapCsharpNamespace(namespaceName: string, body: string): string` indents `body`, then builds `namespace ${namespaceName}` + `LineBreak` + `{` + indented body + `}` + `LineBreak`, with two adjustments:

- If the indented body does not start with `LineBreak`, insert one `LineBreak` after `{`. That puts the first line of content on the next line. It is not a blank line. If the body already starts with `LineBreak`, do not insert another one.
- If the indented body does not end with `LineBreak`, insert one `LineBreak` before `}`. If it already ends with `LineBreak`, do not insert another one.

- [ ] **Step 5: Apply the tail and newline conditions**

In `GenEnumMessageAndGetTypeName`, change the tail guard to `tail && tail.length > 0`. Keep the existing write: comment, then one `LineBreak`, then `}`.

In `GenObjectMessageAndGetTypeName`, keep the `tail.length > 0` guard. After the comment is built, append one `LineBreak` before the class `}`. Do not append a second one.

`ARR_FILE_HEADER` ends with two `LineBreak`s, not three.

`GenSheetType` closes the row class with `}` plus one `LineBreak`, not two. The shipped template already has one newline after `{data}`, so the list class stays one blank line below the row class.

Lead-type concatenation in `ExportGlobal` does not add a `LineBreak` after a value. Each value already starts and ends with one. Sheet concatenation adds one `LineBreak` after `sheetType`, not two. Do not add a `LineBreak` after the combined block.

Replace the three namespace wraps with `wrapCsharpNamespace`: the per-sheet wrap in `ExportTo`, the lead-type wrap in `ExportTo`, and the combined wrap in `ExportGlobal`. When `Namespace` is absent, append the body as-is. Do not write the word `undefined`, and do not indent.

Leave the `UseNamespace` loop as it is. Leave the extra `LineBreak` that lead-type files place between `GET_COMMON_USING_HEADER()` and the namespace. Do not add a blank line inside the indexer or after `listExample`'s `{`.

- [ ] **Step 6: Run the check and the full suite**

Run: `npm run verify:fixtures`

Expected: PASS, ending in `[verify-fixtures] All checks passed.`

Run: `npm test`

Expected: PASS, ending in `[run-tests] All checks passed.`

- [ ] **Step 7: Commit**

```bash
git add src/export/export_to_protobuf_net.ts scripts/verify-fixtures.js testcase/typeDef.ts testcase/typeDef.js docs/superpowers/specs/2026-11-16-csharp-blank-lines-design.md docs/superpowers/plans/2026-11-16-csharp-blank-lines.md
git commit -m "fix: drop review-failing blank lines from C# export"
```
