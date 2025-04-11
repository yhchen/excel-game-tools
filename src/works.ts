import * as path from 'path';
import * as fs from 'fs';
import * as utils from './utils';
import { gCfg, gRootDir } from './config';
import * as excel_utils from './excel_utils';
import { OnExportAllDone } from './TypeDefParser';

const gExportWrapperLst = new Array<utils.IExportWrapper>();
function InitEnv(): boolean {
	for (const exportCfg of gCfg.Export) {
		const Constructor = utils.ExportWrapperMap.get(exportCfg.type);
		if (Constructor == undefined) {
			utils.exceptionRecord(utils.red(`Export is not currently supported for the current type "${utils.yellow_ul(exportCfg.type)}"!\n` +
				`ERROR : Export constructor not found. initialize failure!`));
			return false;
		}
		const Exportor = Constructor.call(Constructor, exportCfg);
		if (Exportor) {
			if ((<any>exportCfg).ExtName == undefined) {
				(<any>exportCfg).ExtName = Exportor.DefaultExtName;
			}
			gExportWrapperLst.push(Exportor);
		}
	}
	return true;
}

export async function execute(): Promise<boolean> {
	if (!InitEnv()) {
		throw `InitEnv failure!`;
	}
	if (!await HandleReadHeader()) {
		throw `handle read excel data failure.`;
	}
	if (!await excel_utils.HandleDataTableStep2()) {
		throw `handle read excel base data failure.`;
	}
	if (!excel_utils.HandleDataTableStep3()) {
		throw `handle read sheet table with object, array, or sheet column with key failure.`;
	}
	if (!await HandleExportAll()) {
		throw `handle export failure.`;
	}
	return true;
}

////////////////////////////////////////////////////////////////////////////////
//#region private side
const WorkerMonitor = new utils.AsyncWorkMonitor();
async function HandleExcelFileWork(fileName: string, cb: (ret: boolean) => void): Promise<void> {
	if (utils.IsFileOrFolderIgnore(fileName)) {
		utils.debug(`- Pass File "${fileName}"`);
		return;
	}

	WorkerMonitor.addWork();
	let ret = false;
	try {
		var ext = path.extname(fileName);
		if (ext == '.csv') ret = await excel_utils.HandleCsvFile(fileName);
		else if (ext == '.xls' || ext == '.xlsx') ret = await excel_utils.HandleExcelFile(fileName);
		else ret = true;
	} catch (ex) {
		utils.logger(`handle fileName failure. ${ex}`);
	}
	cb(ret);
	WorkerMonitor.decWork();
}

async function HandleDir(dirName: string, cb: (ret: boolean) => void): Promise<void> {
	if (utils.IsFileOrFolderIgnore(dirName)) {
		utils.debug(`- Pass Folder "${dirName}"`);
		return;
	}
	WorkerMonitor.addWork();
	const pa = await fs.promises.readdir(dirName);
	pa.forEach(function (fileName) {
		const filePath = path.join(dirName, fileName);
		let info = fs.statSync(filePath);
		if (!info.isFile()) HandleDir(filePath, cb);
		else HandleExcelFileWork(filePath, cb);
	});
	WorkerMonitor.decWork();
}

async function HandleReadHeader(): Promise<boolean> {
	let ret = true;
	const cb = (v: boolean) => {
		ret = ret && v;
	};
	for (let fileOrPath of gCfg.IncludeFilesAndPath) {
		if (!path.isAbsolute(fileOrPath)) {
			fileOrPath = path.join(gRootDir, fileOrPath);
		}
		if (!fs.existsSync(fileOrPath)) {
			utils.exception(`file or directory "${utils.yellow_ul(fileOrPath)}" not found!`);
			break;
		}
		if (fs.statSync(fileOrPath).isDirectory()) {
			HandleDir(fileOrPath, cb);
		} else if (fs.statSync(fileOrPath).isFile()) {
			HandleExcelFileWork(fileOrPath, cb);
		} else {
			utils.exception(`UnHandle file or directory type : "${utils.yellow_ul(fileOrPath)}"`);
		}
	}
	await WorkerMonitor.delay(50);
	await WorkerMonitor.WaitAllWorkDone();
	utils.logger(`${utils.green('[SUCCESS]')} READ ALL SHEET DONE. Total Use Tick : ${utils.green(utils.TimeUsed.LastElapse())}`);
	return ret;
}

async function HandleExportAll(): Promise<boolean> {
	const monitor = new utils.AsyncWorkMonitor();
	let allOK = true;
	for (const kv of utils.ExportExcelDataMap) {
		for (const handler of gExportWrapperLst) {
			monitor.addWork();
			handler.ExportToAsync(kv[1], (ok) => {
				allOK = allOK && ok;
				monitor.decWork();
			});
		}
	}
	// fixme: 后续尽量将ExportToGlobalAsync与ExportToAsync并行执行，增加效率
	await monitor.WaitAllWorkDone();
	for (const handler of gExportWrapperLst) {
		monitor.addWork();
		handler.ExportToGlobalAsync((ok) => {
			allOK = allOK && ok;
			monitor.decWork();
		});
	}
	await monitor.WaitAllWorkDone();
	OnExportAllDone();
	return allOK;
}

//#endregion
