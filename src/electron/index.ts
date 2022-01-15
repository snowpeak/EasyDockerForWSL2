import * as electron from "electron";
const app = electron.app;
import {ipcMain} from "electron";
import {ElectronLog} from "electron-log";
import * as log from "electron-log";

import {Config} from './Config';
import path from "path";
import fs from "fs";

import {MainWin} from './MainWin';

//------------------------
// 定数定義
//------------------------
const VER_NO = "1.1.0";

//------------------------
// スタティック変数
//------------------------
var s_tray:electron.Tray|null = null;
var s_mainWin:MainWin|null = null;
var s_config = Config.getInstance();

//-------------------------
// ログ関連
//------------------------
let logfile = path.resolve(Config.getDataDir(), "log.txt" );
//fs.unlinkSync(logfile);
log.transports.file.resolvePath = () => path.resolve(Config.getDataDir(), "log.txt" );
log.transports.file.level = false; 
let p_config_loglevel = s_config.getString("loglevel", "");
if("error" == p_config_loglevel){
	log.transports.file.level = "error";
}else if("info" == p_config_loglevel){
	log.transports.file.level = "info";
}
log.info('app start');

//-------------------------
// タスクトレイ作成
//------------------------
function createTray(){
	// タスクトレイ
    const p_ext = process.platform === 'win32' ? 'ico' : 'png';
    const p_iconPath = `${__dirname}/../../resource/image/icon-32.${p_ext}`;
	const p_tray = new electron.Tray(p_iconPath);
	const nativeImage = electron.nativeImage;
	p_tray.setContextMenu(electron.Menu.buildFromTemplate([
        /*
		{
			label: s_msgDic["maintenance_data"],
			icon: nativeImage.createFromPath(`${__dirname}/../image/editList.png`),
			click: () => {
                createAccountListWin();
			}
		},
        */
        {
			label: 'About',
			//role: 'about',
			icon: nativeImage.createFromPath(`${__dirname}/../../resource/image/icon-32.png`),
			click: () => {
				electron.dialog.showMessageBoxSync({
					title: 'EasyDocker for WSL2 ${VERNO}',
					message: "メッセージ",
					detail:  "詳細"
				});
			}
		},
		{
			type: 'separator'
		},
		{
			label: 'Exit',
			role: 'quit',
			icon: nativeImage.createFromPath(`${__dirname}/../../resource/image/close-32.png`),
		}
	]));
	
	p_tray.on('click', (event, bounds, position) => {
        if(s_mainWin && s_mainWin.getWin()){
            s_mainWin.focus();
        }else{
			let p_width = s_config.getNum("mainWin/width", 1000);
			let p_height = s_config.getNum("mainWin/height", 800);
			let p_dbg = s_config.getBool("dbg", false);
            s_mainWin = new MainWin(p_width, p_height, p_dbg);
        }
	});
	return p_tray;
}

import { createConnection, Entity}  from "typeorm";
import { Connection } from "typeorm";
var s_con:Connection;

app.on('ready', ()=>{
    s_tray = createTray();

	let p_confg = Config.getInstance();
	let p_dir = Config.getDataDir();
	let p_dbfile = path.resolve(p_dir, "database.sqlite3");
	createConnection({
		"type": "sqlite",
		"database": p_dbfile,
		"entities":[
			path.resolve(__dirname, "../database/entity/**/*.entity.js"),
		],    
		"synchronize": true
	}).then(async con => {
		s_con = con;
		log.info("db connection established:" + p_dbfile)
	}).catch(error => log.error(error));

	let p_config = Config.getInstance();
	let p_autorun = p_config.getString("autorun", "");
	if(p_autorun == "Y"){
		WSL2.start();
	}
});

// 終了処理
app.on('window-all-closed', ()=>{
    //タスクトレイ化するのでwindowが閉じても終了しない
});

app.on('activate', ()=>{
    if(!s_mainWin){
		let p_width = s_config.getNum("mainWin/width", 1000);
		let p_height = s_config.getNum("mainWin/height", 800);
		let p_dbg = s_config.getBool("dbg", false);
		s_mainWin = new MainWin(p_width, p_height, p_dbg);
    }
});

//--------------------------------
// Windowとの通信部
//--------------------------------
ipcMain.on('selectOpenFile', (x_event, x_filterName:string, x_extends: string[]) => {
	let p_win = s_mainWin;
	let p_filenames = electron.dialog.showOpenDialogSync({
		properties: ['openFile'],
		title: 'Select File',
		defaultPath: '.',
		filters: [
			{
				name: x_filterName,
				extensions: x_extends
			}
		]
	});

	if(p_filenames && p_filenames.length > 0){
		x_event.sender.send("resSelectOpenFile", p_filenames[0]);
	} else{
		x_event.sender.send("resSelectOpenFile", null);
	}
})

