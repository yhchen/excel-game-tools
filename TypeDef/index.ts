import moment = require('moment');
import fs = require('fs');

const debug = function (...param: any[]) { };// console.log;
const error = console.error;
// 缓存已读取的文件
const FileCache: { [key: string]: string; } = {};

export namespace def {

    /**
     * write debug log
     * @param param log data
     */
    export function debugLog(...param: any[]) {
        debug(...param);
    }

    /**
     * generate array type for the 
     * @param elementType array base type, base of TypeDef
     * @param count array length, if value is `undefined` means any(unlimit) length.
     * @param exChecker data user checker, if find error can throw new Error('message') or throw `error message`, can be undefined
     * @returns return TArray type
     */
    export function TArray(elementType: TypeDef | Function, count?: number, exChecker?: (data: any[]) => void): ArrayTypeDef {
        // translate type
        const type = Internal.TryColumnTypeTranslate(elementType);
        // check type
        if (type.__inner__o_type__abcxyz__ == undefined) {
            throw new Error('Array Only support [base type],[enum],[sheet.column],[object] types');
        }
        else if (type.__inner__o_type__abcxyz__ == 'array' || type.__inner__o_type__abcxyz__ == 'object') {
            if (type.__inner__level__abcxyz__ > 2) {
                throw new Error('Arrays can be defined up to two dimensions, more dimensions will not be supported!');
            }
        }

        if (count == undefined || typeof count === 'number') {
            if (count == undefined || count >= 1) {
                const parse = (data: any[]) => {
                    if (data == undefined) {
                        return;
                    }
                    if (typeof data !== 'object') {
                        throw new Error('data type must be array');
                    }
                    if (count != undefined && data.length != count) {
                        throw new Error(`array length incorrect. expect: ${count ?? '<variable>'} current: + ${data.length}`);
                    }
                    let res = [];
                    for (const d of data) {
                        res.push(type.__inner__parse__abcxyz__(d));
                    }
                    if (exChecker != undefined) {
                        exChecker(res);
                    }
                    return res;
                };
                return Type(type, undefined, 'array', type.__inner__level__abcxyz__ + 1, count, undefined, parse, exChecker != undefined, (type)?.__inner__is_json_parse_mode__ ?? false);
            } else {
                throw new Error('Vector type: ' + type + 'count: ' + count + 'error! count must be greater than 1');
            }
        }
        throw new Error('Vector type: ' + type + 'count: ' + count + 'error!, count is not a int value');
    }

    /**
     * generate object type
     * @param objType object type
     * @param exChecker data user checker, can be undefined
     * @returns return TObject type
     */
    export function TObject(objType: { [key: string]: TypeDef | Function; } & ImpossibleTypeDefKey, exChecker?: (data: { [key: string]: any; }, rawdata: { [key: string]: any; }) => void): ObjectTypeDef {
        const type: { [key: string]: TypeDef; } = <any>objType;
        let count = 0, minCount = 0;
        let typeList = [];
        for (const k in type) {
            ++count; ++minCount;
            type[k] = Internal.TryColumnTypeTranslate(type[k]);
            if (type[k].__inner__o_type__abcxyz__ == undefined || type[k].__inner__level__abcxyz__ > 0) {
                throw new Error('Object Only support base type, enum or other sheet.column lines');
            }
            if (type[k].__inner__is_json_parse_mode__) {
                throw new Error('TJson can not use in TObject type');
            }
            typeList.push(type[k]);
        }
        for (let i = typeList.length - 1; i > -1; --i) {
            if (!typeList[i].__inner_has_default_value) break;
            --minCount;
        }
        const res = Type(type, undefined, 'object', 1, count, undefined, (data) => {
            if (typeof data !== 'object' || data.length < minCount) {
                throw new Error('object type parse failure. object element count incorrect. expect: ' + count + ' current: ' + data.length);
            }
            let index = 0;
            const res: any = {};
            for (const k in type) {
                if (data.length <= index) {
                    res[k] = type[k].__inner__defaultval__abcxyz__;
                } else {
                    res[k] = type[k].__inner__parse__abcxyz__(data[index]);
                }
                ++index;
            }
            if (exChecker != undefined) {
                exChecker(res, data);
            }
            return res;
        }, exChecker != undefined, false);
        // 如果TObject的每一个对象都有默认值，则可以直接导出对应的对象
        if (minCount <= 0) {
            res.__inner__defaultval__abcxyz__ = res.__inner__parse__abcxyz__([]);
            res.__inner_has_default_value = true;
        }
        res.__inner__is_struct_parse_mode__ = false;
        return res;
    }

