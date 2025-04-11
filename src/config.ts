import * as fs from 'fs';
import * as path from 'path';
import * as utils from './utils';
import ConfTpl from "./config_tpl.json";
import { TypeDefParser } from './TypeDefParser';

// Work Root Dir
export const gRootDir = process.cwd();

// Global Export Config
export let gCfg: typeof ConfTpl = ConfTpl; // default config

export function InitGlobalConfig(fpath: string = '', enableDebugOutput?: boolean): boolean {
	if (fpath != '') {
		gCfg = JSON.parse(<string>fs.readFileSync(fpath, { encoding: 'utf8' }));
		function check(gCfg: any, ConfTpl: any): boolean {
			for (let key in ConfTpl) {
				if (ConfTpl[key] != null && typeof gCfg[key] !== typeof ConfTpl[key]) {
					utils.exception(utils.red(`configure format error. key "${utils.yellow(key)}" not found!`));
					return false;
				}
				if (utils.isObject(typeof ConfTpl[key])) {
					check(gCfg[key], ConfTpl[key]);
				}
			}
			return true;
		};
		if (!check(gCfg, ConfTpl)) {
			return false;
		}
	}

	if (utils.StrNotEmpty(gCfg.TypeCheckerJSFilePath)) {
		setTypeCheckerJSFilePath(gCfg.TypeCheckerJSFilePath);
	}

	if (enableDebugOutput != undefined) {
		gCfg.EnableDebugOutput = enableDebugOutput;
	}
	return true;
}

export function setTypeCheckerJSFilePath(jsPath: string) {
	if (!path.isAbsolute(jsPath)) {
		jsPath = path.join(gRootDir, jsPath);
	}
	let jsFile = jsPath
	if (!utils.StrNotEmpty(path.parse(jsPath).ext)) {
		jsFile = `${jsPath}.js`;
	}
	if (!fs.existsSync(jsFile)) {
		utils.exception(`config : {TypeCheckerJSFilePath} incorrect! path not found! : ${jsFile}`);
	}
	TypeDefParser.TypeCheckerJSFilePath = jsPath;
	// try {
	// 	require(jsPath);
	// }
	// catch (ex) {
	// 	utils.exception(`config: {TypeCheckerJSFilePath} incorrect! js file format error ${jsPath}`, ex);
	// }
}