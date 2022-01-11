const App = Vue.createApp({
    data() {
        return {
            filePath: null,
            filePath_err: false,

            repo: null,
            repo_err: false,

            tag: null,
            tag_err: false,

            loadErr: null
        }
    },
    created() {
        if (window.LoadImageWinBridge) {
            window.LoadImageWinBridge.resSelectFile(this.resSelectFile);
            window.LoadImageWinBridge.resLoadImage(this.resLoadImage);
        }
    },
    methods: {
        selectFile: function(){
            window.LoadImageWinBridge.selectFile("DockerImage", ["zip","tar","tar.gz"]);
        },
        resSelectFile: function (x_path) {
            if(x_path){
                this.filePath = x_path;
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
}


