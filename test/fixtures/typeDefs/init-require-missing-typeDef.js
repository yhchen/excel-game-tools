"use strict";
require = global.require;
const { def } = require("def");
global.__require_tmp_file_path__ = __dirname;
require("./does-not-exist.js");

function initialize() {}
function onExportAllDone() {}
exports.initialize = initialize;
exports.onExportAllDone = onExportAllDone;
