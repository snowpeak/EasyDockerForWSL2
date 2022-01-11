import {ImageAPI, ImageJson} from "./ImageAPI"
import {IdJson} from "./APIBase"
import {ContainerAPI, ContainerJson, CreateInfo} from "./ContainerAPI"

/*
ImageAPI.getAll((x_ret)=>{
    console.log(x_ret);


    let p_imageId = x_ret[0].RepoTags[0];
    let p_info:CreateInfo = {
        Hostname: "test",
        Cmd: ["/sbin/init"],
        Labels: {
            "testLabel": "samlple"
        },
        Image: p_imageId,
        ExposedPorts: {
            "22/tcp":{}
        },
        HostConfig: {
            Privileged: true,
            PortBindings: {
                "22/tcp": [{ "HostPort": "11022" }]
            }
        },
    }
    ContainerAPI.create(p_info, true, (x_id)=>{
        console.log("created container id="+x_id);
    })
});
*/

ContainerAPI.getAll((x_err, x_ret)=>{
    console.log(x_ret);
    let p_container = x_ret[0];
    if(p_container.State != "running"){
        ContainerAPI.start(p_container.Id, (x_err)=>{
            if(x_err == null){
                console.log("started container");
            } else {
                console.log("failed to start container: " + x_err);
            }
        });
    }else{
        ContainerAPI.stop(p_container.Id, (x_err)=>{
            if(x_err == null){
                console.log("stopped container");
            } else {
                console.log("failed to stop container: " + x_err);
            }
        });
    }
});
