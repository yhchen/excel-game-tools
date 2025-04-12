import * as fs from 'fs';
import * as path from 'path';
import * as utils from './utils';
import ConfTpl from './config_tpl.json';
import { TypeDefParser } from './TypeDefParser';

// Work Root Dir
export const gRootDir = process.cwd();

type TConfTpl = typeof ConfTpl;
// Global Export Config
export let gCfg: TConfTpl = ConfTpl; // default config

export function InitGlobalConfig(fpath = '', enableDebugOutput?: boolean): boolean {
    if (fpath !== '') {
        gCfg = <TConfTpl>JSON.parse(fs.readFileSync(fpath, { encoding: 'utf8' }));
        const check = (_cfg: utils.AnyObjectType, _configTpl: utils.AnyObjectType): boolean => {
            for (const key in _configTpl) {
                if (_configTpl[key] !== undefined && typeof _cfg[key] !== typeof _configTpl[key]) {
                    utils.exception(
                        utils.red(`configure format error. key "${utils.yellow(key)}" not found!`)
                    );
                    return false;
                }
                if (utils.isObject(typeof _configTpl[key])) {
                    check(<utils.AnyObjectType>_cfg[key], <utils.AnyObjectType>_configTpl[key]);
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

    if (enableDebugOutput !== undefined) {
        gCfg.EnableDebugOutput = enableDebugOutput;
    }
    return true;
}

export function setTypeCheckerJSFilePath(jsPath: string): void {
    if (!path.isAbsolute(jsPath)) {
        jsPath = path.join(gRootDir, jsPath);
    }
    let jsFile = jsPath;
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
