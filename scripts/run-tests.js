#!/usr/bin/env node

const { spawnSync } = require('node:child_process');

function run(command, args) {
	const display = [command].concat(args).join(' ');
	console.log(`\n== ${display} ==`);
	const result = spawnSync(command, args, {
		cwd: process.cwd(),
		stdio: 'inherit',
		shell: false,
	});
	if (result.error) {
		console.error(`[run-tests] Failed to start ${display}: ${result.error.message}`);
		process.exit(1);
	}
	if (result.status !== 0) {
		console.error(`[run-tests] Failed with exit code ${result.status}: ${display}`);
		process.exit(result.status || 1);
	}
}

const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';

run(npmCommand, ['run', 'build']);
run(process.execPath, ['--test', 'test/unit/*.test.js']);
run(process.execPath, ['--test', 'test/integration/*.test.js']);
run(process.execPath, ['scripts/verify-fixtures.js']);

console.log('\n[run-tests] All checks passed.');
