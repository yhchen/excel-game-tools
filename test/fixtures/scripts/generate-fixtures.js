#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');
const xlsx = require('xlsx');

const rootDir = path.resolve(__dirname, '..', '..', '..');
const fixturesDir = path.join(rootDir, 'test', 'fixtures');
const positiveDir = path.join(fixturesDir, 'positive');
const negativeDir = path.join(fixturesDir, 'negative');
const configDir = path.join(fixturesDir, 'configs');
const typeDefDir = path.join(fixturesDir, 'typeDefs');
const tmpDir = './test/tmp';

function ensureDir(dir) {
	fs.mkdirSync(dir, { recursive: true });
}

function writeFile(filePath, content) {
	ensureDir(path.dirname(filePath));
	fs.writeFileSync(filePath, content, 'utf8');
}

function writeJson(filePath, value) {
	writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function csv(rows) {
	return rows.map(row => row.map(cell => {
		const text = String(cell == null ? '' : cell);
		if (/[",\n\r]/.test(text)) {
			return `"${text.replace(/"/g, '""')}"`;
		}
		return text;
	}).join(',')).join('\n') + '\n';
}

function tableRows(header, groups, types, dataRows, comment = 'generated fixture') {
	return [
		['#', comment],
		[''].concat(header),
		['$'].concat(groups),
		['*'].concat(types),
	].concat(dataRows.map(row => [''].concat(row)));
}

function config(caseName, includePath, typeDefName = 'positive-typeDef.js', groupFilter = ['*']) {
	return {
		IncludeFilesAndPath: Array.isArray(includePath) ? includePath : [includePath],
		GroupMap: {
			'*': '(All) Default value',
			'A': 'All test',
			'S': 'Server',
			'C': 'Client'
		},
		Export: [{
			type: 'json',
			OutputDir: `${tmpDir}/${caseName}/`,
			GroupFilter: groupFilter,
			UseDefaultValueIfEmpty: true
		}],
		DateFmt: 'YYYY/MM/DD HH:mm:ss',
		TypeCheckerJSFilePath: `./test/fixtures/typeDefs/${typeDefName}`,
		TinyDateFmt: 'YYYY/MM/DD',
		TimeStampUseMS: true,
		LineBreak: '\n',
		FractionDigitsFMT: 6,
		EnableDebugOutput: false,
		ArraySpliter: [',', ';', '\n']
	};
}

function writeCaseConfig(caseName, includePath, typeDefName = 'positive-typeDef.js', groupFilter = ['*']) {
	writeJson(path.join(configDir, `${caseName}.json`), config(caseName, includePath, typeDefName, groupFilter));
}

function writeTypeDefs() {
	writeFile(path.join(typeDefDir, 'positive-typeDef.js'), `"use strict";
require = global.require;
const { def } = require("def");
global.__require_tmp_file_path__ = __dirname;

function initialize(Sheets, typeDefs) {
	const int = typeDefs.int;
	const string = typeDefs.string;
	const float = typeDefs.float;

	const requiredString = typeDefs.RequiredString = def.TCustom(string, data => {
		if (data === '') throw new Error('value can not be empty');
		return true;
	});
	const nonZeroInt = typeDefs.NonZeroInt = def.TCustom(int, data => {
		if (data === 0) throw new Error('value can not be Zero (0)');
		return true;
	});
	const nonZeroDefaultZero = typeDefs.NonZeroDefaultZero = def.TCustom(int.DVAL(0), data => {
		if (data === 0) throw new Error('value can not be Zero (0)');
		return true;
	});

	typeDefs.TestEnum = def.TEnum({
		Invalid: 0,
		Item: 1,
		Equip: 2
	});
	typeDefs.EnumDefaultEquip = typeDefs.TestEnum.DVAL(2);
	typeDefs.IntDefault5 = int.DVAL(5);
	typeDefs.StringDefaultX = string.DVAL('x');

	typeDefs.PositionWithDefaults = def.TObject({
		x: int,
		y: int.DVAL(7),
		label: string.DVAL('origin')
	});
	typeDefs.PositionWithRequiredName = def.TObject({
		id: int,
		name: requiredString
	});
	typeDefs.ObjectDefaultZeroNonZero = def.TObject({
		count: nonZeroDefaultZero
	});
	typeDefs.ObjectArrayWithDefaults = def.TArray(def.TObject({
		id: int,
		count: int.DVAL(1)
	}));
	typeDefs.IntArrayNonZero = def.TArray(nonZeroInt);
	typeDefs.JsonWithDefaults = def.TJson({
		key: int.DVAL(1),
		value: requiredString
	});
	typeDefs.Vector2Fixed = def.TArray(float, 2);
}

function onExportAllDone() {}

exports.initialize = initialize;
exports.onExportAllDone = onExportAllDone;
`);

	writeFile(path.join(typeDefDir, 'reference-typeDef.js'), `"use strict";
require = global.require;
const { def } = require("def");
global.__require_tmp_file_path__ = __dirname;

function initialize(Sheets, typeDefs) {
	typeDefs.RefObject = def.TObject({
		itemId: Sheets.RefSource.id,
		count: typeDefs.int.DVAL(1)
	});
}

function onExportAllDone() {}

exports.initialize = initialize;
exports.onExportAllDone = onExportAllDone;
`);
}

function writePositiveCsvFixtures() {
	writeFile(path.join(positiveDir, 'BasicTypes.csv'), csv(tableRows(
		['id', 'intValue', 'uintValue', 'floatValue', 'doubleValue', 'stringValue', 'boolValue', 'dateValue', 'tinyDateValue', 'enumValue'],
		['*', '*', '*', '*', '*', '*', '*', '*', '*', '*'],
		['int<!!>', 'int', 'uint', 'float', 'double', 'string', 'bool', 'date', 'tinydate', 'TestEnum'],
		[
			['1', '-12', '12', '1.25', '2.5', 'plain text', 'true', '2026/07/03 12:30:00', '2026/07/03', '1'],
			['2', '', '', '', '', '', '', '', '', '']
		]
	)));

	writeFile(path.join(positiveDir, 'Arrays.csv'), csv(tableRows(
		['id', 'ints', 'matrix', 'cube', 'fixedPair', 'vector', 'nonZeroInts'],
		['*', '*', '*', '*', '*', '*', '*'],
		['int<!!>', 'int[]', 'int[][]', 'int[][][]', 'int[2]', 'Vector2Fixed', 'IntArrayNonZero'],
		[
			['1', '1,2,3', '1,2;3,4', '1,2;3,4\n5,6;7,8', '9,10', '1.5,2.5', '3,4,5'],
			['2', '', '', '', '11,12', '3.5,4.5', '6,7']
		]
	)));

	writeFile(path.join(positiveDir, 'Groups.csv'), csv([
		['#', 'group comments', '', '', ''],
		['', 'id', 'serverOnly', 'clientOnly', '#CommentColumn'],
		['$', '*', 'S', 'C', '*'],
		['*', 'int<!!>', 'string', 'string', 'string'],
		['#', 'comment row', '', '', ''],
		['', '1', 'server-a', 'client-a', 'hidden'],
		['', '2', 'server-b', 'client-b', 'hidden']
	]));

	writeFile(path.join(positiveDir, 'ValidatorsAndDefaults.csv'), csv(tableRows(
		['id', 'requiredUnique', 'nonZeroUnique', 'requiredNonZeroUnique', 'defaultRequired', 'defaultStringRequired', 'enumDefault', 'floatNonZero', 'boolValue'],
		['*', '*', '*', '*', '*', '*', '*', '*', '*'],
		['int<!!>', 'string<!N;!!>', 'int<!0;!!>', 'int<!N;!0;!!>', 'IntDefault5<!N>', 'StringDefaultX<!N>', 'EnumDefaultEquip', 'float<!0>', 'bool'],
		[
			['1', 'alpha', '10', '20', '', '', '', '0.5', 'false'],
			['2', 'beta', '11', '21', '6', 'provided', '1', '1.25', 'true']
		]
	)));

	writeFile(path.join(positiveDir, 'ObjectsArraysDefaults.csv'), csv(tableRows(
		['id', 'position', 'objectArray', 'jsonData'],
		['*', '*', '*', '*'],
		['int<!!>', 'PositionWithDefaults', 'ObjectArrayWithDefaults', 'JsonWithDefaults'],
		[
			['1', '10', '100;200,2', '{"value":"present"}'],
			['2', '20,30,custom', '300;400,4', '{"key":9,"value":"explicit"}']
		]
	)));

	writeFile(path.join(positiveDir, 'RefSource.csv'), csv(tableRows(
		['id', 'name'],
		['*', '*'],
		['int<!!>', 'string<!N>'],
		[
			['100', 'source-a'],
			['200', 'source-b']
		]
	)));

	writeFile(path.join(positiveDir, 'RefUsers.csv'), csv(tableRows(
		['id', 'sourceId', 'refObject'],
		['*', '*', '*'],
		['int<!!>', 'RefSource.id', 'RefObject'],
		[
			['1', '100', '100'],
			['2', '200', '200,5']
		]
	)));
}

function writeNegativeCsvFixtures() {
	const cases = {
		'RequiredEmpty.csv': tableRows(['id', 'requiredName'], ['*', '*'], ['int<!!>', 'string<!N>'], [['1', '']]),
		'NonzeroZero.csv': tableRows(['id', 'count'], ['*', '*'], ['int<!!>', 'int<!0>'], [['1', '0']]),
		'UniqueDuplicate.csv': tableRows(['id', 'code'], ['*', '*'], ['int<!!>', 'string<!!>'], [['1', 'same'], ['2', 'same']]),
		'UniqueDefaultDuplicate.csv': tableRows(['id', 'value'], ['*', '*'], ['int<!!>', 'IntDefault5<!!>'], [['1', ''], ['2', '']]),
		'CombinedRequiredUniqueEmpty.csv': tableRows(['id', 'code'], ['*', '*'], ['int<!!>', 'string<!N;!!>'], [['1', '']]),
		'CombinedRequiredUniqueDuplicate.csv': tableRows(['id', 'code'], ['*', '*'], ['int<!!>', 'string<!N;!!>'], [['1', 'dup'], ['2', 'dup']]),
		'InvalidEnum.csv': tableRows(['id', 'kind'], ['*', '*'], ['int<!!>', 'TestEnum'], [['1', '999']]),
		'InvalidGroup.csv': [
			['#', 'bad group'],
			['', 'id', 'name'],
			['$', '*', 'Z'],
			['*', 'int<!!>', 'string'],
			['', '1', 'bad-group']
		],
		'FixedArrayLength.csv': tableRows(['id', 'pair'], ['*', '*'], ['int<!!>', 'int[2]'], [['1', '1,2,3']]),
		'ObjectRequiredField.csv': tableRows(['id', 'position'], ['*', '*'], ['int<!!>', 'PositionWithRequiredName'], [['1', '100']]),
		'ObjectDefaultNonzero.csv': tableRows(['id', 'payload'], ['*', '*'], ['int<!!>', 'ObjectDefaultZeroNonZero'], [['1', '']]),
		'JsonInvalidSyntax.csv': tableRows(['id', 'jsonData'], ['*', '*'], ['int<!!>', 'JsonWithDefaults'], [['1', '{"value":']]),
		'JsonRequiredField.csv': tableRows(['id', 'jsonData'], ['*', '*'], ['int<!!>', 'JsonWithDefaults'], [['1', '{"key":2}']]),
		'ArrayElementZero.csv': tableRows(['id', 'values'], ['*', '*'], ['int<!!>', 'IntArrayNonZero'], [['1', '1,0,2']]),
		'CombinedUniqueRequiredEmpty.csv': tableRows(['id', 'code'], ['*', '*'], ['int<!!>', 'string<!!;!N>'], [['1', '']]),
		'WhitespaceRequired.csv': tableRows(['id', 'code'], ['*', '*'], ['int<!!>', 'string<!N>'], [['1', '   ']]),
		'NumericStringUnique.csv': tableRows(['id', 'code'], ['*', '*'], ['int<!!>', 'int<!!>'], [['1', '1'], ['2', 1]]),
		'EnumNameLike.csv': tableRows(['id', 'kind'], ['*', '*'], ['int<!!>', 'TestEnum'], [['1', 'Item']]),
		'InvalidReference.csv': tableRows(['id', 'sourceId'], ['*', '*'], ['int<!!>', 'RefSource.id'], [['1', '999']])
	};
	for (const [fileName, rows] of Object.entries(cases)) {
		writeFile(path.join(negativeDir, fileName), csv(rows));
	}
}

function addSheet(workbook, sheetName, rows, merges) {
	const sheet = xlsx.utils.aoa_to_sheet(rows);
	if (merges) {
		sheet['!merges'] = merges;
	}
	xlsx.utils.book_append_sheet(workbook, sheet, sheetName);
}

function writeXlsxFixtures() {
	const merged = xlsx.utils.book_new();
	addSheet(merged, 'XlsxMergedArrays', [
		['#', 'xlsx merged arrays'],
		['', 'id', 'dateValue', 'mergedValues', 'mergedValuesTail'],
		['$', '*', '*', '*', '*'],
		['*', 'int<!!>', 'date', 'int[]', 'int[]'],
		['', 1, new Date(Date.UTC(2026, 6, 3, 12, 30, 0)), '1,2', ''],
		['', 2, new Date(Date.UTC(2026, 6, 4, 12, 30, 0)), '3,4', '']
	], [
		{ s: { r: 1, c: 3 }, e: { r: 1, c: 4 } }
	]);
	xlsx.writeFile(merged, path.join(positiveDir, 'XlsxMergedArrays.xlsx'), { cellDates: true });

	const comments = xlsx.utils.book_new();
	addSheet(comments, 'XlsxCommentsAndIgnore', [
		['#', 'comment text', '', ''],
		['', 'id', 'name', '#ignored'],
		['$', '*', '*', '*'],
		['*', 'int<!!>', 'string<!N>', 'string'],
		['#', 'skip row', '', ''],
		['', 1, 'visible', 'hidden']
	]);
	addSheet(comments, '!IgnoredSheet', [
		['#', 'ignored'],
		['', 'id'],
		['*', 'int'],
		['', 999]
	]);
	xlsx.writeFile(comments, path.join(positiveDir, 'XlsxCommentsAndIgnore.xlsx'));
}

function writeConfigs() {
	const positiveCases = [
		['positive-basic-types', './test/fixtures/positive/BasicTypes.csv', 'positive-typeDef.js'],
		['positive-arrays', './test/fixtures/positive/Arrays.csv', 'positive-typeDef.js'],
		['positive-groups-client', './test/fixtures/positive/Groups.csv', 'positive-typeDef.js', ['C', '*']],
		['positive-validators-defaults', './test/fixtures/positive/ValidatorsAndDefaults.csv', 'positive-typeDef.js'],
		['positive-objects-arrays-defaults', './test/fixtures/positive/ObjectsArraysDefaults.csv', 'positive-typeDef.js'],
		['positive-xlsx-merged-arrays', './test/fixtures/positive/XlsxMergedArrays.xlsx', 'positive-typeDef.js'],
		['positive-xlsx-comments-ignore', './test/fixtures/positive/XlsxCommentsAndIgnore.xlsx', 'positive-typeDef.js']
	];
	for (const [caseName, includePath, typeDefName, groups] of positiveCases) {
		writeCaseConfig(caseName, includePath, typeDefName, groups || ['*']);
	}

	writeCaseConfig('positive-references', [
		'./test/fixtures/positive/RefSource.csv',
		'./test/fixtures/positive/RefUsers.csv'
	], 'reference-typeDef.js');

	const negativeFiles = fs.readdirSync(negativeDir).filter(name => name.endsWith('.csv'));
	for (const fileName of negativeFiles) {
		const caseName = `negative-${path.basename(fileName, '.csv').replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()}`;
		const typeDefName = fileName === 'InvalidReference.csv' ? 'reference-typeDef.js' : 'positive-typeDef.js';
		const includePath = fileName === 'InvalidReference.csv'
			? ['./test/fixtures/positive/RefSource.csv', `./test/fixtures/negative/${fileName}`]
			: `./test/fixtures/negative/${fileName}`;
		writeCaseConfig(caseName, includePath, typeDefName);
	}
}

for (const dir of [positiveDir, negativeDir, configDir, typeDefDir]) {
	ensureDir(dir);
}

writeTypeDefs();
writePositiveCsvFixtures();
writeNegativeCsvFixtures();
writeXlsxFixtures();
writeConfigs();

console.log('[generate-fixtures] Fixtures generated.');
