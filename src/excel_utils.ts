import * as path from 'path';
import * as fs from 'fs';
import * as xlsx from 'xlsx';
import * as utils from './utils';
import { gCfg } from './config';
import { TypeDefParser } from './TypeDefParser';
import { ExcelLoader } from './loader/excel_loader';
import { IDataLoader } from './loader/idata_loader';
import { CSVLoader } from './loader/csv_loader';

// excel handler data
type WorksheetHandlerData = {
	worksheet: IDataLoader,
	rIdx: number,
	RowMax: number,
	ColumnMax: number,
	DataTable: utils.SheetDataTable,
};

const ExcelWorkSheetHandleListStep = new Array<WorksheetHandlerData>();

export async function HandleExcelFile(fileName: string): Promise<boolean> {
	try {
		let opt: xlsx.ParsingOptions = {
			type: "buffer",
			// codepage: 0,//If specified, use code page when appropriate **
			cellFormula: false,//Save formulae to the .f field
			cellHTML: false,//Parse rich text and save HTML to the .h field
			cellText: true,//Generated formatted text to the .w field
			cellDates: true,//Store dates as type d (default is n)
			cellStyles: true,//Store style/theme info to the .s field
			/**
			* If specified, use the string for date code 14 **
			 * https://github.com/SheetJS/js-xlsx#parsing-options
			 *		Format 14 (m/d/yy) is localized by Excel: even though the file specifies that number format,
			 *		it will be drawn differently based on system settings. It makes sense when the producer and
			 *		consumer of files are in the same locale, but that is not always the case over the Internet.
			 *		To get around this ambiguity, parse functions accept the dateNF option to override the interpretation of that specific format string.
			 */
			dateNF: gCfg.TinyDateFmt.toLowerCase(),
			WTF: true,//If true, throw errors on unexpected file features **
		};
		const filebuffer = await fs.promises.readFile(fileName);
		const excel = xlsx.read(filebuffer, opt);
		if (excel == null) {
			utils.exception(`excel ${utils.yellow_ul(fileName)} open failure.`);
		}
		if (excel.Sheets == null) {
			return true;
		}
		for (let sheetName of excel.SheetNames) {
			utils.debug(`- Handle excel "${utils.brightWhite(fileName)}" Sheet "${utils.yellow_ul(sheetName)}"`);
			const worksheet = excel.Sheets[sheetName];
			const excelLoader = new ExcelLoader(worksheet, sheetName, fileName);
			HandleDataTable(excelLoader, fileName);
		}
	} catch (ex) {
		utils.exceptionRecord(`handle excel: "${fileName}" failure with exception`, ex);
		return false;
	}
	return true;
}

export async function HandleCsvFile(fileName: string): Promise<boolean> {
	try {
		const csv = await CSVLoader.load(fileName);
		if (csv == null) {
			utils.exception(`csv ${utils.yellow_ul(fileName)} open failure.`);
		}
		utils.debug(`- Handle csv "${utils.brightWhite(fileName)}" Sheet "${utils.yellow_ul(csv.sheetName)}"`);
		HandleDataTable(csv, fileName);
	} catch (ex) {
		utils.exceptionRecord(`handle csv: "${fileName}" failure with exception`, ex);
		return false;
	}
	return true;
}

