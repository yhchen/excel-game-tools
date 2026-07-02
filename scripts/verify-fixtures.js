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

phase('Build project');
run(npmCommand, ['run', 'build']);

phase('Run fixture CLI');
run(process.execPath, ['dist/index.js', '-c', 'src/config_tpl.json', '-t', 'testcase/typeDef.js']);

phase('Check generated outputs');
verifyRequiredOutputs();
parseJson('testcase/exports/global.json');
parseJson('testcase/exports/json/TypeHighChecker.json');
expectFileIncludes('testcase/exports/global_proto2.proto', 'syntax = "proto2"');
expectFileIncludes('testcase/exports/global_proto3.proto', 'syntax = "proto3"');

console.log('\n[verify-fixtures] All checks passed.');
