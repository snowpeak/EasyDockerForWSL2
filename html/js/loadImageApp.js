const App = Vue.createApp({
    data() {
        return {
            filePath: null,
            filePath_err: false,

            repo: null,
            repo_err: false,

            tag: null,
            tag_err: false,

            zipErr : null,
            infoJson : null,
            protocols:["TCP","TCP","","",""],
            locals:["","","","",""],
            remotes:["","","","",""],


            loadErr: null
        }
    },
    created() {
        if (window.LoadImageWinBridge) {
            window.LoadImageWinBridge.resSelectFile(this.resSelectFile);
            window.LoadImageWinBridge.resCheckZipFile(this.resCheckZipFile);
            window.LoadImageWinBridge.resLoadImage(this.resLoadImage);
        }
    },
    methods: {
        selectFile: function(){
            window.LoadImageWinBridge.selectFile("DockerImage", ["zip","tar.gz"]);
        },
        resSelectFile: function (x_path) {
            if(x_path){
                if(x_path != this.filePath){
                    this.zipErr = null;
                    this.infoJson = null;
                }
                this.filePath = x_path;
            }
        },
        checkZipFile: function(){
            window.LoadImageWinBridge.checkZipFile(this.filePath);
        },
        resCheckZipFile: function (x_err, x_json) {
            this.zipErr = null;
            this.infoJson = null;
            if(x_err){
                console.log(x_err);
                this.zipErr = x_err;
            }else if(x_json){
                this.infoJson = x_json;
                let p_idx = 0;
                for(let p_port of x_json.port_json){
                    this.protocols[p_idx] = p_port.protocol;
                    this.locals[p_idx] = p_port.local;
                    this.remotes[p_idx] = p_port.remote;
                }
                console.log("resCheckZipFile: " + x_json);
                console.log(x_json.port_json);
            }
        },
        loadImage: function(x_id){
            this.loadErr = null;

            this.filePath_err = !(this.filePath);
            this.repo_err = !(this.repo);
            this.tag_err = !(this.tag);

            if( !this.filePath_err && !this.repo_err && !this.tag_err){
                common_startSpinner("spinner");
                window.LoadImageWinBridge.loadImage(this.filePath, this.repo, this.tag);
            }
        },
        resLoadImage: function (x_err) {
            common_stopSpinner("spinner");
            this.loadErr = x_err;
            if(!x_err){
                window.close();
            }
        },
        close: function(){
            window.close();
        }
    }
})

{
    let p_i18nJson = window.LoadImageWinBridge.getMsg();
    const i18n = new VueI18n.createI18n(p_i18nJson);
    App.use(i18n);
    App.mount("#App");

    let tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'))
    let tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl)
    })
}