ipcMain.on('selectSaveFile', (x_event, x_filterName:string, x_extends: string[]) => {
	let p_win = s_mainWin;
	let p_filepath = electron.dialog.showSaveDialogSync({
		properties: ['createDirectory'],
		title: 'Select File',
		defaultPath: '.',
		filters: [
			{
				name: x_filterName,
				extensions: x_extends
			}
		]
	});

	if(p_filepath){
		x_event.sender.send("resSelectSaveFile", p_filepath);
	} else{
		x_event.sender.send("resSelectSaveFile", null);
	}
})

// container 操作
import {ContainerAPI, ContainerJson, CreateInfo} from "../docker/ContainerAPI"
ipcMain.on('getContainers', (x_event)=>{
	getAllContainer(x_event.sender);
})

function getAllContainer(x_webContents:Electron.WebContents){
	try {
		ContainerAPI.getAll((x_err, x_ret) => {
			if (x_err) {
				x_webContents.send('resGetContainers', x_err, x_ret);
			} else {
				ContainerTbl.getAll(s_con)
					.then((x_map) => {
						for (let p_container of x_ret) {
							let p_id = p_container.Id;
							let p_dbInfo = x_map[p_id];
							p_container['dbInfo'] = p_dbInfo;
						}
						x_webContents.send('resGetContainers', x_err, x_ret);
					})
			}
		});
	} catch (e) {
		let p_msg = "error";
		if(e instanceof Error){
			p_msg = e.message;
		}
		x_webContents.send('resGetContainers', p_msg, null);
	}	
}

ipcMain.on('startContainer', (x_event, x_id)=>{
	ContainerAPI.start(x_id, (x_err)=>{
		x_event.sender.send('resStartContainer', x_err, x_id);
	})
})
ipcMain.on('stopContainer', (x_event, x_id)=>{
	ContainerAPI.stop(x_id, (x_err)=>{
		x_event.sender.send('resStopContainer', x_err, x_id);
	})
})
ipcMain.on('deleteContainer', (x_event, x_id)=>{
	ContainerAPI.delete(x_id, (x_err)=>{
		if(!x_err){
			ContainerTbl.delete(s_con, x_id);
		}
		x_event.sender.send('resDeleteContainer', x_err,x_id);
	})
})
ipcMain.on('getContainerDB', (x_event, x_id)=>{
	ContainerTbl.getOne(s_con, x_id)
	.then((x_res)=>{
		x_event.sender.send('resGetContainerDB', null, x_res);
	},(x_err)=>{
		x_event.sender.send('resGetContainerDB', x_err, null);
	})
})
import {EditMemoWin} from './EditMemoWin';
ipcMain.on('editMemoWin', (x_event, x_id:string)=>{
	let p_width = s_config.getNum("editMemoWin/width", 600);
	let p_height = s_config.getNum("editMemoWin/height", 800);
	let p_dbg = s_config.getBool("dbg", false);
	let p_win = new EditMemoWin(p_width, p_height, p_dbg, "containerId=" + x_id);
})
ipcMain.on('saveMemo', (x_event, x_id, x_memo)=>{
	ContainerTbl.getOne(s_con, x_id)
	.then((x_res)=>{
		if(x_res){
			x_res.memo = x_memo;
			x_res.save(s_con)
			.then((x_obj)=>{
				x_event.sender.send('resSaveMemo', null);
				if(s_mainWin){
					getAllContainer(s_mainWin?.getWin().webContents);
				}
			},(x_err)=>{
				x_event.sender.send('resSaveMemo', x_err);
			})
		}
	},(x_err)=>{
		x_event.sender.send('resSaveMemo', x_err);
	})
})

import {WSL2} from "../wsl2/wsl2"
ipcMain.on('openConsole', (x_event, x_id)=>{
	WSL2.openConsole(x_id);
})
ipcMain.on('openHostConsole', (x_event)=>{
	WSL2.openHostConsole();
})
ipcMain.on('requestToOS', (x_event, x_path)=>{
	WSL2.requestToOS(x_path);
})

