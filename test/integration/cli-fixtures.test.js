const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { fixturePath, rootDir, tmpPath } = require('../helpers/paths');
const { cleanCase, runCli, assertSuccess, assertFailure, readJson, jsonOutput } = require('../helpers/cli');

function runArgs(args) {
	return spawnSync(process.execPath, ['dist/index.js'].concat(args), {
		cwd: rootDir,
		encoding: 'utf8',
		shell: false,
	});
}

function config(name) {
	return fixturePath('configs', `${name}.json`);
}

function typeDef(name) {
	return fixturePath('typeDefs', name);
}

test('positive basic types fixture exports parsed scalar values and defaults', () => {
	const caseName = 'positive-basic-types';
	cleanCase(caseName);
	const result = runCli(config(caseName), typeDef('positive-typeDef.js'));
	assertSuccess(result);
	const data = readJson(jsonOutput(caseName, 'BasicTypes'));
	assert.deepEqual(data._ids, [1, 2]);
	assert.equal(data['1'].intValue, -12);
	assert.equal(data['1'].uintValue, 12);
	assert.equal(data['1'].floatValue, 1.25);
	assert.equal(data['1'].doubleValue, 2.5);
	assert.equal(data['1'].stringValue, 'plain text');
	assert.equal(data['1'].boolValue, true);
	assert.equal(data['1'].enumValue, 1);
	assert.equal(data['2'].intValue, 0);
	assert.equal(data['2'].stringValue, '');
});

test('positive arrays fixture exports nested arrays and fixed arrays', () => {
	const caseName = 'positive-arrays';
	cleanCase(caseName);
	const result = runCli(config(caseName), typeDef('positive-typeDef.js'));
	assertSuccess(result);
	const data = readJson(jsonOutput(caseName, 'Arrays'));
	assert.deepEqual(data['1'].ints, [1, 2, 3]);
	assert.deepEqual(data['1'].matrix, [[1, 2], [3, 4]]);
	assert.deepEqual(data['1'].cube, [[[1, 2], [3, 4]], [[5, 6], [7, 8]]]);
	assert.deepEqual(data['1'].fixedPair, [9, 10]);
	assert.deepEqual(data['1'].vector, [1.5, 2.5]);
	assert.deepEqual(data['1'].nonZeroInts, [3, 4, 5]);
	assert.equal(Object.prototype.hasOwnProperty.call(data['2'], 'ints'), false);
});

test('positive group fixture exports filtered columns and skips comments', () => {
	const caseName = 'positive-groups-client';
	cleanCase(caseName);
	const result = runCli(config(caseName), typeDef('positive-typeDef.js'));
	assertSuccess(result);
	const data = readJson(jsonOutput(caseName, 'Groups'));
	assert.deepEqual(data._ids, [1, 2]);
	assert.equal(data['1'].clientOnly, 'client-a');
	assert.equal(Object.prototype.hasOwnProperty.call(data['1'], 'serverOnly'), false);
	assert.equal(Object.prototype.hasOwnProperty.call(data['1'], '#CommentColumn'), false);
});

test('positive validator and default fixture covers DVAL and validator pass cases', () => {
	const caseName = 'positive-validators-defaults';
	cleanCase(caseName);
	const result = runCli(config(caseName), typeDef('positive-typeDef.js'));
	assertSuccess(result);
	const data = readJson(jsonOutput(caseName, 'ValidatorsAndDefaults'));
	assert.equal(data['1'].requiredUnique, 'alpha');
	assert.equal(data['1'].nonZeroUnique, 10);
	assert.equal(data['1'].requiredNonZeroUnique, 20);
	assert.equal(data['1'].defaultRequired, 5);
	assert.equal(data['1'].defaultStringRequired, 'x');
	assert.equal(data['1'].enumDefault, 2);
	assert.equal(data['1'].floatNonZero, 0.5);
	assert.equal(data['1'].boolValue, false);
	assert.equal(data['2'].floatNonZero, 1.25);
	assert.equal(data['2'].boolValue, true);
});

