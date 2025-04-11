////////////////////////////////////////////////////////////////////////////////
// Version: 1.0.1
// common header here. do not edit it!
declare const global: any; declare const require: Function; (<any>require) = global.require; import { def } from 'def'; declare const __dirname: string; (<any>global).__require_tmp_file_path__ = __dirname;
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
};

/**
 * 所有导出工作全部完成后执行
 */
export function onExportAllDone() {

}