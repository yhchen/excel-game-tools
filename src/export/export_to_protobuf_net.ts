import * as fs from 'fs';
import * as path from 'path';
import * as utils from '../utils';
import * as protobufjs from 'protobufjs';
import { forEach, isArray } from 'lodash';
import { ArrayTypeDef, BaseTypeDef, ColumnTypeDef, EnumTypeDef, ObjectTypeDef, TypeDef, TypeDefParser } from '../TypeDefParser';
import { gCfg } from '../config';

let EnableRegion = true;

const PBNTypeTranslateMap = new Map<string, { s: string, opt: boolean, }>([
	['char', { s: 'char', opt: false }],
	['uchar', { s: 'byte', opt: false }],
	['short', { s: 'short', opt: false }],
	['ushort', { s: 'ushort', opt: false }],
	['int', { s: 'int', opt: false }],
	['uint', { s: 'uint', opt: false }],
	['int64', { s: 'long', opt: false }],
	['uint64', { s: 'ulong', opt: false }],
	['string', { s: 'string', opt: false }],
	['double', { s: 'double', opt: false }],
	['float', { s: 'float', opt: false }],
	['bool', { s: 'bool', opt: false }],
	['boolean', { s: 'bool', opt: false }],
	['date', { s: 'string', opt: true }],
	['tinydate', { s: 'string', opt: true }],
	['timestamp', { s: 'long', opt: true }],
	['utctime', { s: 'long', opt: true }],
]);

const GET_AND_SET = '{ get; set; }';

// 生成数组类型
function ARRAY_TYPE(baseTypeName: string): string {
	// return `List<${baseTypeName}>`;
	return `${baseTypeName}[]`;
}

// 获取通用using头部
function GET_COMMON_USING_HEADER(): string {
	return `using ProtoBuf;${gCfg.LineBreak}using System;${gCfg.LineBreak}`;
	// return `using ProtoBuf;${gCfg.LineBreak}using System.Collections.Generic;${gCfg.LineBreak}`;
	// return `using ProtoBuf;${gCfg.LineBreak}`;
}


////////////////////////////////////////////////////////////////////////////////
class ProtobufNetExport extends utils.IExportWrapper {
	private TABLE_ROW_NAME = this._exportCfg.ARRAY_ELEMENT_NAME ?? 'Arr';
	private TABLE_PREFIX = this._exportCfg.ARRAY_ELEMENT_NAME ?? 'Arr';
	private readonly ARR_FILE_HEADER = '/** This is an automatically generated class by excel export tools. Please do not modify it. **/' + gCfg.LineBreak + gCfg.LineBreak + gCfg.LineBreak;

	constructor(exportCfg: utils.ExportCfg) {
		super(exportCfg);
	}

	public get DefaultExtName(): string { return '.cs'; }