test('positive object, array object, and json fixture applies nested defaults', () => {
	const caseName = 'positive-objects-arrays-defaults';
	cleanCase(caseName);
	const result = runCli(config(caseName), typeDef('positive-typeDef.js'));
	assertSuccess(result);
	const data = readJson(jsonOutput(caseName, 'ObjectsArraysDefaults'));
	assert.deepEqual(data['1'].position, { x: 10, y: 7, label: 'origin' });
	assert.deepEqual(data['1'].objectArray, [{ id: 100, count: 1 }, { id: 200, count: 2 }]);
	assert.deepEqual(data['1'].jsonData, { key: 1, value: 'present' });
	assert.deepEqual(data['2'].position, { x: 20, y: 30, label: 'custom' });
	assert.deepEqual(data['2'].jsonData, { key: 9, value: 'explicit' });
});

test('positive reference fixture validates Sheet.Column references and object references', () => {
	const caseName = 'positive-references';
	cleanCase(caseName);
	const result = runCli(config(caseName), typeDef('reference-typeDef.js'));
	assertSuccess(result);
	const data = readJson(jsonOutput(caseName, 'RefUsers'));
	assert.equal(data['1'].sourceId, 100);
	assert.deepEqual(data['1'].refObject, { itemId: 100, count: 1 });
	assert.deepEqual(data['2'].refObject, { itemId: 200, count: 5 });
});

test('positive characterization fixture locks accepted whitespace and enum names', () => {
	const caseName = 'positive-characterization';
	cleanCase(caseName);
	const result = runCli(config(caseName), typeDef('positive-typeDef.js'));
	assertSuccess(result);
	const data = readJson(jsonOutput(caseName, 'Characterization'));
	assert.equal(data['1'].whitespaceRequired, '   ');
	assert.equal(data['1'].enumNameValue, 1);
});

test('positive xlsx merged arrays fixture exports xlsx values', () => {
	const caseName = 'positive-xlsx-merged-arrays';
	cleanCase(caseName);
	const result = runCli(config(caseName), typeDef('positive-typeDef.js'));
	assertSuccess(result);
	const data = readJson(jsonOutput(caseName, 'XlsxMergedArrays'));
	assert.deepEqual(data._ids, [1, 2]);
	assert.deepEqual(data['1'].mergedValues, [1, 2]);
	assert.match(String(data['1'].dateValue), /2026|178/);
});

test('merged ItemData array fills an omitted Level from DVAL', () => {
	const caseName = 'positive-itemdata-merged-omitted-level';
	cleanCase(caseName);
	const result = runCli(config(caseName), typeDef('positive-typeDef.js'));
	assertSuccess(result);
	const data = readJson(jsonOutput(caseName, 'EquipLevelUpCostConfig'));
	assert.deepEqual(data['1'].Cost, [
		{ Id: 82000005, Count: 18350, Level: 0 },
		{ Id: 82000006, Count: 400, Level: 0 },
		{ Id: 82000002, Count: 36700, Level: 0 }
	]);
	assert.deepEqual(data['2'].Cost, [
		{ Id: 82000005, Count: 18240, Level: 0 },
		{ Id: 82000002, Count: 36480, Level: 0 }
	]);
	assert.deepEqual(data['3'].Cost, [
		{ Id: 82000005, Count: 30, Level: 2 }
	]);
});

test('trailing empty object fields use DVAL and holes stay parsed', () => {
	const caseName = 'positive-tail-default-objects';
	cleanCase(caseName);
	const result = runCli(config(caseName), typeDef('positive-typeDef.js'));
	assertSuccess(result);
	const data = readJson(jsonOutput(caseName, 'TailDefaultObjects'));
	assert.deepEqual(data['1'].value, { v1: 1, v2: 'x', v3: 0 });
	assert.deepEqual(data['2'].value, { v1: 1, v2: '', v3: 5 });
	assert.deepEqual(data['3'].value, { v1: 1, v2: 'kept', v3: 4 });
	assert.deepEqual(data['4'].value, { v1: 1, v2: ' ', v3: 0 });
});

