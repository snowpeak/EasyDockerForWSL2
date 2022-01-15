import * as http from 'http';
import {Config} from '../electron/Config';
import * as log from 'electron-log';

export type IdJson = {
    Id : string,
    [key:string]:string
}

export abstract class APIBase{
    public static getOptions(x_path:string, x_method:string, x_contentType?:string, x_postData?:string):{}{
        let p_config = Config.getInstance();

        let p_options = {
          host: p_config.getString('host', ""),
          port: p_config.getString('port', ""),
          path: x_path,
          method: x_method,
          headers: {}
        }
        if(x_contentType != null && x_contentType != ""
            && x_postData != null && x_postData != ""){
            p_options.headers = {
              'Content-Type' : x_contentType,
              'Content-Length' : Buffer.byteLength(x_postData)
            }
        }
        return p_options;
    }

    protected static sendThenJSON(x_options:{}, x_postData:string|null, x_success:number, 
        x_func:(x_err:string|null, x_json:any)=>void){
        let p_req = http.request(x_options, (p_res) => {
            p_res.setEncoding("utf8");
            let p_jsonStr = "";
            p_res.on('data', (chunk) => {
                p_jsonStr += chunk;
            });

            p_res.on('end', () => {
                if(p_res.statusCode != x_success){
                    x_func("Error status code : " + p_res.statusCode, null);                    
                }
                try {
                    let p_json = JSON.parse(p_jsonStr);
                    x_func(null, p_json);
                } catch (e) {
                    x_func("JSON parse err: " + p_jsonStr, null);
                }
            });
        })
        p_req.on('error', (e) => {
            log.error('problem with request: ' + e.message);
            x_func(e.message, null);
        })
        if(x_postData){
            p_req.write(x_postData);
        }
        p_req.end();
    }

    protected static sendThenBool(x_options:{}, x_postData:string|null, x_success:number, x_func:(x_err:string|null)=>void){
        let p_req = http.request(x_options, (p_res) => {
            p_res.setEncoding("utf8");
            let p_resStr = "";
            p_res.on('data', (chunk)=>{
                p_resStr += chunk;
            });

            p_res.on('end', ()=>{
                if(p_res.statusCode == x_success){
                    // 成功
                    x_func(null);
                } else {
                    // 失敗
                    x_func(p_resStr);
                }
            });
            p_req.on('error', (e) => {
                x_func(e.message);
            })
        })
        if(x_postData){
            p_req.write(x_postData);
        }
        p_req.end();        
    }
}