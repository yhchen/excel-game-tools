"use strict";
require = global.require;
const { def } = require("def");
global.__require_tmp_file_path__ = __dirname;

function initialize(Sheets, typeDefs) {
	def.TObject({ a: typeDefs.int }).DVAL(1);
}

function onExportAllDone() {}

exports.initialize = initialize;
exports.onExportAllDone = onExportAllDone;