test('positive scalar edges export defaults, checkers, bounds, and go files', () => {
	const caseName = 'positive-scalar-edges';
	cleanCase(caseName);
	const result = runCli(config(caseName), typeDef('positive-typeDef.js'));
	assertSuccess(result);
	const data = readJson(jsonOutput(caseName, 'Edges'));
	assert.deepEqual(data['1'].allDefault, { a: 8, b: 'y' });
	assert.deepEqual(data['2'].allDefault, { a: 3, b: 'z' });
	assert.deepEqual(data['1'].checkedInts, [1, 2]);
	assert.deepEqual(data['2'].checkedInts, [3]);
	assert.deepEqual(data['1'].checkedJson, { n: 2 });
	assert.deepEqual(data['2'].checkedJson, { n: 0 });
	assert.deepEqual(data['1'].one, [7]);
	assert.deepEqual(data['2'].one, [8]);
	assert.equal(data['1'].shortMin, -32768);
	assert.equal(data['1'].shortMax, 32767);
	assert.equal(data['1'].plain, 4);
	assert.deepEqual(data['1'].matrixTail, [[1, 2]]);
	assert.deepEqual(data['2'].matrixTail, [[9]]);
	assert.equal(data['1'].named, 1);
	assert.equal(data['2'].named, 2);
	const goDir = tmpPath(caseName);
	assert.match(fs.readFileSync(path.join(goDir, 'initialize.go'), 'utf8'), /Edges = newEdges\(\)/);
	assert.match(fs.readFileSync(path.join(goDir, 'Edges.go'), 'utf8'), /type edges struct/);
	assert.match(fs.readFileSync(path.join(goDir, 'loadConfig.go'), 'utf8'), /_Edges := newEdges\(\)/);
});

test('debug output flag runs a successful export', () => {
	const caseName = 'positive-scalar-edges';
	cleanCase(caseName);
	const result = runArgs(['--debug-output', '1', '-c', config(caseName), '-t', typeDef('positive-typeDef.js')]);
	assertSuccess(result);
});

test('positive xlsx comments fixture skips ignored sheets and comments', () => {
	const caseName = 'positive-xlsx-comments-ignore';
	cleanCase(caseName);
	const result = runCli(config(caseName), typeDef('positive-typeDef.js'));
	assertSuccess(result);
	const data = readJson(jsonOutput(caseName, 'XlsxCommentsAndIgnore'));
	assert.deepEqual(data._ids, [1]);
	assert.equal(data['1'].name, 'visible');
	assert.equal(Object.prototype.hasOwnProperty.call(data['1'], '#ignored'), false);
});

