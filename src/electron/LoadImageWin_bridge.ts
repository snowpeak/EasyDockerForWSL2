import {ipcRenderer, contextBridge} from 'electron';
import {i18nUtil} from './i18nUtil';

contextBridge.exposeInMainWorld("LoadImageWinBridge",{
    //-------------------------
    // 共通
    //-------------------------
    getMsg:()=>{
        //ipcRenderer.send("getMsg");
        return i18nUtil.getI18nJson();
    },

    selectFile:(x_filterName:string, x_extensions:string[])=>{
        ipcRenderer.send("selectOpenFile", x_filterName, x_extensions);
    },
    resSelectFile:(x_func:(x_path:string)=>void) =>{
        ipcRenderer.on("resSelectOpenFile", (x_event, x_path) =>{
            x_func(x_path);
        })
    },

    //-------------------------
    // イメージ
    //-------------------------
    loadImage:(x_path:string, x_repo:string, x_tag:string)=>{
        ipcRenderer.send("loadImage", x_path, x_repo, x_tag);
    },
    resLoadImage:(x_func:(x_res:{})=>void) =>{
        ipcRenderer.on("resLoadImage", (x_event, x_err:string) =>{
            x_func(x_err);
        })
    },
})
