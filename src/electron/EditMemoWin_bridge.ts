import {ipcRenderer, contextBridge} from 'electron';
import {i18nUtil} from './i18nUtil';

contextBridge.exposeInMainWorld("EditMemoWinBridge",{
    //-------------------------
    // 共通
    //-------------------------
    getMsg:()=>{
        //ipcRenderer.send("getMsg");
        return i18nUtil.getI18nJson();
    },

    saveMemo:(x_id:string, x_memo:string)=>{
        ipcRenderer.send("saveMemo", x_id, x_memo);
    },
    resSaveMemo:(x_func:(x_err:string)=>void) =>{
        ipcRenderer.on("resSaveMemo", (x_event, x_err) =>{
            x_func(x_err);
        })
    },

    //-------------------------
    // コンテナ
    //-------------------------
    getContainerDB:(x_id:string)=>{
        ipcRenderer.send("getContainerDB", x_id);
    },
    resGetContainerDB:(x_func:(x_err:string, x_res:{})=>void) =>{
        ipcRenderer.on("resGetContainerDB", (x_event, x_err, x_res) =>{
            x_func(x_err, x_res);
        })
    },
})
