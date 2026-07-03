const path = require('node:path');

const rootDir = path.resolve(__dirname, '..', '..');
const fixtureDir = path.join(rootDir, 'test', 'fixtures');
const tmpDir = path.join(rootDir, 'test', 'tmp');

function fixturePath(...parts) {
	return path.join(fixtureDir, ...parts);
}

function tmpPath(...parts) {
	return path.join(tmpDir, ...parts);
}

module.exports = {
	rootDir,
	fixtureDir,
	tmpDir,
	fixturePath,
	tmpPath,
};