    /**
     * generate object type
     * @param objType object type
     * @param exChecker data user checker, can be undefined
     * @returns return TStruct type
     */
    export function TStruct(objType: { [key: string]: TypeDef | Function; } & ImpossibleTypeDefKey, exChecker?: (data: { [key: string]: any; }, rawdata: { [key: string]: any; }) => void): ObjectTypeDef {
        var res = TObject(objType, exChecker);
        res.__inner__is_struct_parse_mode__ = true;
        return res;
    }

    /**
     * generate object type from json format
     * @param jsonType object type
     * @param exChecker data user checker, if find error can throw new Error('message') or throw `error message`, can be undefined
     * @returns return TJson type(same as TObject)
     * 
     * @example
     *      TJson({
     *           x: int,
     *           y: int,
     *           width: int,
     *           height: int,
     *      })
     * 
     *      data in excel:
     *      { "x": 1, "y": 2, "width": 3, height: 4 }
     *      { "x": 1, "y": 2, "width": 3 }  !!! ATTENTION: member can be ignore, and member will auto output by default number !!!
     * 
     */
    export function TJson(jsonType: { [key: string]: TypeDef | Function; }, exChecker?: (data: { [key: string]: any; }, jsondata: { [key: string]: any; }) => void): ObjectTypeDef {
        const type: { [key: string]: TypeDef; } = <any>jsonType;
        for (const k in type) {
            type[k] = Internal.TryColumnTypeTranslate(type[k]);
            if (type[k].__inner__o_type__abcxyz__ == undefined) {
                throw new Error(`TJson subtype invalid. key: ${k}`);
            }
        }
        return Type(type, undefined, 'object', 1, undefined, undefined, (data) => {
            if (typeof data !== 'object') {
                throw new Error('object type parse failure. type is not a object!');
            }
            const res: any = {};
            for (const k in type) {
                if (data[k] == undefined) {
                    res[k] = type[k].__inner__defaultval__abcxyz__;
                } else {
                    res[k] = type[k].__inner__parse__abcxyz__(data[k]);
                }
            }
            if (exChecker != undefined) {
                exChecker(res, data);
            }
            return res;
        }, exChecker != undefined, true);
    }

    /**
     * custom checker for base type. if found error call:
     * `throw new Error('what is wrong?')` in exChecker
     * @param type int, char, short, string, etc...
     * @param exChecker data user checker, if find error can throw new Error('message') or throw `error message`, can be undefined
     * @returns return TCustom type
     */
    export function TCustom(type: TypeDef, exChecker: (data: any) => void): TypeDef {
        if (exChecker == undefined) {
            return type;
        }
        return Type(type.__inner__type__abcxyz__, type.__inner__name__abcxyz__, type.__inner__o_type__abcxyz__, type.__inner__level__abcxyz__, type.__inner__count__abcxyz__, type.__inner__defaultval__abcxyz__, (data) => {
            const res = type.__inner__parse__abcxyz__(data);
            exChecker(res);
            return res;
        }, true, type.__inner__is_json_parse_mode__);
    }

    /**
     * translate for base type. return value will set to target data:
     * @param type int, char, short, string, etc...
     * @param exChecker data user checker, if find error can throw new Error('message') or throw `error message`, can be undefined
     * @returns return TCustom type
     */
    export function TTranslate(type: TypeDef, translator: (data: any) => any): TypeDef {
        if (translator == undefined) {
            return type;
        }
        return Type(type.__inner__type__abcxyz__, type.__inner__name__abcxyz__, type.__inner__o_type__abcxyz__, type.__inner__level__abcxyz__, type.__inner__count__abcxyz__, type.__inner__defaultval__abcxyz__, (data) => {
            const res = type.__inner__parse__abcxyz__(data);
            return translator(res);
        }, true, type.__inner__is_json_parse_mode__);
    }

