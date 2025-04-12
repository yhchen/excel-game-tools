import * as fs from 'fs';
import * as path from 'path';
export { isString, isNumber, isArray, isObject, isBoolean } from 'lodash';
import moment = require('moment');
import { gCfg } from './config';
import { TypeDefParser } from './TypeDefParser';

export type AnyObjectType = { [key: string]: unknown };

// generate moment.js
{
    let hasMoment = false;
    for (const file in require.cache) {
        if (file.endsWith('moment.js')) {
            hasMoment = true;
        }
    }
    if (!hasMoment) {
        require.cache['moment.js'] = {
            id: '23432432432423p4923p4i324i324o35u43i5u4oiturewjrtwotrewjlkj',
            exports: moment,
            filename: 'moment.js',
            loaded: true,
            require: require,
            parent: undefined,
            children: [],
            path: '',
            paths: [],
        };
    }
}

////////////////////////////////////////////////////////////////////////////////
//#region console color
import chalk from 'chalk';
import { IDataLoader } from './loader/idata_loader';
import { isString } from 'lodash';
export const yellow_ul = chalk.yellow.underline; //yellow under line
export const orange_ul = chalk.magentaBright.underline.bold; //orange under line
export const yellow = chalk.yellow;
export const red = chalk.redBright;
export const green = chalk.greenBright;
export const brightWhite = chalk.whiteBright.bold;
//#endregion

////////////////////////////////////////////////////////////////////////////////
//#region Logger
export const enum E_ERROR_LEVEL {
    EXECUTE_FAILURE = -1,
    INIT_EXTENDS = -1001,
}
export function logger(...args: unknown[]): void {
    console.log(...args);
}
export function debug(...args: unknown[]): void {
    if (!gCfg.EnableDebugOutput) return;
    logger(...args);
}
export function warn(txt: string): void {
    const LOG_CTX = `${orange_ul(`+ [WARN] `)} ${txt}\n`;
    ExceptionLogLst.push(LOG_CTX);
    logger(LOG_CTX);
}
const ExceptionLogLst = new Array<string>();
export function exception(txt: string, ex?: unknown): never {
    exceptionRecord(txt, ex);
    throw txt;
}
// record exception not throw.
export function exceptionRecord(txt: string, ex?: unknown): void {
    let ex_message = '';
    if (gCfg.EnableDebugOutput) {
        if (ex instanceof Error) {
            ex_message = `${ex.message}\n${String(ex.stack)}`;
        } else {
            ex_message = isString(ex) ? ex : JSON.stringify(ex);
        }
    } else {
        ex_message = ex instanceof Error ? ex.message : isString(ex) ? ex : JSON.stringify(ex);
    }
    let LOG_CTX = `${red(`+ [ERROR] `)} ${txt}\n`;
    if (StrNotEmpty(ex_message)) LOG_CTX += `${red(ex_message)}\n`;
    ExceptionLogLst.push(LOG_CTX);
    logger(LOG_CTX);
}
//#endregion

////////////////////////////////////////////////////////////////////////////////
//#region base function
export function StrNotEmpty(s: unknown): s is string {
    if (typeof s === 'string') {
        return s.trim().length > 0;
    }
    return false;
}

export const gGlobalIgnoreDirName = new Set(['.svn', '.git']);

export function IsFileOrFolderIgnore(_path: string): boolean {
    const baseName = path.basename(_path);
    return (
        gGlobalIgnoreDirName.has(baseName) ||
        baseName.startsWith('!') ||
        baseName.startsWith('#') ||
        baseName.startsWith('.') ||
        baseName.startsWith('~$') ||
        baseName.startsWith('$')
    );
}
//#endregion

////////////////////////////////////////////////////////////////////////////////
//#region Time Profile
/************* total use tick ****************/
let BeforeExistHandler: () => void;
export function SetBeforeExistHandler(handler: () => void): void {
    BeforeExistHandler = handler;
}

