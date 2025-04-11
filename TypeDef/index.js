"use strict";
exports.__esModule = true;
exports.Internal = exports.def = void 0;
var moment = require("moment");
var fs = require("fs");
var debug = function () {
    var param = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        param[_i] = arguments[_i];
    }
}; // console.log;
var error = console.error;
// 缓存已读取的文件
var FileCache = {};
var def;
(function (def) {
    /**
     * generate array type for the
     * @param elementType array base type, base of TypeDef
     * @param count array length, if value is `undefined` means any(unlimit) length.
     * @param exChecker data user checker, if find error can throw new Error('message') or throw `error message`, can be undefined
     * @returns return TArray type
     */
    function TArray(elementType, count, exChecker) {
        var _a, _b;
        // translate type
        var type = Internal.TryColumnTypeTranslate(elementType);
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
                var parse = function (data) {
                    if (data == undefined) {
                        return;
                    }
                    if (typeof data !== 'object') {
                        throw new Error('data type must be array');
                    }
                    if (count != undefined && data.length != count) {
                        throw new Error("array length incorrect. expect: ".concat(count !== null && count !== void 0 ? count : '<variable>', " current: + ").concat(data.length));
                    }
                    var res = [];
                    for (var _i = 0, data_1 = data; _i < data_1.length; _i++) {
                        var d = data_1[_i];
                        res.push(type.__inner__parse__abcxyz__(d));
                    }
                    if (exChecker != undefined) {
                        exChecker(res);
                    }
                    return res;
                };
                return Type(type, undefined, 'array', type.__inner__level__abcxyz__ + 1, count, undefined, parse, exChecker != undefined, (_b = (_a = (type)) === null || _a === void 0 ? void 0 : _a.__inner__is_json_parse_mode__) !== null && _b !== void 0 ? _b : false);
            }
            else {
                throw new Error('Vector type: ' + type + 'count: ' + count + 'error! count must be greater than 1');
            }
        }
        throw new Error('Vector type: ' + type + 'count: ' + count + 'error!, count is not a int value');
    }
    def.TArray = TArray;
    /**
     * generate object type
     * @param objType object type
     * @param exChecker data user checker, can be undefined
     * @returns return TObject type
     */
    function TObject(objType, exChecker) {
        var type = objType;
        var count = 0, minCount = 0;
        var typeList = [];
        for (var k in type) {
            ++count;
            ++minCount;
            type[k] = Internal.TryColumnTypeTranslate(type[k]);
            if (type[k].__inner__o_type__abcxyz__ == undefined || type[k].__inner__level__abcxyz__ > 0) {
                throw new Error('Object Only support base type, enum or other sheet.column lines');
            }
            if (type[k].__inner__is_json_parse_mode__) {
                throw new Error('TJson can not use in TObject type');
            }
            typeList.push(type[k]);
        }
        for (var i = typeList.length - 1; i > -1; --i) {
            if (!typeList[i].__inner_has_default_value)
                break;
            --minCount;
        }
        return Type(type, undefined, 'object', 1, count, undefined, function (data) {
            if (typeof data !== 'object' || data.length < minCount) {
                throw new Error('object type parse failure. object element count incorrect. expect: ' + count + ' current: ' + data.length);
            }
            var index = 0;
            var res = {};
            for (var k in type) {
                if (data.length <= index) {
                    res[k] = type[k].__inner__defaultval__abcxyz__;
                }
                else {
                    res[k] = type[k].__inner__parse__abcxyz__(data[index]);
                }
                ++index;
            }
            if (exChecker != undefined) {
                exChecker(res, data);
            }
            return res;
        }, exChecker != undefined, false);
    }
    def.TObject = TObject;
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
    function TJson(jsonType, exChecker) {
        var type = jsonType;
        for (var k in type) {
            type[k] = Internal.TryColumnTypeTranslate(type[k]);
            if (type[k].__inner__o_type__abcxyz__ == undefined) {
                throw new Error("TJson subtype invalid. key: ".concat(k));
            }
        }
        return Type(type, undefined, 'object', 1, undefined, undefined, function (data) {
            if (typeof data !== 'object') {
                throw new Error('object type parse failure. type is not a object!');
            }
            var res = {};
            for (var k in type) {
                if (data[k] == undefined) {
                    res[k] = type[k].__inner__defaultval__abcxyz__;
                }
                else {
                    res[k] = type[k].__inner__parse__abcxyz__(data[k]);
                }
            }
            if (exChecker != undefined) {
                exChecker(res, data);
            }
            return res;
        }, exChecker != undefined, true);
    }
    def.TJson = TJson;
    /**
     * custom checker for base type. if found error call:
     * `throw new Error('what is wrong?')` in exChecker
     * @param type int, char, short, string, etc...
     * @param exChecker data user checker, if find error can throw new Error('message') or throw `error message`, can be undefined
     * @returns return TCustom type
     */
    function TCustom(type, exChecker) {
        if (exChecker == undefined) {
            return type;
        }
        return Type(type.__inner__type__abcxyz__, type.__inner__name__abcxyz__, type.__inner__o_type__abcxyz__, type.__inner__level__abcxyz__, type.__inner__count__abcxyz__, type.__inner__defaultval__abcxyz__, function (data) {
            var res = type.__inner__parse__abcxyz__(data);
            exChecker(res);
            return res;
        }, true, type.__inner__is_json_parse_mode__);
    }
    def.TCustom = TCustom;
    /**
     * generate enum type
     * ATTENTION: Because of protobuf limitations, enumeration value 0 must be defined
     * @param enumDefine enum type
     * @param name enum name (can be undefined)
     * @returns return TEnum type
     */
    function TEnum(enumDefine, name) {
        var enumObject = {};
        var hasZero = false;
        for (var key in enumDefine) {
            var val = enumDefine[key];
            enumObject[key] = val;
            enumObject[val] = val;
            if (val == 0)
                hasZero = true;
        }
        if (!hasZero) {
            throw new Error("Due to the Proto3 protocol, enumeration types must have a default value of 0.");
        }
        var enumType = Type(enumDefine, name, 'enum', 0, undefined, 0, function (data) {
            var res = enumObject[data];
            if (res == undefined) {
                throw new Error('enum type incorrect. data: ' + data);
            }
            return res;
        }, false, false);
        // for outer checker
        for (var k in enumDefine) {
            enumType[k] = enumDefine[k];
        }
        return enumType;
    }
    def.TEnum = TEnum;
    /**
     * check n is a number
     * @param n
     * @returns return true if n is a number, otherwise return false.
     */
    function isNumber(n) {
        if (typeof n === 'string') {
            n = n.trim();
        }
        return typeof n === 'number' || (+n).toString() === n;
    }
    def.isNumber = isNumber;
    ;
    /**
     * parse data type
     * @param date can be a date string or a Date object
     * @returns return `Date` object if date is validated.
     */
    function ParseDate(date) {
        if (moment.isDate(date)) {
            return date;
        }
        else if (typeof date === 'string') {
            var oDate = moment(date, Internal.DateFmt);
            if (!oDate.isValid())
                throw new Error("[TypeParser] Date Type \"".concat(date, "\" Invalid!"));
            return oDate.toDate();
        }
        throw new Error("[TypeParseer] Date Type \"".concat(date, "\" Invalid!"));
    }
    def.ParseDate = ParseDate;
    ;
    // generate type
    //@internal
    function Type(type, name, otype, level, count, defaultValue, parse, has_ex_checkers, is_json_parse_mode) {
        if (level == undefined)
            level = 0;
        if (type == undefined) {
            throw new Error("type must be a string or other type!");
        }
        if (parse == undefined) {
            throw new Error("Type must have a parser. for data translate");
        }
        var comment = GetTypeComment();
        return {
            __inner__type__abcxyz__: type,
            __inner__name__abcxyz__: name,
            __inner__o_type__abcxyz__: otype,
            __inner__level__abcxyz__: level,
            __inner__count__abcxyz__: count,
            __inner__defaultval__abcxyz__: defaultValue,
            __inner__is_json_parse_mode__: is_json_parse_mode,
            __inner_has_ex_checkers: has_ex_checkers,
            __inner__parse__abcxyz__: parse,
            DVAL: function (customDefaultVal) {
                if (otype != 'enum' && otype != 'base') {
                    throw new Error('Only <enum> and <base> type can use DVAL function!');
                }
                if (customDefaultVal == undefined) {
                    throw new Error("default value can not be null or undefined.");
                }
                if (typeof (customDefaultVal) != typeof (defaultValue)) {
                    throw new Error("default value type incorrect! need type: ".concat(typeof (defaultValue), " current type: ").concat(typeof (customDefaultVal)));
                }
                var newType = Type(type, name, otype, level, count, customDefaultVal, parse, has_ex_checkers, is_json_parse_mode);
                newType.__inner__def_comment = comment;
                newType.__inner_has_default_value = true;
                return newType;
            },
            __inner__def_comment: comment
        };
    }
    def.Type = Type;
    /**
     * get other column data at the same row by column name.
     * @param columnName other column name
     * @returns return target column date from current row.
     */
    function getRowDataByColumnName(columnName) {
        var cIdx = Internal.HeaderNameMap.get(columnName);
        if (cIdx === undefined) {
            throw new Error("type extens checker failure. column name ".concat(columnName, " not found!"));
        }
        return Internal.RowData[cIdx];
    }
    def.getRowDataByColumnName = getRowDataByColumnName;
    // boolean checker
    var BooleanFalseKeyMap = { 'false': false, '0': false, "null": false, undefined: false };
    /**
     * integer range: [-127, 128]
     */
    def.char = def.Type('char', 'char', 'base', 0, undefined, 0, function (data) { if (def.isNumber(data) && data >= -127 && data <= 128)
        return +data;
    else
        throw "value: ".concat(data, " is not a number or between [-127, 128]"); }, false, false);
    /**
     * integer range: [0, 255]
     */
    def.uchar = def.Type('uchar', 'uchar', 'base', 0, undefined, 0, function (data) { if (def.isNumber(data) && data >= 0 && data <= 255)
        return +data;
    else
        throw "value: ".concat(data, " is not a number or between [0, 255]"); }, false, false);
    /**
     * integer range: [-32767, 32768]
     */
    def.short = def.Type('short', 'short', 'base', 0, undefined, 0, function (data) { if (def.isNumber(data) && data >= -32768 && data <= 32767)
        return +data;
    else
        throw "value: ".concat(data, " is not a number or between [-32768, 32767]"); }, false, false);
    /**
     * integer range: [0, 65535]
     */
    def.ushort = def.Type('ushort', 'ushort', 'base', 0, undefined, 0, function (data) { if (def.isNumber(data) && data >= 0 && data <= 32768)
        return +data;
    else
        throw "value: ".concat(data, " is not a number or between [0, 32768]"); }, false, false);
    /**
     * integer range: [-2147483648, 2147483647]
     */
    def.int = def.Type('int', 'int', 'base', 0, undefined, 0, function (data) { if (def.isNumber(data) && data >= -2147483648 && data <= 2147483647)
        return +data;
    else
        throw "value: ".concat(data, " is not a number or between [-2147483648, 2147483647]"); }, false, false);
    /**
     * integer range: [0, 4294967295]
     */
    def.uint = def.Type('uint', 'uint', 'base', 0, undefined, 0, function (data) { if (def.isNumber(data) && data >= 0 && data <= 4294967295)
        return +data;
    else
        throw "value: ".concat(data, " is not a number or between [0, 4294967295]"); }, false, false);
    /**
     * integer range: [-9223372036854775808, 9223372036854775807]
     */
    def.int64 = def.Type('int64', 'int64', 'base', 0, undefined, 0, function (data) { if (def.isNumber(data))
        return +data;
    else
        throw "value: ".concat(data, " is not a number"); }, false, false);
    /**
     * integer range: [0, 18446744073709551615]
     */
    def.uint64 = def.Type('uint64', 'uint64', 'base', 0, undefined, 0, function (data) { if (def.isNumber(data) && data >= 0)
        return +data;
    else
        throw "value: ".concat(data, " is not a number"); }, false, false);
    /**
     * string object. auto change 'line break' to '\n
     */
    def.string = def.Type('string', 'string', 'base', 0, undefined, '', function (data) { var res = data.toString(); if (res == data)
        return res; }, false, false);
    /**
     * all number. no limit
     */
    def.double = def.Type('double', 'double', 'base', 0, undefined, 0, function (data) { if (def.isNumber(data))
        return (+data).toFixed(Internal.FractionDigitsFMT);
    else
        throw "value: ".concat(data, " is not a number"); }, false, false);
    /**
     * all number. no limit
     */
    def.float = def.Type('float', 'float', 'base', 0, undefined, 0, function (data) {
        if (def.isNumber(data))
            return (+data).toFixed(Internal.FractionDigitsFMT);
        else
            throw "value: ".concat(data, " is not a number");
    }, false, false);
    /**
     * true: 'true' or '1' false: 'false' empty or '0'
     */
    def.bool = def.Type('bool', 'bool', 'base', 0, undefined, false, function (data) { var _a; return (_a = BooleanFalseKeyMap[data.toString().toLowerCase()]) !== null && _a !== void 0 ? _a : true; }, false, false);
    /**
     * 	YYYY/MM/DD HH:mm:ss or see: config.DateFmt
     */
    def.date = def.Type('date', 'date', 'base', 0, undefined, undefined, function (data) { var date = def.ParseDate(data); if (date)
        return moment(date).format(Internal.DateFmt); }, false, false);
    /**
     * YYYY/MM/DD or see config.TinyDateFmt
     */
    def.tinydate = def.Type('tinydate', 'tinydate', 'base', 0, undefined, 0, function (data) { var date = def.ParseDate(data); if (date)
        return moment(date).format(Internal.TinyDateFmt); }, false, false);
    /**
     * Unix time stamp. use ms if config.TimeStampUseMS value is true
     */
    def.timestamp = def.Type('timestamp', 'timestamp', 'base', 0, undefined, 0, function (data) { var date = def.ParseDate(data); if (date)
        return Internal.TimeStampUseMS ? date.getTime() : Math.round(date.getTime() / 1000); }, false, false);
    /**
     * UTC time stamp. use ms if config.TimeStampUseMS value is true
     */
    def.utctime = def.Type('utctime', 'utctime', 'base', 0, undefined, 0, function (data) { var date = def.ParseDate(data); if (date)
        return Math.round((date.getTime() / 1000 + Internal.gTimeZoneOffset) * (Internal.TimeStampUseMS ? 1000 : 1)); }, false, false);
    /**
     * @description all typeDefs here
     */
    def.TypeDefs = {
        char: def.char,
        uchar: def.uchar,
        short: def.short,
        ushort: def.ushort,
        int: def.int,
        uint: def.uint,
        int64: def.int64,
        uint64: def.uint64,
        string: def.string,
        double: def.double,
        float: def.float,
        bool: def.bool,
        date: def.date,
        tinydate: def.tinydate,
        timestamp: def.timestamp,
        utctime: def.utctime
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
})(def = exports.def || (exports.def = {}));
/**
 * internal function. please do not use it!
 */
