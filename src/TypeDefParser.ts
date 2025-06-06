import { gCfg } from './config';
import { FindNum } from './TypeUtils';
import * as utils from './utils';
import { def, Internal } from 'def';
import moment from 'moment';
export type TypeDef = def.TypeDef;
export type BaseTypeDef = def.BaseTypeDef;
export type ObjectTypeDef = def.ObjectTypeDef;
export type ArrayTypeDef = def.ArrayTypeDef;
export type EnumTypeDef = def.EnumTypeDef;
export type ColumnTypeDef = def.ColumnTypeDef;

const Sheets: { [key: string]: { [key: string]: (value: any) => boolean; }; } = {};
const typeDefs = def.TypeDefs;
let _onExportAllDone: () => void;

// 内部解析数组定义用
type InnerArrayDef = {
	next: InnerArrayDef | string,
	count?: number;
} | string;

function InitEnv() {
	try {
		beforeInitialize();
		// require type def
		const checkf = require('./TypeDefLoader');
		for (const [SheetName, ExcelData] of utils.ExportExcelDataMap) {
			const Binder: { [key: string]: (value: any) => boolean; } = {};
			for (const header of ExcelData.arrTypeHeader) {
				const handler = ExcelData.checkColumnContainsValueAndTranslate.bind(ExcelData, header.name);
				(<any>handler).SheetName = SheetName;
				(<any>handler).ColumnName = header.name;
				(<any>handler).Header = header;
				Binder[header.name] = handler;
			}
			Sheets[SheetName] = Binder;
		}
		// const context = fs.readFileSync(TypeDefParser.TypeCheckerJSFilePath, { encoding: 'utf-8' });
		_onExportAllDone = checkf.onExportAllDone;
		checkf.initialize(Sheets, typeDefs, gCfg);
		afterInitialize();
		// console.log(JSON.stringify(checkf.typeDefs, undefined, 2));
	} catch (ex) {
		utils.exceptionRecord(`typeDef: ${TypeDefParser.TypeCheckerJSFilePath} format error`, ex);
		process.exit(utils.E_ERROR_LEVEL.INIT_EXTENDS);
	}
}

/**
 * 所有工作全部完成后，执行该方法
 */
export function OnExportAllDone() {
	if (_onExportAllDone) _onExportAllDone();
}

function beforeInitialize() {
	// init def values
	Internal.DateFmt = gCfg.DateFmt;
	Internal.TinyDateFmt = gCfg.TinyDateFmt;
	Internal.FractionDigitsFMT = gCfg.FractionDigitsFMT;
	Internal.TimeStampUseMS = gCfg.TimeStampUseMS;
}

function afterInitialize() {
	const typeNameFilter: any = { enum: true, object: true, array: true };
	for (const key in typeDefs) {
		// translate column defines to type parse
		typeDefs[key] = Internal.TryColumnTypeTranslate(typeDefs[key]);
		// add type_name for base type def
		if (typeDefs[key].__inner__name__abcxyz__ == undefined && typeNameFilter[typeDefs[key].__inner__o_type__abcxyz__]) {
			typeDefs[key].__inner__name__abcxyz__ = key;
		}
	}
}

export class TypeDefParser {
	public constructor() {
	}

	private static InitFlag = false;

	public init(s: string): TypeDefParser {
		if (!TypeDefParser.InitFlag) {
			TypeDefParser.InitFlag = true;
			InitEnv();
		}
		this._type = s;
		this._typeDef = this.initDefineType(this._type);
		this._canCollectionOnBasePass = this.checkCollectionOnBasePass(this._typeDef);
		return this;
	}

	// init column type name using target column type
	public static initializeColumnTypeName() {
		Internal.initializeColumnTypeName();
	}

	public static TypeCheckerJSFilePath = './typeDef';
	public static get GDefType(): { [key: string]: TypeDef; } { return typeDefs; }

