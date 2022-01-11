import { toASCII } from "punycode";
import { json } from "stream/consumers";
import { WSL2 } from "./wsl2"

async function status() {
    let result = await WSL2.status();
    console.log(result);
};

async function start() {
    let result = await WSL2.start();
    console.log(result);
};

async function stop() {
    let result = await WSL2.stop();
    console.log(result);
};

async function openConsole(x_id: string) {
    console.log("openConsole");
    let child = await WSL2.openConsole(x_id);
    await new Promise(resolve => setTimeout(resolve, 3000)) // 3秒待つ
    console.log(child);
};

async function requestToOS(x_path: string) {
    await WSL2.requestToOS(x_path);
};
//--------------
// test run
//--------------
//status();
//tart();
//stop();
//openConsole("02e");

/*
(async function () {
    try {
        WSL2.requestToOS("C:\aa130030");
    } catch (error) {
        console.log("exception:" + error);
    }
}())
*/

/*
import * as iconv from 'iconv-lite';
(async function () {
    try {
        let p_res = await WSL2.execCommand("wsl -l --all -v");
        //let p_res = await WSL2.execCommand("dir");
        let p_lines = p_res.split(/[\n\r]/);
        for (let p_line of p_lines) {
            console.log("line:" + p_line);
            let p_tokens = p_line.split(" ");
            for (let p_token of p_tokens) {
                if(p_token.length < 1){
                    continue;
                }
                console.log("  token:[" + p_token + "]" + (p_token.length));
            }
        }
    } catch (error) {
        console.log("exception:" + error);
    }
}())
*/
console.log(process.env['USERPROFILE']);