function HandleDataTable(worksheet: IDataLoader, fileName: string) {
	const res = HandleDataTableStep1(worksheet);
	if (!res) return;
	var dataTable = res.DataTable;
	const oldDataTable = utils.ExportExcelDataMap.get(worksheet.sheetName);
	if (!oldDataTable) {
		utils.ExportExcelDataMap.set(worksheet.sheetName, dataTable);
		ExcelWorkSheetHandleListStep.push({ worksheet: worksheet, rIdx: res.rIdx, RowMax: res.RowMax, ColumnMax: res.ColumnMax, DataTable: dataTable });
		return;
	}
	// check header
	if (dataTable.arrTypeHeader.length != oldDataTable.arrTypeHeader.length) {
		utils.exception(`found duplicate file name with different header : ${utils.yellow_ul(worksheet.sheetName)} \n`
			+ `at ${utils.yellow_ul(fileName)} \n`
			+ `and ${utils.yellow_ul(oldDataTable.sheetTable[0].fileName)}`);
	}
	for (let i = 0; i < dataTable.arrTypeHeader.length; ++i) {
		if (!utils.IsSheetHeaderSame(dataTable.arrTypeHeader[i], oldDataTable.arrTypeHeader[i])) {
			utils.exception(`found duplicate file name with different header [${dataTable.arrTypeHeader[i].name}] and [${oldDataTable.arrTypeHeader[i].name}] : ${utils.yellow_ul(worksheet.sheetName)} \n`
				+ `at ${utils.yellow_ul(fileName)} \n`
				+ `and ${utils.yellow_ul(oldDataTable.sheetTable[0].fileName)}`);
		}
	}


	// merge data
	// fixme: 需要确保合并的稳定性，不然会导致数据错乱
	// utils.exception(`found duplicate file name : ${utils.yellow_ul(datatable.sheetName)} \n`);
	oldDataTable.combineSheetTable(dataTable);
	ExcelWorkSheetHandleListStep.push({ worksheet: worksheet, rIdx: res.rIdx, RowMax: res.RowMax, ColumnMax: res.ColumnMax, DataTable: oldDataTable });

	// var rIdx = oldDataTable.arrValues.length <= 0
	// 	? datatable.arrValues.length <= 0 ? 0 : datatable.arrValues[0].rIdx - 1
	// 	: oldDataTable.arrValues[oldDataTable.arrValues.length - 1].rIdx;
	// for (const row of datatable.arrValues) {
	// 	row.rIdx = rIdx++;
	// 	oldDataTable.arrValues.push(row);
	// }
}

////////////////////////////////////////////////////////////////////////////////

type Step1Result = {
	DataTable: utils.SheetDataTable,
	worksheet: IDataLoader,
	rIdx: number,
	RowMax: number,
	ColumnMax: number,
};

// step 1. init header name
function HandleDataTableStep1(worksheet: IDataLoader): Step1Result | undefined {
	if (!utils.StrNotEmpty(worksheet.sheetName) || worksheet.sheetName[0] == "!" || worksheet.sheetName[0] == "#") {
		utils.debug(`- Pass Sheet "${worksheet.sheetName}" : Sheet Name start with "!" or "#"`);
		return;
	}

	const Range = worksheet.getRange();
	if (Range == undefined) {
		return;
	}
	const ColumnMax = Range.e.c;
	const RowMax = Range.e.r;
	// find max column and rows
	let rIdx = 0;
	const DataTable = new utils.SheetDataTable(worksheet);
	// find column name
	rIdx = HandleWorksheetNameRow(worksheet, rIdx, RowMax, ColumnMax, DataTable);
	// find group filter
	rIdx = HandleWorksheetGroupFilterRow(worksheet, rIdx, RowMax, ColumnMax, DataTable);
	if (rIdx < 0) return;
	// find type row
	rIdx = HandleWorksheetTypeRow(worksheet, rIdx, RowMax, ColumnMax, DataTable);
	return { DataTable, worksheet, rIdx, RowMax, ColumnMax };
}

function IsCommentCell(data: xlsx.CellObject | undefined): boolean {
	return data != undefined && utils.StrNotEmpty(data.w) && data.w[0] == '#';
}

