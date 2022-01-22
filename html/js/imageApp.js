const imageApp = Vue.createApp({
    data() {
        return {
            tabErr: null,
            actionErr: null,
            images: [],
            deleteImageId:""
        }
    },
    created() {
        if (window.MainWinBridge) {
            window.MainWinBridge.resGetImages(this.resGetImages);
            window.MainWinBridge.resDeleteImage(this.resDeleteImage);
        }
    },
    methods: {
        init(){
            this.tabErr = null;
            this.actionErr = null;
            window.MainWinBridge.getImages();
        },
        resGetImages: function (x_err, x_images) {
            this.tabErr = x_err;
            this.images = x_images;
        },
        prepareDeleteImage: function(x_id){
            this.deleteImageId = x_id;
        },
        createContainerWin: function(x_id){
            window.MainWinBridge.createContainerWin(x_id);
        },
        doDeleteImage: function(){
            common_startSpinner("deleteImageSpinner");
            window.MainWinBridge.deleteImage(this.deleteImageId);

        },
        resDeleteImage: function (x_err, x_id) {
            common_stopSpinner("deleteImageSpinner");
            let p_modalId = document.getElementById('delImageModal');
            let p_modal = bootstrap.Modal.getInstance(p_modalId);
            p_modal.hide();

            if(x_err != null){
                try{
                    let p_errJson = JSON.parse(x_err);
                    this.actionErr = p_errJson.message;
                }catch(e){
                    this.actionErr = x_err;
                }
            }else{
                this.actionErr = null;
            }
            window.MainWinBridge.getImages();
        },
        loadImageWin: function(){
            window.MainWinBridge.loadImageWin();
        },
        pullImageWin: function(){
            window.MainWinBridge.pullImageWin();
        }
    }
})

{
    let p_i18nJson = window.MainWinBridge.getMsg();
    const i18n = new VueI18n.createI18n(p_i18nJson);
    imageApp.use(i18n);
    let p_if = imageApp.mount("#imageApp");

    let p_tab = document.getElementById("image-tab");
    p_tab.addEventListener('shown.bs.tab', function (event) {
        p_if.init();
    });


    let p_delModal = document.getElementById("delImageModal");
    p_delModal.addEventListener('show.bs.modal', function (event) {
        console.log('show.bs.modal:' + p_delModal);
        let p_btn = event.relatedTarget;
        let p_name = p_btn.getAttribute('data-bs-tag');
        document.querySelector("#delImageTag").innerHTML = p_name;
    })
}