	protected async ExportTo(dt: utils.SheetDataTable): Promise<boolean> {
		if (this.isExportToFile()) {
			return true;
		}

		let FMT: string | undefined = this._exportCfg.ExportTemple;
		if (FMT == undefined) {
			utils.exception(`[Config Error] ${utils.yellow_ul('Export.ExportTemple')} not defined!`);
		}
		if (FMT.indexOf('{data}') < 0) {
			utils.exception(`[Config Error] ${utils.yellow_ul('Export.ExportTemple')} not found Keyword ${utils.yellow_ul('{data}')}!`);
		}
		if (FMT.indexOf('{classDef}') < 0) {
			utils.exception(`[Config Error] ${utils.yellow_ul('Export.ExportTemple')} not found Keyword ${utils.yellow_ul('{classDef}')}!`);
		}

		// generate enum and object types...
		if (this._leadTypeMap.size <= 0) {
			const globalDef = TypeDefParser.GDefType;
			for (const key in globalDef) {
				const type = globalDef[key];
				if (type.__inner__o_type__abcxyz__ == 'enum') {
					this.GenEnumMessageAndGetTypeName(type);
				} else if (type.__inner__o_type__abcxyz__ == 'object') {
					this.GenObjectMessageAndGetTypeName(type);
				}
			}
		}
		// generate table using context
		let usingContext = GET_COMMON_USING_HEADER();
		if (this._exportCfg.UseNamespace) {
			for (let using of this._exportCfg.UseNamespace) {
				usingContext += `using ${using};${gCfg.LineBreak}`;
			}
			usingContext += gCfg.LineBreak;
		}
		// generate table proto
		const namespaceContext = this._exportCfg.Namespace ? `namespace ${this._exportCfg.Namespace}${gCfg.LineBreak}{${gCfg.LineBreak}` : undefined;
		const name = dt.sheetName;
		let sheetType = this.GenSheetType(name, dt, FMT);
		let sheetContext = `${usingContext}`;
		if (sheetType) {
			let data = usingContext;
			if (namespaceContext) {
				sheetContext += `${namespaceContext}` +
					sheetType.split(gCfg.LineBreak).join(`${gCfg.LineBreak}    `) +
					`${gCfg.LineBreak}}`;
			} else {
				sheetContext += sheetType;
			}
			const outfile = this.getOutputFilePath(name);
			await this.writeFileAsync(outfile, sheetContext);
			utils.debug(`${utils.green('[SUCCESS]')} Output file '${utils.yellow_ul(outfile)}'. `
				+ `Total use tick:${utils.green(utils.TimeUsed.LastElapse())}`);
		}

		// generate lead type...
		for (const [name, define] of this._leadTypeMap) {
			// init once
			if (this._leadTypeExportedSet.has(name)) {
				continue;
			}
			this._leadTypeExportedSet.add(name);
			// ignore type...
			if (this._exportCfg.IgnoreTypeExport != null && this._exportCfg.IgnoreTypeExport.indexOf(name) >= 0) {
				utils.debug(`ignore type export: ${name}`);
				continue;
			}
			let leadTypeMessage = `${GET_COMMON_USING_HEADER()}${gCfg.LineBreak}`;
			if (this._exportCfg.Namespace) {
				leadTypeMessage += `namespace ${this._exportCfg.Namespace}${gCfg.LineBreak}` +
					`{${gCfg.LineBreak}` +
					`${define.split(gCfg.LineBreak).join(`${gCfg.LineBreak}    `)}${gCfg.LineBreak}` +
					`}${gCfg.LineBreak}`;
			} else {
				leadTypeMessage += `${define}${gCfg.LineBreak}`;
			}
			const outfile = this.getOutputFilePath(name);
			await this.writeFileAsync(outfile, leadTypeMessage);
			utils.debug(`${utils.green('[SUCCESS]')} Output file '${utils.yellow_ul(outfile)}'. `
				+ `Total use tick:${utils.green(utils.TimeUsed.LastElapse())}`);
		}

		return true;
	}