	// get default
	public get DefaultValue(): any {
		return this._typeDef.__inner__defaultval__abcxyz__;
	}

	public get IsStructMode(): boolean {
		return (<any>this.type)?.__inner__is_struct_parse_mode__ ?? false;
	}

	public get type(): def.TypeDef { return this._typeDef; }

	public static setHeaderNameMap(sheetName: string, headerNameMap: Map<string, number>): void {
		Internal.SheetName = sheetName;
		Internal.HeaderNameMap = headerNameMap;
	}

	public static setColumnName(columnName: string) {
		Internal.ColunmName = columnName;
	}

	public get isUnique() { return this._isUnique; }
	public get isNotNull() { return this._isNotNull; }
	public get isNotZero() { return this._isNotZero; }

	public static setRowData(rowData: Array<any>): void {
		Internal.RowData = rowData;
	}

	public get s(): string { return this._type; }

	public ParseContent(value: { w?: string, v?: string | number | boolean | Date, } | undefined): any {
		const res = this.__Inner_ParseContent(value);
		if (this._isUnique) {
			if (res == undefined) {
				throw `unique value can not be empty!`;
			}
			if (this._dictUniqueKey[res] != undefined) {
				throw `duplicate value: ${res} value must be unique!`;
			}
			this._dictUniqueKey[res] = true;
		}
		if (this._isNotZero && res === 0) {
			throw `value can not be Zero (0)`;
		}
		return res;
	}

	private _dictUniqueKey: any = {};

	private __Inner_ParseContent(value: { w?: string, v?: string | number | boolean | Date, } | undefined): any {
		if (value == undefined || value.w == undefined || value.w.length <= 0) {
			if (!this._typeDef.__inner_has_default_value && this._isNotNull) {
				throw `value can not be empty!`;
			}
			return this.DefaultValue;
		}
		// 统一将 \r 删除掉，在导出配置中再决定是否需要替换换行符格式
		value.w = value.w.replace(/\r\n/g, '\n');
		switch (this._typeDef.__inner__o_type__abcxyz__) {
			case 'base':
			case 'enum':
				return this._typeDef.__inner__parse__abcxyz__(value.v ?? value.w);
			case 'column':
				return this._typeDef.__inner__parse__abcxyz__(value.v ?? value.w);
			case 'object':
			case 'array': {
				if (this._typeDef.__inner__is_json_parse_mode__) {
					let json: any;
					try {
						json = JSON.parse(value.w);
					} catch (ex) {
						utils.exception(`invalid json: \n${json}`, ex);
					}
					return this._typeDef.__inner__parse__abcxyz__(json);
				} else {
					// 如果在TArray或者TObject的配置中，有且仅有一个Date元素的时候，获取到的字符串是不正确的，所以需要用moment格式化一次
					let v = value.w;
					if (this._typeDef.__inner__level__abcxyz__ == 1 && moment.isDate(value.v)) {
						v = moment(value.v).format(gCfg.DateFmt);
					}
					const arr = this.splitArray(v, this._typeDef.__inner__level__abcxyz__ - 1);
					return this._typeDef.__inner__parse__abcxyz__(arr);
				}
			}
			default:
				throw `invalid typeDef type: ${JSON.stringify(this._typeDef, null, 2)}`;
		}
	}

	public static isBaseType(typeDef: TypeDef): boolean { return typeDef.__inner__o_type__abcxyz__ == 'base'; }
	public static isArrayType(typeDef: TypeDef): boolean { return typeDef.__inner__o_type__abcxyz__ == 'array'; }
	public static isObjectType(typeDef: TypeDef): boolean { return typeDef.__inner__o_type__abcxyz__ == 'object'; }
	public static isEnumType(typeDef: TypeDef): boolean { return typeDef.__inner__o_type__abcxyz__ == 'enum'; }
	public static isColumnType(typeDef: TypeDef): boolean { return typeDef.__inner__o_type__abcxyz__ == 'column'; }
	public get canCollectionOnBasePass() { return this._canCollectionOnBasePass; }