process.addListener('exit', () => {
    // process.addListener('beforeExit', () => {
    process.removeAllListeners('exit');
    const HasException = ExceptionLogLst.length > 0;
    if (BeforeExistHandler && !HasException) {
        BeforeExistHandler();
    }
    const color = HasException ? red : green;
    logger(color(`----------------------------------------`));
    logger(
        color(`-          ${HasException ? 'Got Exception !!!' : '    Well Done    '}           -`)
    );
    logger(color(`----------------------------------------`));
    logger(`Total Use Tick : "${yellow_ul(TimeUsed.TotalElapse())}"`);

    if (HasException) {
        logger(red('Exception Logs:'));
        ExceptionLogLst.reverse().forEach(log => {
            logger(log);
        });
        process.exit(-1);
    } else {
        process.exit(0);
    }
});

export namespace TimeUsed {
    export function LastElapse(): string {
        const Now = moment.now();
        const elpase = Now - _LastAccess;
        _LastAccess = Now;
        return elpase.toString() + 'ms';
    }

    export function TotalElapse(): string {
        return ((moment.now() - _StartTime) / 1000).toString() + 's';
    }

    const _StartTime = moment.now();
    let _LastAccess = _StartTime;
}
//#endregion

////////////////////////////////////////////////////////////////////////////////
//#region async Worker Monitor
export class AsyncWorkMonitor {
    public addWork(cnt = 1): void {
        this._leftCnt += cnt;
    }
    public decWork(cnt = 1): void {
        this._leftCnt -= cnt;
    }
    public async WaitAllWorkDone(): Promise<void> {
        while (this._leftCnt > 0) {
            await this.delay();
            if (this._leftCnt <= 0) {
                return;
            }
        }
    }
    public async delay(ms = 0): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    private _leftCnt = 0;
}
//#endregion

////////////////////////////////////////////////////////////////////////////////
//#region Datas
// excel gen data table
export enum ESheetRowType {
    header = 1, // name row
    type = 2, // type
    data = 3, // data
    comment = 4, // comment
}
export type SheetRow = {
    type: ESheetRowType;
    values: Array<unknown>;
    rIdx: number;
    worksheet: IDataLoader;
};
export type SheetHeader = {
    name: string; // name
    shortName: string; //shortName
    stype: string; // type string
    cIdx: number; // header idx
    idx: number;
    isComment: boolean; // is comment line?
    comment?: string; // 注释内容
    group: string; // group
    parser: TypeDefParser;
};
export function IsSheetHeaderSame(header1: SheetHeader, header2: SheetHeader): boolean {
    return (
        header1.name === header2.name &&
        header1.stype === header2.stype &&
        header1.cIdx === header2.cIdx &&
        header1.idx === header2.idx &&
        header1.isComment === header2.isComment &&
        header1.comment === header2.comment &&
        header1.group === header2.group
    );
}

export class SheetDataTable {
    public constructor(sheetTable: IDataLoader) {
        this.sheetTable.push(sheetTable);
    }
    public combineSheetTable(dataTable: SheetDataTable): void {
        for (const st of dataTable.sheetTable) {
            this.sheetTable.push(st);
        }
        // for (let i = 0; i < dataTable.arrValues.length; ++i) {
        // 	this.arrValues.push(dataTable.arrValues[i]);
        // }
    }
    // check sheet column contains key
    public checkColumnContainsValueAndTranslate(
        columnName: string,
        value: string
    ): unknown | undefined {
        if (!this.columnKeysMap.has(columnName)) {
            try {
                this.makeColumnKeyMap(columnName);
            } catch (ex) {
                exception(
                    `CALL [checkColumnContainsValue] failure: sheet column name ${yellow_ul(
                        this.sheetName + '.' + columnName
                    )}`,
                    ex
                );
            }
        }
        const s = this.columnKeysMap.get(columnName);
        return s?.get(String(value));
    }
    public containsColumName(name: string): boolean {
        for (const header of this.arrTypeHeader) {
            if (header.name === name) return true;
        }
        return false;
    }

