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

function resetDir(dir) {
	fs.rmSync(dir, { recursive: true, force: true });
	ensureDir(dir);
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
	const commentRow = ['#', comment].concat(new Array(header.length - 1).fill(''));
	return [
		commentRow,
		[''].concat(header),
		['$'].concat(groups),
		['*'].concat(types),
	].concat(dataRows.map(row => [''].concat(row)));
}

function config(caseName, includePath, typeDefName = 'positive-typeDef.js', groupFilter = ['*'], extra = {}) {
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
		'see: http://momentjs.com/docs/#/parsing/string-format/': null,
		DateFmt: 'YYYY/MM/DD HH:mm:ss',
		cm21: 'relative to ${cwd} or absolute path',
		TypeCheckerJSFilePath: `./test/fixtures/typeDefs/${typeDefName}`,
		TinyDateFmt: 'YYYY/MM/DD',
		TimeStampUseMS: true,
		cm22: 'custom defined data, can be null',
		LineBreak: '\n',
		FractionDigitsFMT: 6,
		EnableDebugOutput: false,
		ArraySpliter: [',', ';', '\n'],
		...extra
	};
}

function writeCaseConfig(caseName, includePath, typeDefName = 'positive-typeDef.js', groupFilter = ['*'], extra = {}) {
	writeJson(path.join(configDir, `${caseName}.json`), config(caseName, includePath, typeDefName, groupFilter, extra));
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
	typeDefs.ItemData = def.TObject({
		Id: int,
		Count: int,
		Level: int.DVAL(0)
	});
	typeDefs.TailDefaultObject = def.TObject({
		v1: int,
		v2: string.DVAL('x'),
		v3: int.DVAL(0)
	});
	typeDefs.RequiredPair = def.TObject({
		v1: int,
		v2: int
	});
	typeDefs.IntTailDefault = def.TObject({
		v1: int,
		v2: int.DVAL(0)
	});
	typeDefs.IntArrayNonZero = def.TArray(nonZeroInt);
	typeDefs.JsonWithDefaults = def.TJson({
		key: int.DVAL(1),
		value: requiredString
	});
	typeDefs.Vector2Fixed = def.TArray(float, 2);
	typeDefs.AllDefaultPair = def.TObject({
		a: int.DVAL(3),
		b: string.DVAL('z')
	});
	typeDefs.CheckedInts = def.TArray(int, undefined, (data) => {
		if (data.indexOf(0) >= 0) throw new Error('array has zero');
	});
	typeDefs.CheckedJson = def.TJson({
		n: int
	}, (data) => {
		if (data.n < 0) throw new Error('json n is negative');
	});
	typeDefs.NameEcho = def.TCustom(int, () => {
		if (def.GetSheetName() !== 'Edges' || def.GetColumnName() !== 'named') {
			throw new Error('name mismatch');
		}
		return true;
	});
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

	writeFile(path.join(typeDefDir, 'coverage-typeDef.js'), `"use strict";
require = global.require;
const { def } = require("def");
global.__require_tmp_file_path__ = __dirname;

function initialize(Sheets, typeDefs) {
	const int = typeDefs.int;
	const acceptNonNegative = (data) => {
		if (data < 0) throw new Error('custom value must be >= 0');
		return true;
	};
	typeDefs.RejectEven = def.TCustom(int, (data) => {
		if (data % 2 === 0) throw new Error('custom rejected even');
		return true;
	});
	typeDefs.CustomWrapDval = def.TCustom(int.DVAL(5), acceptNonNegative);
	typeDefs.WrapPair = def.TObject({
		v1: int,
		v2: typeDefs.CustomWrapDval
	});
	typeDefs.TinyEnum = def.TEnum({
		None: 0,
		Read: 1
	});
	typeDefs.CustomFlag = def.TCustom(typeDefs.TinyEnum, (data) => {
		if (data === 0) throw new Error('custom flag rejected zero');
		return true;
	});
	typeDefs.OddList = def.TArray(typeDefs.RejectEven);
	typeDefs.PairSum = def.TObject({
		a: int,
		b: int
	}, (data) => {
		if (data.a + data.b > 10) throw new Error('pair sum too large');
	});
	typeDefs.LookupMissing = def.TCustom(int, () => {
		def.getRowDataByColumnName('missingCol');
		return true;
	});
}

function onExportAllDone() {}

exports.initialize = initialize;
exports.onExportAllDone = onExportAllDone;
`);

	writeInitTypeDef('init-dval-object-typeDef.js', '	def.TObject({ a: typeDefs.int }).DVAL(1);');
	writeInitTypeDef('init-enum-no-zero-typeDef.js', '	def.TEnum({ Only: 1 });');
	writeInitTypeDef('init-dval-null-typeDef.js', '	typeDefs.int.DVAL(undefined);');
	writeInitTypeDef('init-dval-type-typeDef.js', "	typeDefs.int.DVAL('x');");
	writeInitTypeDef('init-array-bad-typeDef.js', '	def.TArray({});');
	writeInitTypeDef('init-object-array-typeDef.js', '	def.TObject({ a: def.TArray(typeDefs.int) });');
	writeInitTypeDef('init-vector-count-typeDef.js', "	def.TArray(typeDefs.int, 'nope');");
	writeInitTypeDef('init-json-bad-typeDef.js', '	def.TJson({ a: {} });');
	writeFile(path.join(typeDefDir, 'init-require-missing-typeDef.js'), `"use strict";
require = global.require;
const { def } = require("def");
global.__require_tmp_file_path__ = __dirname;
require("./does-not-exist.js");

function initialize() {}
function onExportAllDone() {}
exports.initialize = initialize;
exports.onExportAllDone = onExportAllDone;
`);
}

