import {AbstractWin} from './AbstractWin';
export class LoadImageWin extends AbstractWin{
    constructor(x_width:number, x_height:number, x_dbg?:boolean){
        super(x_width, x_height, x_dbg);
    }

    getHtmlPath():string{
        return "../../html/loadImageWin.html";
    }
    getBridgePath():string{
        return "./LoadImageWin_bridge.js";
    }
}