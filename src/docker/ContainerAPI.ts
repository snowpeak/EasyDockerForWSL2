import {APIBase} from "./APIBase";
import {Config} from "../electron/Config";
import * as http from 'http';
import * as log from 'electron-log';
import * as fs from 'fs';
import * as path from 'path';
import * as tar from 'tar';

export type ContainerJson = {
    Id : string,
    Image: string,
    State: string,
    dbInfo:{}
};

export type CreateInfo = {
    Hostname: string,
    Cmd: ["/sbin/init"],
    // Labels:{
    //     [name:string]:string
    // },
    Image: string,
    ExposedPorts:{
        [name:string]:{} // "8080/tcp":{}
    }
    HostConfig:{
        Privileged:boolean,
        PortBindings:{
            [name:string]:[{HostPort:string}], //"8080/tcp":[{"HostPort":"8080"}]
        }
    }
};

export class ContainerAPI extends APIBase{
    public static getAll(x_func:(x_err:string|null, x_ret:[ContainerJson])=>void){
        let p_options = super.getOptions("/containers/json?all=true", "GET", "", "");
        super.sendThenJSON(p_options, null, 200, x_func);
    }

    public static create(x_info:CreateInfo, x_start:boolean, x_func:(x_err:string|null, x_id:string|null)=>void){
        let p_postStr = JSON.stringify(x_info);
        let p_options = super.getOptions("/containers/create", "POST", "application/json", p_postStr);

        let p_req = http.request(p_options, (p_res) => {
            p_res.setEncoding("utf8");
            let p_jsonStr = "";
            p_res.on('data', (chunk)=>{
                p_jsonStr += chunk;
            });

            p_res.on('end', ()=>{
                if(p_res.statusCode != 201){
                    // 失敗
                    x_func(p_jsonStr, null);
                } else if(x_start){
                    let p_json = JSON.parse(p_jsonStr);
                    this.start(p_json.Id, (x_err)=>{
                        x_func(x_err, p_json.Id);
                    })
                } else {
                    let p_json = JSON.parse(p_jsonStr);
                    x_func(null, p_json.Id);
                }
            });
            p_req.on('error', (e) => {
                log.error('problem with request: ' + e.message);
            })
        })
        p_req.write(p_postStr);
        p_req.end();
    }

    public static getFileInfo(x_id:string, x_path:string, x_user:string, x_func:(x_err:string|null, x_infoJson:{}|null)=>void){
        this.execCmd(x_id, ["ls", "-laF", "--file-type", x_path], x_user, (x_err, x_str)=>{
            let p_json = null;
            if(x_str){
                p_json = this.lsToJson(x_str);
            }
            x_func(x_err, p_json);                
        })
    }

    public static execCmd(x_id:string, x_cmds:string[], x_user:string, x_func:(x_err:string|null, x_string:string|null)=>void){
        let p_param = {
            "AttachStdin": false,
            "AttachStdout": true,
            "AttachStderr": true,
            "Tty": false,
            "Cmd": x_cmds,
            "User": x_user
        }
        let p_postStr = JSON.stringify(p_param);
        let p_options = super.getOptions(`/containers/${x_id}/exec`, "POST", "application/json", p_postStr);

        let p_req = http.request(p_options, (p_res) => {
            p_res.setEncoding("utf8");
            let p_resStr = "";
            p_res.on('data', (chunk)=>{
                p_resStr += chunk;
            });

            p_res.on('end', ()=>{
                if(p_res.statusCode != 201){
                    // 失敗
                    x_func(p_resStr, null);
                    return;
                }
                log.info("cmd id = " + p_resStr);
                let p_json = JSON.parse(p_resStr);
                this.startCmd(p_json.Id, (x_err, x_res)=>{
                    x_func(x_err, x_res);
                })
            });
            p_req.on('error', (e) => {
                log.error('problem with request: ' + e.message);
            })
        })
        p_req.write(p_postStr);
        p_req.end();
    }

    private static startCmd(x_cmdid:string, x_func:(x_err:string|null, x_res:string|null)=>void){
        let p_param = {
            "Detach": false,
            "Tty": false
        }
        let p_postStr = JSON.stringify(p_param);
        let p_options = super.getOptions(`/exec/${x_cmdid}/start`, "POST", "application/json", p_postStr);

        let p_req = http.request(p_options, (p_res) => {
            p_res.setEncoding("utf8");
            let p_resStr = "";
            p_res.on('data', (chunk)=>{
                p_resStr += chunk;
            });

            p_res.on('end', ()=>{
                if(p_res.statusCode != 200){
                    // 失敗
                    x_func(p_resStr, null);
                    return;
                }
                log.info("cmd result = " + p_resStr);
                x_func(null, p_resStr);
            });
            p_req.on('error', (e) => {
                log.error('problem with request: ' + e.message);
                x_func(e.message, null);
            })
        })
        p_req.write(p_postStr);
        p_req.end();
    }

