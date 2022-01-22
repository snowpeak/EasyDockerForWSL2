import {exec, spawn, ChildProcess, execSync} from "child_process";
import {shell} from "electron";
import * as path from 'path';
import * as fs from 'fs';
import * as iconv from 'iconv-lite';
import {Config} from '../electron/Config';

import * as log from "electron-log";

export class WSL2 {
    public static DISTRIBUTION = "EasyDocker";

    public static async status():Promise<boolean>{
        let p_result = await this.execCommand(`wsl -d ${WSL2.DISTRIBUTION} -e /etc/init.d/docker status`, "UTF-8");
        log.info("WSL2.status(): " + p_result);
        if(p_result.indexOf("running") < 0){
            return false;
        }
        return true;
    }
    public static install(x_func: (x_result: boolean) => void) {
        let p_srcFile = path.resolve(__dirname, "../../resource/easydocker.tar.gz");
        let p_workDir = Config.getDataDir();
        let p_workFile = path.resolve(p_workDir, "easydocker.tar.gz");
        // p_srcFileを を p_workDir に移動する
        try {
            log.info("WSL2.install() step1: prepare file");
            let p_in = fs.createReadStream(p_srcFile);
            let p_out = fs.createWriteStream(p_workFile);
            p_out.on('close', async () => {
                log.info("copy finished");

                let p_cmd = `wsl --import ${WSL2.DISTRIBUTION} "${p_workDir}" "${p_workFile}"`;
                log.info("WSL2.install() step2: " + p_cmd);
                await this.execCommand(p_cmd, "UTF-16");
                fs.rmSync(p_workFile);

                p_cmd = `wsl --set-version ${WSL2.DISTRIBUTION} 2`;
                log.info("WSL2.install() step3: " + p_cmd);
                await this.execCommand(p_cmd, "UTF-16");

                log.info("WSL2.install() step4: start Docker");
                await this.start();
                x_func(true);
            })
            let p_result = p_in.pipe(p_out);
        } catch (e) {
            log.error(e);
            x_func(false);
        }
    }

    public static async delete():Promise<boolean>{
        try{
            log.info("WSL2.delete(): ");
            let p_result = await this.execCommand(`wsl --unregister ${WSL2.DISTRIBUTION}`, "UTF-16");
        }catch(e){
            // おそらくもうなかった。
            log.error(e);
            return false;
        }
        return true;
    }    
    public static async start():Promise<boolean>{
        try{
            if(await WSL2.status()){
                log.info("WSL2.start(): already started");
            }else{
                log.info("WSL2.start(): ");
                let p_result = await this.execCommand(`wsl -d ${WSL2.DISTRIBUTION} -e /etc/init.d/docker start`, "UTF-8");
            }
        }catch(e){
            // おそらくもう起動していた
            log.error(e);
            return false;
        }
        return true;
    }
    public static async stop():Promise<boolean>{
        try{
            if(await WSL2.status()){
                log.info("WSL2.stop(): ");
                let p_result = await this.execCommand(`wsl -t ${WSL2.DISTRIBUTION}`, "UTF-16");
            } else {
                log.info("WSL2.stop(): not running.");
            }
        }catch(e){
            // おそらくもう停止していた
            log.error(e);
            return false;
        }
        return true;
    }

    public static async openConsole(x_id:string):Promise<ChildProcess>{
        let p_args = ["wsl", "-d", WSL2.DISTRIBUTION, "-e", "docker", "exec", "-it", x_id, "/bin/bash"];
        let p_child = this.forkCommand("start", p_args );
        return p_child;
    }
    public static async openHostConsole(x_args:string[]|null):Promise<ChildProcess>{
        if(x_args && x_args.length > 0){
            let p_args = ["/WAIT", "wsl", "-d", WSL2.DISTRIBUTION, "--cd", "~"];
            p_args = p_args.concat(x_args)
            return this.forkCommand("start", p_args );
        }else {
            let p_args = ["wsl", "-d", WSL2.DISTRIBUTION, "--cd", "~"];
            return this.forkCommand("start", p_args );
        }
    }

    public static requestToOS(x_path:string){
        //shell.openExternal(x_path)
        shell.openPath(x_path)
        .then(()=>{
            // success
            log.info("request to OS:" + x_path);
        },(error)=>{
            // err
            log.error("failed to request to OS:" + x_path + ", " + error);
        })
    }

    public static openBrowser(x_path:string){
        shell.openExternal(x_path)
    }

    static async execCommand(x_cmd: string, x_encoding:string):Promise<string>{
        return new Promise((resolve, reject) =>{
            try{
                let p_buf = execSync(x_cmd, {
                    windowsHide: true,
                });
                let p_res = iconv.decode(p_buf, x_encoding);
                resolve(p_res);
            }catch(e){
                if( e instanceof Error){
                    //reject(e.message);
                    resolve(e.message);
                }else {
                    //reject(e);
                    resolve(String(e));
                }
            }
            /*
            exec(x_cmd, (err, stdout, stderr)=>{
                if(err) reject(err);
                if(stderr) reject(stderr);
                resolve(stdout)
            })
            */
        })
    }
    
    static forkCommand(x_cmd:string, x_args:string[]):ChildProcess{
        let p_child = spawn(x_cmd, x_args, {shell:true, stdio: "ignore"});
        p_child.unref();
        return p_child;
    }
}
