import { TypeDefParser } from "./TypeDefParser";
import path = require('path');
import fs = require('fs');

let jspath = TypeDefParser.TypeCheckerJSFilePath;
if (path.parse(TypeDefParser.TypeCheckerJSFilePath).ext != '.js') {
	jspath += '.js';
}

// let context = '';
// try {
// 	context = fs.readFileSync(jspath, { encoding: 'utf-8' });
// } catch (ex) {
// 	utils.exception('read TypeCheckerJSFilePath file path failure with error', ex);
// }
// eval(context);

const require_bak = global.require;
const def = require('def');

(<any>global).require = (id: string) => {
	if (id === 'def') {
		return def;
	} else if (id.startsWith('./') || id.startsWith('../')) {
		const tryPaths: string[] = [(<any>global).__require_tmp_file_path__, path.dirname(TypeDefParser.TypeCheckerJSFilePath)];
		for (const p of tryPaths) {
			if (p != undefined) try { const fp = path.resolve(p, id); return require(fp); } catch (ex: Error | any) {
				if (ex.code !== 'MODULE_NOT_FOUND') {
					throw ex; // re-throw if it's not a module not found error
				}
			}
		}
		throw new Error(`could not found js file : ${id} from paths: ${tryPaths.join(',')}`);
	}
	return require(id);
};

const typeDefs = require(TypeDefParser.TypeCheckerJSFilePath);

global.require = require_bak;

export function initialize(...args: any[]) {
	return typeDefs.initialize(...args);
}

export function onExportAllDone(...args: any[]) {
	if (typeDefs.onExportAllDone) typeDefs.onExportAllDone(...args);
}
