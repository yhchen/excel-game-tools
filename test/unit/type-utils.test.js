const test = require('node:test');
const assert = require('node:assert/strict');
const { FindNum, FindWord } = require('../../dist/TypeUtils.js');

test('FindNum returns the first contiguous number scope after whitespace', () => {
	assert.deepEqual(FindNum('  123abc'), { start: 2, end: 4, len: 3 });
	assert.deepEqual(FindNum('\t42]'), { start: 1, end: 2, len: 2 });
});

test('FindNum rejects signs, decimals, and non-number starts', () => {
	assert.equal(FindNum('-1'), undefined);
	assert.deepEqual(FindNum('1.5'), { start: 0, end: 0, len: 1 });
	assert.equal(FindNum('abc123'), undefined);
});

test('FindWord returns identifiers made from letters, numbers, and underscores', () => {
	assert.deepEqual(FindWord('  Item_01[]'), { start: 2, end: 8, len: 7 });
	assert.deepEqual(FindWord('abc.def'), { start: 0, end: 2, len: 3 });
});

test('FindWord rejects non-word starts', () => {
	assert.equal(FindWord('-abc'), undefined);
	assert.equal(FindWord('  .abc'), undefined);
});