    // fixme: remove this
    public get sheetName(): string {
        return this.sheetTable[0].sheetName;
    }
    // public get fileName(): string { return this.sheetTable.fileName; }
    public readonly sheetTable = new Array<IDataLoader>();
    public arrTypeHeader = new Array<SheetHeader>();
    public mapTypeHeader = new Map<number, SheetHeader>();
    public arrHeaderNameMap = new Map<string, number>();
    public readonly arrValues = new Array<SheetRow>();

    private makeColumnKeyMap(columnName: string): void {
        for (let i = 0; i < this.arrTypeHeader.length; ++i) {
            const header = this.arrTypeHeader[i];
            if (header.name === columnName) {
                if (!header.parser.canCollectionOnBasePass) {
                    throw new Error(
                        'column was reference by other sheet column. column type must be a base type!'
                    );
                }
                const m = new Map<string, unknown>();
                for (const row of this.arrValues) {
                    if (row.type !== ESheetRowType.data) continue;
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                    const v = row.values[header.cIdx];
                    m.set(String(v), v);
                }
                this.columnKeysMap.set(columnName, m);
                return;
            }
        }
        throw new Error(`column name : ${red(columnName)} not exist!`);
    }
    private columnKeysMap = new Map<string, Map<string, unknown>>();
}
// all export data here
export const ExportExcelDataMap = new Map<string, SheetDataTable>();

//#endregion

////////////////////////////////////////////////////////////////////////////////
//#region export config

export type ExportCfg = {
    type: string;
    OutputDir: string;
    OutputDataDir?: string;
    UseDefaultValueIfEmpty: boolean;
    NameTranslate?: { [key: string]: string }; // translate name to target name
    ARRAY_ELEMENT_NAME?: string; // translate name to target name
    GroupFilter: Array<string>;
    ExportTemple?: string;
    ExtName?: string;
    Namespace?: string; // for csharp
    IDUseGeterAndSeter?: boolean;
    UseShortName?: boolean;
    UseNamespace?: Array<string>;
    ExportEnum?: boolean;
    NullableReferenceTypes?: boolean;
    IgnoreTypeExport?: Array<string>; // ignore Export TypeList
};

// export template
export abstract class IExportWrapper {
    public constructor(exportCfg: ExportCfg) {
        this._exportCfg = exportCfg;
    }
    public abstract get DefaultExtName(): string;
    // translate col name to target name
    public TranslateColName(name: string): string {
        if (!this._exportCfg.NameTranslate) {
            return name;
        }
        const newName = this._exportCfg.NameTranslate[name];
        return newName ?? name;
    }

    protected isExportToFile(): boolean {
        return this.IsFile(this._exportCfg.OutputDir);
    }

    protected getOutputFilePath(typeName: string): string {
        return this.__genOutputFilePath(this._exportCfg.OutputDir, typeName);
    }

    protected getOutputDateFilePath(typeName: string): string {
        if (this._exportCfg.OutputDataDir === undefined) {
            exception(`export failure. output file directory must be set to an valid path!`);
        }
        return this.__genOutputFilePath(this._exportCfg.OutputDataDir, typeName);
    }

    private __genOutputFilePath(configPath: string, typeName: string): string {
        const outFile = configPath.replace(new RegExp('{name}', 'gm'), typeName);
        if (this.IsFile(outFile)) {
            const dir = path.dirname(outFile);
            if (!fs.existsSync(dir) && !this.CreateDir(dir)) {
                exception(`create output path "${yellow_ul(dir)}" failure!`);
            }
            return outFile;
        }
        if (!fs.existsSync(outFile) && !this.CreateDir(outFile)) {
            exception(`create output path "${yellow_ul(outFile)}" failure!`);
        }
        return path.join(outFile, typeName + String(this._exportCfg.ExtName));
    }

