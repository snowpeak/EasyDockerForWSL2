import * as electron from "electron"
const s_app = electron.app;
const BrowserWindow  = electron.BrowserWindow;

export abstract class AbstractWin{
    protected m_win: electron.BrowserWindow | null = null;
    private m_width = -1;
    private m_height = -1;
    private m_dbg = false;

    static s_idWinMap:{[key:number]:AbstractWin} = {};
    static getWinById(x_id: number):AbstractWin{
        let p_ret = AbstractWin.s_idWinMap[x_id];
        return p_ret;
    }

    constructor(x_width:number, x_height:number, x_dbg?:boolean, x_params?:string){
        this.m_width = x_width;
        this.m_height = x_height;
        if(x_dbg != undefined){
            this.m_dbg = x_dbg;
        }
        this.m_win = this.getWin(x_params);
    }
    focus(){
        let p_win = this.getWin();
        p_win.focus();
    }
    isValid():boolean{
        if(this.m_win){
            return true;
        }
        return false;
    }

    abstract getHtmlPath():string;
    abstract getBridgePath():string;

    // override for custom closing
    protected closeWin(){
    }

    public getWin(x_params?:string):electron.BrowserWindow{
        if(this.m_win != null){
            return this.m_win;
        }

        let p_webPreferences : Electron.WebPreferences  = {
            nodeIntegration: false,
            contextIsolation: true,  // true, since electron V12 
        }
        let p_bridgeJS = this.getBridgePath();
        if(p_bridgeJS){
            p_webPreferences.preload = `${__dirname}/${p_bridgeJS}`
        }

        let p_width = this.m_width;
        if(this.m_dbg){
            p_width = this.m_width + 400;
        }
        let p_win = new BrowserWindow({
            width: p_width,
            height: this.m_height,
            webPreferences: p_webPreferences
        });
        p_win.setMenu(null);
        AbstractWin.s_idWinMap[p_win.id] = this;

        if(this.m_dbg){
            p_win.webContents.openDevTools();
        }

        p_win.on('close', ()=>{
            this.closeWin();
            if(this.m_win){
                delete AbstractWin.s_idWinMap[this.m_win.id];
            }
            this.m_win = null;
        })
        let p_html = this.getHtmlPath();
        let p_url = `file://${__dirname}/${p_html}?winId=${p_win.id}`;
        if(x_params){
            p_url += ("&" + x_params);
        }
        p_win.loadURL(p_url);

        this.m_win = p_win;
        return this.m_win;
    }
}