    public static downloadFile(x_id:string, x_path:string, x_user:string, x_toDir:string, x_func:(x_err:string|null)=>void){
        let p_options = super.getOptions(`/containers/${x_id}/archive?path=${x_path}`, "GET", "", "");

        fs.mkdirSync(x_toDir, {recursive:true});

        let p_req = http.request(p_options, (p_res) => {
            p_res.pipe(
                tar.x({
                    C: x_toDir
                }).on('error', (x_err)=>{
                    log.error( String(x_err));
                })
            );
            p_res.on('end', ()=>{
                if(p_res.statusCode != 200){
                    // 失敗
                    x_func("error: " + p_res.statusCode);
                    return;
                }
                log.info("file downloaded : " + x_path);
                x_func(null);
            });
            p_req.on('error', (e) => {
                log.error('problem with request: ' + e.message);
                x_func(e.message);
            })
        })
        p_req.end();
    }

    public static uploadFile(x_id:string, x_srcDir:string, x_filename:string, x_toDir:string, x_user:string, x_func:(x_err:string|null)=>void){
        let p_options = super.getOptions(`/containers/${x_id}/archive?path=${x_toDir}`, "PUT", "", "");
        let p_req = http.request(p_options, (p_res) => {
            p_res.setEncoding("utf8");
            let p_resStr = "";
            p_res.on('data', (chunk)=>{
                p_resStr += chunk;
            });
            p_res.on('end', ()=>{
                if(p_res.statusCode != 200){
                    // 失敗
                    x_func("error: " + p_res.statusCode);
                    return;
                }
                log.info("file uploaded : " + x_filename + " to " + x_toDir);
                x_func(null);
            });
            p_req.on('error', (e) => {
                log.error('problem with request: ' + e.message);
                x_func(e.message);
            })
        })
        tar.c(
            {
                C: x_srcDir,
                gzip:true
            },
            [x_filename]
        ).pipe(p_req);
       /*
        tar.c(
            {
                C: x_srcDir,
                gzip:true
            },
            [x_filename]
        ).pipe(fs.createWriteStream(path.resolve(Config.getDataDir(), "test.tar.gz")));
        p_req.end();
        */
    }

    public static start(x_id:string, x_func:(x_err:string|null)=>void){
        let p_options = super.getOptions(`/containers/${x_id}/start`, "POST");
        super.sendThenBool(p_options, null, 204, x_func);
    }
    public static stop(x_id:string, x_func:(x_err:string|null)=>void){
        let p_options = super.getOptions(`/containers/${x_id}/stop`, "POST");
        super.sendThenBool(p_options, null, 204, x_func);
    }
    public static delete(x_id:string, x_func:(x_err:string|null)=>void){
        let p_options = super.getOptions(`/containers/${x_id}?force=true`, "DELETE");
        super.sendThenBool(p_options, null, 204, x_func);
    }
    public static parsePasswd(x_str:string){
        let p_lines = x_str.split(/\r\n|\n/);
        for(let p_line of p_lines){
            let p_tokens = p_line.split(/:/);
            let p_userid = p_tokens[0];
            let p_homeDir = p_tokens[5];
            let p_shell = p_tokens[6];
            log.info(p_userid, + "," + p_homeDir + "," + p_shell);
        }
    }
    public static lsToJson(x_str:string){
        let p_lines = x_str.split(/\r\n|\n/);
        let p_lineNo = 0;
        let p_dirInfo:{[key:string]:string}[] = [];

        for(let p_line of p_lines){
            p_lineNo++;
            if(p_lineNo == 1){
                continue;
            }
            let p_tokens = p_line.split(/\s/);
            if(p_tokens.length < 8){
                continue;
            }

            let p_foundIdx = 0;
            let p_info = {
                permission: "",
                owner: "",
                group: "",
                size: "",
                date: "",
                name: "",
            };
            for(let p_token of p_tokens){
                if( p_foundIdx > 8){
                    p_info.name += p_token;
                    continue;
                }
                if(p_token == ""  || p_token.trim() == ""){
                    continue;
                }
                if(p_foundIdx == 0){
                    p_info.permission = p_token;
                }else if( p_foundIdx == 1){
                    //
                }else if( p_foundIdx == 2){
                    p_info.owner = p_token;
                }else if( p_foundIdx == 3){
                    p_info.group = p_token;
                }else if( p_foundIdx == 4){
                    p_info.size = p_token;
                }else if( p_foundIdx == 5){
                    p_info.date = p_token;
                }else if( p_foundIdx == 6){
                    p_info.date += " " + p_token;
                }else if( p_foundIdx == 7){
                    p_info.date += " " + p_token;
                }else if( p_foundIdx == 8){
                    p_info.name = p_token;
                }
                p_foundIdx++;
            }
            p_dirInfo.push(p_info);
        }
        return p_dirInfo;
    }
}