    /**
     * generate enum type
     * ATTENTION: Because of protobuf limitations, enumeration value 0 must be defined
     * @param enumDefine enum type
     * @param name enum name (can be undefined)
     * @param isFlag is Flag Enum Mode (can be undefined)
     * @returns return TEnum type
     */
    export function TEnum<_Ty1 extends { [key: string]: number; } & ImpossibleTypeDefKey>(enumDefine: _Ty1, name?: string | undefined, isFlag?: boolean): _Ty1 & EnumTypeDef {
        const enumObject: any = {};
        let hasZero = false;
        for (const key in enumDefine) {
            const val = enumDefine[key];
            enumObject[key] = val;
            enumObject[val] = val;
            if (val == 0) hasZero = true;
        }
        if (!hasZero) {
            throw new Error(`Due to the Proto3 protocol, enumeration types must have a default value of 0.`);
        }
        const enumType = <any>Type(enumDefine, name, 'enum', 0, undefined, 0, (data) => {
            const res = enumObject[data];
            if (res == undefined) {
                throw new Error('enum type incorrect. data: ' + data);
            }
            return res;
        }, false, false);
        // for outer checker
        for (const k in enumDefine) {
            enumType[k] = enumDefine[k];
        }
        enumType.__inner__is_flag__mode = isFlag;
        return enumType;
    }

    const graph: any = {
        0: { 'black': 0, 'sign': 1, '.': 2, 'digit': 6 },
        1: { 'digit': 6, '.': 2 },
        2: { 'digit': 3 },
        3: { 'digit': 3, 'e': 4, "E": 4 },
        4: { 'digit': 5, 'sign': 7 },
        5: { 'digit': 5 },
        6: { 'digit': 6, '.': 3, 'e': 4, "E": 4 },
        7: { 'digit': 5 }
    };

    /**
     * check s is a number
     * @param s 
     * @returns return true if n is a number, otherwise return false.
     */
    export function isNumber(s: any): boolean {
        if (typeof s === 'string') {
            let state = 0;
            for (let c of s.trim()) {
                if (c >= '0' && c <= '9') {
                    c = 'digit';
                } else if (c === ' ') {
                    c = 'black';
                } else if (c === '+' || c === '-') {
                    c = 'sign';
                };
                state = graph[state][c];
                if (state === undefined) {
                    return false;
                };
            };
            if (state === 3 || state === 5 || state === 6) {
                return true;
            };
            return false;
        }
        return typeof s === 'number' || !isNaN(s);
    };

    /**
     * check `value` is string
     */
    export function isString(value?: any): value is string {
        return value != undefined && typeof (value) === 'string';
    }

    /**
     * convert UTC date to local date
     * @param utc UTC date
     * @returns local date
     */
    function utc_to_local(utc: Date) {
        return new Date(utc.getUTCFullYear(), utc.getUTCMonth(), utc.getUTCDate(), utc.getUTCHours(), utc.getUTCMinutes(), utc.getUTCSeconds(), utc.getUTCMilliseconds());
    }

    /**
     * convert local date to UTC date
     * @param local local date
     * @returns UTC date
     */
    function local_to_utc(local: Date) {
        return new Date(Date.UTC(local.getFullYear(), local.getMonth(), local.getDate(), local.getHours(), local.getMinutes(), local.getSeconds(), local.getMilliseconds()));
    }

    /**
     * parse data type
     * @param date can be a date string or a Date object
     * @returns return `Date` object if date is validated.
     */
    export function ParseDate(date: any): Date {
        if (moment.isDate(date)) {
            return utc_to_local(date);
        } else if (typeof date === 'string') {
            const oDate = moment(date, Internal.DateFmt);
            if (!oDate.isValid())
                throw new Error(`[TypeParser] Date Type "${date}" Invalid!`);
            return oDate.toDate();
        }
        throw new Error(`[TypeParseer] Date Type "${date}" Invalid!`);
    };


    ////////////////////////////////////////////////////////////////////////////////

