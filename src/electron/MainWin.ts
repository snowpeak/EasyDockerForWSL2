import {AbstractWin} from './AbstractWin';
export class MainWin extends AbstractWin{
    constructor(x_width:number, x_height:number, x_dbg?:boolean){
        super(x_width, x_height, x_dbg);
    }

    getHtmlPath():string{
        return "../../html/mainWin.html";
    }
    getBridgePath():string{
        return "./MainWin_bridge.js";
    }
}