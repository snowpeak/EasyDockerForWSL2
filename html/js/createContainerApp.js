const App = Vue.createApp({
    data() {
        return {
            imageId: "",
            name:null,
            tag:null,
            repo:null,
            service:"Y",
            host:"rakwf21",
            protocols:["TCP","TCP","","",""],
            locals:["8080","22","","",""],
            remotes:["8080","22","","",""],
            memo: "",
            createErr: null,
        }
    },
    created() {
        if (window.CreateContainerWinBridge) {
            window.CreateContainerWinBridge.resCreateContainer(this.resCreateContainer);
            window.CreateContainerWinBridge.resGetImageById(this.resGetImageById);
        }
        let p_params = new URLSearchParams(location.search);
        this.imageId = p_params.get('imageId');
        console.log("created: " + this.imageId);
        window.CreateContainerWinBridge.getImageById(this.imageId);
        
    },
    methods: {
        resGetImageById: function (x_err, x_image, x_infoJson) {
            console.log("resGetImagebyId: " + this.imageId);
            console.log(x_image);

            this.repo = x_image.RepoTags[0].split(":")[0];
            this.tag = x_image.RepoTags[0].split(":")[1];
            this.name = this.repo + ":" + this.tag;

            if(x_infoJson){
                this.service = x_infoJson.service;
                this.host = x_infoJson.host;
                let p_idx = 0;
                for(let p_port of x_infoJson.port_json){
                    console.log(p_port);
                    this.protocols[p_idx] = p_port.protocol;
                    this.locals[p_idx] = p_port.local;
                    this.remotes[p_idx] = p_port.remote;
                    p_idx++;
                }
                this.memo = x_infoJson.memo;
            }
        },
        createContainer: function(x_id){
            this.createErr = null;
            let p_protocols = [];
            let p_locals = [];
            let p_remotes = [];
            for(let i=0; i<this.protocols.length; i++){
                p_protocols.push("" + this.protocols[i]);
                p_locals.push("" + this.locals[i]);
                p_remotes.push("" + this.remotes[i]);
            }

            window.CreateContainerWinBridge.createContainer(
               this.name, this.repo, this.tag, this.service, this.host, p_protocols, p_locals, p_remotes, this.memo);
            },
        resCreateContainer: function (x_err) {
            let p_spinner = document.getElementById("spinner");
            if (p_spinner) {
                p_spinner.classList.add("d-none")
            }
            this.createErr = x_err;
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
    let p_i18nJson = window.CreateContainerWinBridge.getMsg();
    console.log(p_i18nJson);
    const i18n = new VueI18n.createI18n(p_i18nJson);
    App.use(i18n);
    App.mount("#App");

    let tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'))
    let tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl)
    })

}


