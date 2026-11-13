"use strict";
require = global.require;
const { def } = require("def");
global.__require_tmp_file_path__ = __dirname;

function initialize(Sheets, typeDefs) {
	const int = typeDefs.int;
	const acceptNonNegative = (data) => {
		if (data < 0) throw new Error('custom value must be >= 0');
		return true;
	};
	typeDefs.RejectEven = def.TCustom(int, (data) => {
		if (data % 2 === 0) throw new Error('custom rejected even');
		return true;
	});
	typeDefs.CustomWrapDval = def.TCustom(int.DVAL(5), acceptNonNegative);
	typeDefs.WrapPair = def.TObject({
		v1: int,
		v2: typeDefs.CustomWrapDval
	});
	typeDefs.TinyEnum = def.TEnum({
		None: 0,
		Read: 1
	});
	typeDefs.CustomFlag = def.TCustom(typeDefs.TinyEnum, (data) => {
		if (data === 0) throw new Error('custom flag rejected zero');
		return true;
	});
	typeDefs.OddList = def.TArray(typeDefs.RejectEven);
	typeDefs.PairSum = def.TObject({
		a: int,
		b: int
	}, (data) => {
		if (data.a + data.b > 10) throw new Error('pair sum too large');
	});
	typeDefs.LookupMissing = def.TCustom(int, () => {
		def.getRowDataByColumnName('missingCol');
		return true;
	});
}

function onExportAllDone() {}

exports.initialize = initialize;
exports.onExportAllDone = onExportAllDone;