    public async ExportToAsync(
        dt: SheetDataTable,
        endCallBack: (ok: boolean) => void
    ): Promise<boolean> {
        let ok = false;
        try {
            ok = await this.ExportTo(dt);
        } catch (ex) {
            exceptionRecord(`export to ${JSON.stringify(this._exportCfg)} failure.`, ex);
        }
        if (endCallBack) {
            endCallBack(ok);
        }
        return ok;
    }

    public async ExportToGlobalAsync(endCallBack: (ok: boolean) => void): Promise<boolean> {
        let ok = false;
        try {
            ok = await this.ExportGlobal();
        } catch (ex) {
            exceptionRecord(`export to global ${JSON.stringify(this._exportCfg)} failure.`, ex);
        }
        if (endCallBack) {
            endCallBack(ok);
        }
        return ok;
    }
    protected abstract ExportTo(dt: SheetDataTable): Promise<boolean>;
    protected abstract ExportGlobal(): Promise<boolean>;
    protected CreateDir(outdir: string): boolean {
        if (!fs.existsSync(outdir)) {
            fs.mkdirSync(outdir);
            return fs.existsSync(outdir);
        }
        return true;
    }

    protected IsFile(s: string): boolean {
        const ext = this._exportCfg.ExtName || this.DefaultExtName;
        const idx = s.lastIndexOf(ext);
        if (idx < 0) return false;
        return idx + ext.length === s.length;
    }

    protected _exportCfg: ExportCfg;
}

export function ExecGroupFilter(
    sheetName: string,
    arrGrpFilters: Array<string>,
    arrHeader: Array<SheetHeader>
): Array<SheetHeader> {
    // 没有配置过滤组，直接返回所有行
    if (arrGrpFilters === undefined || arrGrpFilters.length <= 0) {
        return arrHeader;
    }
    // 生成filterSet
    const filterSet = new Set<string>();
    for (const group of arrGrpFilters) {
        filterSet.add(group);
    }
    const result = new Array<SheetHeader>();
    if (arrGrpFilters.length <= 0) {
        return result;
    }

    // translate
    for (const header of arrHeader) {
        if (filterSet.has(header.group)) {
            result.push(header);
        }
    }
    return result;
}

export type ExportWrapperFactory = (cfg: ExportCfg) => IExportWrapper;
export const ExportWrapperMap = new Map<string, ExportWrapperFactory>([
    ['protobuf-net', require('./export/export_to_protobuf_net')],
    ['js', require('./export/export_to_js')],
    ['json', require('./export/export_to_json')],
    ['lua', require('./export/export_to_lua')],
    ['proto3', require('./export/export_to_proto3')],
    ['proto2', require('./export/export_to_proto2')],
]);

export function EmptyCallback(_?: unknown | undefined): void {
    // empty callback
}

export async function EmptyCallbackAsync(): Promise<void> {
    // empty callback
}

//#endregion

////////////////////////////////////////////////////////////////////////////////
//#region Format Converter
export namespace FMT26 {
    const WORDS = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';

    export function NumToS26(num: number): string {
        let result = '';
        ++num;
        while (num > 0) {
            let m = num % 26;
            if (m === 0) m = 26;
            result = String.fromCharCode(m + 64) + result;
            num = (num - m) / 26;
        }
        return result;
    }

    export function S26ToNum(str: string): number {
        let result = 0;
        const ss = str.toUpperCase();
        for (let i = str.length - 1, j = 1; i >= 0; i--, j *= 26) {
            const c = ss[i];
            if (c < 'A' || c > 'Z') return 0;
            result += (c.charCodeAt(0) - 64) * j;
        }
        return result;
    }

    export function StringToColRow(str: string): { row: number; col: number } {
        const ret = { row: 0, col: 0 };
        for (let i = 0; i < str.length; ++i) {
            if (WORDS.indexOf(str[i]) < 0) {
                ret.row = parseInt(str.substr(i));
                ret.col = S26ToNum(str.substr(0, i));
                break;
            }
        }

        return ret;
    }
}

//#endregion
