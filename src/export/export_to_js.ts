import * as path from 'path';
import * as utils from "../utils";
import * as export_common from "./export_common";

function DumpToString(data: any) {
	if (utils.isString(data)) {
		return `'${data.replace(/\'/g, "\\'")}'`;
	} else if (utils.isNumber(data)) {
		return data.toString();
	} else if (utils.isArray(data)) {
		let s = '';
		for (let i = 0; i < data.length; ++i) {
			if (data[i] === undefined) continue;
			s += (s.length === 0 ? '' : ',') + DumpToString(data[i]);
		}
		return `[${s}]`;
	} else if (utils.isObject(data)) {
		let s = '';
		for (let name in data) {
			const v = (<any>data)[name];
			if (v === undefined) continue;
			s += `${s.length === 0 ? '' : ','}${name}:${DumpToString(v)}`;
		}
		return `{${s}}`;
	} else if (utils.isBoolean(data)) {
		return data ? 'true' : 'false';
	} else {
		utils.exception(`Internal ERROR! type not Handle${data}!`);
	}
	return '';
}

class JSExport extends utils.IExportWrapper {
	constructor(exportCfg: utils.ExportCfg) { super(exportCfg); }

	public get DefaultExtName(): string { return '.js'; }
	protected async ExportTo(dt: utils.SheetDataTable): Promise<boolean> {
		let jsObj = {};
		const arrExportHeader = utils.ExecGroupFilter(dt.sheetName, this._exportCfg.GroupFilter, dt.arrTypeHeader);
		if (arrExportHeader.length <= 0) {
			utils.debug(`Pass Sheet ${utils.yellow_ul(dt.sheetName)} : No Column To Export.`);
			return true;
		}
		for (let row of dt.arrValues) {
			export_common.buildRowObject(this, arrExportHeader, row, jsObj, this._exportCfg);
		}
		if (this.isExportToFile()) {
			this._globalObj[dt.sheetName] = jsObj;
			return true;
		}

		const FMT = export_common.assertExportTemplate(this._exportCfg.ExportTemple, true);
		const jscontent = FMT.replace("{name}", dt.sheetName).replace("{data}", DumpToString(jsObj) || "{}");
		const outfile = this.getOutputFilePath(dt.sheetName);
		await export_common.writeExportFile(outfile, jscontent);
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
		const jscontent = FMT.replace("{data}", DumpToString(this._globalObj));
		await export_common.writeExportFile(outdir, jscontent);
		return true;
	}

	private _globalObj: any = {};
}

module.exports = function (exportCfg: utils.ExportCfg): utils.IExportWrapper { return new JSExport(exportCfg); };