// コンテナ生成
import {CreateContainerWin} from './CreateContainerWin';
ipcMain.on('createContainerWin', (x_event, x_id:string)=>{
	let p_width = s_config.getNum("createContainerWin/width", 800);
	let p_height = s_config.getNum("createContainerWin/height", 800);
	let p_dbg = s_config.getBool("dbg", false);
	let p_win = new CreateContainerWin(p_width, p_height, p_dbg, "imageId=" + x_id);
})

import {Container as ContainerTbl} from '../database/entity/Container.entity';
ipcMain.on('createContainer', (x_event, x_name, x_repo, x_tag, x_service,
 	 x_host, x_protocols, x_locals, x_remotes, x_memo)=>{
		let p_exposedPorts:{[name:string]:{}} = {};
		let p_portBindings:{[name:string]:[{"HostPort":string}]} = {};

		let p_portJson:[{protocol:string, local:string, remote:string}]|null= null;
		for(let i=0; i<x_protocols.length; i++){
			if(x_protocols[i]){
				let p_remotePort = `${x_remotes[i]}/${x_protocols[i]}`;
				p_exposedPorts[p_remotePort] = {};
				p_portBindings[p_remotePort] = [{"HostPort": x_locals[i]}]
			}
				if(p_portJson == null){
					p_portJson = [{protocol:x_protocols[i], local: x_locals[i], remote:x_remotes[i]}];
				}else{
					p_portJson.push({protocol:x_protocols[i], local: x_locals[i], remote:x_remotes[i]});
				}
		  }

			let p_info:CreateInfo = {
				Hostname: x_host,
				Cmd: ["/sbin/init"],
				Image: x_repo + ":" + x_tag,
				ExposedPorts: p_exposedPorts,
				HostConfig: {
					Privileged: ("Y"==x_service),
					PortBindings: p_portBindings,
				},
			}
			ContainerAPI.create(p_info, true, (x_err, x_id)=>{
				if( x_err ){
					log.error("failed to create container, reason=" + x_err);
					if(x_id){
						// delete
						ContainerAPI.delete(x_id, (x_err)=>{
							if(x_err){
								log.error("failed to delete container, id=" + x_id);
							}else{
								log.error("deleted container, id=" + x_id);
							}
						})
					}
					x_event.sender.send("resCreateContainer", x_err);

				}else if(x_id){
					let p_db = new ContainerTbl(x_id, x_name, x_repo, x_tag, x_service, x_host, JSON.stringify(p_portJson), x_memo, new Date().getTime());
					p_db.save(s_con);

					x_event.sender.send("resCreateContainer", null);// success
					if(s_mainWin){
						getAllContainer(s_mainWin.getWin().webContents);
					}
				}
			})
})


// image 操作
import {ImageAPI, ImageJson} from "../docker/ImageAPI"
ipcMain.on('getImages', (x_event)=>{
	ImageAPI.getAll((x_err, x_ret)=>{
		x_event.sender.send('resGetImages', x_err, x_ret);
	});
})

ipcMain.on('getImageById', (x_event, x_id)=>{
	ImageAPI.getAll((x_err, x_ret)=>{
		if(x_ret != null){
			for(let p_image of x_ret){
				if(p_image.Id == x_id){
					ImageTbl.getOne(s_con, x_id)
					.then(x_imgTbl=>{
						let p_info:{}|null = null;
						if(x_imgTbl != null){
							try{
								log.info(x_imgTbl.info_json);
								p_info = JSON.parse(x_imgTbl.info_json);
							}catch(e){
								log.error(e);
							}
						}
						x_event.sender.send('resGetImageById', x_err, p_image, p_info);
					},(x_err=>{
						x_event.sender.send('resGetImageById', x_err, null, null);
					}))
				}
			}
		}
	});
})


ipcMain.on('deleteImage', (x_event, x_id)=>{
	ImageAPI.delete(x_id, (x_err)=>{
		x_event.sender.send('resDeleteImage', x_err, x_id);
		if(!x_err){
			ImageTbl.delete(s_con, x_id);
		}
	})
})

// Image書き出し
import {ExportImageWin} from './ExportImageWin';
ipcMain.on('exportImageWin', (x_event, x_id:string)=>{
	let p_width = s_config.getNum("exportImageWin/width", 700);
	let p_height = s_config.getNum("exportImageWin/height", 800);
	let p_dbg = s_config.getBool("dbg", false);
	let p_win = new ExportImageWin(p_width, p_height, p_dbg, "containerId=" + x_id);
})
ipcMain.on('exportImage', (x_event, x_id, x_filePath, x_info)=>{
	ImageAPI.exportImage(x_id, x_filePath, x_info, (x_err)=>{
		x_event.sender.send("resExportImage", x_err);
	})
})

