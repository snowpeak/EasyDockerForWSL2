import {ipcRenderer, contextBridge} from 'electron';
import {i18nUtil} from './i18nUtil';
import {ContainerJson} from '../docker/ContainerAPI';

contextBridge.exposeInMainWorld("MainWinBridge",{
    //-------------------------
    // 共通
    //-------------------------
    getMsg:()=>{
        //ipcRenderer.send("getMsg");
        return i18nUtil.getI18nJson();
    },
    //-------------------------
    // コンテナ
    //-------------------------
    getContainers:()=>{
        ipcRenderer.send("getContainers");
    },
    resGetContainers:(x_func:(x_err:any, x_res:ContainerJson[])=>void) =>{
        ipcRenderer.on("resGetContainers", (x_event, x_err, x_res) =>{
            x_func(x_err, x_res);
        })
    },

    fileWin:(x_id:string)=>{
        ipcRenderer.send("fileWin", x_id);
    },

    startContainer:(x_id:string)=>{
        ipcRenderer.send("startContainer", x_id);
    },
    resStartContainer:(x_func:(x_err:any, x_id:string)=>void) =>{
        ipcRenderer.on("resStartContainer", (x_event, x_err, x_id) =>{
            x_func(x_err, x_id);
        })
    },

    stopContainer:(x_id:string)=>{
        ipcRenderer.send("stopContainer", x_id);
    },
    resStopContainer:(x_func:(x_err:any, x_id:string)=>void) =>{
        ipcRenderer.on("resStopContainer", (x_event, x_err, x_id) =>{
            x_func(x_err, x_id);
        })
    },
    openConsole:(x_id:string)=>{
        ipcRenderer.send("openConsole", x_id);
    },
    openHostConsole:()=>{
        ipcRenderer.send("openHostConsole");
    },

    exportImageWin:(x_id:string)=>{
        ipcRenderer.send("exportImageWin", x_id);
    },

    editMemoWin:(x_id:string)=>{
        ipcRenderer.send("editMemoWin", x_id);
    },

    deleteContainer:(x_id:string)=>{
        ipcRenderer.send("deleteContainer", x_id);
    },
    resDeleteContainer:(x_func:(x_id:string)=>void) =>{
        ipcRenderer.on("resDeleteContainer", (x_event, x_id) =>{
            x_func(x_id);
        })
    },

    //-------------------------
    // イメージ
    //-------------------------
    getImages:()=>{
        ipcRenderer.send("getImages");
    },
    resGetImages:(x_func:(x_err:string, x_res:{})=>void) =>{
        ipcRenderer.on("resGetImages", (x_event, x_err, x_res) =>{
            x_func(x_err, x_res);
        })
    },
    createContainerWin:(x_id:string)=>{
        ipcRenderer.send("createContainerWin", x_id);
    },
    deleteImage:(x_id:string)=>{
        ipcRenderer.send("deleteImage", x_id);
    },
    resDeleteImage:(x_func:(x_err:string, x_id:string)=>void) =>{
        ipcRenderer.on("resDeleteImage", (x_event, x_err, x_id) =>{
            x_func(x_err, x_id);
        })
    },
    loadImageWin:()=>{
        ipcRenderer.send("loadImageWin");
    },
    //-------------------------
    // 設定
    //-------------------------
    getStatus:()=>{
        ipcRenderer.send("getStatus");
    },
    resGetStatus:(x_func:(x_status:{})=>void) =>{
        ipcRenderer.on("resGetStatus", (x_event, x_status) =>{
            x_func(x_status);
        })
    },

    installDocker:()=>{
        ipcRenderer.send("installDocker");
    },
    resInstallDocker:(x_func:(x_status:boolean)=>void) =>{
        ipcRenderer.on("resInstallDocker", (x_event, x_status) =>{
            x_func(x_status);
        })
    },  
    deleteDocker:()=>{
        ipcRenderer.send("deleteDocker");
    },
    resDeleteDocker:(x_func:(x_status:boolean)=>void) =>{
        ipcRenderer.on("resDeleteDocker", (x_event, x_status) =>{
            x_func(x_status);
        })
    },  

    startDocker:()=>{
        ipcRenderer.send("startDocker");
    },
    resStartDocker:(x_func:(x_status:boolean)=>void) =>{
        ipcRenderer.on("resStartDocker", (x_event, x_status) =>{
            x_func(x_status);
        })
    },   
    stopDocker:()=>{
        ipcRenderer.send("stopDocker");
    },
    resStopDocker:(x_func:(x_status:boolean)=>void) =>{
        ipcRenderer.on("resStopDocker", (x_event, x_status) =>{
            x_func(x_status);
        })
    },   
    requestToOS:(x_path:string)=>{
        ipcRenderer.send("requestToOS", x_path);
    },
    getConfig:()=>{
        ipcRenderer.send("getConfig");
    },
    saveConfig:(x_config:{})=>{
        ipcRenderer.send("saveConfig", x_config);
    },
    resGetConfig:(x_func:(x_config:{})=>void) =>{
        ipcRenderer.on("resGetConfig", (x_event, x_config) =>{
            x_func(x_config);
        })
    },
})
