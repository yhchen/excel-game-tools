import * as path from 'path';
import * as utils from "../utils";
import * as export_common from "./export_common";

class JSONExport extends utils.IExportWrapper {
	constructor(exportCfg: utils.ExportCfg) { super(exportCfg); }

	public get DefaultExtName(): string { return '.json'; }
	protected async ExportTo(dt: utils.SheetDataTable): Promise<boolean> {
		let jsonObj = {};
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
		const jsoncontent = JSON.stringify(jsonObj || "{}");
		const outfile = this.getOutputFilePath(dt.sheetName);
		await export_common.writeExportFile(outfile, jsoncontent);
		return true;
	}

	protected async ExportGlobal(): Promise<boolean> {
		const outdir = this._exportCfg.OutputDir;
		if (!this.isExportToFile())
			return true;
		if (!this.CreateDir(path.dirname(outdir))) {
			utils.exception(`create output path "${utils.yellow_ul(path.dirname(outdir))}" failure!`);
			return false;
		}
		const jsoncontent = JSON.stringify(this._globalObj || "{}");
		await export_common.writeExportFile(outdir, jsoncontent);
		return true;
	}

	private _globalObj: any = {};
}

module.exports = function (exportCfg: utils.ExportCfg): utils.IExportWrapper { return new JSONExport(exportCfg); };