    /**
     * sub type define
     */
    export type SubType = string | TypeDef | { [key: string]: TypeDef; } | Function | { [key: string]: number; };

    type ImpossibleTypeDefKey = {
        [P in keyof TypeDef]?: never;
    };

    /**
     * Common Defines
     */
    export type CommonTypeDef = {
        /**
         * Set default value for base data.(string, int, short, etc...)
         * @param customDefaultVal Default value.
         * @returns Return a new TypeDef object that uses @param customDefaultVal as the default value
         */
        DVAL: (customDefaultVal: any) => TypeDef,
        /**
         * ATTENTION: Tools built-in variables, please do not modify or the same name
         */
        /**
         * name
         */
        __inner__name__abcxyz__?: string,
        // /**
        //  * sub type
        //  */
        // __inner__type__abcxyz__: SubType,
        // /**
        //  * @see OType
        //  */
        // __inner__o_type__abcxyz__: OType,
        /**
         * current array (or object) deep
         */
        __inner__level__abcxyz__: number,
        /**
         * number of arrays, if undefined the length is not limited
         */
        __inner__count__abcxyz__?: number,
        /**
         * default value
         */
        __inner__defaultval__abcxyz__: any,
        /**
         * is json parse mode object
         */
        __inner__is_json_parse_mode__: boolean, // 是否是json解析模式
        /**
         * has ex checker(will be parse in second pass)
         */
        __inner_has_ex_checkers: boolean,
        /**
         * data parser
         */
        __inner__parse__abcxyz__: (data: any) => any;
        /**
         * collect user comment data
         */
        __inner__def_comment?: {
            /**
             * sub node comment collection
             */
            children?: { [key: string]: string[]; },
            /**
             * current node comment collection
             */
            self: string[],
            /**
             * End node comment collection (currently used to record Endregion, but you can consider extending other functions later)
             */
            tail?: string[],
        };
        __inner_has_default_value?: boolean;
    };

    /**
     * Base Type Defines
     */
    export type BaseTypeDef = CommonTypeDef & {
        /**
         * sub type
         */
        __inner__type__abcxyz__: string,
        __inner__o_type__abcxyz__: 'base',
        __inner__level__abcxyz__: 0,
        __inner__is_json_parse_mode__: false,
    };

    /**
     * Object Type Defines
     */
    export type ObjectTypeDef = CommonTypeDef & {
        /**
         * sub type
         */
        __inner__type__abcxyz__: { [key: string]: TypeDef; },
        __inner__o_type__abcxyz__: 'object',
        __inner__level__abcxyz__: number,
        __inner__count__abcxyz__: number,
        __inner__is_json_parse_mode__: boolean,
        __inner__is_struct_parse_mode__: boolean,
    };

    /**
     * Array Type Defines
     */
    export type ArrayTypeDef = CommonTypeDef & {
        /**
         * sub type
         */
        __inner__type__abcxyz__: TypeDef,
        __inner__o_type__abcxyz__: 'array',
        __inner__level__abcxyz__: number,
        __inner__count__abcxyz__?: number,
    };

    /**
     * Enum Type Defines
     */
    export type EnumTypeDef = CommonTypeDef & {
        /**
         * sub type
         */
        __inner__type__abcxyz__: { [key: string]: number; },
        __inner__o_type__abcxyz__: 'enum',
        __inner__level__abcxyz__: 0,
        __inner__defaultval__abcxyz__: 0,
        __inner__is_json_parse_mode__: false,
        __inner__is_flag__mode: false, // is Flag Mode
    };

    /**
     * Column Type Defines
     */
    export type ColumnTypeDef = CommonTypeDef & {
        /**
         * sub type
         */
        __inner__type__abcxyz__: Function,
        __inner__o_type__abcxyz__: 'column',
        __inner__level__abcxyz__: 0,
        __inner__is_json_parse_mode__: false,
    };


    /**
     * otype to type defines map
     */
    export type TypeDefMap = {
        'base': BaseTypeDef,
        'object': ObjectTypeDef,
        'array': ArrayTypeDef,
        'enum': EnumTypeDef,
        'column': ColumnTypeDef,
    };