function HandleWorksheetNameRow(worksheet: IDataLoader, rIdx: number, RowMax: number, ColumnMax: number, DataTable: utils.SheetDataTable): number {
	const arrTypeHeader = new Array<utils.SheetHeader>();
	const mapTypeHeader = new Map<number, utils.SheetHeader>();
	const headerNameMap = new Map<string, number>();
	// find column name
	let commentRIdx = -1;
	for (; rIdx <= RowMax; ++rIdx) {
		const firstCell = worksheet.getData(0, rIdx);
		if (commentRIdx == -1 && !utils.StrNotEmpty(firstCell?.w)) {
			continue;
		}
		if (IsCommentCell(firstCell)) {
			commentRIdx = rIdx;
			continue;
		}
		const tmpArry: any[] = [];
		for (let cIdx = 1; cIdx <= ColumnMax; ++cIdx) {
			const cell = worksheet.getData(cIdx, rIdx);
			if (cell?.w == null || IsCommentCell(cell)) {
				continue;
			}
			const comment = worksheet.getData(cIdx, commentRIdx)?.w ?? undefined;
			var name = cell.w;
			if (!/^[a-zA-Z0-9_]+$/.test(name)) {
				utils.exception(`Excel "${utils.yellow_ul(worksheet.fileName)}" `
					+ `Sheet "${utils.yellow_ul(worksheet.sheetName)} `
					+ `Cell "${utils.yellow_ul(utils.FMT26.NumToS26(cIdx) + (rIdx + 1).toString())}" `
					+ `Header Name "${utils.yellow_ul(name)}" Invalid!`);
			}
			const header: utils.SheetHeader = {
				name: name,
				shortName: utils.FMT26.NumToS26(arrTypeHeader.length),
				cIdx: cIdx,
				idx: arrTypeHeader.length,
				stype: '', // there is no stype
				isComment: false,
				group: '*',
				comment: comment?.trim(),
				parser: new TypeDefParser(),
			};
			arrTypeHeader.push(header);
			mapTypeHeader.set(header.cIdx, header);
			headerNameMap.set(name, cIdx);
			tmpArry.push(name);
		}
		DataTable.arrTypeHeader = arrTypeHeader;
		DataTable.mapTypeHeader = mapTypeHeader;
		DataTable.arrHeaderNameMap = headerNameMap;
		DataTable.arrValues.push({ worksheet, type: utils.ESheetRowType.header, values: tmpArry, rIdx });
		++rIdx;
		break;
	}
	return rIdx;
}

function HandleWorksheetGroupFilterRow(worksheet: IDataLoader, rIdx: number, RowMax: number, ColumnMax: number, DataTable: utils.SheetDataTable): number {
	// find column name
	for (; rIdx <= RowMax; ++rIdx) {
		const firstCell = worksheet.getData(0, rIdx);
		if (firstCell == undefined || !utils.StrNotEmpty(firstCell.w)) {
			continue;
		}
		if (firstCell.w[0] == '#' || (firstCell.w[0] == '/' && firstCell.w[1] == '/')) {
			continue;
		}
		// filter not found!
		if (firstCell.w[0] != '$') {
			return rIdx;
		}
		const tmpArry: any[] = [];
		for (const header of DataTable.arrTypeHeader) {
			const cIdx = header.cIdx;
			const cell = worksheet.getData(cIdx, rIdx);
			if (cell == undefined || !utils.StrNotEmpty(cell.w)) {
				continue;
			}
			const w = cIdx == 0 ? cell.w.substring(1) : cell.w; // cut symbol '$'
			const colGrp = utils.StrNotEmpty(w) ? w : '*';
			if ((<any>gCfg.GroupMap)[colGrp] == undefined) {
				utils.exception(`Excel "${utils.yellow_ul(worksheet.fileName)}" Sheet "${utils.yellow_ul(worksheet.sheetName)}" `
					+ `Cell "${utils.yellow_ul(utils.FMT26.NumToS26(cIdx) + (rIdx).toString())}" `
					+ `Group Filter ${utils.yellow_ul(colGrp)} Invalid"!`);
			}
			header.group = colGrp;
			tmpArry.push(cell.w);
		}
		DataTable.arrValues.push({ worksheet, type: utils.ESheetRowType.header, values: tmpArry, rIdx });
		++rIdx;
		break;
	}
	return rIdx;
}

