import {AbstractWin} from './AbstractWin';
export class CreateContainerWin extends AbstractWin{
    constructor(x_width:number, x_height:number, x_dbg:boolean, x_params?:string){
        super(x_width, x_height, x_dbg, x_params);
    }

    getHtmlPath():string{
        return "../../html/createContainerWin.html";
    }
    getBridgePath():string{
        return "./CreateContainerWin_bridge.js";
    }
}