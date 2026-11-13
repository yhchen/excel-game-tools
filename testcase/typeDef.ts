////////////////////////////////////////////////////////////////////////////////
// Version: 1.0.1
// common header here. do not edit it!
declare const global: any; declare const require: Function; (<any>require) = global.require; import { def, Internal } from 'def'; declare const __dirname: string; (<any>global).__require_tmp_file_path__ = __dirname;
////////////////////////////////////////////////////////////////////////////////

import { SheetList } from './SheetList';

export function initialize(Sheets: { [key in SheetList]: { [key: string]: ((value: any) => boolean) & def.TypeDef; }; }, typeDefs: { [key: string]: def.TypeDef; }) {
	// internal type
	const char = typeDefs.char;
	const uchar = typeDefs.uchar;
	const short = typeDefs.short;
	const ushort = typeDefs.ushort;
	const int = typeDefs.int;
	const uint = typeDefs.uint;
	const int64 = typeDefs.int64;
	const uint64 = typeDefs.uint64;
	const string = typeDefs.string;
	const double = typeDefs.double;
	const float = typeDefs.float;
	const bool = typeDefs.bool;
	const date = typeDefs.date;
	const tinydate = typeDefs.tinydate;
	const timestamp = typeDefs.timestamp;
	const utctime = typeDefs.utctime;

	// commonly used type
	const vector2 = typeDefs.vector2 = def.TObject({ x: float, y: float });
	const vector3 = typeDefs.vector3 = def.TObject({ x: float, y: float, z: float });

	// a json object with key, value fields.
	const KVJson = typeDefs.KVJson = def.TJson({
		// default value is 1
		key: int.DVAL(1),
		// value
		value: int,
	});

	////////////////////////////////////////////////////////////////////////////////
	// ?????????? initialize sheet table here ??????????

	////////////////////////////////////////////////////////////////////////////////
	// ?????????? enum type add below ??????????
	const EItemType = typeDefs.EItemType = def.TEnum({
		/*
		 * 测试奇葩注释
		 */
		Invalid: 0,
		/* 测试单行注释 */
		Item: 1,
		// 测试单行注释
		Equip: 2,
		/**
		 * player pet
		 */
		Pet: 101,
		/**
		 * pet egg
		 */
		Egg: 102,
		/// <summary>
		/// Guild things
		/// </summary>
		Guild: 103,
		/// <summary>
		/// Guild things
		/// </summary>
		Special: 104,
	});
	const AppType = typeDefs.AppType = def.TEnum({
		ClientH: 0,
		ClientM: 1,
		Gate: 2,
		Logic: 3,
	});
	const ETriggerType = typeDefs.ETriggerType = def.TEnum({
		Invalid: 0,
		Task: 1,
		Award: 2,
		length: 100,
		arguments: 12312321,
		name: 1232132,
	});

	typeDefs.Item3 = def.TArray(Sheets.Item.id, 3);
	typeDefs.EquipId = Sheets.Equip.id;
	typeDefs.Vector3 = def.TArray(float, 3);
	typeDefs.Vector2 = def.TArray(float, 2);
	typeDefs.Test1 = def.TArray(EItemType);
	typeDefs.Position = def.TObject({
		x: int,
		y: int,
		width: int,
		height: int,
		// __inner__count__abcxyz__: int,
	});
	typeDefs.physisLocation = def.TArray(def.TArray(float, 2));
	typeDefs.physisLocation1 = def.TArray(vector3, 3);
	typeDefs.physisLocation2 = def.TArray(typeDefs.Position, 2);
	typeDefs.Award = def.TObject({
		type: EItemType,
		id: int,
		count: int64,
	}, function (data) {
		switch (data.type) {
			case EItemType.Equip:
				return Sheets.Equip.id(data.id);
			case EItemType.Item:
				return Sheets.Item.id(data.id);
		}
	});
	typeDefs.Item = def.TObject({
		id: Sheets.Item.id,
		count: int64,
	});
	typeDefs.testGetDataByColNameCheckCell = def.TCustom(EItemType, (data) => {
		console.log('----------------------------------------------------------------');
		const checkData = def.getRowDataByColumnName('checkCellValue');
		if (checkData + 100 != data) throw new Error(`value: ${data} is not equal to column 'checkCell' data: ${checkData}`);
		return true;
	});

	const acceptNonNegative = (data: number) => {
		if (data < 0) throw new Error('custom value must be >= 0');
		return true;
	};
	typeDefs.CustomWrapDval = def.TCustom(int.DVAL(5), acceptNonNegative);
	typeDefs.CustomThenDval = def.TCustom(int, acceptNonNegative).DVAL(5);
	typeDefs.TranslatedInt = def.TTranslate(int, (data: number) => data * 10);
	typeDefs.EItemFlags = def.TEnum({
		None: 0,
		Read: 1,
		Write: 2,
		ReadWrite: 3,
	}, undefined, true);
	typeDefs.PointStruct = def.TStruct({
		x: int,
		y: int.DVAL(7),
	});
	typeDefs.ThenTail = def.TObject({
		v1: int,
		v2: typeDefs.CustomThenDval,
	});
	const refTargetId = Internal.TryColumnTypeTranslate(Sheets.RefTarget.id);
	refTargetId.__inner__name__abcxyz__ = 'int';
	typeDefs.CustomRefId = def.TCustom(refTargetId, (data: number) => {
		if (data <= 0) throw new Error('custom ref id must be positive');
		return true;
	});
	typeDefs.FlagsDefaultWrite = typeDefs.EItemFlags.DVAL(2);
	typeDefs.CustomFlag = def.TCustom(typeDefs.EItemFlags, (data: number) => {
		if (data === 0) throw new Error('custom flag rejected zero');
		return true;
	});
	typeDefs.TranslatedText = def.TTranslate(string, (data: string) => data.toUpperCase());
	typeDefs.ComboJson = def.TJson({
		key: int.DVAL(1),
		value: string.DVAL('x'),
		kind: typeDefs.EItemFlags,
	});
	typeDefs.OddList = def.TArray(def.TCustom(int, (data: number) => {
		if (data % 2 === 0) throw new Error('custom rejected even');
		return true;
	}));
	typeDefs.CheckedPair = def.TObject({
		a: int,
		b: int,
	}, (data) => {
		if (data.a + data.b > 10) throw new Error('pair sum too large');
	});
};

/**
 * 所有导出工作全部完成后执行
 */
export function onExportAllDone() {

}