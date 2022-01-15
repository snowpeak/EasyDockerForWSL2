import * as path from 'path';
import * as fs from 'fs';
import * as log from 'electron-log';
declare var process: {
    env: {
        USERPROFILE: string
    }
}

var DEFAULT_CONFIG : {[key:string]:any}= {
    host: "localhost",
    port: "12375",
    autorun: "Y",
    lang: "ja",
    dbg: false,
    loglevel: 'error',
    dataDir: "", // set at _loadConfig()
    mainWin:{
        width: 1200,
        height: 800,
    },
    editMemoWin:{
        width: 600,
        height: 800,
    },
    createContainerWin:{
        width: 800,
        height: 800,
    },
    exportImageWin:{
        width: 700,
        height: 800,
    },
    loadImageWin:{
        width: 700,
        height: 800,
    },
};

export class Config {
    private static s_instance: Config | null = null;

    /**
     * Configファイルをメモリ上で保存するJSON
     */
    private m_json: any = {}

    /**
     * コンストラクタ
     * @param x_path コンフィグファイルのパス
     */
    private constructor(x_path: string) {
        this.m_json = _loadConfigFile(x_path);
    }
    public static getInstance(): Config {
        if (Config.s_instance) {
            return Config.s_instance;
        }
        let p_configDir = Config.getDataDir();
        let p_configPath = path.resolve(p_configDir, 'config.json');
        Config.s_instance = new Config(p_configPath);
        return Config.s_instance;
    }

    public static getDataDir(): string {
        let p_configDir = "";
        if (__dirname.indexOf('app.asar') >= 0) {
            // インストーラー
            p_configDir = path.resolve(process.env['USERPROFILE'], '.EasyDockerForWSL2');
        } else {
            //開発環境
            p_configDir = path.resolve(__dirname, "../../data"); 
        }
        if (!fs.existsSync(p_configDir)) {
            fs.mkdirSync(p_configDir);
        }
        return p_configDir;
    }

    /**
     * Config全体の要素を返す
     * @returns  Configの全要素
     */
    getConfig():{}{
        return this.m_json;
    }
    /**
     * コンフィグ値をstringで取り出す
     * @param {String} x_path 必要なパラメータへのパス( 例 set01/name)
     * @return 値(基本的にはStringだが、配列だったりjsonだったりすることがある) 
     */
    private getParam(x_path: string):string|number|boolean|null {
        if (x_path == null || x_path.length == 0 || this.m_json == {}) {
            return null;
        }
        let p_names = [x_path];
        if (x_path.indexOf("/") > 0) {
            p_names = x_path.split("/");
        }
        let p_value = this.m_json;
        for (let p_name of p_names) {
            p_value = p_value[p_name];
            if (p_value == null) {
                break;
            }
        }
        return p_value;
    }

        /**
     * コンフィグ値をstringで取り出す
     * @param x_path パラメータへのパス( 例 set01/width)
     * @param x_default パラメータがない時のデフォルト値 
     */
    getString(x_path: string, x_default: string): string | null {
        let p_value = this.getParam(x_path);
        if (typeof (p_value) === "string") {
            return p_value;
        }

        let p_ret = x_default;
        if (p_value) {
            p_ret = String(p_value);
        }
        return p_ret;
    }

    /**
     * コンフィグ値をintで取り出す
     * @param x_path パラメータへのパス( 例 set01/width)
     * @param x_default パラメータがない時のデフォルト値 
     */
    getNum(x_path:string, x_default:number):number{
        let p_ret = NaN;

        let p_value = this.getParam(x_path);
        if(typeof(p_value) == "number"){
            return p_value;
        }

        if(typeof(p_value) === "string" ){
            p_ret = parseInt(p_value, 10);
            if(p_ret == NaN){
                p_ret = parseFloat(p_value);
            }
        }
        if(p_ret === NaN ){
            p_ret = x_default;
        }
        return p_ret;
    }

    /**
     * コンフィグ値をbooelanで取り出す
     * @param x_path パラメータへのパス( 例 set01/width)
     * @param x_default パラメータがない時のデフォルト値 
     */
    getBool(x_path:string, x_default:boolean):boolean{
        let p_value = this.getParam(x_path);
        if( typeof(p_value) === "boolean"){
            return p_value;
        }
        if( p_value == "false"){
            return false;
        }

        let p_ret = x_default;
        if (p_value) {
            p_ret = Boolean(p_value);
        }
        return p_ret;
    }

    setParam(x_path: string, x_value: string) {
        let p_names = [x_path];
        if (x_path.indexOf("/") > 0) {
            p_names = x_path.split("/");
        }
        let p_node = this.m_json;
        let p_name = null;
        for (let i = 0; i < p_names.length; i++) {
            p_name = p_names[i];
            if (i == p_names.length - 1) {
                p_node[p_name] = x_value;
            } else {
                let p_nextNode = p_node[p_name];
                if (p_nextNode == null) {
                    p_node[p_name] = {};
                    p_nextNode = p_node[p_name];
                }
                p_node = p_nextNode;
            }
        }
    }

    /**
     * configを更新して保存する
     * @param {json} x_server 
     */
    public saveConfig() {
        let p_configDir = Config.getDataDir();
        let p_configPath = path.resolve(p_configDir, 'config.json');
        _saveConfigFile(p_configPath, this.m_json);
    }
}

function _loadConfigFile(x_path: string): { [key:string]:any} {
    let p_config = DEFAULT_CONFIG;
    p_config["dataDir"] =  Config.getDataDir();

    try {
        let p_ret = JSON.parse(fs.readFileSync(x_path, 'utf8'));
        for(let p_key in p_ret){
            p_config[p_key] = p_ret[p_key];
        }
    } catch (e) {
        console.log(e);
    }
    return p_config;
}

function _saveConfigFile(x_path: string, x_json: {}): boolean {
    log.info("save config:" + x_path);
    try {
        let p_jsonStr = JSON.stringify(x_json, null, 2);
        fs.writeFileSync(x_path, p_jsonStr);
        return true;
    } catch (e) {
        log.error(e);
        return false;
    }
}