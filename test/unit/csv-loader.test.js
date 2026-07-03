const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { rootDir, tmpPath } = require('../helpers/paths');

function runCsvProbe(csvContent) {
	const dir = tmpPath('unit-csv-loader');
	fs.rmSync(dir, { recursive: true, force: true });
	fs.mkdirSync(dir, { recursive: true });
	const csvPath = path.join(dir, 'QuotedCase.csv');
	fs.writeFileSync(csvPath, csvContent, 'utf8');

	const script = `
		const { CSVLoader } = require('./dist/loader/csv_loader.js');
		CSVLoader.load(${JSON.stringify(csvPath)}).then(loader => {
			const values = {
				sheetName: loader.sheetName,
				a1: loader.getData(0, 0)?.w,
				b1: loader.getData(1, 0)?.w,
				a2: loader.getData(0, 1)?.w,
				b2: loader.getData(1, 1)?.w,
				c2: loader.getData(2, 1)?.w,
				range: loader.getRange()
			};
			console.log(JSON.stringify(values));
		}).catch(error => {
			console.error(error);
			process.exit(1);
		});
	`;
	const result = spawnSync(process.execPath, ['-e', script], {
		cwd: rootDir,
		encoding: 'utf8',
		shell: false,
	});
	assert.equal(result.status, 0, result.stderr || result.stdout);
	const jsonLine = result.stdout.trim().split(/\r?\n/).find(line => line.startsWith('{'));
	return JSON.parse(jsonLine);
}

test('CSVLoader preserves quoted commas and empty fields', () => {
	const result = runCsvProbe('name,desc,empty\n1,"hello, world",\n');
	assert.equal(result.sheetName, 'QuotedCase');
	assert.equal(result.a1, 'name');
	assert.equal(result.b2, 'hello, world');
	assert.equal(result.c2, '');
});

test('CSVLoader preserves multiline quoted fields', () => {
	const result = runCsvProbe('id,text\n1,"line 1\nline 2"\n');
	assert.equal(result.a2, '1');
	assert.equal(result.b2, 'line 1\nline 2');
});
