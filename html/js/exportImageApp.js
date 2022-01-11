const App = Vue.createApp({
    data() {
        return {
            containerId : null,
            filePath: null,
            filePath_err: false,

            service:"Y",
            host:"rakwf21",
            protocols:["TCP","TCP","","",""],
            locals:["8080","22","","",""],
            remotes:["8080","22","","",""],
            memo: "",

            exportErr: null
        }
    },
    created() {
        if (window.ExportImageWinBridge) {
            window.ExportImageWinBridge.resGetContainers(this.resGetContainers);
            window.ExportImageWinBridge.resSelectFile(this.resSelectFile);
            window.ExportImageWinBridge.resExportImage(this.resExportImage);
        }
        let p_params = new URLSearchParams(location.search);
        this.containerId = p_params.get('containerId');
        window.ExportImageWinBridge.getContainers();
    },
    methods: {
        selectFile: function(){
            window.ExportImageWinBridge.selectFile("DockerImage", ["zip","tar","tar.gz"]);
        },
        resSelectFile: function (x_path) {
            if(x_path){
                this.filePath = x_path;
            }
        },
        resGetContainers: function (x_err, x_containers) {
            for(let p_container of x_containers){
                if(p_container.Id == this.containerId && p_container.dbInfo){
                    let p_idx = 0;
                    let p_infoJson = JSON.parse(p_container.dbInfo.port_json);
                    for(let p_port of p_infoJson){
                        this.protocols[p_idx] = p_port.protocol;
                        this.locals[p_idx] = p_port.local;
                        this.remotes[p_idx] = p_port.remote;
                        p_idx++;
                        console.log("loop:" + p_idx);
                    }

                    console.log(JSON.stringify(p_container));
                    this.service = p_container.dbInfo.service;
                    this.host = p_container.dbInfo.host;
                    this.memo = p_container.dbInfo.memo;
                    break;             
                }
            }
        },
        exportImage: function(){
            this.loadErr = null;
            this.filePath_err = !(this.filePath);

            let p_port_json = []
            for(let i=0; i<this.protocols.length; i++){
                p_port_json.push({
                    protocol: this.protocols[i],
                    local: this.locals[i],
                    remote: this.remotes[i],
                })
            }
            let p_info = {
                "service" : this.service,
                "host" : this.host,
                "port_json": p_port_json,
                "memo": this.memo
            }

            if( !this.filePath_err){
                let p_spinner = document.getElementById("spinner");
                if (p_spinner) {
                    p_spinner.classList.remove("d-none")
                }
                console.log("do export:" + this.containerId);
                window.ExportImageWinBridge.exportImage(this.containerId, this.filePath, p_info);
            }
        },
        resExportImage: function (x_err) {
            let p_spinner = document.getElementById("spinner");
            if (p_spinner) {
                p_spinner.classList.add("d-none")
            }
            this.exportErr = x_err;
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
    let p_i18nJson = window.ExportImageWinBridge.getMsg();
    const i18n = new VueI18n.createI18n(p_i18nJson);
    App.use(i18n);
    App.mount("#App");
}