    /**
     * object type
     */
    export type OType = keyof TypeDefMap;


    // type base defined
    export type TypeDef = BaseTypeDef | ObjectTypeDef | ArrayTypeDef | EnumTypeDef | ColumnTypeDef;

    // generate type
    //@internal
    export function Type<_OTYPE extends OType>(type: SubType, name: string | undefined, otype: _OTYPE, level: number, count: number | undefined, defaultValue: any, parse: (data: any) => any, has_ex_checkers: boolean, is_json_parse_mode: boolean): TypeDefMap[_OTYPE] {
        if (level == undefined) level = 0;
        if (type == undefined) {
            throw new Error(`type must be a string or other type!`);
        }
        if (parse == undefined) {
            throw new Error(`Type must have a parser. for data translate`);
        }
        const comment = GetTypeComment();
        return <TypeDefMap[_OTYPE]>{
            __inner__type__abcxyz__: type,
            __inner__name__abcxyz__: name,
            __inner__o_type__abcxyz__: otype,
            __inner__level__abcxyz__: level,
            __inner__count__abcxyz__: count,
            __inner__defaultval__abcxyz__: defaultValue,
            __inner__is_json_parse_mode__: is_json_parse_mode,
            __inner_has_ex_checkers: has_ex_checkers,
            __inner__parse__abcxyz__: parse,
            DVAL: (customDefaultVal) => {
                if (otype != 'enum' && otype != 'base') {
                    throw new Error('Only <enum> and <base> type can use DVAL function!');
                }
                if (customDefaultVal == undefined) {
                    throw new Error(`default value can not be null or undefined.`);
                }
                if (typeof (customDefaultVal) != typeof (defaultValue)) {
                    throw new Error(`default value type incorrect! need type: ${typeof (defaultValue)} current type: ${typeof (customDefaultVal)}`);
                }
                let newType = Type(type, name, otype, level, count, customDefaultVal, parse, has_ex_checkers, is_json_parse_mode);
                newType.__inner__def_comment = comment;
                newType.__inner_has_default_value = true;
                return newType;
            },
            __inner__def_comment: comment,
        };
    }

    /**
     * get other column data at the same row by column name.
     * @param columnName other column name
     * @returns return target column date from current row.
     */
    export function getRowDataByColumnName(columnName: string) {
        const cIdx = Internal.HeaderNameMap.get(columnName);
        if (cIdx === undefined) {
            throw new Error(`type extens checker failure. column name ${columnName} not found!`);
        }
        return Internal.RowData[cIdx];
    }

    /**
     * Get Current Handle Column Name
     */
    export function GetColumnName() { return Internal.ColunmName; }

    /**
     * Get Current Handle Sheet Name
     */
    export function GetSheetName() { return Internal.SheetName; }

    // boolean checker
    const BooleanFalseKeyMap: { [key: string]: boolean; } = { 'false': false, '0': false, null: false, undefined: false };

