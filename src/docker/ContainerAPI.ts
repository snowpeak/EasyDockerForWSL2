import { APIBase } from "./APIBase";
import { Config } from "../electron/Config";
import * as http from 'http';
import * as log from 'electron-log';
import * as fs from 'fs';
import * as path from 'path';
import * as tar from 'tar';

export type ContainerJson = {
    Id: string,
    Image: string,
    State: string,
    dbInfo: {}
};

export type CreateInfo = {
    Hostname: string,
    Cmd: ["/sbin/init"],
    // Labels:{
    //     [name:string]:string
    // },
    Image: string,
    ExposedPorts: {
        [name: string]: {} // "8080/tcp":{}
    }
    HostConfig: {
        Privileged: boolean,
        PortBindings: {
            [name: string]: [{ HostPort: string }], //"8080/tcp":[{"HostPort":"8080"}]
        }
    }
};

export class ContainerAPI extends APIBase {
    public static getAll(x_func: (x_err: string | null, x_ret: [ContainerJson]) => void) {
        let p_options = super.getOptions("/containers/json?all=true", "GET", "", "");
        super.sendThenJSON(p_options, null, 200, x_func);
    }

    public static create(x_info: CreateInfo, x_start: boolean, x_func: (x_err: string | null, x_id: string | null) => void) {
        let p_postStr = JSON.stringify(x_info);
        let p_options = super.getOptions("/containers/create", "POST", "application/json", p_postStr);

        let p_req = http.request(p_options, (p_res) => {
            p_res.setEncoding("utf8");
            let p_jsonStr = "";
            p_res.on('data', (chunk) => {
                p_jsonStr += chunk;
            });

            p_res.on('end', () => {
                if (p_res.statusCode != 201) {
                    // 失敗
                    x_func(p_jsonStr, null);
                } else if (x_start) {
                    let p_json = JSON.parse(p_jsonStr);
                    this.start(p_json.Id, (x_err) => {
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

    public static getShellUsers(x_id: string, x_func: (x_users: {}[]) => void) {
        this.execCmd(x_id, ["cat", "/etc/passwd"], "root", (x_err, x_str) => {
            x_func(ContainerAPI.parsePasswd(x_str!));
        })
    }

    public static getFileInfo(x_id: string, x_path: string, x_user: string, x_func: (x_err: string | null, x_infoJson: { [key: string]: string }[]) => void) {
        this.execCmd(x_id, ["ls", "-laF", "--file-type", x_path], x_user, (x_err, x_str) => {
            let p_json: { [key: string]: string }[] = [];
            if (x_str) {
                p_json = this.lsToJson(x_str);
            }
            x_func(x_err, p_json);
        })
    }

    public static execCmd(x_id: string, x_cmds: string[], x_user: string, x_func: (x_err: string | null, x_string: string | null) => void) {
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
            p_res.on('data', (chunk) => {
                p_resStr += chunk;
            });

            p_res.on('end', () => {
                if (p_res.statusCode != 201) {
                    // 失敗
                    x_func(p_resStr, null);
                    return;
                }
                log.info("cmd id = " + p_resStr);
                let p_json = JSON.parse(p_resStr);
                this.startCmd(p_json.Id, (x_err, x_res) => {
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

    private static startCmd(x_cmdid: string, x_func: (x_err: string | null, x_res: string | null) => void) {
        let p_param = {
            "Detach": false,
            "Tty": false
        }
        let p_postStr = JSON.stringify(p_param);
        let p_options = super.getOptions(`/exec/${x_cmdid}/start`, "POST", "application/json", p_postStr);

        let p_req = http.request(p_options, (p_res) => {
            p_res.setEncoding("utf8");
            let p_resStr = "";
            p_res.on('data', (chunk) => {
                p_resStr += chunk;
            });

            p_res.on('end', () => {
                if (p_res.statusCode != 200) {
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

    public static downloadFile(x_id: string, x_path: string, x_user: string, x_toDir: string, x_func: (x_err: string | null) => void) {
        //let p_spaceStr = escapeSpace(x_path);
        let p_escapeStr = encodeURI(x_path);

        let p_options = super.getOptions(`/containers/${x_id}/archive?path=${p_escapeStr}`, "GET", "", "");

        fs.mkdirSync(x_toDir, { recursive: true });

        let p_req = http.request(p_options, (p_res) => {
            let p_errMsg = "";
            if (p_res.statusCode != 200) {
                // error
                p_res.on('data', (chunk) => {
                    p_errMsg += chunk;
                })
            } else {
                // receive tar
                p_res.pipe(
                    tar.x({
                        C: x_toDir
                    }).on('error', (x_err) => {
                        log.error(String(x_err));
                    })
                );

                //let p_out = fs.createWriteStream(path.resolve(x_toDir, "test.tar"));
                //p_res.pipe(p_out);
            }
            // p_res.pipe(
            //     tar.x({
            //         C: x_toDir
            //     }).on('error', (x_err) => {
            //         log.error(String(x_err));
            //     })
            // );
            p_res.on('end', () => {
                if (p_res.statusCode != 200) {
                    // 失敗
                    x_func("error: " + p_res.statusCode + ", " + p_errMsg);
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

    public static deleteFile(x_id: string, x_path: string, x_user: string, x_func: (x_err: string | null) => void) {
        this.execCmd(x_id, ["rm", "-rf", x_path], x_user, (x_err, x_str) => {
            if (x_str) {
                x_func(deleteControlChar(x_str));
            } else {
                x_func(x_err);
            }
        })
    }

    public static uploadFile(x_id: string, x_srcDir: string, x_filename: string, x_toDir: string, x_user: string, x_func: (x_err: string | null) => void) {
        ContainerAPI.getFileInfo(x_id, x_toDir, x_user, (x_err, x_infoJson) => {
            if (x_err) {
                x_func(x_err);
                return;
            }
            // check permissson
            let p_newFile = true;
            let p_creatable = false;
            let p_overwritable = false;
            let p_originOwner = "";
            let p_originGroup = ""
            let p_originPermission = ""
            for (let p_info of x_infoJson) {
                // x_infoJson {permission:"", owner:"", group:"", ..., name:""},
                if (p_info.name == "./") {
                    if (x_user == "root"
                        || (x_user == p_info.owner && p_info.permission.charAt(2) == "w")
                        || p_info.permission.charAt(8) == "w") {
                        p_creatable = true;
                    }
                    continue;
                }
                if (p_info.name == x_filename) {
                    p_newFile = false;
                    if (x_user == "root"
                        || (x_user == p_info.owner && p_info.permission.charAt(2) == "w")
                        || p_info.permission.charAt(8) == "w") {
                        p_overwritable = true;
                        p_originOwner = p_info.owner;
                        p_originGroup = p_info.group;
                        p_originPermission = getNumOfPermission(p_info.permission);
                    }
                }
            }

            //----------------------
            // permission err
            //----------------------
            if (p_newFile) {
                if (!p_creatable) {
                    x_func(`Permission denied: ${x_user} can not create file in ${x_toDir}. `);
                    return;
                }
            } else if (!p_overwritable) {
                x_func(`Permission denied: ${x_user} can not overwrite ${x_filename}. `);
                return;
            }

            //--------
            // upload 
            //--------
            if (!x_toDir.endsWith("/")) {
                x_toDir += "/";
            }
            if (p_newFile) {
                // touch new file --> overwrite the file
                let p_cmds = ["touch", `${x_toDir}${x_filename}`];
                ContainerAPI.execCmd(x_id, p_cmds, x_user, (x_err, x_string) => {
                    // recursive call
                    this.uploadFile(x_id, x_srcDir, x_filename, x_toDir, x_user, (x_err) => {
                        x_func(x_err);
                    })
                })
            } else {
                // overwrite
                ContainerAPI.uploadFileInternal(x_id, x_srcDir, x_filename, x_toDir, x_user, (x_err) => {
                    if (x_err) {
                        x_func(x_err);
                        return;
                    }

                    if (!x_toDir.endsWith("/")) {
                        x_toDir += "/";
                    }
                    let p_cmds = ["chown", `${p_originOwner}.${p_originGroup}`, `${x_toDir}${x_filename}`];
                    ContainerAPI.execCmd(x_id, p_cmds, "root", (x_err, x_string) => {
                        if (x_err) {
                            x_func(x_err);
                            return;
                        }
                        p_cmds = ["chmod", p_originPermission, `${x_toDir}${x_filename}`];
                        ContainerAPI.execCmd(x_id, p_cmds, "root", (x_err, x_string) => {
                            x_func(x_err);
                        })
                    })
                    //}
                })
            }
        })
    }

    public static start(x_id: string, x_func: (x_err: string | null) => void) {
        let p_options = super.getOptions(`/containers/${x_id}/start`, "POST");
        super.sendThenBool(p_options, null, 204, x_func);
    }
    public static stop(x_id: string, x_func: (x_err: string | null) => void) {
        let p_options = super.getOptions(`/containers/${x_id}/stop`, "POST");
        super.sendThenBool(p_options, null, 204, x_func);
    }
    public static delete(x_id: string, x_func: (x_err: string | null) => void) {
        let p_options = super.getOptions(`/containers/${x_id}?force=true`, "DELETE");
        super.sendThenBool(p_options, null, 204, x_func);
    }
    public static parsePasswd(x_str: string): { [key: string]: string }[] {
        let p_ret: { [key: string]: string }[] = [];

        let p_lines = x_str.split(/\r\n|\n/);
        for (let p_line of p_lines) {
            let p_tokens = p_line.split(/:/);
            if (p_tokens.length < 6) {
                continue;
            }
            let p_userid = deleteControlChar(p_tokens[0]);
            let p_homeDir = p_tokens[5];
            let p_shell = p_tokens[6];
            log.info(p_userid + "," + p_homeDir + "," + p_shell);
            if (p_shell.endsWith("sh")) {
                p_ret.push({
                    "userid": p_userid,
                    "homeDir": p_homeDir
                });
            }
        }
        return p_ret;
    }

    public static lsToJson(x_str: string): { [key: string]: string }[] {
        let p_lines = x_str.split(/\r\n|\n/);
        let p_lineNo = 0;
        let p_dirInfo: { [key: string]: string }[] = [];

        for (let p_line of p_lines) {
            p_lineNo++;
            if (p_lineNo == 1) {
                continue;
            }
            let p_tokens = p_line.split(/\s/);
            if (p_tokens.length < 8) {
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
            for (let p_token of p_tokens) {
                if (p_foundIdx > 7) {
                    break;
                }
                if (p_token == "" || p_token.trim() == "") {
                    continue;
                }
                if (p_foundIdx == 0) {
                    p_info.permission = p_token;
                } else if (p_foundIdx == 1) {
                    //
                } else if (p_foundIdx == 2) {
                    p_info.owner = p_token;
                } else if (p_foundIdx == 3) {
                    p_info.group = p_token;
                } else if (p_foundIdx == 4) {
                    p_info.size = p_token;
                } else if (p_foundIdx == 5) {
                    p_info.date = p_token;
                } else if (p_foundIdx == 6) {
                    p_info.date += " " + p_token;
                } else if (p_foundIdx == 7) {
                    p_info.date += " " + p_token;
                }
                p_foundIdx++;
            }
            p_info.name += p_line.substring(40).trim();
            p_dirInfo.push(p_info);
        }
        return p_dirInfo;
    }

    private static uploadFileInternal(x_id: string, x_srcDir: string, x_filename: string, x_toDir: string, x_user: string, x_func: (x_err: string | null) => void) {
        let p_options = super.getOptions(`/containers/${x_id}/archive?path=${x_toDir}`, "PUT", "", "");
        let p_req = http.request(p_options, (p_res) => {
            p_res.setEncoding("utf8");
            let p_resStr = "";
            p_res.on('data', (chunk) => {
                p_resStr += chunk;
            });
            p_res.on('end', () => {
                if (p_res.statusCode != 200) {
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
                gzip: true
            },
            [x_filename]
        ).pipe(p_req);
    }
}

function deleteControlChar(x_str: string): string {
    let p_ret = "";
    for (let p_char of x_str) {
        if (p_char >= ' ' && p_char <= '~') {
            p_ret += p_char;
        }
    }
    return p_ret;
}

function getNumOfPermission(x_permission: string): string {
    let p_ret = "";
    let p_num = 0;
    for (let p_idx = 0; p_idx < x_permission.length; p_idx++) {
        if (p_idx == 0) {
            continue;
        }
        let p_expLevel = 2 - ((p_idx - 1) % 3);
        if (x_permission.charAt(p_idx) != "-") {
            p_num += (2 ** p_expLevel);
        }
        if (p_expLevel == 0) {
            p_ret += String(p_num);
            p_num = 0;
        }
    }

    return p_ret;
}