	protected async ExportGlobal(): Promise<boolean> {
		const outdir = this._exportCfg.OutputDir;
		if (!this.isExportToFile()) {
			await this.CleanupOldFiles(outdir);
			return true;
		}
		if (!this.CreateDir(path.dirname(outdir))) {
			utils.exception(`create output path '${utils.yellow_ul(path.dirname(outdir))}' failure!`);
		}
		let FMT: string | undefined = this._exportCfg.ExportTemple;
		if (FMT == undefined) {
			utils.exception(`[Config Error] ${utils.yellow_ul('Export.ExportTemple')} not defined!`);
		}
		if (FMT.indexOf('{data}') < 0) {
			utils.exception(`[Config Error] ${utils.yellow_ul('Export.ExportTemple')} not found Keyword ${utils.yellow_ul('{data}')}!`);
		}
		if (FMT.indexOf('{classDef}') < 0) {
			utils.exception(`[Config Error] ${utils.yellow_ul('Export.ExportTemple')} not found Keyword ${utils.yellow_ul('{classDef}')}!`);
		}

		// generate enum and object types...
		const globalDef = TypeDefParser.GDefType;
		for (const key in globalDef) {
			const type = globalDef[key];
			if (type.__inner__o_type__abcxyz__ == 'enum') {
				this.GenEnumMessageAndGetTypeName(type);
			} else if (type.__inner__o_type__abcxyz__ == 'object') {
				this.GenObjectMessageAndGetTypeName(type);
			}
		}

		// sort export table by name.
		let exTypeData = '';
		const array = [];
		for (let [k, v] of utils.ExportExcelDataMap) {
			array.push(v);
		}
		array.sort((a, b) => {
			return a.sheetName.localeCompare(b.sheetName);
		});
		for (let dataTable of array) {
			const name = dataTable.sheetName;
			let sheetType = this.GenSheetType(name, dataTable, FMT);
			if (sheetType) {
				exTypeData += `${sheetType}${gCfg.LineBreak}${gCfg.LineBreak}`;
			}
		}

		const NamespaceContent = this._exportCfg.Namespace ? `namespace ${this._exportCfg.Namespace}${gCfg.LineBreak}{${gCfg.LineBreak}` : undefined;
		let leadTypeMessage = '';
		for (const [key, value] of this._leadTypeMap) {
			leadTypeMessage += value + gCfg.LineBreak;
		}
		exTypeData = `${leadTypeMessage}${exTypeData}${gCfg.LineBreak}`;

		if (this._exportCfg.Namespace) {
			exTypeData = `    ` + exTypeData.split(gCfg.LineBreak).join(`${gCfg.LineBreak}    `);
		}
		let data = GET_COMMON_USING_HEADER();
		if (this._exportCfg.UseNamespace) {
			for (let using of this._exportCfg.UseNamespace) {
				data += `using ${using};${gCfg.LineBreak}`;
			}
			data += gCfg.LineBreak;
		}
		data += `${NamespaceContent}${gCfg.LineBreak}` +
			exTypeData +
			(NamespaceContent == undefined ? '' : `${gCfg.LineBreak}}${gCfg.LineBreak}`);
		await this.writeFileAsync(outdir, data);
		utils.debug(`${utils.green('[SUCCESS]')} Output file '${utils.yellow_ul(outdir)}'. `
			+ `Total use tick:${utils.green(utils.TimeUsed.LastElapse())}`);
		return true;
	}