// step 2. init type row
export async function HandleDataTableStep2(): Promise<boolean> {
	ExcelWorkSheetHandleListStep.sort((a, b) => a.worksheet.fileName < b.worksheet.fileName ? -1 : 1);
	for (let i = ExcelWorkSheetHandleListStep.length - 1; i > -1; --i) {
		const s = ExcelWorkSheetHandleListStep[i];
		// handle type row
		try {
			s.rIdx = HandleWorksheetTypeRowPaste(s.worksheet, s.rIdx, s.RowMax, s.ColumnMax, s.DataTable);
			s.rIdx = HandleWorksheetCollectBaseDataRow(s.worksheet, s.rIdx, s.RowMax, s.ColumnMax, s.DataTable);
		} catch (ex) {
			utils.exceptionRecord("handle read excel base data failure.", ex);
			return false;
		}
	}
	return true;
}

// step 3. init data row
export function HandleDataTableStep3(): boolean {
	let foundError = false;
	TypeDefParser.initializeColumnTypeName();
	for (const [sheetName, DataTable] of utils.ExportExcelDataMap) {
		for (let colIdx = 0; colIdx < DataTable.arrTypeHeader.length; ++colIdx) {
			let header = DataTable.arrTypeHeader[colIdx];
			// already deal
			if (header.parser.canCollectionOnBasePass) {
				continue;
			}
			// handle parseContent
			const cIdx = header.cIdx;
			if (!header.parser) continue;
			TypeDefParser.setHeaderNameMap(DataTable.sheetName, DataTable.arrHeaderNameMap);
			for (let rowIdx = 0; rowIdx < DataTable.arrValues.length; ++rowIdx) {
				const row = DataTable.arrValues[rowIdx];
				if (row.type != utils.ESheetRowType.data) continue;

				// if (!data) continue;
				const data = row.worksheet.getData(cIdx, row.rIdx);
				try {
					TypeDefParser.setColumnName(header.name);
					TypeDefParser.setRowData(row.values);
					row.values[cIdx] = header.parser.ParseContent(data);
				} catch (ex) {
					foundError = true;
					utils.exceptionRecord(`Excel "${utils.yellow_ul(row.worksheet.fileName)}" `
						+ `Sheet Row "${utils.yellow_ul(DataTable.sheetName + '.' + utils.yellow_ul(header.name))}" High Type format error `
						+ `Cell "${utils.yellow_ul(utils.FMT26.NumToS26(cIdx) + (row.rIdx + 1).toString())}" `
						+ ` "${utils.yellow_ul(data?.w ?? '<no data>')}"!`, ex);
				}
			}
		}
	}
	utils.logger(`${foundError ? utils.red('[FAILURE]') : utils.green('[SUCCESS]')} `
		+ `CHECK ALL TypeChecker Parser DONE. Total Use Tick : ${utils.green(utils.TimeUsed.LastElapse())}`);
	return !foundError;
}

function HandleWorksheetTypeRow(worksheet: IDataLoader, rIdx: number,
	RowMax: number, ColumnMax: number, DataTable: utils.SheetDataTable) {
	const arrHeaderName = DataTable.arrTypeHeader;
	for (; rIdx <= RowMax; ++rIdx) {
		const zeroCell = worksheet.getData(0, rIdx);
		const firstCell = worksheet.getData(arrHeaderName[0].cIdx, rIdx);
		if (firstCell == undefined || !utils.StrNotEmpty(firstCell.w) || zeroCell == undefined || !utils.StrNotEmpty(zeroCell.w)) {
			continue;
		}
		if (firstCell.w[0] == '#') {
			continue;
		}

		if (zeroCell.w[0] != '*') {
			utils.exception(`Excel "${utils.yellow_ul(worksheet.fileName)}" Sheet "${utils.yellow_ul(worksheet.sheetName)}" Sheet Type Row not found!`);
		}
		const tmpArry = [];
		for (const col of arrHeaderName) {
			const cell = worksheet.getData(col.cIdx, rIdx);
			if (cell == undefined || cell.w == undefined) {
				utils.exception(`Excel "${utils.yellow_ul(worksheet.fileName)}" ` +
					`Sheet "${utils.yellow_ul(worksheet.sheetName)}"  Type Row "${utils.yellow_ul(col.name)}" not found!`);
			}
			try {
				const header = DataTable.mapTypeHeader.get(col.cIdx);
				if (header == undefined) {
					continue;
				}
				// 完善checker
				col.stype = cell.w;
				tmpArry.push(cell.w);
			} catch (ex) {
				// new CTypeParser(cell.w); // for debug useud
				utils.exception(`Excel "${utils.yellow_ul(worksheet.fileName)}" Sheet "${utils.yellow_ul(worksheet.sheetName)}" Sheet Type Row`
					+ ` "${utils.yellow_ul(col.name)}" format error "${utils.yellow_ul(cell.w)}"!`, ex);
			}
		}
		DataTable.arrValues.push({ worksheet, type: utils.ESheetRowType.type, values: tmpArry, rIdx: rIdx });
		++rIdx;
		break;
	}
	return rIdx;
}

