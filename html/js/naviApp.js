const naviApp = Vue.createApp({
    data() {
        return {}
    },
    created() {
    },
    methods: {
        dummy: function () {
        },
    }
})

{
    let p_i18nJson = window.MainWinBridge.getMsg();
    const i18n = new VueI18n.createI18n(p_i18nJson);
    naviApp.use(i18n);
    naviApp.mount("#naviApp");

    let p_locale = p_i18nJson.locale;
    document.getElementById("container-tab").innerHTML = p_i18nJson.messages[p_locale].navi.container;
    document.getElementById("image-tab").innerHTML = p_i18nJson.messages[p_locale].navi.image;
    document.getElementById("setting-tab").innerHTML = p_i18nJson.messages[p_locale].navi.setting;
}


