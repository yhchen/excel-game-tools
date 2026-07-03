const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { rootDir, tmpPath } = require('./paths');

function cleanCase(caseName) {
	const dir = tmpPath(caseName);
	fs.rmSync(dir, { recursive: true, force: true });
	fs.mkdirSync(dir, { recursive: true });
	return dir;
}

function runCli(configPath, typeDefPath) {
	return spawnSync(process.execPath, ['dist/index.js', '-c', configPath, '-t', typeDefPath], {
		cwd: rootDir,
		encoding: 'utf8',
		shell: false,
	});
}

function assertSuccess(result) {
	assert.equal(result.status, 0, `expected success\nstdout:\n${result.stdout}\nstderr:\n${result.stderr}`);
}

function assertFailure(result, expectedText) {
	assert.notEqual(result.status, 0, `expected failure\nstdout:\n${result.stdout}\nstderr:\n${result.stderr}`);
	const output = `${result.stdout}\n${result.stderr}`;
	assert.match(output, expectedText);
}

function readJson(filePath) {
	assert.equal(fs.existsSync(filePath), true, `${filePath} should exist`);
	return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function jsonOutput(caseName, sheetName) {
	return path.join(tmpPath(caseName), `${sheetName}.json`);
}

module.exports = {
	cleanCase,
	runCli,
	assertSuccess,
	assertFailure,
	readJson,
	jsonOutput,
};
