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
	typeDefs.WrapTranslate = def.TTranslate(int.DVAL(5), (data) => data * 10);
	typeDefs.ThenTranslate = def.TTranslate(int, (data) => data * 10).DVAL(5);
	typeDefs.CustomOfTranslate = def.TCustom(def.TTranslate(int, (data) => data * 10), (data) => {
		if (data < 20) throw new Error('translated below 20');
	});
	typeDefs.TranslateOfCustom = def.TTranslate(def.TCustom(int, (data) => {
		if (data < 0) throw new Error('raw below zero');
	}), (data) => data * 10);
	typeDefs.AllDefaultPair = def.TObject({
		a: int.DVAL(3),
		b: typeDefs.string.DVAL('z')
	});
	typeDefs.JsonMix = def.TJson({
		nums: def.TArray(int),
		tag: def.TCustom(int.DVAL(5), (data) => {
			if (data < 0) throw new Error('json tag is negative');
		})
	});
	typeDefs.ParityUnique = def.TTranslate(int, (data) => data % 2);
	typeDefs.DoubledNonZero = def.TTranslate(int, (data) => data * 10);
	typeDefs.PartialStruct = def.TStruct({ x: int, y: int.DVAL(7) });
	typeDefs.ZeroTranslate = def.TTranslate(int, () => 0);
}

function onExportAllDone() {}

exports.initialize = initialize;
exports.onExportAllDone = onExportAllDone;