var Internal;
(function (Internal) {
    Internal.gTimeZoneOffset = new Date().getTimezoneOffset() * 60;
    var gColumnTypeTranslate = []; // 用于记录然后将所有的[表明].[字段名]检查函数翻译为语法解析用的column类型节点
    var CheckerBoundName = 'bound checkColumnContainsValueAndTranslate';
    function TryColumnTypeTranslate(type) {
        if (typeof type === 'function' && type.name == CheckerBoundName) {
            var columnType = def.Type(type, "".concat(type.SheetName, ".").concat(type.ColumnName), 'column', 0, undefined, undefined, function (data) {
                var value = type(data);
                if (value == undefined) {
                    throw new Error("data error, data: ".concat(data, " not in Sheet Column ").concat(type.SheetName, ".").concat(type.ColumnName, "."));
                }
                return value;
            }, false, false);
            gColumnTypeTranslate.push(columnType);
            return columnType;
        }
        return type;
    }
    Internal.TryColumnTypeTranslate = TryColumnTypeTranslate;
    ;
    function initializeColumnTypeName() {
        for (var _i = 0, gColumnTypeTranslate_1 = gColumnTypeTranslate; _i < gColumnTypeTranslate_1.length; _i++) {
            var columnType = gColumnTypeTranslate_1[_i];
            columnType.__inner__name__abcxyz__ = (columnType.__inner__type__abcxyz__).Header.parser.type.__inner__name__abcxyz__;
        }
    }
    Internal.initializeColumnTypeName = initializeColumnTypeName;
})(Internal = exports.Internal || (exports.Internal = {}));
//#region get comment method
/**
 * 获取文件和行号信息
 */
