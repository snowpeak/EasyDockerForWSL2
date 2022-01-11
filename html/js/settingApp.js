const App = Vue.createApp({
    data() {
        return {
            status:{
                "wsl2": true,
                "easydocker": true,
                "dockerEngine": true,
            },
            config:{
                "host": "localhost",
                "port": "2376",
                "autorun": "Y",
                "lang": "ja",
                "dataDir": ""
            },
            updated:false,
        }
    },
    created() {
        if (window.MainWinBridge) {
            window.MainWinBridge.resGetStatus(this.resGetStatus);
            window.MainWinBridge.resInstallDocker(this.resInstallDocker);
            window.MainWinBridge.resDeleteDocker(this.resDeleteDocker);
            window.MainWinBridge.resStartDocker(this.resStartDocker);
            window.MainWinBridge.resStopDocker(this.resStopDocker);
            window.MainWinBridge.resGetConfig(this.resGetConfig);
        }
    },
    methods: {
        resGetStatus: function(x_status){
            this.status = x_status;
        },

        installDocker(){
            common_startSpinner("installDockerSpinner");
            window.MainWinBridge.installDocker();
        },
        resInstallDocker(x_result){
            common_stopSpinner("installDockerSpinner");
            window.MainWinBridge.getStatus();
        },

        deleteDocker(){
            common_startSpinner("deleteDockerSpinner");
            window.MainWinBridge.deleteDocker();
        },
        resDeleteDocker(x_result){
            common_stopSpinner("deleteDockerSpinner");
            window.MainWinBridge.getStatus();
        },

        startDocker(){
            window.MainWinBridge.startDocker();
        },
        resStartDocker(x_result){
            window.MainWinBridge.getStatus();
        },

        stopDocker(){
            window.MainWinBridge.stopDocker();
        },
        resStopDocker(x_result){
            window.MainWinBridge.getStatus();
        },
        openHostConsole(){
            window.MainWinBridge.openHostConsole();
        },

        requestToOS(x_path){
            window.MainWinBridge.requestToOS(x_path);
        },

        resGetConfig: function(x_config){
            this.config = x_config;
        },
        saveConfig: function(){
            try{
                // this.config はvueオブジェクトなので厳密にはjsonとは異なります。
                // そのため、Electronに渡す際には純粋なjsonに変換し直します。
                let p_str = JSON.stringify(this.config);
                let p_json = JSON.parse(p_str);
                window.MainWinBridge.saveConfig(p_json);
                this.updated = true;
            }catch(e){
                alert(e);
            }
        },
        close: function(){
            window.close();
        }
    }
})

{
    let p_i18nJson = window.MainWinBridge.getMsg();
    const i18n = new VueI18n.createI18n(p_i18nJson);
    App.use(i18n);
    let p_if = App.mount("#settingApp");

    let p_tab = document.getElementById("setting-tab");
    p_tab.addEventListener('shown.bs.tab', function (event) {
        window.MainWinBridge.getStatus();
        window.MainWinBridge.getConfig();
        //p_if.$data.updated = false;
    });
}