function HandleWorksheetTypeRowPaste(worksheet: IDataLoader, rIdx: number,
	RowMax: number, ColumnMax: number, DataTable: utils.SheetDataTable) {
	const arrHeaderName = DataTable.arrTypeHeader;
	for (const col of arrHeaderName) {
		try {
			// 完善checker
			col.parser.init(col.stype);
		} catch (ex) {
			utils.exception(`Excel "${utils.yellow_ul(worksheet.fileName)}" Sheet "${utils.yellow_ul(worksheet.sheetName)}" Sheet Type Row`
				+ ` "${utils.yellow_ul(col.name)}" format error "${utils.yellow_ul(col.stype)}"!`, ex);
		}
	}
	return rIdx;
}

function HandleWorksheetCollectBaseDataRow(worksheet: IDataLoader, rIdx: number,
	RowMax: number, ColumnMax: number, DataTable: utils.SheetDataTable) {
	let arrHeaderName = DataTable.arrTypeHeader;
	const firstColumn = arrHeaderName[0];
	let hasException = false;
	for (; rIdx <= RowMax; ++rIdx) {
		const tmpArry = [];
		// skip comment line
		const zeroData = worksheet.getData(0, rIdx)?.w;
		if (utils.StrNotEmpty(zeroData) && zeroData[0] == '#') {
			continue;
		}

		const firstData = worksheet.getData(firstColumn.cIdx, rIdx)?.w;
		if (!utils.StrNotEmpty(firstData) || firstData[0] == '#') {
			continue;
		}
		TypeDefParser.setHeaderNameMap(DataTable.sheetName, DataTable.arrHeaderNameMap);
		for (let header of arrHeaderName) {
			if (!header.parser.canCollectionOnBasePass) {
				tmpArry[header.cIdx] = undefined;
			} else {
				TypeDefParser.setColumnName(header.name);
				const cell = worksheet.getData(header.cIdx, rIdx);
				const value = cell && cell.w ? cell.w : '';
				let colObj;
				try {
					TypeDefParser.setRowData(tmpArry);
					colObj = header.parser.ParseContent(cell);
					tmpArry[header.cIdx] = colObj;
				} catch (ex) {
					// col.checker.ParseContent(cell);
					utils.exceptionRecord(`Excel "${utils.yellow_ul(worksheet.fileName)}" Sheet "${utils.yellow_ul(worksheet.sheetName)}" `
						+ `Cell "${utils.yellow_ul(utils.FMT26.NumToS26(header.cIdx) + (rIdx + 1).toString())}" `
						+ `Parse Data "${utils.yellow_ul(value)}" With ${utils.yellow_ul(header.parser.s)} `
						+ `Cause utils.exception!`, ex);
					hasException = true;
				}
			}
		}
		DataTable.arrValues.push({ worksheet, type: utils.ESheetRowType.data, values: tmpArry, rIdx });
	}
	return rIdx;
}


//#endregion
