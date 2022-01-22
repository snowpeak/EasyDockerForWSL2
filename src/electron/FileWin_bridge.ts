import {ipcRenderer, contextBridge} from 'electron';
import {i18nUtil} from './i18nUtil';

contextBridge.exposeInMainWorld("FileWinBridge",{
    //-------------------------
    // 共通
    //-------------------------
    getMsg:()=>{
        //ipcRenderer.send("getMsg");
        return i18nUtil.getI18nJson();
    },

    getUserInfo:(x_id:string)=>{
        ipcRenderer.send("getUserInfo", x_id);
    },
    resGetUserInfo:(x_func:(x_err:string, x_res:{}[]|null)=>void) =>{
        ipcRenderer.on("resGetUserInfo", (x_event, x_err, x_res) =>{
            x_func(x_err, x_res);
        })
    },

    getFileInfo:(x_id:string, x_dir:string, x_user:string)=>{
        ipcRenderer.send("getFileInfo", x_id, x_dir, x_user);
    },
    resGetFileInfo:(x_func:(x_err:string, x_res:{}[]|null)=>void) =>{
        ipcRenderer.on("resGetFileInfo", (x_event, x_err, x_res) =>{
            x_func(x_err, x_res);
        })
    },

    downloadFile:(x_containerId:string, x_winId:number, x_dir:string, x_user:string, x_spinnerid:number)=>{
        ipcRenderer.send("downloadFile", x_containerId, x_winId, x_dir, x_user, x_spinnerid);
    },
    resDownloadFile:(x_func:(x_err:string, x_spinnerid:number)=>void) =>{
        ipcRenderer.on("resDownloadFile", (x_event, x_err, x_spinnerid) =>{
            x_func(x_err, x_spinnerid);
        })
    },

    deleteFile:(x_containerId:string, x_path:string, x_user:string)=>{
        ipcRenderer.send("deleteFile", x_containerId, x_path, x_user);
    },
    resDeleteFile:(x_func:(x_err:string)=>void) =>{
        ipcRenderer.on("resDeleteFile", (x_event, x_err) =>{
            x_func(x_err);
        })
    },

    uploadFile:(x_containerId:string, x_winId:number, x_file:string, x_toDir:string, x_user:string, x_spinnerid:number)=>{
        ipcRenderer.send("uploadFile", x_containerId, x_winId, x_file, x_toDir, x_user, x_spinnerid);
    },
    resUploadFile:(x_func:(x_err:string, x_spinnerid:number)=>void) =>{
        ipcRenderer.on("resUploadFile", (x_event, x_err, x_spinnerid) =>{
            x_func(x_err, x_spinnerid);
        })
    },

    reloadWorkDir:(x_winId:number)=>{
        ipcRenderer.send("reloadWorkDir", x_winId);
    },
    resReloadWorkDir:(x_func:(x_err:string, x_files:{}[]|null)=>void) =>{
        ipcRenderer.on("resReloadWorkDir", (x_event, x_err, x_files) =>{
            x_func(x_err, x_files);
        })
    },

    openFile:(x_winId:number, x_file:string)=>{
        ipcRenderer.send("openFile", x_winId, x_file);
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
