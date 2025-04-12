import * as fs from 'fs';
import * as path from 'path';
import * as utils from '../utils';
import * as protobufjs from 'protobufjs';
import { isArray } from 'lodash';
import { ArrayTypeDef, EnumTypeDef, ObjectTypeDef, TypeDef, TypeDefParser } from '../TypeDefParser';
import { gCfg } from '../config';

const PBTypeTranslateMap = new Map<string, { s: string; opt: boolean }>([
    ['char', { s: 'int32', opt: false }],
    ['uchar', { s: 'uint32', opt: false }],
    ['short', { s: 'int32', opt: false }],
    ['ushort', { s: 'uint32', opt: false }],
    ['int', { s: 'int32', opt: false }],
    ['uint', { s: 'uint32', opt: false }],
    ['int64', { s: 'int64', opt: false }],
    ['uint64', { s: 'uint64', opt: false }],
    ['string', { s: 'string', opt: false }],
    ['double', { s: 'double', opt: false }],
    ['float', { s: 'float', opt: false }],
    ['bool', { s: 'bool', opt: false }],
    ['boolean', { s: 'bool', opt: false }],
    ['date', { s: 'string', opt: true }],
    ['tinydate', { s: 'string', opt: true }],
    ['timestamp', { s: 'int64', opt: true }],
    ['utctime', { s: 'int64', opt: true }],
]);

////////////////////////////////////////////////////////////////////////////////
class PBExport3 extends utils.IExportWrapper {
    private TABLE_ROW_NAME = this._exportCfg.ARRAY_ELEMENT_NAME ?? 'Arr';
    private TABLE_PREFIX = this._exportCfg.ARRAY_ELEMENT_NAME ?? 'Arr';

    constructor(exportCfg: utils.ExportCfg) {
        super(exportCfg);
    }

    public get DefaultExtName(): string {
        return '.proto';
    }

    protected async ExportTo(_: utils.SheetDataTable): Promise<boolean> {
        await utils.EmptyCallbackAsync();
        if (!this.isExportToFile()) {
            return true;
        }
        throw new Error(`proto3 export to folder was not support!`);
    }

    protected async ExportGlobal(): Promise<boolean> {
        const outdir = this._exportCfg.OutputDir;
        const LF = gCfg.LineBreak;
        if (!this._exportCfg.OutputDataDir) {
            utils.exception('proto3 Export.OutputDataDir was not set!');
        }
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

        // generate enum and object types...
        const globalDef = TypeDefParser.GDefType;
        for (const key in globalDef) {
            const type = globalDef[key];
            if (type.__inner__o_type__abcxyz__ === 'enum') {
                this.GenEnumMessageAndGetTypeName(type, LF);
            } else if (type.__inner__o_type__abcxyz__ === 'object') {
                this.GenObjectMessageAndGetTypeName(type, LF);
            }
        }

        // sort export table by name.
        let data = '';
        const array = [];
        for (const [, v] of utils.ExportExcelDataMap) {
            array.push(v);
        }
        array.sort((a, b) => {
            return a.sheetName.localeCompare(b.sheetName);
        });
        for (const dt of array) {
            const name = dt.sheetName;
            const ctx = this.GenSheetType(name, dt.arrTypeHeader, LF);
            if (ctx) {
                data += `${ctx.pbtype}${LF}${LF}`;
            }
        }

        const PackageContent = this._exportCfg.Namespace
            ? `package ${this._exportCfg.Namespace};${LF}`
            : '';
        data = `${this._leadTypeList.join(gCfg.LineBreak)}${data}${LF}`;
        data = `syntax = "proto3";${LF}${LF}${PackageContent}${LF}` + FMT.replace('{data}', data);
        await fs.promises.writeFile(outdir, data, { encoding: 'utf8', flag: 'w' });
        utils.debug(
            `${utils.green('[SUCCESS]')} Output file "${utils.yellow_ul(outdir)}". ` +
                `Total use tick:${utils.green(utils.TimeUsed.LastElapse())}`
        );
        // save to proto files...
        this._protoRoot = new protobufjs.Root().loadSync(outdir, { keepCase: true });
        for (const dt of array) {
            const name = dt.sheetName;
            const outputFile = this.getOutputDateFilePath(name);
            await this.ExportData(dt, outputFile);
        }
        return true;
    }

