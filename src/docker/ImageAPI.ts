import { APIBase } from "./APIBase";

import * as http from 'http';
import * as fs from 'fs';
import * as zlib from 'zlib';

import * as Archiver from 'archiver';
import * as yauzl from 'yauzl';

import * as log from 'electron-log';

export type ImageJson = {
    Id: string,
    Size: number,
    RepoTags: string[]
};

export class ImageAPI extends APIBase {
    public static getAll(x_func: (x_err:string|null, x_ret: ImageJson[]|null) => void) {
        let p_options = super.getOptions("/images/json?all=true", "GET", "", "");
        super.sendThenJSON(p_options, null, 200, x_func);
    }
    public static delete(x_id: string, x_func: (x_errCode: string | null) => void) {
        let p_options = super.getOptions(`/images/${x_id}?force=true`, "DELETE");
        super.sendThenBool(p_options, null, 200, x_func);
    }

    public static extractInfoJson(x_filePath: string, x_func: (x_err: string | null, x_json:{}|null) => void) {
        let p_json:{}|null = null;

        if (x_filePath.endsWith(".zip")) {
            // yauzl version
            yauzl.open(x_filePath, {lazyEntries:true}, function(err, zipfile){
                log.info('open: ' + x_filePath);
                if(err){
                    log.error(err);
                    x_func(String(err), null);
                    return;
                }
                zipfile?.readEntry();
                zipfile?.on("entry", function(entry){
                    if(entry.fileName == 'info.json'){
                        zipfile.openReadStream(entry, function(err, readStream){
                            let p_data = "";
                            readStream?.on("end", function(){
                                log.info("info.json: " + p_data );
                                try{
                                    p_json = JSON.parse(p_data);
                                    x_func(null, p_json);
                                }catch(e){
                                    x_func(String(e), null);
                                }
                                zipfile?.readEntry();
                            });
                            readStream?.on("data", function(chunk){
                                p_data += chunk;
                            });
                        })
                    } else {
                        zipfile.readEntry();
                    }
                })
                zipfile?.on("end", ()=>{
                    log.info(x_filePath + " unzipped.")
                    if(p_json == null){
                        x_func("The file doesn't seem to be for EasyDockerForWSL2.", null);
                    }
                })
            }) 
        }else{
            x_func("not zip file", null);            
        }
    }

    public static loadImage(x_filePath: string, x_repo: string, x_tag: string, x_func: (x_err: string | null, x_info:string|null) => void) {
        let p_url = `/images/create?fromSrc=-&repo=${x_repo}&tag=${x_tag}`
        var p_options = super.getOptions(p_url, "POST", "", "");
        let p_returnInfo:string|null = null;

        let p_req = http.request(p_options, (x_res) => {
            x_res.setEncoding('utf8');

            var p_resStr = "";
            x_res.on('data', (chunk) => {
                p_resStr += chunk
            })
            x_res.on('end', () => {
                if (x_res.statusCode == 200) {
                    // 成功
                    x_func(null, p_returnInfo)
                } else {
                    // 失敗
                    x_func(p_resStr, null)
                }
            });
        })
        p_req.on('error', (e) => {
            x_func(e.message, null);
            return;
        })

        // extract zip and send to Docker
        if (x_filePath.endsWith(".zip")) {
            // yauzl version
            yauzl.open(x_filePath, {lazyEntries:true}, function(err, zipfile){
                log.info('open: ' + x_filePath);
                if(err){
                    log.error(err);
                    x_func(String(err), null);
                    return;
                }
                zipfile?.readEntry();
                zipfile?.on("entry", function(entry){
                    if(entry.fileName == 'info.json'){
                        zipfile.openReadStream(entry, function(err, readStream){
                            let p_data = "";
                            readStream?.on("end", function(){
                                log.info("info.json: " + p_data );
                                zipfile?.readEntry();
                            });
                            readStream?.on("data", function(chunk){
                                p_data += chunk;
                            });
                        })
            
                    } else if(entry.fileName == 'image.tar.gz'){
                        log.info(entry.fileName);
                        zipfile.openReadStream(entry, function(err, readStream){
                            readStream?.on("end", function(){
                                log.info("image.tar.gz uploaded.");
                                zipfile.readEntry();
                            });
                            readStream?.pipe(p_req);
                        })
                    } else {
                        log.info('else:'+ entry.fileName);
                        zipfile.readEntry();
                    }
                })
                zipfile?.on("end", ()=>{
                    log.info(x_filePath + " unzipped.")
                })
            })
            /* adm-zip version */
            /*
            const zip = new AdmZip(x_filePath);
            for(const zipEntry of zip.getEntries()){
                if(zipEntry.entryName == "info.json"){
                    p_returnInfo = zipEntry.getData().toString();
                    
                } else if(zipEntry.entryName == "image.tar.gz"){
                    let p_buf = zipEntry.getData();
                    p_req.write(p_buf, (x_err)=>{
                        p_req.end();
                    });
                }
            }
            */
        } else {
            // Imageを送信する
            try {
                fs.statSync(x_filePath); // if no file --> throw e

                let p_in = fs.createReadStream(x_filePath);
                p_in.pipe(p_req);
            } catch (e) {
                x_func("file not found: " + x_filePath, null);
            }
        }
    }

    /**
     * コンテナをファイルに書き出す
     * @param x_id コンテナID
     * @param x_filePath 書き出し先ファイルパス(tar.gz または zip)
     * @param x_func 書き出し完了時のcallback
     */
    public static exportImage(x_id: string, x_filepath: string, x_info:{}, x_func: (x_err: string | null) => void) {

        let p_url = `/containers/${x_id}/export`
        var p_options = super.getOptions(p_url, "GET", "", "");

        if (x_filepath.endsWith(".zip")) {
            const archive = Archiver.create('zip', { zlib: { level: 0 } });
            archive.on('error', (x_err: any) => {
                x_func(x_err);
            })
            const writeStream = fs.createWriteStream(x_filepath);
            archive.pipe(writeStream);

            // info.json
            archive.append(JSON.stringify(x_info, null, 2), { name: 'info.json' });

            // tarダウンロード開始
            let gz = zlib.createGzip();
            let p_req = http.request(p_options, (x_res) => {
                archive.append(x_res.pipe(gz), { name: "image.tar.gz"});
                x_res.on('end', function () {
                    if (x_res.statusCode != 200) {
                        x_func(String(x_res.statusCode));
                    } else {
                        x_func(null);
                    }
                    archive.finalize();
                });
            });
            p_req.on('error', function (x_err) {
                log.error('Error: ', x_err);
                x_func(x_err.message)
                archive.finalize();
            });
            p_req.end();

        } else {
            let p_outFile = fs.createWriteStream(x_filepath);

            // ダウンロード開始
            let gz = zlib.createGzip();
            let p_req = http.request(p_options, (x_res) => {
                x_res.pipe(gz).pipe(p_outFile);
                gz.on('end', function () {
                    gz.close();
                    p_outFile.close()
                });
                x_res.on('end', function () {
                    //console.log('STATUS: ' + res.statusCode); // 200 success
                    if (x_res.statusCode != 200) {
                        x_func(String(x_res.statusCode));
                    } else {
                        x_func(null);
                    }
                });
            });
            p_req.on('error', function (x_err) {
                log.error('Error: ', x_err);
                x_func(x_err.message)
            });
            p_req.end();
        }
    }
}