function writeInitTypeDef(fileName, body) {
	writeFile(path.join(typeDefDir, fileName), `"use strict";
require = global.require;
const { def } = require("def");
global.__require_tmp_file_path__ = __dirname;

function initialize(Sheets, typeDefs) {
${body}
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

	writeFile(path.join(positiveDir, 'Characterization.csv'), csv(tableRows(
		['id', 'whitespaceRequired', 'enumNameValue'],
		['*', '*', '*'],
		['int<!!>', 'string<!N>', 'TestEnum'],
		[
			['1', '   ', 'Item']
		],
		'current behavior characterization'
	)));

	writeFile(path.join(positiveDir, 'TailDefaultObjects.csv'), csv(tableRows(
		['id', 'value'],
		['*', '*'],
		['int<!!>', 'TailDefaultObject'],
		[
			['1', '1,'],
			['2', '1,,5'],
			['3', '1,kept,4'],
			['4', '1, ,']
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

	const edgeHeaders = ['id', 'allDefault', 'checkedInts', 'checkedJson', 'one', 'shortMin', 'shortMax', 'plain', 'matrixTail', 'named'];
	writeFile(path.join(positiveDir, 'Edges.csv'), csv([
		['#', 'defaults checkers bounds go and names'].concat(new Array(edgeHeaders.length - 1).fill('')),
		[''].concat(edgeHeaders),
		['//', 'skipped group comment'].concat(new Array(edgeHeaders.length - 1).fill('')),
		['$'].concat(edgeHeaders.map(() => '*')),
		['*'].concat([
			'int<!!>', 'AllDefaultPair', 'CheckedInts', 'CheckedJson', 'int[1]',
			'short', 'short', 'int<>', 'int[][]', 'NameEcho'
		]),
		[''].concat([1, '8,y', '1,2', '{"n":2}', 7, -32768, 32767, 4, '1,2;', 1]),
		[''].concat([2, '', '3', '{}', 8, -1, 1, 5, '9;', 2])
	]));
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
			['#', 'bad group', ''],
			['', 'id', 'name'],
			['$', '*', 'Z'],
			['*', 'int<!!>', 'string'],
			['', '1', 'bad-group']
		],
		'FixedArrayLength.csv': tableRows(['id', 'pair'], ['*', '*'], ['int<!!>', 'int[2]'], [['1', '1,2,3']]),
		'ObjectRequiredField.csv': tableRows(['id', 'position'], ['*', '*'], ['int<!!>', 'PositionWithRequiredName'], [['1', '100']]),
		'ObjectDefaultNonzero.csv': tableRows(['id', 'payload'], ['*', '*'], ['int<!!>', 'ObjectDefaultZeroNonZero'], [['1', '0']]),
		'JsonInvalidSyntax.csv': tableRows(['id', 'jsonData'], ['*', '*'], ['int<!!>', 'JsonWithDefaults'], [['1', '{"value":']]),
		'JsonRequiredField.csv': tableRows(['id', 'jsonData'], ['*', '*'], ['int<!!>', 'JsonWithDefaults'], [['1', '{"key":2,"value":""}']]),
		'ArrayElementZero.csv': tableRows(['id', 'values'], ['*', '*'], ['int<!!>', 'IntArrayNonZero'], [['1', '1,0,2']]),
		'CombinedUniqueRequiredEmpty.csv': tableRows(['id', 'code'], ['*', '*'], ['int<!!>', 'string<!!;!N>'], [['1', '']]),
		'NumericStringUnique.csv': tableRows(['id', 'code'], ['*', '*'], ['int<!!>', 'int<!!>'], [['1', '1'], ['2', 1]]),
		'InvalidReference.csv': tableRows(['id', 'sourceId'], ['*', '*'], ['int<!!>', 'RefSource.id'], [['1', '999']]),
		'RequiredPairTrailingEmpty.csv': tableRows(['id', 'pair'], ['*', '*'], ['int<!!>', 'RequiredPair'], [['1', '1,']]),
		'DvalWhitespaceNotDefault.csv': tableRows(['id', 'value'], ['*', '*'], ['int<!!>', 'IntTailDefault'], [['1', '1, ']]),
		'ItemDataBlank.csv': tableRows(['id', 'cost'], ['*', '*'], ['int<!!>', 'ItemData[]<!N>'], [['1', '']]),
		'CharOutOfRange.csv': tableRows(['id', 'wide'], ['*', '*'], ['int<!!>', 'char'], [['1', '129']]),
		'BadSheetRef.csv': tableRows(['id', 'refId'], ['*', '*'], ['int<!!>', 'A.B.C'], [['1', '1']]),
		'UnknownSheet.csv': tableRows(['id', 'refId'], ['*', '*'], ['int<!!>', 'MissingSheet.id'], [['1', '1']]),
		'CustomCheckFail.csv': tableRows(['id', 'value'], ['*', '*'], ['int<!!>', 'RejectEven'], [['1', '2']]),
		'CustomWrapRequiredEmpty.csv': tableRows(['id', 'value'], ['*', '*'], ['int<!!>', 'CustomWrapDval<!N>'], [['1', '']]),
		'CustomWrapTrailingEmpty.csv': tableRows(['id', 'pair'], ['*', '*'], ['int<!!>', 'WrapPair'], [['1', '1,']]),
		'UnknownType.csv': tableRows(['id', 'value'], ['*', '*'], ['int<!!>', 'NoSuchType'], [['1', '1']]),
		'BadArrayBracket.csv': tableRows(['id', 'value'], ['*', '*'], ['int<!!>', 'int['], [['1', '1']]),
		'BadArrayCount.csv': tableRows(['id', 'value'], ['*', '*'], ['int<!!>', 'int[x]'], [['1', '1']]),
		'BadTail.csv': tableRows(['id', 'value'], ['*', '*'], ['int<!!>', 'int<!Q>'], [['1', '1']]),
		'UnclosedTail.csv': tableRows(['id', 'value'], ['*', '*'], ['int<!!>', 'int<!!'], [['1', '1']]),
		'LeadingBracket.csv': tableRows(['id', 'value'], ['*', '*'], ['int<!!>', '[int]'], [['1', '1']]),
		'FixedArrayTooShort.csv': tableRows(['id', 'pair'], ['*', '*'], ['int<!!>', 'int[2]'], [['1', '1']]),
		'UniqueEmptyDuplicate.csv': tableRows(['id', 'value'], ['*', '*'], ['int<!!>', 'int<!!>'], [['1', ''], ['2', '']]),
		'UcharOutOfRange.csv': tableRows(['id', 'value'], ['*', '*'], ['int<!!>', 'uchar'], [['1', '256']]),
		'UshortOutOfRange.csv': tableRows(['id', 'value'], ['*', '*'], ['int<!!>', 'ushort'], [['1', '32769']]),
		'UintNegative.csv': tableRows(['id', 'value'], ['*', '*'], ['int<!!>', 'uint'], [['1', '-1']]),
		'Uint64Negative.csv': tableRows(['id', 'value'], ['*', '*'], ['int<!!>', 'uint64'], [['1', '-1']]),
		'Int64NotNumber.csv': tableRows(['id', 'value'], ['*', '*'], ['int<!!>', 'int64'], [['1', 'abc']]),
		'InvalidDate.csv': tableRows(['id', 'value'], ['*', '*'], ['int<!!>', 'date'], [['1', 'not-a-date']]),
		'EnumArrayBad.csv': tableRows(['id', 'kinds'], ['*', '*'], ['int<!!>', 'TestEnum[]'], [['1', '1,999']]),
		'CustomEnumZero.csv': tableRows(['id', 'kind'], ['*', '*'], ['int<!!>', 'CustomFlag'], [['1', '0']]),
		'CustomListEven.csv': tableRows(['id', 'values'], ['*', '*'], ['int<!!>', 'OddList'], [['1', '1,2']]),
		'CustomPairSum.csv': tableRows(['id', 'pair'], ['*', '*'], ['int<!!>', 'PairSum'], [['1', '6,6']]),
		'CustomLookupMissing.csv': tableRows(['id', 'value'], ['*', '*'], ['int<!!>', 'LookupMissing'], [['1', '1']]),
		'CustomSource.csv': tableRows(['id', 'code'], ['*', '*'], ['int<!!>', 'RejectEven'], [['1', '1']]),
		'RefCustomColumn.csv': tableRows(['id', 'refCode'], ['*', '*'], ['int<!!>', 'CustomSource.code'], [['1', '1']]),
		'InitDvalObject.csv': tableRows(['id'], ['*'], ['int'], [['1']]),
		'InitEnumNoZero.csv': tableRows(['id'], ['*'], ['int'], [['1']]),
		'UnclosedArray.csv': tableRows(['id', 'value'], ['*', '*'], ['int<!!>', 'int[2'], [['1', '1']]),
		'ArrayCountTail.csv': tableRows(['id', 'value'], ['*', '*'], ['int<!!>', 'int[2x]'], [['1', '1']]),
		'ArrayTailJunk.csv': tableRows(['id', 'value'], ['*', '*'], ['int<!!>', 'int[]x'], [['1', '1']]),
		'TailNoOpen.csv': tableRows(['id', 'value'], ['*', '*'], ['int<!!>', 'int>'], [['1', '1']]),
		'VectorCountZero.csv': tableRows(['id', 'value'], ['*', '*'], ['int<!!>', 'int[0]'], [['1', '1']]),
		'FourDimArray.csv': tableRows(['id', 'value'], ['*', '*'], ['int<!!>', 'int[][][][]'], [['1', '1']]),
		'UniqueArrayEmpty.csv': tableRows(['id', 'value'], ['*', '*'], ['int<!!>', 'int[]<!!>'], [['1', '']]),
		'JsonNotObject.csv': tableRows(['id', 'jsonData'], ['*', '*'], ['int<!!>', 'JsonWithDefaults'], [['1', '1']]),
		'ShortOutOfRange.csv': tableRows(['id', 'value'], ['*', '*'], ['int<!!>', 'short'], [['1', '32768']]),
		'FloatNotNumber.csv': tableRows(['id', 'value'], ['*', '*'], ['int<!!>', 'float'], [['1', 'abc']]),
		'DoubleNotNumber.csv': tableRows(['id', 'value'], ['*', '*'], ['int<!!>', 'double'], [['1', 'abc']]),
		'ArrayHasZero.csv': tableRows(['id', 'values'], ['*', '*'], ['int<!!>', 'CheckedInts'], [['1', '1,0']]),
		'JsonNegative.csv': tableRows(['id', 'jsonData'], ['*', '*'], ['int<!!>', 'CheckedJson'], [['1', '{"n":-1}']]),
		'HeaderBad.csv': [
			['#', 'bad header', ''],
			['', 'id', 'bad-name'],
			['$', '*', '*'],
			['*', 'int<!!>', 'int'],
			['', '1', '1']
		],
		'TypeRowMissing.csv': [
			['#', 'type marker is not star', ''],
			['', 'id', 'value'],
			['$', '*', '*'],
			['x', 'int<!!>', 'int'],
			['', '1', '1']
		],
		'InitDvalNull.csv': tableRows(['id'], ['*'], ['int'], [['1']]),
		'InitDvalType.csv': tableRows(['id'], ['*'], ['int'], [['1']]),
		'InitArrayBad.csv': tableRows(['id'], ['*'], ['int'], [['1']]),
		'InitObjectArray.csv': tableRows(['id'], ['*'], ['int'], [['1']]),
		'InitVectorCount.csv': tableRows(['id'], ['*'], ['int'], [['1']]),
		'InitJsonBad.csv': tableRows(['id'], ['*'], ['int'], [['1']]),
		'InitRequireMissing.csv': tableRows(['id'], ['*'], ['int'], [['1']])
	};
	for (const [fileName, rows] of Object.entries(cases)) {
		writeFile(path.join(negativeDir, fileName), csv(rows));
	}

	const dateNumber = xlsx.utils.book_new();
	addSheet(dateNumber, 'DateNumber', [
		['#', 'numeric cell is not a date string'],
		['', 'id', 'value'],
		['$', '*', '*'],
		['*', 'int<!!>', 'date'],
		['', 1, 123]
	]);
	xlsx.writeFile(dateNumber, path.join(negativeDir, 'DateNumber.xlsx'));

	const dupSource = xlsx.utils.book_new();
	addSheet(dupSource, 'DupSheet', [
		['#', 'first copy of DupSheet'],
		['', 'id', 'name'],
		['$', '*', '*'],
		['*', 'int<!!>', 'string'],
		['', 1, 'left']
	]);
	xlsx.writeFile(dupSource, path.join(negativeDir, 'DupSource.xlsx'));

	const dupHeader = xlsx.utils.book_new();
	addSheet(dupHeader, 'DupSheet', [
		['#', 'same sheet name with a shorter header'],
		['', 'id'],
		['$', '*'],
		['*', 'int<!!>'],
		['', 2]
	]);
	xlsx.writeFile(dupHeader, path.join(negativeDir, 'DupHeader.xlsx'));
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

	const itemData = xlsx.utils.book_new();
	addSheet(itemData, 'EquipLevelUpCostConfig', [
		['#', 'merged ItemData array omits trailing Level'],
		['', 'Id', 'Cost', '', ''],
		['$', '*', '*', '', ''],
		['*', 'int<!!>', 'ItemData[]<!N>', '', ''],
		['', 1, '82000005;18350/82000006;400/82000002;36700', '', ''],
		['', 2, '82000005;18240/82000002;36480', '', ''],
		['', 3, '82000005;30;2', '', '']
	], [
		{ s: { r: 1, c: 2 }, e: { r: 1, c: 4 } },
		{ s: { r: 2, c: 2 }, e: { r: 2, c: 4 } },
		{ s: { r: 3, c: 2 }, e: { r: 3, c: 4 } }
	]);
	xlsx.writeFile(itemData, path.join(positiveDir, 'ItemDataMergedOmittedLevel.xlsx'));

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

function writeTypeMatrixWorkbook() {
	const book = xlsx.utils.book_new();
	addSheet(book, 'RefTarget', [
		['#', 'ids referenced by TypeMatrix'],
		['', 'id'],
		['$', '*'],
		['*', 'int<!!>'],
		['', 1],
		['', 2]
	]);
	const headers = [
		'id', 'ucharValue', 'ushortValue', 'uintValue', 'int64Value', 'uint64Value',
		'translated', 'flags', 'enumList', 'structPos', 'wrapDval', 'thenDval',
		'thenRequired', 'thenTail', 'refId', 'refList', 'customRef'
	];
	addSheet(book, 'TypeMatrix', [
		['#', 'type coverage'].concat(new Array(headers.length - 1).fill('')),
		[''].concat(headers),
		['$'].concat(headers.map(() => '*')),
		['*'].concat([
			'int<!!>', 'uchar', 'ushort', 'uint', 'int64', 'uint64',
			'TranslatedInt', 'EItemFlags', 'EItemFlags[]', 'PointStruct',
			'CustomWrapDval', 'CustomThenDval', 'CustomThenDval<!N>', 'ThenTail',
			'RefTarget.id', 'RefTarget.id[]', 'CustomRefId'
		]),
		[''].concat([1, 255, 32768, 4294967295, 3000000000, 42, 3, 3, '1,2', '10,20', 6, 6, 6, '8,4', 1, '1,2', 1]),
		[''].concat([2, '', '', '', '', '', '', 'Read', '2', '4,', '', '', '', '9,', 2, '2', 2])
	]);
	const comboHeaders = ['id', 'enumDefault', 'customEnum', 'translatedText', 'jsonCombo', 'customList', 'checkedPair', 'selfId'];
	addSheet(book, 'Combo', [
		['#', 'enum json translate custom array and same-sheet reference'].concat(new Array(comboHeaders.length - 1).fill('')),
		[''].concat(comboHeaders),
		['$'].concat(comboHeaders.map(() => '*')),
		['*'].concat([
			'int<!!>', 'FlagsDefaultWrite', 'CustomFlag', 'TranslatedText', 'ComboJson',
			'OddList', 'CheckedPair', 'Combo.id'
		]),
		[''].concat([1, 1, 1, 'ab', '{"value":"ok","kind":1}', '1,3', '2,3', 1]),
		[''].concat([2, '', '', '', '{}', '5', '1,1', 2])
	]);
	xlsx.writeFile(book, path.join(rootDir, 'testcase', 'TypeMatrix.xlsx'));
}

function writeConfigs() {
	const positiveCases = [
		['positive-basic-types', './test/fixtures/positive/BasicTypes.csv', 'positive-typeDef.js'],
		['positive-arrays', './test/fixtures/positive/Arrays.csv', 'positive-typeDef.js'],
		['positive-groups-client', './test/fixtures/positive/Groups.csv', 'positive-typeDef.js', ['C', '*']],
		['positive-validators-defaults', './test/fixtures/positive/ValidatorsAndDefaults.csv', 'positive-typeDef.js'],
		['positive-objects-arrays-defaults', './test/fixtures/positive/ObjectsArraysDefaults.csv', 'positive-typeDef.js'],
		['positive-characterization', './test/fixtures/positive/Characterization.csv', 'positive-typeDef.js'],
		['positive-xlsx-merged-arrays', './test/fixtures/positive/XlsxMergedArrays.xlsx', 'positive-typeDef.js'],
		['positive-itemdata-merged-omitted-level', './test/fixtures/positive/ItemDataMergedOmittedLevel.xlsx', 'positive-typeDef.js'],
		['positive-tail-default-objects', './test/fixtures/positive/TailDefaultObjects.csv', 'positive-typeDef.js'],
		['positive-xlsx-comments-ignore', './test/fixtures/positive/XlsxCommentsAndIgnore.xlsx', 'positive-typeDef.js']
	];
	for (const [caseName, includePath, typeDefName, groups] of positiveCases) {
		const extra = caseName === 'positive-itemdata-merged-omitted-level'
			? { ArraySpliter: [';', '/', '#'] }
			: {};
		writeCaseConfig(caseName, includePath, typeDefName, groups || ['*'], extra);
	}

	writeCaseConfig('positive-references', [
		'./test/fixtures/positive/RefSource.csv',
		'./test/fixtures/positive/RefUsers.csv'
	], 'reference-typeDef.js');

	const edgeCase = 'positive-scalar-edges';
	writeJson(path.join(configDir, `${edgeCase}.json`), config(
		edgeCase,
		'./test/fixtures/positive/Edges.csv',
		'positive-typeDef.js',
		['*'],
		{
			Export: [
				{
					type: 'json',
					OutputDir: `${tmpDir}/${edgeCase}/`,
					GroupFilter: ['*'],
					UseDefaultValueIfEmpty: true
				},
				{
					type: 'go',
					OutputDir: `${tmpDir}/${edgeCase}/`,
					GroupFilter: ['*'],
					UseDefaultValueIfEmpty: false
				}
			]
		}
	));

	writeJson(path.join(configDir, 'negative-missing-file.json'), config(
		'negative-missing-file',
		'./test/fixtures/positive/NoSuchFile.csv'
	));
	writeJson(path.join(configDir, 'negative-bad-export.json'), config(
		'negative-bad-export',
		'./test/fixtures/positive/BasicTypes.csv',
		'positive-typeDef.js',
		['*'],
		{
			Export: [{
				type: 'nope',
				OutputDir: `${tmpDir}/negative-bad-export/`,
				GroupFilter: ['*'],
				UseDefaultValueIfEmpty: true
			}]
		}
	));

	const negativeFiles = fs.readdirSync(negativeDir).filter(isNegativeCaseFile);
	for (const fileName of negativeFiles) {
		const baseName = fileName.replace(/\.(csv|xlsx)$/i, '');
		const caseName = `negative-${baseName.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()}`;
		const typeDefName = negativeTypeDefName(fileName);
		const includePath = negativeIncludePath(fileName);
		writeCaseConfig(caseName, includePath, typeDefName);
	}
}

function isNegativeCaseFile(name) {
	if (name === 'CustomSource.csv' || name === 'DupSource.xlsx') return false;
	return name.endsWith('.csv') || name.endsWith('.xlsx');
}

function negativeTypeDefName(fileName) {
	if (fileName === 'InvalidReference.csv') return 'reference-typeDef.js';
	if (fileName.startsWith('Init')) {
		const kebab = fileName.replace(/\.(csv|xlsx)$/, '').replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
		return `${kebab}-typeDef.js`;
	}
	if (fileName.startsWith('Custom') || fileName === 'RefCustomColumn.csv') return 'coverage-typeDef.js';
	return 'positive-typeDef.js';
}

function negativeIncludePath(fileName) {
	if (fileName === 'InvalidReference.csv') {
		return ['./test/fixtures/positive/RefSource.csv', `./test/fixtures/negative/${fileName}`];
	}
	if (fileName === 'RefCustomColumn.csv') {
		return ['./test/fixtures/negative/CustomSource.csv', `./test/fixtures/negative/${fileName}`];
	}
	if (fileName === 'DupHeader.xlsx') {
		return ['./test/fixtures/negative/DupSource.xlsx', `./test/fixtures/negative/${fileName}`];
	}
	return `./test/fixtures/negative/${fileName}`;
}

for (const dir of [positiveDir, negativeDir, configDir, typeDefDir]) {
	resetDir(dir);
}

writeTypeDefs();
writePositiveCsvFixtures();
writeNegativeCsvFixtures();
writeXlsxFixtures();
writeTypeMatrixWorkbook();
writeConfigs();

console.log('[generate-fixtures] Fixtures generated.');
