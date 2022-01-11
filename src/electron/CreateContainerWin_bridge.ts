import {ipcRenderer, contextBridge} from 'electron';
import {i18nUtil} from './i18nUtil';

contextBridge.exposeInMainWorld("CreateContainerWinBridge",{
    //-------------------------
    // 共通
    //-------------------------
    getMsg:()=>{
        return i18nUtil.getI18nJson();
    },
    //-------------------------
    // コンテナ
    //-------------------------
    createContainer:(x_name:string, x_repo:string, x_tag:string, x_service:string, x_host:string, x_protocols:string[], x_locals:string[], x_remotes:string[], x_memo:string)=>{
        ipcRenderer.send("createContainer", x_name, x_repo, x_tag, x_service, x_host, x_protocols, x_locals, x_remotes, x_memo);
    },
    resCreateContainer:(x_func:(x_err:string)=>void) =>{
        ipcRenderer.on("resCreateContainer", (x_event, x_err:string) =>{
            x_func(x_err);
        })
    },
    //-------------------------
    // イメージ
    //-------------------------
    getImageById:(x_id:string)=>{
        ipcRenderer.send("getImageById", x_id);
    },
    resGetImageById:(x_func:(x_err:string, x_res:{}, x_info:{})=>void) =>{
        ipcRenderer.on("resGetImageById", (x_event, x_err, x_res, x_info) =>{
            x_func(x_err, x_res, x_info);
        })
    },
})
