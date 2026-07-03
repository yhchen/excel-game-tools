"use strict";
require = global.require;
const { def } = require("def");
global.__require_tmp_file_path__ = __dirname;

function initialize(Sheets, typeDefs) {
	const int = typeDefs.int;
	const string = typeDefs.string;
	const float = typeDefs.float;

	const requiredString = typeDefs.RequiredString = def.TCustom(string, data => {
		if (data === '') throw new Error('value can not be empty');
		return true;
	});
	const nonZeroInt = typeDefs.NonZeroInt = def.TCustom(int, data => {
		if (data === 0) throw new Error('value can not be Zero (0)');
		return true;
	});
	const nonZeroDefaultZero = typeDefs.NonZeroDefaultZero = def.TCustom(int.DVAL(0), data => {
		if (data === 0) throw new Error('value can not be Zero (0)');
		return true;
	});

	typeDefs.TestEnum = def.TEnum({
		Invalid: 0,
		Item: 1,
		Equip: 2
	});
	typeDefs.EnumDefaultEquip = typeDefs.TestEnum.DVAL(2);
	typeDefs.IntDefault5 = int.DVAL(5);
	typeDefs.StringDefaultX = string.DVAL('x');

	typeDefs.PositionWithDefaults = def.TObject({
		x: int,
		y: int.DVAL(7),
		label: string.DVAL('origin')
	});
	typeDefs.PositionWithRequiredName = def.TObject({
		id: int,
		name: requiredString
	});
	typeDefs.ObjectDefaultZeroNonZero = def.TObject({
		count: nonZeroDefaultZero
	});
	typeDefs.ObjectArrayWithDefaults = def.TArray(def.TObject({
		id: int,
		count: int.DVAL(1)
	}));
	typeDefs.IntArrayNonZero = def.TArray(nonZeroInt);
	typeDefs.JsonWithDefaults = def.TJson({
		key: int.DVAL(1),
		value: requiredString
	});
	typeDefs.Vector2Fixed = def.TArray(float, 2);
}

function onExportAllDone() {}

exports.initialize = initialize;
exports.onExportAllDone = onExportAllDone;
