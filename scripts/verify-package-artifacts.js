#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const rootDir = path.resolve(__dirname, '..');
const binDir = path.join(rootDir, 'bin');
const supportFiles = new Set([
	'.gitignore',
	'build_and_run.bat',
	'build_and_run.sh',
	'index.d.ts',
]);

function fail(message) {
	console.error(`\n[verify-package-artifacts] ${message}`);
	process.exit(1);
}

function listArtifacts() {
	if (!fs.existsSync(binDir)) {
		fail('bin directory is missing');
	}
	return fs.readdirSync(binDir)
		.filter(name => !supportFiles.has(name))
		.map(name => ({ name, filePath: path.join(binDir, name) }))
		.filter(item => fs.statSync(item.filePath).isFile());
}

function requireSingleArtifact(artifacts, label, predicate) {
	const matches = artifacts.filter(item => predicate(item.name));
	if (matches.length !== 1) {
		fail(`Expected exactly one ${label} artifact, found ${matches.length}: ${artifacts.map(item => item.name).join(', ') || '<none>'}`);
	}
	const stat = fs.statSync(matches[0].filePath);
	if (stat.size === 0) {
		fail(`${matches[0].name} is empty`);
	}
	return matches[0];
}

function runMacosArtifact(artifact) {
	if (process.platform !== 'darwin') {
		console.log(`[verify-package-artifacts] Skipping macOS binary run on ${process.platform}.`);
		return;
	}
	fs.chmodSync(artifact.filePath, 0o755);
	const result = spawnSync(artifact.filePath, ['-c', 'src/config_tpl.json', '-t', 'testcase/typeDef.js'], {
		cwd: rootDir,
		stdio: 'inherit',
	});
	if (result.error) {
		fail(`Failed to start ${artifact.name}: ${result.error.message}`);
	}
	if (result.status !== 0) {
		fail(`${artifact.name} exited with code ${result.status}`);
	}
}

const artifacts = listArtifacts();
const linuxArtifact = requireSingleArtifact(artifacts, 'Linux', name => /linux/i.test(name));
const macosArtifact = requireSingleArtifact(artifacts, 'macOS', name => /(macos|darwin)/i.test(name));
const windowsArtifact = requireSingleArtifact(artifacts, 'Windows', name => /(win|windows)/i.test(name) || /\.exe$/i.test(name));

console.log(`[verify-package-artifacts] Linux artifact: ${linuxArtifact.name}`);
console.log(`[verify-package-artifacts] macOS artifact: ${macosArtifact.name}`);
console.log(`[verify-package-artifacts] Windows artifact: ${windowsArtifact.name}`);

runMacosArtifact(macosArtifact);

console.log('\n[verify-package-artifacts] All checks passed.');