    /**
     * integer range: [-127, 128]
     */
    export const char = def.Type('char', 'char', 'base', 0, undefined, 0, (data) => { if (def.isNumber(data) && data >= -127 && data <= 128) return +data; else throw `value: ${data} is not a number or between [-127, 128]`; }, false, false);
    /**
     * integer range: [0, 255]
     */
    export const uchar = def.Type('uchar', 'uchar', 'base', 0, undefined, 0, (data) => { if (def.isNumber(data) && data >= 0 && data <= 255) return +data; else throw `value: ${data} is not a number or between [0, 255]`; }, false, false);
    /**
     * integer range: [-32767, 32768]
     */
    export const short = def.Type('short', 'short', 'base', 0, undefined, 0, (data) => { if (def.isNumber(data) && data >= -32768 && data <= 32767) return +data; else throw `value: ${data} is not a number or between [-32768, 32767]`; }, false, false);
    /**
     * integer range: [0, 65535]
     */
    export const ushort = def.Type('ushort', 'ushort', 'base', 0, undefined, 0, (data) => { if (def.isNumber(data) && data >= 0 && data <= 32768) return +data; else throw `value: ${data} is not a number or between [0, 32768]`; }, false, false);
    /**
     * integer range: [-2147483648, 2147483647]
     */
    export const int = def.Type('int', 'int', 'base', 0, undefined, 0, (data) => { if (def.isNumber(data) && data >= -2147483648 && data <= 2147483647) return +data; else throw `value: ${data} is not a number or between [-2147483648, 2147483647]`; }, false, false);
    /**
     * integer range: [0, 4294967295]
     */
    export const uint = def.Type('uint', 'uint', 'base', 0, undefined, 0, (data) => { if (def.isNumber(data) && data >= 0 && data <= 4294967295) return +data; else throw `value: ${data} is not a number or between [0, 4294967295]`; }, false, false);
    /**
     * integer range: [-9223372036854775808, 9223372036854775807]
     */
    export const int64 = def.Type('int64', 'int64', 'base', 0, undefined, 0, (data) => { if (def.isNumber(data)) return +data; else throw `value: ${data} is not a number`; }, false, false);
    /**
     * integer range: [0, 18446744073709551615]
     */
    export const uint64 = def.Type('uint64', 'uint64', 'base', 0, undefined, 0, (data) => { if (def.isNumber(data) && data >= 0) return +data; else throw `value: ${data} is not a number`; }, false, false);
    /**
     * string object. auto change 'line break' to '\n
     */
    export const string = def.Type('string', 'string', 'base', 0, undefined, '', (data) => { const res = data.toString(); if (res == data) return res; }, false, false);
    /**
     * all number. no limit
     */
    export const double = def.Type('double', 'double', 'base', 0, undefined, 0, (data) => { if (def.isNumber(data)) return +data; else throw `value: ${data} is not a number`; }, false, false);
    /**
     * all number. no limit
     */
    export const float = def.Type('float', 'float', 'base', 0, undefined, 0, (data) => { if (def.isNumber(data)) return +data; else throw `value: ${data} is not a number`; }, false, false);
    /**
     * true: 'true' or '1' false: 'false' empty or '0'
     */
    export const bool = def.Type('bool', 'bool', 'base', 0, undefined, false, (data) => { return BooleanFalseKeyMap[data.toString().toLowerCase()] ?? true; }, false, false);
    /**
     * 	YYYY/MM/DD HH:mm:ss or see: config.DateFmt
     */
    export const date = def.Type('date', 'date', 'base', 0, undefined, undefined, (data) => { const date = def.ParseDate(data); if (date) return moment(date).format(Internal.DateFmt); }, false, false);
    /**
     * YYYY/MM/DD or see config.TinyDateFmt
     */
    export const tinydate = def.Type('tinydate', 'tinydate', 'base', 0, undefined, "", (data) => { const date = def.ParseDate(data); if (date) return moment(date).format(Internal.TinyDateFmt); }, false, false);
    /**
     * Unix time stamp. use ms if config.TimeStampUseMS value is true
     */
    export const timestamp = def.Type('timestamp', 'timestamp', 'base', 0, undefined, 0, (data) => { const date = def.ParseDate(data); if (date) return Internal.TimeStampUseMS ? date.getTime() : Math.round(date.getTime() / 1000); }, false, false);
    /**
     * UTC time stamp. use ms if config.TimeStampUseMS value is true
     */
    export const utctime = def.Type('utctime', 'utctime', 'base', 0, undefined, 0, (data) => { const date = def.ParseDate(data); if (date) return Math.round((date.getTime() / 1000 + Internal.gTimeZoneOffset) * (Internal.TimeStampUseMS ? 1000 : 1)); }, false, false);

    /**
     * @description all typeDefs here
     */
    export const TypeDefs: { [key: string]: def.TypeDef; } = {
        char,
        uchar,
        short,
        ushort,
        int,
        uint,
        int64,
        uint64,
        string,
        double,
        float,
        bool,
        date,
        tinydate,
        timestamp,
        utctime,
    };

    // export function forTest() {
    //     const objTest1 = def.TObject({
    //         x: int,
    //         y: int,
    //         width: int,
    //         height: int,
    //         // DVAL: int,
    //     });
    //     const enumTest1 = def.TEnum({
    //         heii: 0,
    //         hello: 2,
    //         number: 3,
    //         // DVAL: 4,
    //         // __inner__name__abcxyz__: 2,
    //     });
    // }
}


