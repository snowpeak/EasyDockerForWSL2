import {ipcRenderer, contextBridge} from 'electron';
import {i18nUtil} from './i18nUtil';

contextBridge.exposeInMainWorld("ExportImageWinBridge",{
    //-------------------------
    // 共通
    //-------------------------
    getMsg:()=>{
        //ipcRenderer.send("getMsg");
        return i18nUtil.getI18nJson();
    },

    selectFile:(x_filterName:string, x_extensions:string[])=>{
        ipcRenderer.send("selectSaveFile", x_filterName, x_extensions);
    },
    resSelectFile:(x_func:(x_path:string)=>void) =>{
        ipcRenderer.on("resSelectSaveFile", (x_event, x_path) =>{
            x_func(x_path);
        })
    },

    //-------------------------
    // コンテナ
    //-------------------------
    getContainers:()=>{
        ipcRenderer.send("getContainers");
    },
    resGetContainers:(x_func:(x_err:any, x_res:{}[])=>void) =>{
        ipcRenderer.on("resGetContainers", (x_event, x_err, x_res) =>{
            x_func(x_err, x_res);
        })
    },
    //-------------------------
    // イメージ
    //-------------------------
    exportImage:(x_id:string, x_path:string, x_info:{})=>{
        ipcRenderer.send("exportImage", x_id, x_path, x_info);
    },
    resExportImage:(x_func:(x_res:{})=>void) =>{
        ipcRenderer.on("resExportImage", (x_event, x_err:string) =>{
            x_func(x_err);
        })
    },
})
