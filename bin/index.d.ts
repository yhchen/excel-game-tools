export declare module def {
    /**
     * write debug log
     * @param param log data
     */
    export function debugLog(...param: any[]): void;
    /**
     * generate array type for the
     * @param elementType array base type, base of TypeDef
     * @param count array length, if value is `undefined` means any(unlimit) length.
     * @param exChecker data user checker, if find error can throw new Error('message') or throw `error message`, can be undefined
     * @returns return TArray type
     */
    export function TArray(elementType: TypeDef | Function, count?: number, exChecker?: (data: any[]) => void): ArrayTypeDef;
    /**
     * generate object type
     * @param objType object type
     * @param exChecker data user checker, can be undefined
     * @returns return TObject type
     */
    export function TObject(objType: {
        [key: string]: TypeDef | Function;
    } & ImpossibleTypeDefKey, exChecker?: (data: {
        [key: string]: any;
    }, rawdata: {
        [key: string]: any;
    }) => void): ObjectTypeDef;
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
    export function TJson(jsonType: {
        [key: string]: TypeDef | Function;
    }, exChecker?: (data: {
        [key: string]: any;
    }, jsondata: {
        [key: string]: any;
    }) => void): ObjectTypeDef;
    /**
     * custom checker for base type. if found error call:
     * `throw new Error('what is wrong?')` in exChecker
     * @param type int, char, short, string, etc...
     * @param exChecker data user checker, if find error can throw new Error('message') or throw `error message`, can be undefined
     * @returns return TCustom type
     */
    export function TCustom(type: TypeDef, exChecker: (data: any) => void): TypeDef;
    /**
     * translate for base type. return value will set to target data:
     * @param type int, char, short, string, etc...
     * @param exChecker data user checker, if find error can throw new Error('message') or throw `error message`, can be undefined
     * @returns return TCustom type
     */
    export function TTranslate(type: TypeDef, translator: (data: any) => any): TypeDef;
    /**
     * generate enum type
     * ATTENTION: Because of protobuf limitations, enumeration value 0 must be defined
     * @param enumDefine enum type
     * @param name enum name (can be undefined)
     * @returns return TEnum type
     */
    export function TEnum<_Ty1 extends {
        [key: string]: number;
    } & ImpossibleTypeDefKey>(enumDefine: _Ty1, name?: string | undefined): _Ty1 & EnumTypeDef;
    /**
     * check s is a number
     * @param s
     * @returns return true if n is a number, otherwise return false.
     */
    export function isNumber(s: any): boolean;
    /**
     * check `value` is string
     */
    export function isString(value?: any): value is string;
    /**
     * parse data type
     * @param date can be a date string or a Date object
     * @returns return `Date` object if date is validated.
     */
    export function ParseDate(date: any): Date;
    /**
     * sub type define
     */
    export type SubType = string | TypeDef | {
        [key: string]: TypeDef;
    } | Function | {
        [key: string]: number;
    };
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
        DVAL: (customDefaultVal: any) => TypeDef;
        /**
         * ATTENTION: Tools built-in variables, please do not modify or the same name
         */
        /**
         * name
         */
        __inner__name__abcxyz__?: string;
        /**
         * current array (or object) deep
         */
        __inner__level__abcxyz__: number;
        /**
         * number of arrays, if undefined the length is not limited
         */
        __inner__count__abcxyz__?: number;
        /**
         * default value
         */
        __inner__defaultval__abcxyz__: any;
        /**
         * is json parse mode object
         */
        __inner__is_json_parse_mode__: boolean;
        /**
         * has ex checker(will be parse in second pass)
         */
        __inner_has_ex_checkers: boolean;
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
            children?: {
                [key: string]: string[];
            };
            /**
             * current node comment collection
             */
            self: string[];
            /**
             * End node comment collection (currently used to record Endregion, but you can consider extending other functions later)
             */
            tail?: string[];
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
        __inner__type__abcxyz__: string;
        __inner__o_type__abcxyz__: 'base';
        __inner__level__abcxyz__: 0;
        __inner__is_json_parse_mode__: false;
    };
    /**
     * Object Type Defines
     */
    export type ObjectTypeDef = CommonTypeDef & {
        /**
         * sub type
         */
        __inner__type__abcxyz__: {
            [key: string]: TypeDef;
        };
        __inner__o_type__abcxyz__: 'object';
        __inner__level__abcxyz__: number;
        __inner__count__abcxyz__: number;
        __inner__is_json_parse_mode__: boolean;
    };
    /**
     * Array Type Defines
     */
    export type ArrayTypeDef = CommonTypeDef & {
        /**
         * sub type
         */
        __inner__type__abcxyz__: TypeDef;
        __inner__o_type__abcxyz__: 'array';
        __inner__level__abcxyz__: number;
        __inner__count__abcxyz__?: number;
    };
    /**
     * Enum Type Defines
     */
    export type EnumTypeDef = CommonTypeDef & {
        /**
         * sub type
         */
        __inner__type__abcxyz__: {
            [key: string]: number;
        };
        __inner__o_type__abcxyz__: 'enum';
        __inner__level__abcxyz__: 0;
        __inner__defaultval__abcxyz__: 0;
        __inner__is_json_parse_mode__: false;
    };
    /**
     * Column Type Defines
     */
    export type ColumnTypeDef = CommonTypeDef & {
        /**
         * sub type
         */
        __inner__type__abcxyz__: Function;
        __inner__o_type__abcxyz__: 'column';
        __inner__level__abcxyz__: 0;
        __inner__is_json_parse_mode__: false;
    };
    /**
     * otype to type defines map
     */
    export type TypeDefMap = {
        'base': BaseTypeDef;
        'object': ObjectTypeDef;
        'array': ArrayTypeDef;
        'enum': EnumTypeDef;
        'column': ColumnTypeDef;
    };
    /**
     * object type
     */
    export type OType = keyof TypeDefMap;
    export type TypeDef = BaseTypeDef | ObjectTypeDef | ArrayTypeDef | EnumTypeDef | ColumnTypeDef;
    /**
     * get other column data at the same row by column name.
     * @param columnName other column name
     * @returns return target column date from current row.
     */
    export function getRowDataByColumnName(columnName: string): any;
    /**
     * Get Current Handle Column Name
     */
    export function GetColumnName(): string;
    /**
     * Get Current Handle Sheet Name
     */
    export function GetSheetName(): string;
    /**
     * integer range: [-127, 128]
     */
    export const char: BaseTypeDef;
    /**
     * integer range: [0, 255]
     */
    export const uchar: BaseTypeDef;
    /**
     * integer range: [-32767, 32768]
     */
    export const short: BaseTypeDef;
    /**
     * integer range: [0, 65535]
     */
    export const ushort: BaseTypeDef;
    /**
     * integer range: [-2147483648, 2147483647]
     */
    export const int: BaseTypeDef;
    /**
     * integer range: [0, 4294967295]
     */
    export const uint: BaseTypeDef;
    /**
     * integer range: [-9223372036854775808, 9223372036854775807]
     */
    export const int64: BaseTypeDef;
    /**
     * integer range: [0, 18446744073709551615]
     */
    export const uint64: BaseTypeDef;
    /**
     * string object. auto change 'line break' to '\n
     */
    export const string: BaseTypeDef;
    /**
     * all number. no limit
     */
    export const double: BaseTypeDef;
    /**
     * all number. no limit
     */
    export const float: BaseTypeDef;
    /**
     * true: 'true' or '1' false: 'false' empty or '0'
     */
    export const bool: BaseTypeDef;
    /**
     * 	YYYY/MM/DD HH:mm:ss or see: config.DateFmt
     */
    export const date: BaseTypeDef;
    /**
     * YYYY/MM/DD or see config.TinyDateFmt
     */
    export const tinydate: BaseTypeDef;
    /**
     * Unix time stamp. use ms if config.TimeStampUseMS value is true
     */
    export const timestamp: BaseTypeDef;
    /**
     * UTC time stamp. use ms if config.TimeStampUseMS value is true
     */
    export const utctime: BaseTypeDef;
    /**
     * @description all typeDefs here
     */
    export const TypeDefs: {
        [key: string]: def.TypeDef;
    };
    export {};
}
/**
 * internal function. please do not use it!
 */
export declare module Internal {
    let HeaderNameMap: Map<string, number>;
    let RowData: any;
    let SheetName: string;
    let ColunmName: string;
    let DateFmt: string;
    let TinyDateFmt: string;
    let FractionDigitsFMT: number;
    let TimeStampUseMS: boolean;
    const gTimeZoneOffset: number;
    function TryColumnTypeTranslate(type: any): def.TypeDef;
    function initializeColumnTypeName(): void;
}
