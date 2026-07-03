const test = require('node:test');
const assert = require('node:assert/strict');
const { fixturePath } = require('../helpers/paths');
const { cleanCase, runCli, assertSuccess, assertFailure, readJson, jsonOutput } = require('../helpers/cli');

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
	['negative-unique-default-duplicate', /duplicate|unique/i],
	['negative-unique-duplicate', /duplicate|unique/i]
];

for (const [caseName, expectedError] of negativeCases) {
	test(`${caseName} fails with stable validation output`, () => {
		cleanCase(caseName);
		const typeDefName = caseName === 'negative-invalid-reference' ? 'reference-typeDef.js' : 'positive-typeDef.js';
		const result = runCli(config(caseName), typeDef(typeDefName));
		assertFailure(result, expectedError);
	});
}