	private GenSheetType(sheetName: string, dataTable: utils.SheetDataTable, FMT: string): string | undefined {
		const arrHeader: utils.SheetHeader[] = dataTable.arrTypeHeader;
		const arrExportHeader = utils.ExecGroupFilter(sheetName, this._exportCfg.GroupFilter, arrHeader);
		if (arrExportHeader.length <= 0) {
			utils.debug(`Pass Sheet ${utils.yellow_ul(sheetName)} : No Column To Export.`);
			return;
		}

		let data = `{${gCfg.LineBreak}`;
		for (let header of arrExportHeader) {
			if (header.isComment) continue;
			let typeName = `string`;
			const defType = header.parser.type;
			const isNotNull = header.parser.isNotNull;
			let isBaseType = true;
			if (defType != undefined) {
				switch (defType.__inner__o_type__abcxyz__) {
					case 'array':
						{
							typeName = '';
							const subTypeDef = defType.__inner__type__abcxyz__;
							switch (subTypeDef.__inner__o_type__abcxyz__) {
								case 'array':
									typeName += this.GenArrayMessageAndGetTypeName(subTypeDef);
									break;
								case 'object':
									typeName += this.GenObjectMessageAndGetTypeName(subTypeDef);
									break;
								case 'base':
								case 'enum':
								case 'column':
									typeName += this.GenBaseTypeName(subTypeDef);
									break;
								default:
									utils.exception(`call '${utils.yellow_ul('GenTypeName')}' failure`);
							}
							typeName = ARRAY_TYPE(typeName);
							isBaseType = false;
						}
						break;
					case 'object':
						typeName = this.GenObjectMessageAndGetTypeName(defType);
						isBaseType = false;
						break;
					case 'base':
					case 'enum':
					case 'column':
						typeName = this.GenBaseTypeName(defType);
						break;
					default:
						utils.exception(`call '${utils.yellow_ul('GenTypeName')}' failure`);
				}
			}

			let comment = '';
			if (header.comment != undefined && header.comment.trim() != '') {
				if (header.comment.indexOf('\n') < 0) {
					comment = `    /// <summary>${header.comment}</summary>${gCfg.LineBreak}`;
				} else {
					comment = `    /// <summary>` + gCfg.LineBreak +
						`    /// ${header.comment.replace(/\r/g, '').split('\n').join(`${gCfg.LineBreak}    /// `)}` + gCfg.LineBreak +
						`    /// </summary>${gCfg.LineBreak}`;
				}
			}
			if ((!isBaseType && !isNotNull) && this._exportCfg.NullableReferenceTypes && !header.parser.IsStructMode) {
				data +=
					gCfg.LineBreak + comment +
					// `    [DataMember]${gCfg.LineBreak}` +
					`    [ProtoMember(${header.cIdx + 1})]${gCfg.LineBreak}` +
					`#nullable enable${gCfg.LineBreak}` +
					`    public ${typeName}? ${this.TranslateColName(header.name)} ${GET_AND_SET}${gCfg.LineBreak}` +
					`#nullable disable${gCfg.LineBreak}`
					;
			}
			else {
				data +=
					gCfg.LineBreak + comment +
					// `    [DataMember]${gCfg.LineBreak}` +
					`    [ProtoMember(${header.cIdx + 1})]${gCfg.LineBreak}` +
					`    public ${typeName} ${this.TranslateColName(header.name)} ${GET_AND_SET}${gCfg.LineBreak}`;
				;
			}
		}
		data += `}${gCfg.LineBreak}${gCfg.LineBreak}`;
		const classDef =
			`[ProtoContract]${gCfg.LineBreak}` +
			// `[DataContract]${gCfg.LineBreak}` +
			`public partial class ${sheetName}`;

		const arrTypeContext =
			`[ProtoContract]${gCfg.LineBreak}` +
			// `[DataContract]${gCfg.LineBreak}` +
			`public partial class ${this.TABLE_PREFIX}${sheetName}${gCfg.LineBreak}` +
			`{${gCfg.LineBreak}` +
			// `    [DataMember]${gCfg.LineBreak}` +
			`    [ProtoMember(1)]${gCfg.LineBreak}` +
			`    public ${ARRAY_TYPE(sheetName)} ${this.TABLE_ROW_NAME} ${GET_AND_SET}${gCfg.LineBreak}` +
			// `    public ${ARRAY_TYPE(sheetName)}${this._exportCfg.NullableReferenceTypes ? '?' : ''} ${this.TABLE_ROW_NAME} ${GET_AND_SET}${gCfg.LineBreak}` +
			`}`;

		const nameReg = new RegExp('{name}', 'gm');
		let sheetContent = FMT.replace('{data}', data).replace(nameReg, sheetName).replace('{classDef}', classDef);
		let fileList = new Array<string>();
		for (const st of dataTable.sheetTable) {
			fileList.push(path.basename(st.fileName));
		}
		sheetContent = `${gCfg.LineBreak}// excel: ${fileList.join(', ')}${gCfg.LineBreak}`
			+ `// sheet: ${sheetName}${gCfg.LineBreak}`
			+ sheetContent
			+ arrTypeContext;
		return sheetContent;
	}

	private GenBaseTypeName(typeDef: TypeDef): string {
		switch (typeDef.__inner__o_type__abcxyz__) {
			case 'enum':
				return typeDef.__inner__name__abcxyz__ ?? 'sint32';
			case 'base':
			case 'column':
				return PBNTypeTranslateMap.get(typeDef.__inner__name__abcxyz__ ?? '')?.s ?? 'string';
		}
		throw new Error('Gen proto Base type failure. unsupport base type');
	}

