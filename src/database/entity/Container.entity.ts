import { Connection, Entity, Column, PrimaryColumn } from 'typeorm';
import * as log from "electron-log";

@Entity()
export class Container {
    @PrimaryColumn( {length: 100})
    id: string

    @Column( {length: 100})
    name: string

    @Column( {length: 100})
    repo: string

    @Column( {length: 100})
    tag: string

    @Column("text")
    service: string

    @Column("text")
    host: string

    @Column("text")
    port_json: string

    @Column("text")
    memo: string

    @Column()
    createdate: number;

    constructor(x_id:string, x_name:string, x_repo:string, x_tag:string, x_service:string, x_host:string, x_port_json:string, x_memo:string, x_createdate:number){
        this.id = x_id;
        this.name = x_name;
        this.repo = x_repo;
        this.tag = x_tag;
        this.service = x_service;
        this.host = x_host;
        this.port_json = x_port_json;
        this.memo = x_memo;
        this.createdate = x_createdate;
    }

    public async save(x_con: Connection): Promise<Container>{
        let repository  = x_con.getRepository(Container);
        let p_ret = await repository.save(this);
        log.info("container saved: " + p_ret);
        return p_ret;
    }

    public static async getAll(x_con: Connection) : Promise<{[key:string]: Container}> {
        let repository  = x_con.getRepository(Container);
        let p_list = await repository.find();

        let p_ret:{[key:string]: Container} = {};
        for(let p_obj of p_list){
            p_ret[p_obj.id] = p_obj;
        }
        log.info("all containers: num=" + Object.keys(p_ret).length);
        return p_ret;
    }

    public static async getOne(x_con: Connection, x_id:string) : Promise<Container|undefined> {
        let repository  = x_con.getRepository(Container);
        let p_obj = await repository.findOne({id:x_id});
        log.info("get one container:", p_obj);
        return p_obj;
    }

    public static async delete(x_con: Connection, x_id:string) : Promise<boolean> {
        let repository  = x_con.getRepository(Container);
        let p_target = new Container(x_id, "", "", "", "", "", "", "", -1);
        let p_obj = await repository.remove(p_target);
        log.info("delete container: ", x_id);
        return true;
    }
}