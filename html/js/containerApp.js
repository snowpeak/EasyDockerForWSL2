const containerApp = Vue.createApp({
    data() {
        return {
            tabErr: null,
            actionErr: null,
            containers: null,
            deleteContainerId:""
        }
    },
    created() {
        if (window.MainWinBridge) {
            window.MainWinBridge.resGetContainers(this.resGetContainers);
            window.MainWinBridge.resStartContainer(this.resStartContainer);
            window.MainWinBridge.resStopContainer(this.resStopContainer);
            window.MainWinBridge.resDeleteContainer(this.resDeleteContainer);
        }
        s_init = true;
        let p_msg = document.getElementById("startupMsg");
        p_msg.classList.add("d-none");

        this.init();
        let p_tab = document.getElementById("containerTab");
        p_tab.classList.remove("d-none");
    },
    computed: {
        name(){
            return function(x_container){
                if(x_container.dbInfo){
                    return x_container.dbInfo.name;
                }
                return "";
            }
        },
        ports(){
            return function(x_container){
                let p_ret = "";
                if(x_container.dbInfo){
                    let p_json = JSON.parse(x_container.dbInfo.port_json);
                    for(let p_port of p_json){
                        if(p_port.protocol == "TCP" || p_port.protocol == "UDP"){
                            p_ret += p_port.protocol + ":" + p_port.local + '<span class="bi-arrow-right"></span>' + p_port.remote + '<br>';
                        }
                    }
                }
                return p_ret;
            }
        }
    },
    methods: {
        init(){
            this.tabErr = null;
            this.actionErr = null;
            window.MainWinBridge.getContainers();
        },
        resGetContainers: function (x_err, x_containers) {
            this.tabErr = x_err;
            this.containers = x_containers;

            let p_msg = document.getElementById("noContainerMsg");
            if( !x_err && (x_containers == null || x_containers.length == 0)){
                p_msg.classList.remove("d-none");
            }else{
                p_msg.classList.add("d-none");
            }

            let p_tab = document.getElementById("container-tab");
            p_tab.click();
        },
        startContainer: function (x_id) {
            common_startSpinner("startSpinner_" + x_id);
            window.MainWinBridge.startContainer(x_id);
        },
        resStartContainer: function (x_err, x_id) {
            this.actionErr = x_err;
            common_startSpinner("stopSpinner_" + x_id);
            window.MainWinBridge.getContainers();
        },

        stopContainer: function (x_id) {
            common_startSpinner("stopSpinner_" + x_id);
            window.MainWinBridge.stopContainer(x_id);
        },
        resStopContainer: function (x_err, x_id) {
            this.actionErr = x_err;
            common_stopSpinner("stopSpinner_" + x_id);
            window.MainWinBridge.getContainers();
        },

        openConsole: function (x_id) {
            window.MainWinBridge.openConsole(x_id);
        },
        exportImageWin: function (x_id) {
            window.MainWinBridge.exportImageWin(x_id);
        },

        editMemoWin: function(x_id){
            window.MainWinBridge.editMemoWin(x_id);
        },

        prepareDeleteContainer: function(x_id){
            this.deleteContainerId = x_id;
        },
        doDeleteContainer: function(){
            common_startSpinner("deleteSpinner");
            window.MainWinBridge.deleteContainer(this.deleteContainerId);

        },
        resDeleteContainer: function (x_id) {
            common_stopSpinner("deleteSpinner");
            let p_modalId = document.getElementById('delModal');
            let p_modal = bootstrap.Modal.getInstance(p_modalId);
            p_modal.hide();

            window.MainWinBridge.getContainers();
        },
    }

})

{
    let p_i18nJson = window.MainWinBridge.getMsg();
    const i18n = new VueI18n.createI18n(p_i18nJson);
    containerApp.use(i18n);
    let p_if = containerApp.mount("#containerApp");

    let p_tab = document.getElementById("container-tab");
    p_tab.addEventListener('shown.bs.tab', function (event) {
        p_if.init();
    });


    let p_delModal = document.getElementById("delModal");
    p_delModal.addEventListener('show.bs.modal', function (event) {
        console.log('show.bs.modal:' + p_delModal);
        let p_btn = event.relatedTarget;
        let p_name = p_btn.getAttribute('data-bs-name');
        document.querySelector("#delContainerName").innerHTML = p_name;

        let p_image = p_btn.getAttribute('data-bs-image');
        document.querySelector("#delContainerImage").innerHTML = p_image;
    })
}