	private GenArrayMessageAndGetTypeName(typeDef: ArrayTypeDef): string {
		if (typeDef.__inner__o_type__abcxyz__ != 'array') {
			throw new Error(`Generate proto Array Message failure. there is not a Array defines!`);
		}
		const subTypeDef = typeDef.__inner__type__abcxyz__;
		let typeName: string | undefined;
		let subName: string | undefined;
		if (subTypeDef.__inner__o_type__abcxyz__ == 'array') {
			typeName = this.GenArrayMessageAndGetTypeName(subTypeDef);
			subName = typeName.substring(3); // skip first '_v_'
		} else if (subTypeDef.__inner__o_type__abcxyz__ == 'object') {
			subName = typeName = this.GenObjectMessageAndGetTypeName(subTypeDef);
		} else {
			subName = typeName = this.GenBaseTypeName(subTypeDef);
		}

		if (typeName == undefined) {
			throw new Error(`Generate proto Array Message failure. Array don't have a Name!`);
		}
		const level = typeDef.__inner__level__abcxyz__;
		const levelTail = level <= 1 ? '' : level;
		let arrTypeName = `_v${levelTail}_${subName}`;
		if (this._leadTypeMap.has(arrTypeName)) {
			return arrTypeName;
		}

		let message = gCfg.LineBreak +
			`[ProtoContract]${gCfg.LineBreak}` +
			// `[DataContract]${gCfg.LineBreak}` +
			`public partial class ${arrTypeName} {${gCfg.LineBreak}${gCfg.LineBreak}` +
			`    [ProtoMember(1)]${gCfg.LineBreak}` +
			`    public ${ARRAY_TYPE(typeName)} a ${GET_AND_SET}${gCfg.LineBreak}` +
			gCfg.LineBreak +
			`    [ProtoIgnore]${gCfg.LineBreak}` +
			`    public ${typeName} this[int index]${gCfg.LineBreak}` +
			`    {${gCfg.LineBreak}` +
			`        get => this.a[index];${gCfg.LineBreak}` +
			`        set => this.a[index] = value;${gCfg.LineBreak}` +
			`    }${gCfg.LineBreak}` +
			`}${gCfg.LineBreak}`;
		this._leadTypeMap.set(arrTypeName, message);
		return arrTypeName;
	}

