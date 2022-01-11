import {exec, spawn, ChildProcess, execSync} from "child_process";
import {shell} from "electron";
import * as path from 'path';
import * as fs from 'fs';
import * as iconv from 'iconv-lite';
import {Config} from '../electron/Config';

export class WSL2 {
    public static DISTRIBUTION = "EasyDocker";

    public static async status():Promise<boolean>{
        let p_result = await this.execCommand(`wsl -d ${WSL2.DISTRIBUTION} -e /etc/init.d/docker status`);
        console.log("WSL2.status(): " + p_result);
        if(p_result.indexOf("running") < 0){
            return true;
        }
        return true;
    }
    public static install(x_func: (x_result: boolean) => void) {
        let p_srcFile = path.resolve(__dirname, "../../resource/easydocker.tar.gz");
        let p_workDir = Config.getDataDir();
        let p_workFile = path.resolve(p_workDir, "easydocker.tar.gz");
        // p_srcFileを を p_workDir に移動する
        try {
            console.log("WSL2.install() step1: prepare file");
            let p_in = fs.createReadStream(p_srcFile);
            let p_out = fs.createWriteStream(p_workFile);
            p_out.on('close', async () => {
                console.log("copy finished");
                let p_cmd = `wsl --import ${WSL2.DISTRIBUTION} "${p_workDir}" "${p_workFile}"`;
                console.log("WSL2.install() step2: " + p_cmd);
                this.execCommand(p_cmd);

                console.log("WSL2.install() step3: start Docker");
                await this.start();
                x_func(true);
            })
            let p_result = p_in.pipe(p_out);
        } catch (e) {
            console.log(e);
            x_func(false);
        }
    }

    public static async delete():Promise<boolean>{
        try{
            console.log("WSL2.delete(): ");
            let p_result = await this.execCommand(`wsl --unregister ${WSL2.DISTRIBUTION}`);
        }catch(e){
            // おそらくもう停止していた
            console.log(e);
            return false;
        }
        return true;
    }    
    public static async start():Promise<boolean>{
        try{
            console.log("WSL2.start(): ");
            let p_result = await this.execCommand(`wsl -d ${WSL2.DISTRIBUTION} -e /etc/init.d/docker start`);
        }catch(e){
            // おそらくもう起動していた
            console.log(e);
            return false;
        }
        return true;
    }
    public static async stop():Promise<boolean>{
        try{
            console.log("WSL2.stop(): ");
            let p_result = await this.execCommand(`wsl -t ${WSL2.DISTRIBUTION}`);
        }catch(e){
            // おそらくもう停止していた
            console.log(e);
            return false;
        }
        return true;
    }

    public static async openConsole(x_id:string):Promise<ChildProcess>{
        let p_args = ["wsl", "-d", WSL2.DISTRIBUTION, "-e", "docker", "exec", "-it", x_id, "/bin/bash"];
        let p_child = this.forkCommand("start", p_args );
        return p_child;
    }
    public static async openHostConsole():Promise<ChildProcess>{
        let p_args = ["wsl", "-d", WSL2.DISTRIBUTION, "--cd", "~"];
        let p_child = this.forkCommand("start", p_args );
        return p_child;
    }

    public static requestToOS(x_path:string){
        shell.openExternal(x_path)
        .then(()=>{
            // success
            console.log("success");
        },(error)=>{
            // err
            console.log("error");
        })
    }

    static async execCommand(x_cmd: string):Promise<string>{
        return new Promise((resolve, reject) =>{
            try{
                let p_buf = execSync(x_cmd, {
                    windowsHide: true,
                });
                let p_res = iconv.decode(p_buf, "UTF-16");
                resolve(p_res);
            }catch(e){
                if( e instanceof Error){
                    reject(e.message);
                }else {
                    reject(e);
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
