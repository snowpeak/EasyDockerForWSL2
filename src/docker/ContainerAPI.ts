import {APIBase} from "./APIBase";
import * as http from 'http';
import * as log from 'electron-log';

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
}