	// 获取Object的名称并生成Object类型的值
	private GenObjectMessageAndGetTypeName(typeDef: ObjectTypeDef): string {
		if (typeDef.__inner__o_type__abcxyz__ != 'object') {
			throw new Error(`Generate proto Object Message failure. there is not a Object defines!`);
		}
		if (typeDef.__inner__name__abcxyz__ == undefined) {
			throw new Error(`Generate proto Object Message failure. Object don't have a Name!`);
		}
		const typeName = `${typeDef.__inner__name__abcxyz__}`;
		if (this._leadTypeMap.has(typeName)) {
			return typeName; // already define
		}
		let comment = '';
		if (typeDef.__inner__def_comment != undefined && typeDef.__inner__def_comment.self.length > 0) {
			comment = typeDef.__inner__def_comment.self.join(gCfg.LineBreak) + gCfg.LineBreak;
		}
		const kv = typeDef.__inner__type__abcxyz__;
		let body = '';
		let interfaceBody = '';
		let index = 1;
		for (const key in kv) {
			const val = kv[key];
			if (val.__inner__name__abcxyz__ == undefined) {
				// 考虑到TJson中允许嵌入一维数组，所以此处特殊处理一下
				if (val.__inner__o_type__abcxyz__ != 'array') {
					throw new Error(`Generate proto Object Message failure. Object ${typeDef.__inner__name__abcxyz__}.${key} don't have a Name!`);
				}
			}
			let typeName = val.__inner__name__abcxyz__;
			let isBaseType = true;
			if (val.__inner__o_type__abcxyz__ == 'array') {
				isBaseType = false;
				if (val.__inner__type__abcxyz__?.__inner__o_type__abcxyz__ == 'array') {
					typeName = `${ARRAY_TYPE(this.GenArrayMessageAndGetTypeName(val.__inner__type__abcxyz__))}`;
				} else {
					typeName = `${ARRAY_TYPE(this.GenBaseTypeName(val.__inner__type__abcxyz__))}`;
				}
			} else if (val.__inner__o_type__abcxyz__ == 'object') {
				isBaseType = false;
				typeName = this.GenObjectMessageAndGetTypeName(val);
			} else {
				typeName = this.GenBaseTypeName(val);
			}
			let comment = '';
			if (typeDef.__inner__def_comment != undefined && typeDef.__inner__def_comment.children != undefined && typeDef.__inner__def_comment.children[key] != undefined) {
				comment = `    ` + typeDef.__inner__def_comment.children[key].join(`${gCfg.LineBreak}    `);
				if (EnableRegion) {
					comment = comment.replace(/\/\/#region/g, '#region').replace(/\/\/#endregion/g, '#endregion');
				}
				comment += gCfg.LineBreak;
			}
			if (!isBaseType && this._exportCfg.NullableReferenceTypes && !((<any>val).__inner__is_struct_parse_mode__)) {
				body +=
					gCfg.LineBreak + comment +
					// `    [DataMember]${gCfg.LineBreak}` +
					`    [ProtoMember(${index++})]${gCfg.LineBreak}` +
					`#nullable enable${gCfg.LineBreak}` +
					`    public ${typeName}? ${key} ${GET_AND_SET}` + gCfg.LineBreak +
					`#nullable disable${gCfg.LineBreak}`;
			} else {
				body +=
					gCfg.LineBreak + comment +
					// `    [DataMember]${gCfg.LineBreak}` +
					`    [ProtoMember(${index++})]${gCfg.LineBreak}` +
					`    public ${typeName} ${key} ${GET_AND_SET}` + gCfg.LineBreak;
			}
		}
		if (typeDef.__inner__def_comment?.tail && typeDef.__inner__def_comment?.tail.length > 0) {
			let comment = `    ` + typeDef.__inner__def_comment.tail.join(`${gCfg.LineBreak}    `);
			if (EnableRegion) {
				comment = comment.replace(/\/\/#region/g, '#region').replace(/\/\/#endregion/g, '#endregion');
			}
			body += comment;
		}

		let classType = typeDef.__inner__is_struct_parse_mode__ ? "struct" : "class";
		let classMessage = gCfg.LineBreak + comment +
			// `[DataContract]${gCfg.LineBreak}` +
			`[Serializable]${gCfg.LineBreak}` +
			`[ProtoContract]${gCfg.LineBreak}` +
			`public partial ${classType} ${typeName}` + gCfg.LineBreak +
			`{${gCfg.LineBreak}` + body +
			`}` + gCfg.LineBreak;
		let message = classMessage;
		this._leadTypeMap.set(typeName, message);
		return typeName;
	}

	private GenEnumMessageAndGetTypeName(typeDef: EnumTypeDef): string {
		if (typeDef.__inner__o_type__abcxyz__ != 'enum') {
			throw new Error(`Generate proto Enum Message failure. there is not a Object defines!`);
		}
		const enumName = typeDef.__inner__name__abcxyz__;
		if (enumName == undefined) {
			throw new Error(`Generate proto Enum Message failure. Enum don't has a name for it!
Please check your code for the following error examples:
Array(Enum({
	Invalid: 0,
	Item: 1,
	Equip: 2,
}))`);
		}
		if (!this._exportCfg.ExportEnum) {
			return enumName;
		}

		if (this._leadTypeMap.has(enumName)) {
			return enumName;
		}
		const enumObject = <any>typeDef.__inner__type__abcxyz__;

		let comment = '';
		if (typeDef.__inner__def_comment != undefined && typeDef.__inner__def_comment.self.length > 0) {
			comment = typeDef.__inner__def_comment.self.join(gCfg.LineBreak) + gCfg.LineBreak;
		}

		const flagMode = (<any>typeDef).__inner__is_flag__mode ? ", Flags" : "";

		let message = gCfg.LineBreak + comment +
			// `[DataContract]${gCfg.LineBreak}` +
			`[ProtoContract${flagMode}]${gCfg.LineBreak}` +
			`public enum ${enumName}${gCfg.LineBreak}` +
			`{`;
		for (let key in <any>enumObject) {
			let comment = '';
			if (typeDef.__inner__def_comment != undefined && typeDef.__inner__def_comment.children != undefined && typeDef.__inner__def_comment.children[key] != undefined) {
				comment = '    ' + typeDef.__inner__def_comment.children[key].join(`${gCfg.LineBreak}    `) + gCfg.LineBreak;
				if (EnableRegion) {
					comment = comment.replace(/\/\/#region/g, '#region').replace(/\/\/#endregion/g, '#endregion');
				}
			}

			message +=
				gCfg.LineBreak + comment +
				// `    [EnumMember]${gCfg.LineBreak}` +
				`    [ProtoEnum]${gCfg.LineBreak}` +
				`    ${[key]} = ${enumObject[key]},` + gCfg.LineBreak;
		}
		if (typeDef.__inner__def_comment?.tail) {
			let comment = `    ` + typeDef.__inner__def_comment.tail.join(`${gCfg.LineBreak}    `);
			if (EnableRegion) {
				comment = comment.replace(/\/\/#region/g, '#region').replace(/\/\/#endregion/g, '#endregion');
			}
			message += comment + gCfg.LineBreak;
		}

		message += `}${gCfg.LineBreak}`;
		this._leadTypeMap.set(enumName, message);
		return enumName;
	}

	private async writeFileAsync(file: string, context: string) {
		this._saveFileSet.add(path.basename(file));
		await fs.promises.writeFile(file, this.ARR_FILE_HEADER + context, { encoding: 'utf8', flag: 'w' });
	}

	private _protoRoot: protobufjs.Root | undefined;

	private TranslateValue(value: any): any {
		if (isArray(value)) {
			if (value.length <= 0 || !isArray(value[0])) {
				return { a: value };
			}
			const ret: { a: any[]; } = { a: [] };
			for (const subvalue of value) {
				ret.a.push(this.TranslateValue(subvalue));
			}
			return ret;
		}
		return value;
	}

	private _leadTypeMap = new Map<string, string>();
	private _leadTypeExportedSet = new Set<string>();
	private _saveFileSet = new Set<string>();

	// 清理所有的文件
	private async CleanupOldFiles(outdir: string) {
		if (!path.isAbsolute(outdir)) {
			outdir = path.resolve(outdir);
		}
		const pa = await fs.promises.readdir(outdir);
		for (const fileName of pa) {
			const filePath = path.join(outdir, fileName);
			// ignore ext name
			if (path.extname(fileName) != this._exportCfg.ExtName)
				continue;
			let info = fs.statSync(filePath);
			// ignore directory
			if (!info.isFile())
				continue;
			// ignore save file
			if (this._saveFileSet.has(path.basename(fileName)))
				continue;
			// ignore file not auto generate
			const filectx = await fs.promises.readFile(filePath, { encoding: 'utf-8' });
			if (!filectx.startsWith(this.ARR_FILE_HEADER))
				continue;
			// delete file and log
			fs.promises.unlink(filePath);
			utils.logger(`remove old file: ${filePath}`);
		}
	}
}

module.exports = function (exportCfg: utils.ExportCfg): utils.IExportWrapper { return new ProtobufNetExport(exportCfg); };
