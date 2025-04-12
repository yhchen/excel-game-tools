/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import * as path from 'path';
import * as fs from 'fs';
import * as utils from '../utils';

function ParseJSLine(
    exportWrapper: utils.IExportWrapper,
    header: Array<utils.SheetHeader>,
    sheetRow: utils.SheetRow,
    rootNode: { [key: string]: unknown } & { _ids?: Array<unknown> },
    exportCfg: utils.ExportCfg
): string | undefined {
    if (sheetRow.type !== utils.ESheetRowType.data) return undefined;
    const item: { [key: string]: unknown } = {};
    for (
        let i = 0, cIdx = header[0].cIdx;
        i < header.length && cIdx < sheetRow.values.length;
        ++i, cIdx = header[i]?.cIdx
    ) {
        const head = header[i];
        if (!head || head.isComment) continue;
        const name = exportWrapper.TranslateColName(head.name);
        if (sheetRow.values[cIdx] !== undefined) {
            item[name] = sheetRow.values[cIdx];
        } else if (exportCfg.UseDefaultValueIfEmpty) {
            if (head.parser.DefaultValue !== undefined) {
                item[name] = head.parser.DefaultValue;
            }
        }
    }
    const id = sheetRow.values[header[0].cIdx];
    rootNode[<string | number>id] = item;
    if (rootNode._ids === undefined) {
        rootNode._ids = [];
    }
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    rootNode._ids.push(id);
}

function DumpToString(data: unknown): string {
    if (utils.isString(data)) {
        return `'${data.replace(/'/g, "\\'")}'`;
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
        for (const name in data) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            const v = (<Record<string, unknown>>data)[name];
            if (v === undefined) continue;
            s += `${s.length === 0 ? '' : ','}${name}:${DumpToString(v)}`;
        }
        return `{${s}}`;
    } else if (utils.isBoolean(data)) {
        return data ? 'true' : 'false';
    } else {
        utils.exception(`Internal ERROR! type not Handle${String(data)}!`);
    }
    return '';
}

class JSExport extends utils.IExportWrapper {
    constructor(exportCfg: utils.ExportCfg) {
        super(exportCfg);
    }

    public get DefaultExtName(): string {
        return '.js';
    }
    protected async ExportTo(dt: utils.SheetDataTable): Promise<boolean> {
        const jsObj = {};
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
            ParseJSLine(this, arrExportHeader, row, jsObj, this._exportCfg);
        }
        if (this.isExportToFile()) {
            this._globalObj[dt.sheetName] = jsObj;
            return true;
        }

        const FMT: string | undefined = this._exportCfg.ExportTemple;
        if (FMT === undefined) {
            utils.exception(
                `[Config Error] ${utils.yellow_ul('Export.ExportTemple')} not defined!`
            );
        }
        if (FMT.indexOf('{data}') < 0) {
            utils.exception(
                `[Config Error] ${utils.yellow_ul(
                    'Export.ExportTemple'
                )} not found Keyword ${utils.yellow_ul('{data}')}!`
            );
        }
        if (FMT.indexOf('{name}') < 0) {
            utils.exception(
                `[Config Error] ${utils.yellow_ul(
                    'Export.ExportTemple'
                )} not found Keyword ${utils.yellow_ul('{name}')}!`
            );
        }
        const jscontent = FMT.replace('{name}', dt.sheetName).replace(
            '{data}',
            DumpToString(jsObj) || '{}'
        );
        const outfile = this.getOutputFilePath(dt.sheetName);
        await fs.promises.writeFile(outfile, jscontent, { encoding: 'utf8', flag: 'w+' });
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
        }
        const FMT: string | undefined = this._exportCfg.ExportTemple;
        if (FMT === undefined) {
            utils.exception(
                `[Config Error] ${utils.yellow_ul('Export.ExportTemple')} not defined!`
            );
        }
        if (FMT.indexOf('{data}') < 0) {
            utils.exception(
                `[Config Error] ${utils.yellow_ul(
                    'Export.ExportTemple'
                )} not found Keyword ${utils.yellow_ul('{data}')}!`
            );
        }
        const jscontent = FMT.replace('{data}', DumpToString(this._globalObj));
        await fs.promises.writeFile(outdir, jscontent, { encoding: 'utf8', flag: 'w+' });
        utils.debug(
            `${utils.green('[SUCCESS]')} Output file "${utils.yellow_ul(outdir)}". ` +
                `Total use tick:${utils.green(utils.TimeUsed.LastElapse())}`
        );
        return true;
    }

    private _globalObj: { [key: string]: unknown } = {};
}

module.exports = function (exportCfg: utils.ExportCfg): utils.IExportWrapper {
    return new JSExport(exportCfg);
};
