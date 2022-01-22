import {ipcRenderer, contextBridge} from 'electron';
import {i18nUtil} from './i18nUtil';

contextBridge.exposeInMainWorld("PullImageWinBridge",{
    //-------------------------
    // 共通
    //-------------------------
    getMsg:()=>{
        //ipcRenderer.send("getMsg");
        return i18nUtil.getI18nJson();
    },

    openHub:(x_type:string)=>{
        ipcRenderer.send("openHub", x_type);
    },
    pullImage:(x_imageTag:string)=>{
        ipcRenderer.send("pullImage", x_imageTag);
    },
    resPullImage:(x_func:(x_code:number)=>void) =>{
        ipcRenderer.on("resPullImage", (x_event, x_code) =>{
            x_func(x_code);
        })
    }
})
