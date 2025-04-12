/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { TypeDefParser } from './TypeDefParser';
import path = require('path');
// import fs = require('fs');

// let jspath = TypeDefParser.TypeCheckerJSFilePath;
// if (path.parse(TypeDefParser.TypeCheckerJSFilePath).ext !== '.js') {
//     jspath += '.js';
// }

// let context = '';
// try {
// 	context = fs.readFileSync(jspath, { encoding: 'utf-8' });
// } catch (ex) {
// 	utils.exception('read TypeCheckerJSFilePath file path failure with error', ex);
// }
// eval(context);

const require_bak = global.require;
import * as def from 'def';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(<any>global).require = (id: string): unknown | undefined => {
    if (id === 'def') {
        return def;
    } else if (id.startsWith('./') || id.startsWith('../')) {
        const tryPaths: string[] = [
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (<any>global).__require_tmp_file_path__,
            path.dirname(TypeDefParser.TypeCheckerJSFilePath),
        ];
        for (const p of tryPaths) {
            if (p !== undefined)
                try {
                    return require(path.resolve(p, id));
                } catch {
                    // ignore
                }
        }
        throw new Error(`could not found js file : ${id} from paths: ${tryPaths.join(',')}`);
    }
    return require(id);
};

const typeDefs = require(TypeDefParser.TypeCheckerJSFilePath);

global.require = require_bak;

export function initialize(...args: unknown[]): unknown {
    return typeDefs.initialize(...args);
}

export function onExportAllDone(...args: unknown[]): void {
    if (typeDefs.onExportAllDone) typeDefs.onExportAllDone(...args);
}