    private GenSheetType(
        sheetName: string,
        arrHeader: utils.SheetHeader[],
        LF: string
    ): { pbtype: string } | undefined {
        const arrExportHeader = utils.ExecGroupFilter(
            sheetName,
            this._exportCfg.GroupFilter,
            arrHeader
        );
        if (arrExportHeader.length <= 0) {
            utils.debug(`Pass Sheet ${utils.yellow_ul(sheetName)} : No Column To Export.`);
            return;
        }

        let rowType = `    message ${sheetName}${LF}    {${LF}`;
        for (const header of arrExportHeader) {
            if (header.isComment) continue;
            let typeName = `string`;
            const defType = header.parser.type;
            if (defType !== undefined) {
                switch (defType.__inner__o_type__abcxyz__) {
                    case 'array':
                        {
                            typeName = 'repeated ';
                            const subTypeDef = defType.__inner__type__abcxyz__;
                            switch (subTypeDef.__inner__o_type__abcxyz__) {
                                case 'array':
                                    typeName += this.GenArrayMessageAndGetTypeName(subTypeDef, LF);
                                    break;
                                case 'object':
                                    typeName += this.GenObjectMessageAndGetTypeName(subTypeDef, LF);
                                    break;
                                case 'base':
                                case 'enum':
                                case 'column':
                                    typeName += this.GenBaseTypeName(subTypeDef);
                                    break;
                                default:
                                    utils.exception(
                                        `call "${utils.yellow_ul('GenTypeName')}" failure`
                                    );
                            }
                        }
                        break;
                    case 'object':
                        typeName = this.GenObjectMessageAndGetTypeName(defType, LF);
                        break;
                    case 'base':
                    case 'enum':
                    case 'column':
                        typeName = this.GenBaseTypeName(defType);
                        break;
                    default:
                        utils.exception(`call "${utils.yellow_ul('GenTypeName')}" failure`);
                }
            }

            rowType += `        ${typeName} ${this.TranslateColName(header.name)} = ${
                header.cIdx + 1
            };${LF}`;
        }
        rowType += `    }${LF}`;
        const tableType = `// sheet: ${sheetName}${LF}message ${this.TABLE_PREFIX}${sheetName}${LF}{${LF}${rowType}    repeated ${sheetName} ${this.TABLE_ROW_NAME} = 1;${LF}}${LF}`;
        return { pbtype: tableType };
    }

    private GenBaseTypeName(typeDef: TypeDef): string {
        switch (typeDef.__inner__o_type__abcxyz__) {
            case 'enum':
                return typeDef.__inner__name__abcxyz__ ?? 'int32';
            case 'base':
            case 'column':
                return PBTypeTranslateMap.get(typeDef.__inner__name__abcxyz__ ?? '')?.s ?? 'string';
        }
        throw new Error('Gen proto Base type failure. unsupport base type');
    }

    private GenArrayMessageAndGetTypeName(typeDef: ArrayTypeDef, LF: string): string {
        if (typeDef.__inner__o_type__abcxyz__ !== 'array') {
            throw new Error(`Generate proto Array Message failure. there is not a Array defines!`);
        }
        const subTypeDef = typeDef.__inner__type__abcxyz__;
        let typeName: string | undefined;
        let subName: string | undefined;
        if (subTypeDef.__inner__o_type__abcxyz__ === 'array') {
            typeName = this.GenArrayMessageAndGetTypeName(subTypeDef, LF);
            subName = typeName.substring(3); // skip first '_v_'
        } else if (subTypeDef.__inner__o_type__abcxyz__ === 'object') {
            subName = typeName = this.GenObjectMessageAndGetTypeName(subTypeDef, LF);
        } else {
            subName = typeName = this.GenBaseTypeName(subTypeDef);
        }

        if (typeName === undefined) {
            throw new Error(`Generate proto Array Message failure. Array don't have a Name!`);
        }
        const level = typeDef.__inner__level__abcxyz__;
        const levelTail = level <= 1 ? '' : level;
        const arrTypeName = `_v${levelTail}_${subName}`;
        if (this._leadTypeSet.has(arrTypeName)) {
            return arrTypeName;
        }

        const message = `message ${arrTypeName} {${LF}    repeated ${typeName} a = 1;${LF}}${LF}`;
        this._leadTypeList.push(message);
        this._leadTypeSet.add(arrTypeName);
        return arrTypeName;
    }

    // 获取Object的名称并生成Object类型的值
    private GenObjectMessageAndGetTypeName(typeDef: ObjectTypeDef, LF: string): string {
        if (typeDef.__inner__o_type__abcxyz__ !== 'object') {
            throw new Error(
                `Generate proto Object Message failure. there is not a Object defines!`
            );
        }
        if (typeDef.__inner__name__abcxyz__ === undefined) {
            throw new Error(`Generate proto Object Message failure. Object don't have a Name!`);
        }
        const typeName = `${typeDef.__inner__name__abcxyz__}`;
        if (this._leadTypeSet.has(typeName)) {
            return typeName; // already define
        }
        const kv = typeDef.__inner__type__abcxyz__;
        let body = '';
        let index = 1;
        for (const key in kv) {
            const val = kv[key];
            if (val.__inner__name__abcxyz__ === undefined) {
                // 考虑到TJson中允许嵌入一维数组，所以此处特殊处理一下
                if (val.__inner__o_type__abcxyz__ !== 'array') {
                    throw new Error(
                        `Generate proto Object Message failure. Object ${typeDef.__inner__name__abcxyz__}.${key} don't have a Name!`
                    );
                }
            }
            let typeName = val.__inner__name__abcxyz__;
            if (val.__inner__o_type__abcxyz__ === 'array') {
                if (val.__inner__type__abcxyz__?.__inner__o_type__abcxyz__ === 'array') {
                    typeName = this.GenArrayMessageAndGetTypeName(
                        val.__inner__type__abcxyz__,
                        gCfg.LineBreak
                    );
                } else {
                    typeName = this.GenBaseTypeName(val.__inner__type__abcxyz__);
                }
            } else if (val.__inner__o_type__abcxyz__ === 'object') {
                typeName = this.GenObjectMessageAndGetTypeName(val, LF);
            } else {
                typeName = this.GenBaseTypeName(val);
            }
            body += `    ${typeName} ${key} = ${index++};${LF}`;
        }
        const message = `message ${typeName} {${LF}${body}}${LF}`;
        this._leadTypeList.push(message);
        this._leadTypeSet.add(typeName);
        return typeName;
    }