const negativeCases = [
	['negative-array-element-zero', /Zero|can not be Zero/i],
	['negative-combined-required-unique-duplicate', /duplicate|unique/i],
	['negative-combined-required-unique-empty', /empty|can not be empty/i],
	['negative-combined-unique-required-empty', /empty|can not be empty/i],
	['negative-fixed-array-length', /array length incorrect|expect/i],
	['negative-invalid-enum', /enum|incorrect|999/i],
	['negative-invalid-group', /Group Filter|Invalid|Z/i],
	['negative-invalid-reference', /not found|reference|CALL|checkColumnContainsValue/i],
	['negative-json-invalid-syntax', /json|invalid/i],
	['negative-json-required-field', /empty|value can not be empty/i],
	['negative-nonzero-zero', /Zero|can not be Zero/i],
	['negative-numeric-string-unique', /duplicate|unique/i],
	['negative-object-default-nonzero', /Zero|can not be Zero/i],
	['negative-object-required-field', /empty|object type parse failure|element count/i],
	['negative-required-empty', /empty|value can not be empty/i],
	['negative-required-pair-trailing-empty', /not a number/i],
	['negative-dval-whitespace-not-default', /not a number/i],
	['negative-item-data-blank', /value can not be empty/i],
	['negative-unique-default-duplicate', /duplicate|unique/i],
	['negative-unique-duplicate', /duplicate|unique/i],
	['negative-char-out-of-range', /between \[-127, 128\]/],
	['negative-bad-sheet-ref', /Sheet Index Type Format Error/],
	['negative-unknown-sheet', /not found/],
	['negative-custom-check-fail', /custom rejected even/],
	['negative-custom-wrap-required-empty', /can not be empty/],
	['negative-custom-wrap-trailing-empty', /not a number/],
	['negative-unknown-type', /not found/],
	['negative-bad-array-bracket', /not found/],
	['negative-bad-array-count', /format error/],
	['negative-bad-tail', /invalid tail checker/],
	['negative-unclosed-tail', /No '>' symbol/],
	['negative-leading-bracket', /incorrect type/],
	['negative-fixed-array-too-short', /array length incorrect/],
	['negative-unique-empty-duplicate', /duplicate|unique/],
	['negative-uchar-out-of-range', /\[0, 255\]/],
	['negative-ushort-out-of-range', /\[0, 32768\]/],
	['negative-uint-negative', /\[0, 4294967295\]/],
	['negative-uint64-negative', /is not a number/],
	['negative-int64-not-number', /is not a number/],
	['negative-invalid-date', /Date Type/],
	['negative-enum-array-bad', /enum type incorrect/],
	['negative-custom-enum-zero', /custom flag rejected zero/],
	['negative-custom-list-even', /custom rejected even/],
	['negative-custom-pair-sum', /pair sum too large/],
	['negative-custom-lookup-missing', /missingCol not found/],
	['negative-ref-custom-column', /must be a base type/],
	['negative-init-dval-object', /Only <enum> and <base>/],
	['negative-init-enum-no-zero', /default value of 0/],
	['negative-unclosed-array', /']' not found/],
	['negative-array-count-tail', /']' not found/],
	['negative-array-tail-junk', /type should be follow/],
	['negative-tail-no-open', /No '<' symbol/],
	['negative-vector-count-zero', /greater than 1/],
	['negative-four-dim-array', /more dimensions/],
	['negative-unique-array-empty', /unique value can not be empty/],
	['negative-json-not-object', /type is not a object/],
	['negative-short-out-of-range', /\[-32768, 32767\]/],
	['negative-float-not-number', /is not a number/],
	['negative-double-not-number', /is not a number/],
	['negative-array-has-zero', /array has zero/],
	['negative-json-negative', /json n is negative/],
	['negative-header-bad', /Header Name/],
	['negative-type-row-missing', /Type Row not found/],
	['negative-date-number', /TypeParseer/],
	['negative-dup-header', /different header/],
	['negative-init-dval-null', /can not be null or undefined/],
	['negative-init-dval-type', /default value type incorrect/],
	['negative-init-array-bad', /Array Only support/],
	['negative-init-object-array', /Object Only support/],
	['negative-init-vector-count', /not a int value/],
	['negative-init-json-bad', /TJson subtype invalid/],
	['negative-init-require-missing', /could not found js file/]
];

function negativeTypeDef(caseName) {
	if (caseName === 'negative-invalid-reference') return 'reference-typeDef.js';
	if (caseName.startsWith('negative-init-')) return `${caseName.slice('negative-'.length)}-typeDef.js`;
	if (caseName.startsWith('negative-custom-') || caseName === 'negative-ref-custom-column') return 'coverage-typeDef.js';
	return 'positive-typeDef.js';
}

for (const [caseName, expectedError] of negativeCases) {
	test(`${caseName} fails with stable validation output`, () => {
		cleanCase(caseName);
		const typeDefName = negativeTypeDef(caseName);
		const result = runCli(config(caseName), typeDef(typeDefName));
		assertFailure(result, expectedError);
	});
}

test('missing config argument prints help', () => {
	assertFailure(runArgs([]), /parameter is missing/);
});

test('help flag prints the option list', () => {
	const result = runArgs(['-h']);
	assert.match(`${result.stdout}\n${result.stderr}`, /-c : config file path/);
});

test('config flag without a path prints help', () => {
	assertFailure(runArgs(['-c']), /no config file path/);
});

test('debug output rejects a value other than 0 or 1', () => {
	assertFailure(runArgs(['--debug-output', '2', '-c', config('positive-basic-types'), '-t', typeDef('positive-typeDef.js')]), /must be \[1\] or \[0\]/);
});

test('debug output requires a value', () => {
	assertFailure(runArgs(['--debug-output']), /must set a value/);
});

test('missing include file fails', () => {
	cleanCase('negative-missing-file');
	assertFailure(runCli(config('negative-missing-file'), typeDef('positive-typeDef.js')), /not found/);
});

test('unknown export type fails while loading exporters', () => {
	cleanCase('negative-bad-export');
	assertFailure(runCli(config('negative-bad-export'), typeDef('positive-typeDef.js')), /Export constructor not found/);
});
