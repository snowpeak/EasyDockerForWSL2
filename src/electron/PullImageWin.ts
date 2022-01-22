import {AbstractWin} from './AbstractWin';
export class PullImageWin extends AbstractWin{
    constructor(x_width:number, x_height:number, x_dbg?:boolean){
        super(x_width, x_height, x_dbg);
    }

    getHtmlPath():string{
        return "../../html/pullImageWin.html";
    }
    getBridgePath():string{
        return "./PullImageWin_bridge.js";
    }
}