function GetFileLineInfo(deep) {
    var _a;
    if (deep === void 0) { deep = 2; }
    var err = new Error('');
    var stacks = (_a = err.stack) === null || _a === void 0 ? void 0 : _a.split('\n');
    if (stacks == undefined) {
        error('get function file: line info failure!');
        return undefined;
    }
    var info;
    var otype = 'base';
    for (var i = deep; i < stacks.length; ++i) {
        var s = stacks[i].trim();
        if (s.startsWith('at Object.TryColumnTypeTranslate')) {
            continue;
        }
        else if (s.startsWith('at Type') || s.startsWith('at Object.Type')) {
            otype = 'base';
            continue;
        }
        else if (s.startsWith('at Object.TArray')) {
            otype = 'array';
            continue;
        }
        else if (s.startsWith('at Object.TEnum')) {
            otype = 'enum';
            continue;
        }
        else if (s.startsWith('at Object.TObject') || s.startsWith('at Object.TJson')) {
            otype = 'object';
            continue;
        }
        else if (s.startsWith('at Object.TCustom')) {
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
    var sfileline = info;
    // has `(` and `)`
    if (sfileline.indexOf('(') < 0 || sfileline.indexOf(')') < 0) {
        debug("stack format error: ".concat(sfileline, ". expect: at Object.Function (FILE:LINE:column)"));
        return undefined;
    }
    sfileline = info.substring(info.indexOf('(') + 1);
    sfileline = sfileline.substring(0, sfileline.lastIndexOf(')'));
    var columnIdx = sfileline.lastIndexOf(':');
    var column = parseInt(sfileline.substring(columnIdx + 1));
    sfileline = sfileline.substring(0, columnIdx);
    var lineIdx = sfileline.lastIndexOf(':');
    var line = parseInt(sfileline.substring(lineIdx + 1));
    var file = sfileline.substring(0, lineIdx);
    var res = { file: file, line: line, column: column, otype: otype };
    debug("---------- [".concat(otype, "]  ").concat(file, ":").concat(line, ":").concat(column, " ----------"));
    return res;
}
/**
 * 获取type的注释信息
 */
function GetTypeComment() {
    var fl = GetFileLineInfo(3);
    if (fl == undefined) {
        debug("!!!get file line info failure!!!");
        return;
    }
    if (FileCache[fl.file] == undefined) {
        try {
            var ctx = fs.readFileSync(fl.file.replace(/\\/g, '/'), { encoding: 'utf-8', flag: 'r' });
            if (ctx == undefined) {
                debug("!!!get type comment failure because read file: ".concat(fl.file, " failure!!!"));
                return undefined;
            }
            FileCache[fl.file] = ctx;
        }
        catch (ex) {
            debug("!!!get type comment failure because read file: ".concat(fl.file, " failure!!!"));
            error(JSON.stringify(ex));
        }
    }
    var content = FileCache[fl.file];
    var lines = content.split('\n');
    var line = fl.line - 1;
    if (line >= lines.length) {
        debug("line: ".concat(line, " but file lines.length: ").concat(lines.length));
        return;
    }
    // get comment before
    var self = GetSelfComment(lines, line, fl.column);
    debug('>>>>>>>>>>>>>>>>>>><<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<');
    debug(self.toString());
    debug('>>>>>>>>>>>>>>>>>>><<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<');
    var childrenComment = GetChildComment(lines, line, fl.otype);
    return { self: self, children: childrenComment === null || childrenComment === void 0 ? void 0 : childrenComment.children, tail: childrenComment === null || childrenComment === void 0 ? void 0 : childrenComment.tail };
}
function TryGetComment(line) {
    line = line.trim();
    if (line.startsWith('*')) { // 匹配 "*/" 或者 "* xxxx" 模式
        return " ".concat(line);
    }
    else if (line.startsWith('//')) { // 匹配 "//" 或者 "///" 模式
        return line;
    }
    else if (line.startsWith('/*')) { // 匹配 "/*" 开头
        return line;
    }
    return undefined;
}
function GetSelfComment(lines, line, column) {
    var comment = [];
    for (var i = line - 1; i > -1; --i) {
        var cmt = TryGetComment(lines[i]);
        if (cmt == undefined)
            break;
        comment.push(cmt);
        continue;
    }
    return comment.reverse();
}
function GetChildComment(lines, line, otype) {
    switch (otype) {
        case 'base':
        case 'array':
        case 'column':
            return undefined;
        case 'enum':
        case 'object':
            return GetEnumOrObjectChildComment(lines, line);
    }
    error("type ".concat(otype, " not found!"));
    return undefined;
}
function GetEnumOrObjectChildComment(lines, line) {
    var firstLine = lines[line];
    // 在一行内就结束的对象?
    if (firstLine.indexOf('}') >= 0) {
        return undefined;
    }
    var res;
    var comment = [];
    for (var i = line + 1; i < lines.length; ++i) {
        var cmt = TryGetComment(lines[i]);
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
        var childname = TryGetChildName(lines[i]);
        if (childname == undefined || comment.length <= 0) {
            comment = [];
            continue;
        }
        if (res == undefined)
            res = { children: {} };
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
function TryGetChildName(line) {
    line = line.trim();
    var idx = line.indexOf(':');
    if (idx <= 0) {
        error("get type child name failure. ctx: ".concat(line));
        return undefined;
    }
    return line.substring(0, idx);
}
//#endregion
