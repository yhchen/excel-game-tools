import * as fs from "fs";
import * as utils from "../utils";

// Shared helpers for row-based exporters (JSON / JS / Lua).
// These extract the row-to-object conversion, export-template validation, and
// output-writing logic that was previously duplicated across the three
// exporters. Format-specific serialization (JS DumpToString, Lua single-file
// content) stays in each exporter.

// Convert one data row into an object on rootNode and accumulate its id under
// the unified `_ids` key. Returns true when the row was a data row (and was
// written), false otherwise, so callers keep the existing behavior of skipping
// non-data rows.
//
// `_ids` always collects the raw first-column value, matching the key used
// for `rootNode[firstColValue]` — this keeps row lookups by id (e.g. Lua's
// `for (let id of jsObj["_ids"]) { jsObj[id] }`) consistent even when the id
// column is empty and UseDefaultValueIfEmpty substitutes a default into the
// row's own fields.
//
// Key insertion order is preserved to keep generated output byte-identical:
// callers that pre-create `_ids` on rootNode (Lua) keep `_ids` as the first
// key; callers that pass a bare `{}` (JSON/JS) get `_ids` created lazily right
// after the first row's id key.
export function buildRowObject(
	exportWrapper: utils.IExportWrapper,
	header: Array<utils.SheetHeader>,
	sheetRow: utils.SheetRow,
	rootNode: any,
	exportCfg: utils.ExportCfg
): boolean {
	if (sheetRow.type != utils.ESheetRowType.data)
		return false;
	if (header.length <= 0)
		return false;
	let item: any = {};
	for (let i = 0, cIdx = header[0].cIdx; i < header.length && cIdx < sheetRow.values.length; ++i, cIdx = header[i]?.cIdx) {
		const head = header[i];
		if (!head || head.isComment) continue;
		const name = exportWrapper.TranslateColName(head.name);
		if (sheetRow.values[cIdx] != null) {
			item[name] = sheetRow.values[cIdx];
		} else if (exportCfg.UseDefaultValueIfEmpty) {
			if (head.parser.DefaultValue != undefined) {
				item[name] = head.parser.DefaultValue;
			}
		}
	}
	const firstColValue = sheetRow.values[header[0].cIdx];
	rootNode[firstColValue] = item;
	if (rootNode._ids == undefined) {
		rootNode._ids = [];
	}
	rootNode._ids.push(firstColValue);
	return true;
}

// Validate an `ExportTemple` string and return it narrowed to `string`.
// `requireName` mirrors the existing rule: per-sheet export requires the
// `{name}` placeholder, global export only requires `{data}`.
export function assertExportTemplate(FMT: string | undefined, requireName: boolean): string {
	if (FMT == undefined) {
		utils.exception(`[Config Error] ${utils.yellow_ul("Export.ExportTemple")} not defined!`);
	}
	if (FMT.indexOf('{data}') < 0) {
		utils.exception(`[Config Error] ${utils.yellow_ul("Export.ExportTemple")} not found Keyword ${utils.yellow_ul("{data}")}!`);
	}
	if (requireName && FMT.indexOf('{name}') < 0) {
		utils.exception(`[Config Error] ${utils.yellow_ul("Export.ExportTemple")} not found Keyword ${utils.yellow_ul("{name}")}!`);
	}
	return FMT;
}

export async function writeExportFile(outfile: string, content: string): Promise<void> {
	await fs.promises.writeFile(outfile, content, { encoding: 'utf8', flag: 'w+' });
	utils.debug(`${utils.green('[SUCCESS]')} Output file "${utils.yellow_ul(outfile)}". `
		+ `Total use tick:${utils.green(utils.TimeUsed.LastElapse())}`);
}
