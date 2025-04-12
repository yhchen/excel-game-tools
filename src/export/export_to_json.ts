/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import * as path from 'path';
import * as fs from 'fs';
import * as utils from '../utils';

class JSONExport extends utils.IExportWrapper {
    constructor(exportCfg: utils.ExportCfg) {
        super(exportCfg);
    }

    public get DefaultExtName(): string {
        return '.json';
    }
    protected async ExportTo(dt: utils.SheetDataTable): Promise<boolean> {
        const jsonObj = {};
        const arrExportHeader = utils.ExecGroupFilter(
            dt.sheetName,
            this._exportCfg.GroupFilter,
            dt.arrTypeHeader
        );
        if (arrExportHeader.length <= 0) {
            utils.debug(`Pass Sheet ${utils.yellow_ul(dt.sheetName)} : No Column To Export.`);
            return true;
        }
        for (const row of dt.arrValues) {
            this.ParseJsonLine(arrExportHeader, row, jsonObj, this._exportCfg);
        }
        if (this.isExportToFile()) {
            this._globalObj[dt.sheetName] = jsonObj;
            return true;
        }
        const jsoncontent = JSON.stringify(jsonObj || '{}');
        const outfile = this.getOutputFilePath(dt.sheetName);
        await fs.promises.writeFile(outfile, jsoncontent, { encoding: 'utf8', flag: 'w+' });
        utils.debug(
            `${utils.green('[SUCCESS]')} Output file "${utils.yellow_ul(outfile)}". ` +
                `Total use tick:${utils.green(utils.TimeUsed.LastElapse())}`
        );
        return true;
    }

    protected async ExportGlobal(): Promise<boolean> {
        const outdir = this._exportCfg.OutputDir;
        if (!this.isExportToFile()) return true;
        if (!this.CreateDir(path.dirname(outdir))) {
            utils.exception(
                `create output path "${utils.yellow_ul(path.dirname(outdir))}" failure!`
            );
            return false;
        }
        const jsoncontent = JSON.stringify(this._globalObj || '{}');
        await fs.promises.writeFile(outdir, jsoncontent, { encoding: 'utf8', flag: 'w+' });
        utils.debug(
            `${utils.green('[SUCCESS]')} Output file "${utils.yellow_ul(outdir)}". ` +
                `Total use tick:${utils.green(utils.TimeUsed.LastElapse())}`
        );
        return true;
    }

    private ParseJsonLine(
        header: Array<utils.SheetHeader>,
        sheetRow: utils.SheetRow,
        rootNode: { [key: string]: unknown } & { _ids?: Array<unknown> },
        exportCfg: utils.ExportCfg
    ): void {
        if (sheetRow.type !== utils.ESheetRowType.data) return;
        if (header.length <= 0) return;
        const item: { [key: string]: unknown } = {};
        for (
            let i = 0, cIdx = header[0].cIdx;
            i < header.length && cIdx < sheetRow.values.length;
            ++i, cIdx = header[i]?.cIdx
        ) {
            const head = header[i];
            if (!head || head.isComment) continue;
            const name = this.TranslateColName(head.name);
            if (sheetRow.values[cIdx] !== undefined) {
                item[name] = sheetRow.values[cIdx];
            } else if (exportCfg.UseDefaultValueIfEmpty) {
                if (head.parser.DefaultValue !== undefined) {
                    item[name] = head.parser.DefaultValue;
                }
            }
        }
        rootNode[<string | number>sheetRow.values[header[0].cIdx]] = item;
        if (rootNode._ids === undefined) {
            rootNode._ids = [];
        }
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call
        rootNode._ids.push(sheetRow.values[header[0].cIdx]);
    }

    private _globalObj: { [key: string]: unknown } = {};
}

module.exports = function (exportCfg: utils.ExportCfg): utils.IExportWrapper {
    return new JSONExport(exportCfg);
};