/**
 * internal function. please do not use it!
 */
export namespace Internal {
    // for getRowDataByColumnName use
    export let HeaderNameMap: Map<string, number>;
    // current check row data
    export let RowData: any;
    // current check sheet name
    export let SheetName: string;
    // current column name
    export let ColunmName: string;
    // config
    export let DateFmt: string; // data fmt
    export let TinyDateFmt: string; // tiny date fmt
    export let FractionDigitsFMT: number; // fraction digits FMT
    export let TimeStampUseMS: boolean; // timestamp use ms
    export const gTimeZoneOffset = new Date().getTimezoneOffset() * 60;

    const gColumnTypeTranslate: def.ColumnTypeDef[] = []; // 用于记录然后将所有的[表明].[字段名]检查函数翻译为语法解析用的column类型节点
    const CheckerBoundName = 'bound checkColumnContainsValueAndTranslate';

    export function TryColumnTypeTranslate(type: any): def.TypeDef {
        if (typeof type === 'function' && type.name == CheckerBoundName) {
            const columnType = def.Type(type, `${type.SheetName}.${type.ColumnName}`, 'column', 0, undefined, undefined, function (data: any) {
                const value = type(data);
                if (value == undefined) {
                    throw new Error(`data error, data: ${data} not in Sheet Column ${type.SheetName}.${type.ColumnName}.`);
                }
                return value;
            }, false, false);
            gColumnTypeTranslate.push(columnType);
            return columnType;
        }
        return type;
    };

    export function initializeColumnTypeName() {
        for (const columnType of gColumnTypeTranslate) {
            try {
                columnType.__inner__name__abcxyz__ = (<any>(columnType.__inner__type__abcxyz__)).Header.parser.type.__inner__name__abcxyz__;
            } catch (ex) {
                throw new Error(`initialize column type name failure. column type: ${columnType.__inner__name__abcxyz__}`);
            }
        }
    }

}


//#region get comment method

/**
 * 获取文件和行号信息
 */
function GetFileLineInfo(deep: number = 2): { file: string, line: number, column: number, otype: def.OType; } | undefined {
    const err = new Error('');
    const stacks = err.stack?.split('\n');
    if (stacks == undefined) {
        error('get function file: line info failure!');
        return undefined;
    }
    let info: string | undefined;
    let otype: def.OType = 'base';
    for (let i = deep; i < stacks.length; ++i) {
        const s = stacks[i].trim();
        if (s.startsWith('at Object.TryColumnTypeTranslate')) {
            continue;
        }
        else if (s.startsWith('at Type') || s.startsWith('at Object.Type')) {
            otype = 'base';
            continue;
        } else if (s.startsWith('at Object.TArray')) {
            otype = 'array';
            continue;
        } else if (s.startsWith('at Object.TEnum')) {
            otype = 'enum';
            continue;
        } else if (s.startsWith('at Object.TObject') || s.startsWith('at Object.TJson')) {
            otype = 'object';
            continue;
        } else if (s.startsWith('at Object.TCustom')) {
            otype = 'base';
            continue;
        }
        info = s;
        break;
    }
    if (info == undefined) {
        debug('!!! inner error! get function file: line info failure. outter function stack not found !!!');
        return undefined;
    }
    let sfileline = info;
    // has `(` and `)`
    if (sfileline.indexOf('(') < 0 || sfileline.indexOf(')') < 0) {
        debug(`stack format error: ${sfileline}. expect: at Object.Function (FILE:LINE:column)`);
        return undefined;
    }
    sfileline = info.substring(info.indexOf('(') + 1);
    sfileline = sfileline.substring(0, sfileline.lastIndexOf(')'));
    const columnIdx = sfileline.lastIndexOf(':');
    const column = parseInt(sfileline.substring(columnIdx + 1));
    sfileline = sfileline.substring(0, columnIdx);
    const lineIdx = sfileline.lastIndexOf(':');
    const line = parseInt(sfileline.substring(lineIdx + 1));
    const file = sfileline.substring(0, lineIdx);

    const res = { file, line, column, otype };
    debug(`---------- [${otype}]  ${file}:${line}:${column} ----------`);
    return res;
}

