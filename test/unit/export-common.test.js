const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { rootDir, tmpPath } = require('../helpers/paths');

function runExportCommonProbe(source, expectedStatus = 0) {
	const result = spawnSync(process.execPath, ['-e', source], {
		cwd: rootDir,
		encoding: 'utf8',
		shell: false,
	});
	assert.equal(result.status, expectedStatus, result.stderr || result.stdout);
	if (expectedStatus !== 0) {
		return { output: `${result.stdout}\n${result.stderr}` };
	}
	const jsonLine = result.stdout.trim().split(/\r?\n/).find(line => line.startsWith('{'));
	return JSON.parse(jsonLine);
}

test('buildRowObject translates names, applies configured defaults, and collects ids', () => {
	const source = `
		const { buildRowObject } = require('./dist/export/export_common.js');
		const utils = require('./dist/utils.js');
		const root = {};
		const wrapper = { TranslateColName(name) { return name === 'Id' ? '_id' : name; } };
		const header = [
			{ name: 'Id', cIdx: 1, isComment: false, parser: { DefaultValue: 10 } },
			{ name: 'Name', cIdx: 2, isComment: false, parser: { DefaultValue: 'fallback' } },
			{ name: 'Comment', cIdx: 3, isComment: true, parser: { DefaultValue: 'hidden' } }
		];
		const row = { type: utils.ESheetRowType.data, values: ['', 1001, null, 'secret'] };
		const written = buildRowObject(wrapper, header, row, root, { UseDefaultValueIfEmpty: true });
		console.log(JSON.stringify({ written, root }));
	`;
	const result = runExportCommonProbe(source);
	assert.equal(result.written, true);
	assert.deepEqual(result.root._ids, [1001]);
	assert.deepEqual(result.root['1001'], { _id: 1001, Name: 'fallback' });
});

test('assertExportTemplate accepts required placeholders', () => {
	const source = `
		const { assertExportTemplate } = require('./dist/export/export_common.js');
		const ok = assertExportTemplate('export const {name} = {data}', true);
		console.log(JSON.stringify({ ok }));
	`;
	const result = runExportCommonProbe(source);
	assert.equal(result.ok, 'export const {name} = {data}');
});

test('assertExportTemplate rejects missing placeholders', () => {
	const missingName = runExportCommonProbe(`
		const { assertExportTemplate } = require('./dist/export/export_common.js');
		assertExportTemplate('{data}', true);
	`, 255);
	assert.match(missingName.output, /\{name\}/);

	const missingData = runExportCommonProbe(`
		const { assertExportTemplate } = require('./dist/export/export_common.js');
		assertExportTemplate('{name}', false);
	`, 255);
	assert.match(missingData.output, /\{data\}/);
});

test('writeExportFile writes utf8 content', () => {
	const outFile = path.join(tmpPath('unit-export-common'), 'out.txt');
	fs.rmSync(path.dirname(outFile), { recursive: true, force: true });
	fs.mkdirSync(path.dirname(outFile), { recursive: true });
	const source = `
		const { writeExportFile } = require('./dist/export/export_common.js');
		writeExportFile(${JSON.stringify(outFile)}, 'hello').then(() => {
			console.log(JSON.stringify({ ok: true }));
		}).catch(error => {
			console.error(error);
			process.exit(1);
		});
	`;
	const result = runExportCommonProbe(source);
	assert.equal(result.ok, true);
	assert.equal(fs.readFileSync(outFile, 'utf8'), 'hello');
});
