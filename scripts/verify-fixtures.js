#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const rootDir = path.resolve(__dirname, '..');
const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';

const requiredOutputs = [
	'testcase/exports/global.json',
	'testcase/exports/global.js',
	'testcase/exports/global.lua',
	'testcase/exports/global.cs',
	'testcase/exports/global_proto2.proto',
	'testcase/exports/global_proto3.proto',
	'testcase/exports/json/TypeHighChecker.json',
	'testcase/exports/js/Example1.js',
	'testcase/exports/lua/Example1.lua',
	'testcase/exports/proto2-data/Example1Category.bytes',
	'testcase/exports/proto3-data/Example1.bytes',
	'testcase/exports/protobuf-net/Example1.cs',
];

function phase(name) {
	console.log(`\n== ${name} ==`);
}

function fail(message) {
	console.error(`\n[verify-fixtures] ${message}`);
	process.exit(1);
}

function run(command, args) {
	console.log(`$ ${[command].concat(args).join(' ')}`);
	const result = spawnSync(command, args, {
		cwd: rootDir,
		stdio: 'inherit',
		shell: false,
	});

	if (result.error) {
		fail(`Failed to start command "${command}": ${result.error.message}`);
	}
	if (result.status !== 0) {
		fail(`Command failed with exit code ${result.status}: ${[command].concat(args).join(' ')}`);
	}
}

function absolute(relativePath) {
	return path.join(rootDir, relativePath);
}

function verifyRequiredOutputs() {
	const failures = [];
	for (const relativePath of requiredOutputs) {
		const filePath = absolute(relativePath);
		if (!fs.existsSync(filePath)) {
			failures.push(`${relativePath} is missing`);
			continue;
		}

		const stat = fs.statSync(filePath);
		if (!stat.isFile()) {
			failures.push(`${relativePath} is not a file`);
		} else if (stat.size === 0) {
			failures.push(`${relativePath} is empty`);
		}
	}

	if (failures.length > 0) {
		fail(`Generated output check failed:\n${failures.map(item => `- ${item}`).join('\n')}`);
	}
}

function parseJson(relativePath) {
	try {
		JSON.parse(fs.readFileSync(absolute(relativePath), 'utf8'));
	} catch (error) {
		fail(`Invalid JSON in ${relativePath}: ${error.message}`);
	}
}

function expectFileIncludes(relativePath, expectedText) {
	const content = fs.readFileSync(absolute(relativePath), 'utf8');
	if (!content.includes(expectedText)) {
		fail(`${relativePath} does not contain ${JSON.stringify(expectedText)}`);
	}
}

function expectEqual(actual, expected, label) {
	const actualText = JSON.stringify(actual);
	const expectedText = JSON.stringify(expected);
	if (actualText !== expectedText) {
		fail(`${label}: expected ${expectedText} but got ${actualText}`);
	}
}