	private splitArray(value: string, level: number): string[] {
		if (value == undefined) return [];
		if (gCfg.ArraySpliter[level] == '\n') {
			value = value.replace(/\r/g, ''); // remove all '\r'
		}

		if (level >= 1 && value.endsWith(gCfg.ArraySpliter[level])) {
			value = value.substring(0, value.length - 1);
		}
		const res: any[] = value.split(gCfg.ArraySpliter[level]);
		if (level <= 0) {
			return res;
		}
		for (let i = 0; i < res.length; ++i) {
			res[i] = this.splitArray(res[i], level - 1);
		}
		return res;
	}

	private checkCollectionOnBasePass(typeDef: def.TypeDef = this._typeDef): boolean {
		if (typeDef.__inner_has_ex_checkers) {
			return false;
		}
		if (TypeDefParser.isBaseType(typeDef) || TypeDefParser.isEnumType(typeDef)) {
			return true;
		}
		if (TypeDefParser.isArrayType(typeDef)) {
			return this.checkCollectionOnBasePass(<def.TypeDef>typeDef.__inner__type__abcxyz__);
		}
		if (TypeDefParser.isObjectType(typeDef)) {
			const subTypeDef = <{ [key: string]: def.TypeDef; }>typeDef.__inner__type__abcxyz__;
			for (const key in subTypeDef) {
				if (!this.checkCollectionOnBasePass(subTypeDef[key])) {
					return false;
				}
			}
			return true;
		}
		return false;
	}

	private initBaseType(s: InnerArrayDef): def.TypeDef {
		if (typeof s === 'string') {
			if (s.indexOf('.') >= 0) {
				// handle sheet column check
				const sp = s.split('.');
				if (sp.length != 2) {
					throw `Sheet Index Type Format Error.(Example: [SheetName].[ColumnName])`;
				}
				const sheetName = sp[0];
				const columnName = sp[1];
				const dataTable = Sheets[sheetName];
				if (dataTable == undefined) {
					throw `Sheet High Type Format Error. SheetName ${utils.yellow_ul(sheetName)} not found.`;
				} else if (!dataTable[columnName] == undefined) {
					throw `Sheet High Type Format Error. Column Name ${utils.yellow_ul(sheetName + '.' + columnName)} not found.`;
				} else {
					return Internal.TryColumnTypeTranslate(dataTable[columnName]);
				}
			} else {
				const type = typeDefs[s];
				if (!type) {
					throw `Sheet High Type Format Error. typeDefs ${utils.yellow_ul(s)} not found.`;
				}
				return type;
			}
		} else {
			const subType = this.initBaseType(s.next);
			return def.TArray(subType, s.count);
		}
	}

	private initDefineType(s: string): def.TypeDef {
		// skip write space
		s = s.trim();
		s = this.InitTypeExParam(s);
		let thisNode: InnerArrayDef | string = s;
		if (s.length <= 0) {
			// make default type
			thisNode = { next: 'string' };
		} else {
			if (s[0] == '[') {
				throw `incorrect type: ${s}. type should be base type, sheet column name like [Item.Id], or defines type`;
			}
			// find word
			let idx: number;
			for (idx = 0; idx < s.length; ++idx) {
				if (s[idx] == '[') {
					thisNode = s.substring(0, idx);
					break;
				}
			}
			while (idx < s.length) {
				if (s[idx] == '[') {
					const startIdx = idx - 1;
					++idx;
					let num: number | undefined = undefined;
					if (idx >= s.length)
						throw `gen type check error: '}' not found!`;
					if (s[idx] != ']') {
						let numscope = FindNum(s, idx);
						if (numscope == undefined)
							throw `gen type check error: array [<NUM>] format error!`;
						idx = numscope.end + 1;
						num = parseInt(s.substr(numscope.start, numscope.len));
					}
					if (idx >= s.length)
						throw `gen type check error: ']' not found!`;
					if (s[idx] != ']') {
						throw `gen type check error: array [<NUM>] ']' not found!`;
					}
					if (typeof thisNode === 'string') {
						thisNode = { next: thisNode, count: num };
					} else {
						const nextNode = thisNode.next;
						thisNode.next = { next: nextNode, count: num };
					}
					++idx;
				} else {
					throw `gen type check error: type should be follow be array [] or [count]`;
				}
			}
		}

		return this.initBaseType(thisNode);
	}

