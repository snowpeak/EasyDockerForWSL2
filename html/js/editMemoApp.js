const App = Vue.createApp({
    data() {
        return {
            containerId: null,
            name: null,
            repo: null,
            tag: null,
            actionErr: null,
        }
    },
    created() {
        if (window.EditMemoWinBridge) {
            window.EditMemoWinBridge.resGetContainerDB(this.resGetContainerDB);
            window.EditMemoWinBridge.resSaveMemo(this.resSaveMemo);
        }
        let p_params = new URLSearchParams(location.search);
        this.containerId = p_params.get('containerId');
        window.EditMemoWinBridge.getContainerDB(this.containerId);
        
    },
    methods: {
         resGetContainerDB: function (x_err, x_res) {
            if(x_res != null){
                this.name = x_res.name;
                this.repo = x_res.repo;
                this.tag = x_res.tag;
                this.memo = x_res.memo;
            }
        },
        saveMemo: function(){
            window.EditMemoWinBridge.saveMemo(this.containerId, this.memo);
        },
        resSaveMemo: function (x_err) {
            this.actionErr = x_err;
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
    let p_i18nJson = window.EditMemoWinBridge.getMsg();
    console.log(p_i18nJson);
    const i18n = new VueI18n.createI18n(p_i18nJson);
    App.use(i18n);
    App.mount("#App");
}