function expectTypeMatrix() {
	const globalJson = JSON.parse(fs.readFileSync(absolute('testcase/exports/global.json'), 'utf8'));
	const sheet = globalJson.TypeMatrix;
	if (!sheet) {
		fail('global.json is missing TypeMatrix');
	}
	const filled = sheet['1'];
	const defaults = sheet['2'];
	if (!filled || !defaults) {
		fail('TypeMatrix rows 1 and 2 are missing');
	}
	expectEqual(filled.ucharValue, 255, 'TypeMatrix 1.ucharValue');
	expectEqual(filled.ushortValue, 32768, 'TypeMatrix 1.ushortValue');
	expectEqual(filled.uintValue, 4294967295, 'TypeMatrix 1.uintValue');
	expectEqual(filled.int64Value, 3000000000, 'TypeMatrix 1.int64Value');
	expectEqual(filled.uint64Value, 42, 'TypeMatrix 1.uint64Value');
	expectEqual(filled.translated, 30, 'TypeMatrix 1.translated');
	expectEqual(filled.flags, 3, 'TypeMatrix 1.flags');
	expectEqual(filled.enumList, [1, 2], 'TypeMatrix 1.enumList');
	expectEqual(filled.structPos, { x: 10, y: 20 }, 'TypeMatrix 1.structPos');
	expectEqual(filled.wrapDval, 6, 'TypeMatrix 1.wrapDval');
	expectEqual(filled.thenDval, 6, 'TypeMatrix 1.thenDval');
	expectEqual(filled.thenRequired, 6, 'TypeMatrix 1.thenRequired');
	expectEqual(filled.thenTail, { v1: 8, v2: 4 }, 'TypeMatrix 1.thenTail');
	expectEqual(filled.refId, 1, 'TypeMatrix 1.refId');
	expectEqual(filled.refList, [1, 2], 'TypeMatrix 1.refList');
	expectEqual(filled.customRef, 1, 'TypeMatrix 1.customRef');
	expectEqual(defaults.ucharValue, 0, 'TypeMatrix 2.ucharValue');
	expectEqual(defaults.ushortValue, 0, 'TypeMatrix 2.ushortValue');
	expectEqual(defaults.uintValue, 0, 'TypeMatrix 2.uintValue');
	expectEqual(defaults.int64Value, 0, 'TypeMatrix 2.int64Value');
	expectEqual(defaults.uint64Value, 0, 'TypeMatrix 2.uint64Value');
	expectEqual(defaults.translated, 0, 'TypeMatrix 2.translated');
	expectEqual(defaults.flags, 1, 'TypeMatrix 2.flags');
	expectEqual(defaults.enumList, [2], 'TypeMatrix 2.enumList');
	expectEqual(defaults.structPos, { x: 4, y: 7 }, 'TypeMatrix 2.structPos');
	expectEqual(defaults.wrapDval, 5, 'TypeMatrix 2.wrapDval');
	expectEqual(defaults.thenDval, 5, 'TypeMatrix 2.thenDval');
	expectEqual(defaults.thenRequired, 5, 'TypeMatrix 2.thenRequired');
	expectEqual(defaults.thenTail, { v1: 9, v2: 5 }, 'TypeMatrix 2.thenTail');
	expectEqual(defaults.refId, 2, 'TypeMatrix 2.refId');
	expectEqual(defaults.refList, [2], 'TypeMatrix 2.refList');
	expectEqual(defaults.customRef, 2, 'TypeMatrix 2.customRef');
	expectFileIncludes('testcase/exports/protobuf-net/PointStruct.cs', 'public partial struct PointStruct');
	expectFileIncludes('testcase/exports/protobuf-net/EItemFlags.cs', '[ProtoContract, Flags]');
	const combo = globalJson.Combo;
	if (!combo || !combo['1'] || !combo['2']) {
		fail('global.json is missing Combo rows 1 and 2');
	}
	expectEqual(combo['1'].enumDefault, 1, 'Combo 1.enumDefault');
	expectEqual(combo['1'].customEnum, 1, 'Combo 1.customEnum');
	expectEqual(combo['1'].translatedText, 'AB', 'Combo 1.translatedText');
	expectEqual(combo['1'].jsonCombo, { key: 1, value: 'ok', kind: 1 }, 'Combo 1.jsonCombo');
	expectEqual(combo['1'].customList, [1, 3], 'Combo 1.customList');
	expectEqual(combo['1'].checkedPair, { a: 2, b: 3 }, 'Combo 1.checkedPair');
	expectEqual(combo['1'].selfId, 1, 'Combo 1.selfId');
	expectEqual(combo['2'].enumDefault, 2, 'Combo 2.enumDefault');
	expectEqual(combo['2'].customEnum, 0, 'Combo 2.customEnum');
	expectEqual(combo['2'].translatedText, '', 'Combo 2.translatedText');
	expectEqual(combo['2'].jsonCombo, { key: 1, value: 'x', kind: 0 }, 'Combo 2.jsonCombo');
	expectEqual(combo['2'].customList, [5], 'Combo 2.customList');
	expectEqual(combo['2'].checkedPair, { a: 1, b: 1 }, 'Combo 2.checkedPair');
	expectEqual(combo['2'].selfId, 2, 'Combo 2.selfId');
	expectMix(globalJson);
}

