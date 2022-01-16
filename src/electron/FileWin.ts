import * as fs from 'fs';
import * as path from 'path';
import {Config} from './Config';

import {AbstractWin} from './AbstractWin';
export class FileWin extends AbstractWin{
    private m_dir:string = "";

    constructor(x_width:number, x_height:number, x_dbg?:boolean, x_params?:string){
        super(x_width, x_height, x_dbg, x_params);

        if(this.m_win){
            let p_config = Config.getInstance();
            this.m_dir = path.resolve(Config.getDataDir(), "download", String(this.m_win.id));
        }
    }

    protected closeWin(): void {
        if(this.m_dir != ""){
            fs.rmSync(this.m_dir, { recursive: true, force:true });
        }        
    }

    getHtmlPath():string{
        return "../../html/fileWin.html";
    }
    getBridgePath():string{
        return "./FileWin_bridge.js";
    }

    getWorkDir():string{
        return this.m_dir;
    }
}