/**
 * 获取type的注释信息
 */
function GetTypeComment(): { self: string[], children?: { [key: string]: string[]; }; tail?: string[]; } | undefined {
    const fl = GetFileLineInfo(3);
    if (fl == undefined) {
        debug(`!!!get file line info failure!!!`);
        return;
    }
    if (FileCache[fl.file] == undefined) {
        try {
            const ctx = fs.readFileSync(fl.file.replace(/\\/g, '/'), { encoding: 'utf-8', flag: 'r' });
            if (ctx == undefined) {
                debug(`!!!get type comment failure because read file: ${fl.file} failure!!!`);
                return undefined;
            }
            FileCache[fl.file] = ctx;
        } catch (ex) {
            debug(`!!!get type comment failure because read file: ${fl.file} failure!!!`);
            error(JSON.stringify(ex));
        }
    }
    const content = FileCache[fl.file];

    const lines = content.split('\n');
    const line = fl.line - 1;
    if (line >= lines.length) {
        debug(`line: ${line} but file lines.length: ${lines.length}`);
        return;
    }
    // get comment before
    const self = GetSelfComment(lines, line, fl.column);
    debug('>>>>>>>>>>>>>>>>>>><<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<');
    debug(self.toString());
    debug('>>>>>>>>>>>>>>>>>>><<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<');
    const childrenComment = GetChildComment(lines, line, fl.otype);

    return { self, children: childrenComment?.children, tail: childrenComment?.tail };
}

function TryGetComment(line: string): string | undefined {
    line = line.trim();
    if (line.startsWith('*')) { // 匹配 "*/" 或者 "* xxxx" 模式
        return ` ${line}`;
    } else if (line.startsWith('//')) { // 匹配 "//" 或者 "///" 模式
        return line;
    } else if (line.startsWith('/*')) { // 匹配 "/*" 开头
        return line;
    }
    return undefined;
}

function GetSelfComment(lines: string[], line: number, column: number): string[] {
    let comment: string[] = [];
    for (let i = line - 1; i > -1; --i) {
        const cmt = TryGetComment(lines[i]);
        if (cmt == undefined) break;
        comment.push(cmt);
        continue;
    }
    return comment.reverse();
}

type ChildrenCommentRes = {
    children: { [key: string]: string[]; },
    tail?: string[],
};

function GetChildComment(lines: string[], line: number, otype: def.OType): ChildrenCommentRes | undefined {
    switch (otype) {
        case 'base':
        case 'array':
        case 'column':
            return undefined;
        case 'enum':
        case 'object':
            return GetEnumOrObjectChildComment(lines, line);
    }
    error(`type ${otype} not found!`);
    return undefined;
}

function GetEnumOrObjectChildComment(lines: string[], line: number): ChildrenCommentRes | undefined {
    const firstLine = lines[line];
    // 在一行内就结束的对象?
    if (firstLine.indexOf('}') >= 0) {
        return undefined;
    }
    let res: ChildrenCommentRes | undefined;
    let comment: string[] = [];
    for (let i = line + 1; i < lines.length; ++i) {
        const cmt = TryGetComment(lines[i]);
        if (cmt != undefined) {
            comment.push(cmt);
            continue;
        }
        if (lines[i].indexOf('}') >= 0) {
            if (res != undefined) {
                res.tail = comment;
            }
            return res;
        }
        // get child name
        let childname = TryGetChildName(lines[i]);
        if (childname == undefined || comment.length <= 0) {
            comment = [];
            continue;
        }
        if (res == undefined) res = { children: {} };
        res.children[childname] = comment;
        comment = [];
        continue;
    }
    return res;
}

/**
 * 尝试获取子节点的名称(enum, object)
 * @param line 
 */
function TryGetChildName(line: string): string | undefined {
    line = line.trim();
    const idx = line.indexOf(':');
    if (idx <= 0) {
        error(`get type child name failure. ctx: ${line}`);
        return undefined;
    }
    return line.substring(0, idx);
}

//#endregion