	public static readonly IS_UNIQUE_TAIL = '!!';
	public static readonly IS_NOT_EMPTY_TAIL = '!N';
	public static readonly IS_NOT_ZERO_TAIL = '!0';

	private InitTypeExParam(s: string): string {
		if (s.endsWith('>')) {
			// find '<'
			const startIdx = s.lastIndexOf('<');
			if (startIdx <= 0) {
				throw `Init Type: '${s}' Error. No '<' symbol for '>' found`;
			}
			const param = s.substring(startIdx + 1, s.length - 1);
			const params = param.split(';');
			for (const p of params) {
				switch (p) {
					case TypeDefParser.IS_UNIQUE_TAIL: this._isUnique = true; break;
					case TypeDefParser.IS_NOT_EMPTY_TAIL: this._isNotNull = true; break;
					case TypeDefParser.IS_NOT_ZERO_TAIL: this._isNotZero = true; break;
					case '': break;
					default: throw `invalid tail checker: ${p}`;
				}
			}
			s = s.substring(0, startIdx);
		} else if (s.indexOf('<') >= 0) {
			throw `Init Type: '${s}' Error. No '>' symbol for '<' found!`;
		}

		return s;
	}

	private _type!: string; // type string
	private _typeDef!: def.TypeDef;
	private _canCollectionOnBasePass!: boolean;
	private _isUnique = false;
	private _isNotNull = false;
	private _isNotZero = false;
}

export function unitTest() {
	// fixme: for test
	utils.logger(typeDefs.Position.__inner__parse__abcxyz__([1, 2, 3, 4]));
	utils.logger(typeDefs.Award.__inner__parse__abcxyz__(["Item", 2, 3]));
	utils.logger(typeDefs.Test1.__inner__parse__abcxyz__(["Item", 2, "Equip", "2"]));
	utils.logger(typeDefs.Item3.__inner__parse__abcxyz__([10001, 10002, 10003]));
	// utils.logger(type_defines.Item3.__inner__parse__abcxyz__([1, 2, 3]));
	utils.logger(typeDefs.EquipId.__inner__parse__abcxyz__(1003));
	utils.logger("Boolean: " + "True" + " Result: " + typeDefs.boolean.__inner__parse__abcxyz__("True"));
	utils.logger("Boolean: " + "true" + " Result: " + typeDefs.boolean.__inner__parse__abcxyz__("true"));
	utils.logger("Boolean: " + "false" + " Result: " + typeDefs.boolean.__inner__parse__abcxyz__("false"));
	utils.logger("Boolean: " + "False" + " Result: " + typeDefs.boolean.__inner__parse__abcxyz__("False"));
	utils.logger("Boolean: " + "0" + " Result: " + typeDefs.boolean.__inner__parse__abcxyz__("0"));
	utils.logger("Boolean: " + "1" + " Result: " + typeDefs.boolean.__inner__parse__abcxyz__("1"));
	utils.logger("Boolean: " + 2 + " Result: " + typeDefs.boolean.__inner__parse__abcxyz__(2));
	utils.logger("Boolean: " + 1 + " Result: " + typeDefs.boolean.__inner__parse__abcxyz__(1));
	utils.logger("Boolean: " + 0 + " Result: " + typeDefs.boolean.__inner__parse__abcxyz__(0));
	// fixme: for test
	process.exit(0);
}