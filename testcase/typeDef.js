"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.onExportAllDone = exports.initialize = void 0;
require = global.require;
const def_1 = require("def");
global.__require_tmp_file_path__ = __dirname;
function initialize(Sheets, typeDefs) {
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
    const vector2 = typeDefs.vector2 = def_1.def.TObject({ x: float, y: float });
    const vector3 = typeDefs.vector3 = def_1.def.TObject({ x: float, y: float, z: float });
    // a json object with key, value fields.
    const KVJson = typeDefs.KVJson = def_1.def.TJson({
        // default value is 1
        key: int.DVAL(1),
        // value
        value: int,
    });
    ////////////////////////////////////////////////////////////////////////////////
    // ?????????? initialize sheet table here ??????????
    ////////////////////////////////////////////////////////////////////////////////
    // ?????????? enum type add below ??????????
    const EItemType = typeDefs.EItemType = def_1.def.TEnum({
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
    const AppType = typeDefs.AppType = def_1.def.TEnum({
        ClientH: 0,
        ClientM: 1,
        Gate: 2,
        Logic: 3,
    });
    const ETriggerType = typeDefs.ETriggerType = def_1.def.TEnum({
        Invalid: 0,
        Task: 1,
        Award: 2,
        length: 100,
        arguments: 12312321,
        name: 1232132,
    });
    typeDefs.Item3 = def_1.def.TArray(Sheets.Item.id, 3);
    typeDefs.EquipId = Sheets.Equip.id;
    typeDefs.Vector3 = def_1.def.TArray(float, 3);
    typeDefs.Vector2 = def_1.def.TArray(float, 2);
    typeDefs.Test1 = def_1.def.TArray(EItemType);
    typeDefs.Position = def_1.def.TObject({
        x: int,
        y: int,
        width: int,
        height: int,
        // __inner__count__abcxyz__: int,
    });
    typeDefs.physisLocation = def_1.def.TArray(def_1.def.TArray(float, 2));
    typeDefs.physisLocation1 = def_1.def.TArray(vector3, 3);
    typeDefs.physisLocation2 = def_1.def.TArray(typeDefs.Position, 2);
    typeDefs.Award = def_1.def.TObject({
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
    typeDefs.Item = def_1.def.TObject({
        id: Sheets.Item.id,
        count: int64,
    });
    typeDefs.testGetDataByColNameCheckCell = def_1.def.TCustom(EItemType, (data) => {
        console.log('----------------------------------------------------------------');
        const checkData = def_1.def.getRowDataByColumnName('checkCellValue');
        if (checkData + 100 != data)
            throw new Error(`value: ${data} is not equal to column 'checkCell' data: ${checkData}`);
        return true;
    });
}
exports.initialize = initialize;
;
/**
 * 所有导出工作全部完成后执行
 */
function onExportAllDone() {
}
exports.onExportAllDone = onExportAllDone;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidHlwZURlZi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInR5cGVEZWYudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBR2tFLE9BQVEsR0FBRyxNQUFNLENBQUMsT0FBTyxDQUFDO0FBQUMsNkJBQTBCO0FBQXdDLE1BQU8sQ0FBQyx5QkFBeUIsR0FBRyxTQUFTLENBQUM7QUFLN00sU0FBZ0IsVUFBVSxDQUFDLE1BQTRGLEVBQUUsUUFBeUM7SUFDakssZ0JBQWdCO0lBQ2hCLE1BQU0sSUFBSSxHQUFHLFFBQVEsQ0FBQyxJQUFJLENBQUM7SUFDM0IsTUFBTSxLQUFLLEdBQUcsUUFBUSxDQUFDLEtBQUssQ0FBQztJQUM3QixNQUFNLEtBQUssR0FBRyxRQUFRLENBQUMsS0FBSyxDQUFDO0lBQzdCLE1BQU0sTUFBTSxHQUFHLFFBQVEsQ0FBQyxNQUFNLENBQUM7SUFDL0IsTUFBTSxHQUFHLEdBQUcsUUFBUSxDQUFDLEdBQUcsQ0FBQztJQUN6QixNQUFNLElBQUksR0FBRyxRQUFRLENBQUMsSUFBSSxDQUFDO0lBQzNCLE1BQU0sS0FBSyxHQUFHLFFBQVEsQ0FBQyxLQUFLLENBQUM7SUFDN0IsTUFBTSxNQUFNLEdBQUcsUUFBUSxDQUFDLE1BQU0sQ0FBQztJQUMvQixNQUFNLE1BQU0sR0FBRyxRQUFRLENBQUMsTUFBTSxDQUFDO0lBQy9CLE1BQU0sTUFBTSxHQUFHLFFBQVEsQ0FBQyxNQUFNLENBQUM7SUFDL0IsTUFBTSxLQUFLLEdBQUcsUUFBUSxDQUFDLEtBQUssQ0FBQztJQUM3QixNQUFNLElBQUksR0FBRyxRQUFRLENBQUMsSUFBSSxDQUFDO0lBQzNCLE1BQU0sSUFBSSxHQUFHLFFBQVEsQ0FBQyxJQUFJLENBQUM7SUFDM0IsTUFBTSxRQUFRLEdBQUcsUUFBUSxDQUFDLFFBQVEsQ0FBQztJQUNuQyxNQUFNLFNBQVMsR0FBRyxRQUFRLENBQUMsU0FBUyxDQUFDO0lBQ3JDLE1BQU0sT0FBTyxHQUFHLFFBQVEsQ0FBQyxPQUFPLENBQUM7SUFFakMscUJBQXFCO0lBQ3JCLE1BQU0sT0FBTyxHQUFHLFFBQVEsQ0FBQyxPQUFPLEdBQUcsU0FBRyxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsRUFBRSxLQUFLLEVBQUUsQ0FBQyxFQUFFLEtBQUssRUFBRSxDQUFDLENBQUM7SUFDdkUsTUFBTSxPQUFPLEdBQUcsUUFBUSxDQUFDLE9BQU8sR0FBRyxTQUFHLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEtBQUssRUFBRSxDQUFDLEVBQUUsS0FBSyxFQUFFLENBQUMsRUFBRSxLQUFLLEVBQUUsQ0FBQyxDQUFDO0lBRWpGLHdDQUF3QztJQUN4QyxNQUFNLE1BQU0sR0FBRyxRQUFRLENBQUMsTUFBTSxHQUFHLFNBQUcsQ0FBQyxLQUFLLENBQUM7UUFDMUMscUJBQXFCO1FBQ3JCLEdBQUcsRUFBRSxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztRQUNoQixRQUFRO1FBQ1IsS0FBSyxFQUFFLEdBQUc7S0FDVixDQUFDLENBQUM7SUFFSCxnRkFBZ0Y7SUFDaEYsb0RBQW9EO0lBRXBELGdGQUFnRjtJQUNoRiw0Q0FBNEM7SUFDNUMsTUFBTSxTQUFTLEdBQUcsUUFBUSxDQUFDLFNBQVMsR0FBRyxTQUFHLENBQUMsS0FBSyxDQUFDO1FBQ2hEOztXQUVHO1FBQ0gsT0FBTyxFQUFFLENBQUM7UUFDVixZQUFZO1FBQ1osSUFBSSxFQUFFLENBQUM7UUFDUCxTQUFTO1FBQ1QsS0FBSyxFQUFFLENBQUM7UUFDUjs7V0FFRztRQUNILEdBQUcsRUFBRSxHQUFHO1FBQ1I7O1dBRUc7UUFDSCxHQUFHLEVBQUUsR0FBRztRQUNSLGFBQWE7UUFDYixnQkFBZ0I7UUFDaEIsY0FBYztRQUNkLEtBQUssRUFBRSxHQUFHO1FBQ1YsYUFBYTtRQUNiLGdCQUFnQjtRQUNoQixjQUFjO1FBQ2QsT0FBTyxFQUFFLEdBQUc7S0FDWixDQUFDLENBQUM7SUFDSCxNQUFNLE9BQU8sR0FBRyxRQUFRLENBQUMsT0FBTyxHQUFHLFNBQUcsQ0FBQyxLQUFLLENBQUM7UUFDNUMsT0FBTyxFQUFFLENBQUM7UUFDVixPQUFPLEVBQUUsQ0FBQztRQUNWLElBQUksRUFBRSxDQUFDO1FBQ1AsS0FBSyxFQUFFLENBQUM7S0FDUixDQUFDLENBQUM7SUFDSCxNQUFNLFlBQVksR0FBRyxRQUFRLENBQUMsWUFBWSxHQUFHLFNBQUcsQ0FBQyxLQUFLLENBQUM7UUFDdEQsT0FBTyxFQUFFLENBQUM7UUFDVixJQUFJLEVBQUUsQ0FBQztRQUNQLEtBQUssRUFBRSxDQUFDO1FBQ1IsTUFBTSxFQUFFLEdBQUc7UUFDWCxTQUFTLEVBQUUsUUFBUTtRQUNuQixJQUFJLEVBQUUsT0FBTztLQUNiLENBQUMsQ0FBQztJQUVILFFBQVEsQ0FBQyxLQUFLLEdBQUcsU0FBRyxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQztJQUMvQyxRQUFRLENBQUMsT0FBTyxHQUFHLE1BQU0sQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDO0lBQ25DLFFBQVEsQ0FBQyxPQUFPLEdBQUcsU0FBRyxDQUFDLE1BQU0sQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDLENBQUM7SUFDeEMsUUFBUSxDQUFDLE9BQU8sR0FBRyxTQUFHLENBQUMsTUFBTSxDQUFDLEtBQUssRUFBRSxDQUFDLENBQUMsQ0FBQztJQUN4QyxRQUFRLENBQUMsS0FBSyxHQUFHLFNBQUcsQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLENBQUM7SUFDdkMsUUFBUSxDQUFDLFFBQVEsR0FBRyxTQUFHLENBQUMsT0FBTyxDQUFDO1FBQy9CLENBQUMsRUFBRSxHQUFHO1FBQ04sQ0FBQyxFQUFFLEdBQUc7UUFDTixLQUFLLEVBQUUsR0FBRztRQUNWLE1BQU0sRUFBRSxHQUFHO1FBQ1gsaUNBQWlDO0tBQ2pDLENBQUMsQ0FBQztJQUNILFFBQVEsQ0FBQyxjQUFjLEdBQUcsU0FBRyxDQUFDLE1BQU0sQ0FBQyxTQUFHLENBQUMsTUFBTSxDQUFDLEtBQUssRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQzNELFFBQVEsQ0FBQyxlQUFlLEdBQUcsU0FBRyxDQUFDLE1BQU0sQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFDLENBQUM7SUFDbEQsUUFBUSxDQUFDLGVBQWUsR0FBRyxTQUFHLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDLENBQUM7SUFDNUQsUUFBUSxDQUFDLEtBQUssR0FBRyxTQUFHLENBQUMsT0FBTyxDQUFDO1FBQzVCLElBQUksRUFBRSxTQUFTO1FBQ2YsRUFBRSxFQUFFLEdBQUc7UUFDUCxLQUFLLEVBQUUsS0FBSztLQUNaLEVBQUUsVUFBVSxJQUFJO1FBQ2hCLFFBQVEsSUFBSSxDQUFDLElBQUksRUFBRTtZQUNsQixLQUFLLFNBQVMsQ0FBQyxLQUFLO2dCQUNuQixPQUFPLE1BQU0sQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQztZQUNqQyxLQUFLLFNBQVMsQ0FBQyxJQUFJO2dCQUNsQixPQUFPLE1BQU0sQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQztTQUNoQztJQUNGLENBQUMsQ0FBQyxDQUFDO0lBQ0gsUUFBUSxDQUFDLElBQUksR0FBRyxTQUFHLENBQUMsT0FBTyxDQUFDO1FBQzNCLEVBQUUsRUFBRSxNQUFNLENBQUMsSUFBSSxDQUFDLEVBQUU7UUFDbEIsS0FBSyxFQUFFLEtBQUs7S0FDWixDQUFDLENBQUM7SUFDSCxRQUFRLENBQUMsNkJBQTZCLEdBQUcsU0FBRyxDQUFDLE9BQU8sQ0FBQyxTQUFTLEVBQUUsQ0FBQyxJQUFJLEVBQUUsRUFBRTtRQUN4RSxPQUFPLENBQUMsR0FBRyxDQUFDLGtFQUFrRSxDQUFDLENBQUM7UUFDaEYsTUFBTSxTQUFTLEdBQUcsU0FBRyxDQUFDLHNCQUFzQixDQUFDLGdCQUFnQixDQUFDLENBQUM7UUFDL0QsSUFBSSxTQUFTLEdBQUcsR0FBRyxJQUFJLElBQUk7WUFBRSxNQUFNLElBQUksS0FBSyxDQUFDLFVBQVUsSUFBSSw2Q0FBNkMsU0FBUyxFQUFFLENBQUMsQ0FBQztRQUNySCxPQUFPLElBQUksQ0FBQztJQUNiLENBQUMsQ0FBQyxDQUFDO0FBQ0osQ0FBQztBQWxIRCxnQ0FrSEM7QUFBQSxDQUFDO0FBRUY7O0dBRUc7QUFDSCxTQUFnQixlQUFlO0FBRS9CLENBQUM7QUFGRCwwQ0FFQyJ9