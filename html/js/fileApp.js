const App = Vue.createApp({
    data() {
        return {
            winId: null,
            containerId: null,
            name: null,
            repo: null,
            tag: null,
            execUserid: "root",
            lastDir: "",
            dir: "/",
            usersJson:[],

            deleteTargetFile: "",

            files: [],
            hostFiles: [],
            actionErr: null,
        }
    },
    created() {
        if (window.FileWinBridge) {
            window.FileWinBridge.resGetContainerDB(this.resGetContainerDB);
            window.FileWinBridge.resGetUserInfo(this.resGetUserInfo);
            window.FileWinBridge.resGetFileInfo(this.resGetFileInfo);
            window.FileWinBridge.resDownloadFile(this.resDownloadFile);
            window.FileWinBridge.resDeleteFile(this.resDeleteFile);
            window.FileWinBridge.resUploadFile(this.resUploadFile);
            window.FileWinBridge.resReloadWorkDir(this.resReloadWorkDir);
        }
        let p_params = new URLSearchParams(location.search);
        this.winId = p_params.get('winId');
        this.containerId = p_params.get('containerId');
        window.FileWinBridge.getContainerDB(this.containerId);

        let p_usersJsonStr = p_params.get('usersJsonStr');
        let p_usersJson = JSON.parse(p_usersJsonStr); // [{userid:〇〇, homeDir:××}]
        this.usersJson = p_usersJson;

        if(this.usersJson && this.usersJson.length > 0){
            this.execUserid = this.usersJson[0].userid;
            this.dir = this.usersJson[0].homeDir;
        }
    },
    methods: {
        resGetContainerDB: function (x_err, x_res) {
            if (x_res != null) {
                this.name = x_res.name;
                this.repo = x_res.repo;
                this.tag = x_res.tag;
                this.memo = x_res.memo;
            }
        },
        changeUser(){
            for(let p_json of this.usersJson){
                if(p_json.userid == this.execUserid){
                    if(this.files.length == 0){
                        this.lastDir = "";
                        this.dir = p_json.homeDir;
                    }
                    return;
                }
            }
        },
        showHomeDir(){
            for(let p_json of this.usersJson){
                if(p_json.userid == this.execUserid){
                    this.dir = p_json.homeDir;
                    this.lastDir = p_json.homeDir;
                    common_startSpinner("showHomeDir_spinner");
                    window.FileWinBridge.getFileInfo(this.containerId, this.dir, this.execUserid);
                    return;
                }
            }
        },
        enterAtDir: function(x_event){
            if(x_event.key == 'Enter'){
                this.getFileInfo();
            }
        },
        getFileInfo: function () {
            this.lastDir = this.dir;
            common_startSpinner("getFileInfo_spinner");
            window.FileWinBridge.getFileInfo(this.containerId, this.dir, this.execUserid);
        },
        resGetFileInfo: function (x_err, x_files) {
            this.files = x_files;
            this.actionErr = x_err;
            common_stopSpinner("showHomeDir_spinner");
            common_stopSpinner("getFileInfo_spinner");
            console.log("resGetFileInfo:" + x_files.length);
        },
        resGetUserInfo: function (x_err, x_users) {
            this.actionErr = x_err;
            console.log(x_users);
        },
        moveToDir(x_dir) {
            let p_linkIdx = x_dir.indexOf('->');
            if(p_linkIdx > 0){
                x_dir = x_dir.substring(p_linkIdx+2).trim();
            }
            let p_nextDir = this.lastDir;
            if (x_dir == "../") {
                if (p_nextDir != "/") {
                    if (p_nextDir.endsWith('/')) {
                        p_nextDir = p_nextDir.substring(0, p_nextDir.length - 1);
                    }
                    let p_lastIdx = p_nextDir.lastIndexOf("/");
                    if (p_lastIdx > 0) {
                        p_nextDir = p_nextDir.substring(0, p_lastIdx);
                    } else if (p_lastIdx == 0) {
                        p_nextDir = "/"
                    }
                }
            } else {
                if (!p_nextDir.endsWith('/')) {
                    p_nextDir += "/";
                }
                p_nextDir += x_dir;
            }
            this.lastDir = p_nextDir;
            this.dir = p_nextDir;
            common_startSpinner("getFileInfo_spinner");
            window.FileWinBridge.getFileInfo(this.containerId, this.dir, this.execUserid);
        },
        downloadFile(x_fileName, x_index) {
            console.log("download file: " + x_fileName);
            let p_target = this.lastDir;
            if (!p_target.endsWith("/")) {
                p_target += "/"
            }

            let p_idx = x_fileName.indexOf("->");
            if( p_idx > 0 ){
                x_fileName = x_fileName.substring(p_idx+2).trim();                
            }
            p_target += x_fileName;

            common_startSpinner("download_spinner_" + x_index);
            window.FileWinBridge.downloadFile(this.containerId, this.winId, p_target, this.execUserid, x_index);
        },
        resDownloadFile(x_err, x_spinnerid) {
            this.actionErr = x_err;
            common_stopSpinner("download_spinner_" + x_spinnerid);
        },

        prepareDeleteFile(x_filename){
            this.deleteTargetFile = x_filename;
        },
        deleteFile: function(){
            let p_deleteFile = this.deleteTargetFile;
            console.log("doDelete file: " + p_deleteFile);
            let p_target = this.lastDir;
            if (!p_target.endsWith("/")) {
                p_target += "/"
            }

            let p_idx = p_deleteFile.indexOf("->");
            if( p_idx > 0 ){
                p_deleteFile = p_deleteFile.substring(p_idx+2).trim();                
            }
            p_target += p_deleteFile;

            common_startSpinner("deleteSpinner");
            window.FileWinBridge.deleteFile(this.containerId, p_target, this.execUserid);
        },
        resDeleteFile(x_err){
            this.actionErr = x_err;
            common_stopSpinner("deleteSpinner");
            let p_modalId = document.getElementById('deleteFileModal');
            let p_modal = bootstrap.Modal.getInstance(p_modalId);
            p_modal.hide();
            if(!x_err){
                this.getFileInfo();
            }
        },

        uploadFile(x_file, x_index) {
            this.actionErr = null;
            common_startSpinner("upload_spinner_" + x_index);
            window.FileWinBridge.uploadFile(this.containerId, this.winId, x_file, this.lastDir, this.execUserid, x_index);
        },
        resUploadFile(x_err, x_spinnerid) {
            this.actionErr = x_err;
            common_stopSpinner("upload_spinner_" + x_spinnerid);
        },
        reloadWorkDir() {
            common_startSpinner("reloadWorkDir_spinner");
            window.FileWinBridge.reloadWorkDir(this.winId);
        },
        resReloadWorkDir: function (x_err, x_files) {
            this.hostFiles = x_files;
            this.actionErr = x_err;
            common_stopSpinner("reloadWorkDir_spinner");
            console.log("resReloadWorkDir:" + x_files.length);
        },
        openFile(x_file) {
            window.FileWinBridge.openFile(this.winId, x_file);
        },
        close: function () {
            window.close();
        }
    }
})

{
    let p_i18nJson = window.FileWinBridge.getMsg();
    const i18n = new VueI18n.createI18n(p_i18nJson);
    App.use(i18n);
    App.mount("#App");

    let p_delModal = document.getElementById("deleteFileModal");
    p_delModal.addEventListener('show.bs.modal', function (event) {
        console.log('show.bs.modal:' + p_delModal);
        let p_btn = event.relatedTarget;
        let p_name = p_btn.getAttribute('data-bs-name');
        document.querySelector("#deleteFileName").innerHTML = p_name;
    })
}


