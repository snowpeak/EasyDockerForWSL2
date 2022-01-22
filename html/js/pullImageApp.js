const App = Vue.createApp({
    data() {
        return {
            type: "dockerhub",
            tag: null,
            status: null  // null, running, end
        }
    },
    created() {
        if (window.PullImageWinBridge) {
            window.PullImageWinBridge.resPullImage(this.resPullImage);
        }
    },
    methods: {
        openHub(x_type){
            window.PullImageWinBridge.openHub(x_type);
        },
        pullImage(){
            this.status = 'running';
            common_startSpinner("spinner");
            window.PullImageWinBridge.pullImage(this.tag);
        },
        resPullImage(x_code){
            common_stopSpinner("spinner");
            this.status = 'end';
        },
        close: function(){
            window.close();
        }
    }
})

{
    let p_i18nJson = window.PullImageWinBridge.getMsg();
    const i18n = new VueI18n.createI18n(p_i18nJson);
    App.use(i18n);
    App.mount("#App");
}