import {LoadImageWin} from './LoadImageWin';
ipcMain.on('loadImageWin', (x_event)=>{
	let p_width = s_config.getNum("loadImageWin/width", 700);
	let p_height = s_config.getNum("loadImageWin/height", 800);
	let p_dbg = s_config.getBool("dbg", false);
	let p_win = new LoadImageWin(p_width, p_height, p_dbg);
})

import {Image as ImageTbl} from '../database/entity/Image.entity';
ipcMain.on('loadImage', (x_event, x_filePath, x_repo, x_tag) => {
	// x_repo と x_tag が被らないか確認する
	getImageByRepoTag(x_repo, x_tag, (x_img) => {
		if (x_img != null) {
			x_event.sender.send("resLoadImage", "Duplicate TagName, " + x_repo + ":" + x_tag);
			return;
		} else {
			// 重複なし
			ImageAPI.loadImage(x_filePath, x_repo, x_tag, (x_err, x_info) => {
				x_event.sender.send("resLoadImage", x_err);
				if (!x_err) {
					if (x_info != null) {
						getImageByRepoTag(x_repo, x_tag, (x_img) => {
							if (x_img != null) {
								let p_db = new ImageTbl(x_img.Id, x_info);
								p_db.save(s_con);
							}
							ImageAPI.getAll((x_err, x_ret) => {
								s_mainWin?.getWin().webContents.send("resGetImages", x_err, x_ret);
							});
						})
					} else {
						ImageAPI.getAll((x_err, x_ret) => {
							s_mainWin?.getWin().webContents.send("resGetImages", x_err, x_ret);
						});

					}
				}
			})
		}
	})
})

function getImageByRepoTag(x_repo: string, x_tag: string, x_func: (x_img: ImageJson | null) => void) {
	ImageAPI.getAll((x_err, x_ret) => {
		let p_retImage = null;
		if (x_ret != null) {
			let p_checkRepo = x_repo + ":" + x_tag;
			for (let p_image of x_ret) {
				let p_repos = p_image.RepoTags;
				for (let p_repo of p_repos) {
					if (p_repo == p_checkRepo) {
						p_retImage = p_image;
						break;
					}
				}
			}
		}
		x_func(p_retImage);
	});
}

//--------------------
// 設定関連
//--------------------
ipcMain.on('getStatus', (x_event)=>{
	let p_status = {
		wsl2: false,
		easydocker: false,
		dockerEngine: false
	};
	(async function(){
		try {
			let p_res = await WSL2.execCommand("wsl -l --all -v", "UTF-16");
			p_status.wsl2 = true;

			let p_lines = p_res.split(/[\n\r]/);
			for (let p_line of p_lines) {
				let p_tokens = p_line.split(" ");
				for (let p_token of p_tokens) {
					if (p_token.length < 1) {
						continue;
					}
					if(p_token == WSL2.DISTRIBUTION){
						p_status.easydocker = true;

						if(p_line.indexOf("Running") >= 0){
							p_status.dockerEngine = true;
						}
						break;
					}
				}
			}
		}catch(err)	{
			p_status.wsl2 = false;
		}
		x_event.sender.send('resGetStatus', p_status);
	}());
})

ipcMain.on('installDocker', (x_event) => {
	WSL2.install((x_result)=>{
		x_event.sender.send('resInstallDocker', x_result);
		log.info("replay resInstallDocker");
	});
})
ipcMain.on('deleteDocker', (x_event) => {
	(async function () {
		let p_res = await WSL2.delete();
		x_event.sender.send('resDeleteDocker', p_res);
	}());
})

ipcMain.on('startDocker', (x_event) => {
	(async function () {
		let p_res = await WSL2.start();
		x_event.sender.send('resStartDocker', p_res);
	}());
})
ipcMain.on('stopDocker', (x_event) => {
	(async function () {
		let p_res = await WSL2.stop();
		x_event.sender.send('resStopDocker', p_res);
	}());
})

ipcMain.on('getConfig', (x_event)=>{
	let p_config = Config.getInstance().getConfig();
	x_event.sender.send('resGetConfig', p_config);
})
ipcMain.on('saveConfig', (x_event, x_config)=>{
	let p_config = Config.getInstance();
	for(let p_key in x_config){
		let p_value = x_config[p_key];
		p_config.setParam(p_key, p_value);
	}
	p_config.saveConfig();
	x_event.sender.send('resGetConfig', p_config.getConfig());
})