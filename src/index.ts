#!/usr/bin/env node

import * as fs from 'fs';
import { execute } from './works';
import * as utils from './utils';
import * as config from './config';

////////////////////////////////////////////////////////////////////////////////
function printHelp(errMsg?: string): never {
    if (errMsg) utils.exceptionRecord(errMsg);
    utils.logger(`${process.argv[0]} ${process.argv[1]} [options...]`);
    utils.logger(`options: `);
    utils.logger(`-c : config file path`);
    utils.logger(`-t : typeDef file path`);
    utils.logger(
        `--debug-output : 1 : enabled output more debug information. 0 : turn off debug information.`
    );
    process.exit(-1);
}

async function main(): Promise<void> {
    try {
        let configPath: string | undefined;
        let typeDef_Path: string;
        let enableDebugOutput: boolean | undefined;
        for (let i = 2; i < process.argv.length; ++i) {
            const cmd = process.argv[i];
            if (cmd === '-h' || cmd === '--h' || cmd === '/h' || cmd === '/?') {
                printHelp();
            } else if (cmd === '-c') {
                ++i;
                if (i >= process.argv.length) printHelp(`no config file path behide the -c option`);
                configPath = process.argv[i].replace(/\\/g, '/');
                if (!fs.existsSync(configPath)) printHelp();
            } else if (cmd === '-t') {
                ++i;
                if (i >= process.argv.length) printHelp(`no config file path behide the -c option`);
                typeDef_Path = process.argv[i];
                try {
                    utils.yellow(`---------: ${typeDef_Path}`);
                    config.setTypeCheckerJSFilePath(typeDef_Path);
                    utils.yellow('-------------------------');
                } catch (ex) {
                    utils.red(String(ex));
                    printHelp();
                    return;
                }
            } else if (cmd === '--debug-output') {
                ++i;
                if (i >= process.argv.length)
                    printHelp(`--debug-output must set a value. [1] or [0]`);
                const option = process.argv[i];
                if (option === '1') enableDebugOutput = true;
                else if (option === '0') enableDebugOutput = false;
                else printHelp(`--debug-output value must be [1] or [0]`);
            }
        }

        if (configPath === undefined) {
            printHelp(`The [-c : config file path] parameter is missing`);
            return;
        }

        if (!config.InitGlobalConfig(configPath, enableDebugOutput)) {
            utils.exception(`Init Global Config "${configPath}" Failure.`);
            return;
        }
        await execute();
        utils.logger('--------------------------------------------------------------------');
    } catch (ex) {
        utils.exceptionRecord(String(ex));
        process.exit(utils.E_ERROR_LEVEL.EXECUTE_FAILURE);
    }
}

// main entry
main().then(utils.EmptyCallback).catch(utils.EmptyCallback);
// process.exit(0);
