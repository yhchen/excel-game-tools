import * as utils from "../utils";
import * as path from 'path';
import * as json_to_lua from 'json_to_lua';
import { gCfg } from "../config";
import * as export_common from "./export_common";

type IExportToSingleLuaData = {
	head: string;
	data: string;
};

// export to single lua file
function exportToSingleLuaContent(exportWrapper: utils.IExportWrapper, sheetName: string, header: Array<utils.SheetHeader>, jsObj: any, shortName: boolean = false): IExportToSingleLuaData {
	const LF = gCfg.LineBreak;
	if (!shortName) {
		return { head: '', data: json_to_lua.jsObjectToLuaPretty(jsObj, 2) };
	}
	const headLst = new Array<string>();
	const NameMapToShort = new Map<string, string>();
	for (let i = 0; i < header.length; ++i) {
		const head = header[i];
		const name = exportWrapper.TranslateColName(head.name);
		headLst.push(`local ${head.shortName} = "${name}"`);
		NameMapToShort.set(name, head.shortName);
	}
	const headContent = headLst.join(LF);
	const tableLst = new Array<string>();
	for (let id of jsObj["_ids"]) {
		const objLst = new Array<string>();
		const jsObjSingle = jsObj[id];
		for (const hdr of header) {
			const name = exportWrapper.TranslateColName(hdr.name);
			if (jsObjSingle[name] == undefined) continue;
			objLst.push(`\t\t[${hdr.shortName}] = ${json_to_lua.jsObjectToLua(jsObjSingle[name])},`);
		}
		tableLst.push(`\t${json_to_lua.makeLuaKey(id)} = {${LF}${objLst.join(LF)}${LF}\t},`);
	}
	return { head: headContent, data: `{${LF}${tableLst.join(LF)}${LF}}` };
}

class LuaExport extends utils.IExportWrapper {
	constructor(exportCfg: utils.ExportCfg) { super(exportCfg); }

	public get DefaultExtName(): string { return '.lua'; }
	protected async ExportTo(dt: utils.SheetDataTable): Promise<boolean> {
		const LF = gCfg.LineBreak;
		let jsonObj = { _ids: [] };
		const arrExportHeader = utils.ExecGroupFilter(dt.sheetName, this._exportCfg.GroupFilter, dt.arrTypeHeader);
		if (arrExportHeader.length <= 0) {
			utils.debug(`Pass Sheet ${utils.yellow_ul(dt.sheetName)} : No Column To Export.`);
			return true;
		}
		for (let row of dt.arrValues) {
			export_common.buildRowObject(this, arrExportHeader, row, jsonObj, this._exportCfg);
		}
		if (this.isExportToFile()) {
			this._globalObj[dt.sheetName] = jsonObj;
			return true;
		}

		const FMT = export_common.assertExportTemplate(this._exportCfg.ExportTemple, true);
		try {
			const dataCtx = exportToSingleLuaContent(this, dt.sheetName, arrExportHeader, jsonObj, this._exportCfg.UseShortName);
			const NameRex = new RegExp('{name}', 'g');
			let luacontent = FMT.replace(NameRex, dt.sheetName).replace('{data}', dataCtx.data);
			if (utils.StrNotEmpty(dataCtx.head)) {
				luacontent = `${dataCtx.head}${LF}${luacontent}`;
			}
			const outfile = this.getOutputFilePath(dt.sheetName);
			await export_common.writeExportFile(outfile, luacontent);
		} catch (ex) {
			utils.exception(`${ex}`);
		}
		return true;
	}

	protected async ExportGlobal(): Promise<boolean> {
		const outdir = this._exportCfg.OutputDir;
		if (!this.isExportToFile())
			return true;
		if (!this.CreateDir(path.dirname(outdir))) {
			utils.exception(`create output path "${utils.yellow_ul(path.dirname(outdir))}" failure!`);
		}
		const FMT = export_common.assertExportTemplate(this._exportCfg.ExportTemple, false);
		const luacontent = FMT.replace("{data}", json_to_lua.jsObjectToLuaPretty(this._globalObj, 3));
		await export_common.writeExportFile(outdir, luacontent);
		return true;
	}

	private _globalObj: any = {};
}

module.exports = function (exportCfg: utils.ExportCfg): utils.IExportWrapper { return new LuaExport(exportCfg); };