function expectMix(globalJson) {
	const mix = globalJson.Mix;
	if (!mix || !mix['1'] || !mix['2']) {
		fail('global.json is missing Mix rows 1 and 2');
	}
	const row1 = mix['1'];
	const row2 = mix['2'];
	expectEqual(mix._ids, [1, 2], 'Mix._ids');
	expectEqual(row1.wrapTranslate, 30, 'Mix 1.wrapTranslate');
	expectEqual(row1.thenTranslate, 30, 'Mix 1.thenTranslate');
	expectEqual(row1.thenTranslateRequired, 40, 'Mix 1.thenTranslateRequired');
	expectEqual(row1.customOfTranslate, 30, 'Mix 1.customOfTranslate');
	expectEqual(row1.translateOfCustom, 30, 'Mix 1.translateOfCustom');
	expectEqual(row1.allRequired, { a: 8, b: 'y' }, 'Mix 1.allRequired');
	expectEqual(row1.jsonMix, { nums: [1, 2], tag: 5 }, 'Mix 1.jsonMix');
	expectEqual(row1.parity, 1, 'Mix 1.parity');
	expectEqual(row1.doubled, 30, 'Mix 1.doubled');
	expectEqual(row2.wrapTranslate, 5, 'Mix 2.wrapTranslate');
	expectEqual(row2.thenTranslate, 5, 'Mix 2.thenTranslate');
	expectEqual(row2.thenTranslateRequired, 5, 'Mix 2.thenTranslateRequired');
	expectEqual(row2.customOfTranslate, 20, 'Mix 2.customOfTranslate');
	expectEqual(row2.translateOfCustom, 0, 'Mix 2.translateOfCustom');
	expectEqual(row2.allRequired, { a: 3, b: 'z' }, 'Mix 2.allRequired');
	expectEqual(row2.jsonMix, { tag: 5 }, 'Mix 2.jsonMix');
	expectEqual(Object.prototype.hasOwnProperty.call(row2.jsonMix, 'nums'), false, 'Mix 2.jsonMix.nums');
	expectEqual(row2.parity, 0, 'Mix 2.parity');
	expectEqual(row2.doubled, 40, 'Mix 2.doubled');
}

function expectMerge(globalJson) {
	const itemTable = globalJson.ItemTable;
	if (!itemTable) {
		fail('global.json is missing ItemTable');
	}
	expectEqual(itemTable._ids, [5, 6, 7, 8, 1, 2, 3, 4], 'ItemTable._ids');
	for (let n = 1; n <= 8; n++) {
		expectEqual(itemTable[String(n)].Id, n, `ItemTable ${n}.Id`);
		expectEqual(itemTable[String(n)].Name, `name${n}`, `ItemTable ${n}.Name`);
	}
	const mergeRows = globalJson.MergeRows;
	if (!mergeRows || !mergeRows['1'] || !mergeRows['2']) {
		fail('global.json is missing MergeRows');
	}
	expectEqual(mergeRows._ids, [2, 1], 'MergeRows._ids');
	expectEqual(mergeRows['2'], { id: 2, name: 'beta', buddy: 1 }, 'MergeRows 2');
	expectEqual(mergeRows['1'], { id: 1, name: 'alpha', buddy: 1 }, 'MergeRows 1');
}

phase('Build project');
run(npmCommand, ['run', 'build']);

phase('Run fixture CLI');
run(process.execPath, ['dist/index.js', '-c', 'src/config_tpl.json', '-t', 'testcase/typeDef.js']);

phase('Check generated outputs');
verifyRequiredOutputs();
parseJson('testcase/exports/global.json');
expectTypeMatrix();
expectMerge(JSON.parse(fs.readFileSync(absolute('testcase/exports/global.json'), 'utf8')));
parseJson('testcase/exports/json/TypeHighChecker.json');
expectFileIncludes('testcase/exports/global_proto2.proto', 'syntax = "proto2"');
expectFileIncludes('testcase/exports/global_proto3.proto', 'syntax = "proto3"');

console.log('\n[verify-fixtures] All checks passed.');