    private GenEnumMessageAndGetTypeName(typeDef: EnumTypeDef, LF: string): string {
        if (typeDef.__inner__o_type__abcxyz__ !== 'enum') {
            throw new Error(`Generate proto Enum Message failure. there is not a Object defines!`);
        }
        const enumName = typeDef.__inner__name__abcxyz__;
        if (enumName === undefined) {
            throw new Error(`Generate proto Enum Message failure. Enum don't has a name for it!
Please check your code for the following error examples:
Array(Enum({
	Invalid: 0,
	Item: 1,
	Equip: 2,
}))`);
        }
        if (this._leadTypeSet.has(enumName)) {
            return enumName;
        }
        const enumObject = typeDef.__inner__type__abcxyz__;

        let message = `enum ${enumName} {${LF}`;
        for (const key in enumObject) {
            message += `    ${enumName}_${key} = ${enumObject[key]};${LF}`;
        }
        message += `}${LF}`;
        this._leadTypeList.push(message);
        this._leadTypeSet.add(enumName);
        return enumName;
    }

    private _protoRoot: protobufjs.Root | undefined;

    private TranslateValue(value: unknown, type: TypeDef): unknown {
        if (
            isArray(value) &&
            type.__inner__o_type__abcxyz__ === 'array' &&
            type.__inner__type__abcxyz__.__inner__o_type__abcxyz__ === 'array'
        ) {
            if (value.length <= 0 || !isArray(value[0])) {
                return { a: value };
            }
            const ret = new Array<{ a: unknown[] }>();
            for (const subvalue of value) {
                ret.push({
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                    a: <unknown[]>this.TranslateValue(subvalue, type.__inner__type__abcxyz__),
                });
            }
            return ret;
        }
        return value;
    }

    private async ExportData(dt: utils.SheetDataTable, outputFile: string): Promise<void> {
        if (this._protoRoot === undefined) return;
        const arrTypeHeader = utils.ExecGroupFilter(
            dt.sheetName,
            this._exportCfg.GroupFilter,
            dt.arrTypeHeader
        );
        if (arrTypeHeader === undefined || arrTypeHeader.length <= 0) {
            console.info(
                `Pass Sheet ${utils.yellow_ul(dt.sheetName)}: ignore export data ${outputFile}`
            );
            return;
        }
        const protoEncoder = this._protoRoot.lookupType(
            `${this._exportCfg.Namespace ? this._exportCfg.Namespace + '.' : ''}${
                this.TABLE_PREFIX
            }${dt.sheetName}`
        );
        const arrExportHeader = utils.ExecGroupFilter(
            dt.sheetName,
            this._exportCfg.GroupFilter,
            dt.arrTypeHeader
        );
        if (arrExportHeader.length <= 0) {
            return;
        }

        const exportList = [];
        for (let row = 0; row < dt.arrValues.length; ++row) {
            if (dt.arrValues[row].type !== utils.ESheetRowType.data) continue;
            const data = dt.arrValues[row].values;
            const newData: { [key: string]: unknown } = {};
            for (const hdr of arrExportHeader) {
                if (hdr.isComment) continue;
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
                newData[this.TranslateColName(hdr.name)] = this.TranslateValue(
                    data[hdr.cIdx],
                    hdr.parser.type
                );
            }
            exportList.push(newData);
        }
        const exportData = { [this.TABLE_ROW_NAME]: exportList };
        try {
            const exportProto = protoEncoder.encode(exportData).finish();
            await fs.promises.writeFile(outputFile, exportProto, { encoding: 'binary' });
        } catch (ex) {
            utils.exception(`Sheet: [${utils.yellow_ul(dt.sheetName)}] encode proto failure.`, ex);
        }
    }

    private _leadTypeSet = new Set<string>();
    private _leadTypeList: string[] = [];
}

module.exports = function (exportCfg: utils.ExportCfg): utils.IExportWrapper {
    return new PBExport3(exportCfg);
};
