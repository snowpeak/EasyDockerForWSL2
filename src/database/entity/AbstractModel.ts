import { Connection} from "typeorm";
import * as log from "electron-log";

export abstract class AbstractModel{
    private classObj: any;

    constructor(x_class:any){
        this.classObj = x_class
    }
    public async save(x_con: Connection): Promise<AbstractModel>{
        let repository  = x_con.getRepository(this.classObj);
        let p_ret = await repository.save(this);
        return p_ret;
    }

    public static async getAll(x_con: Connection) : Promise<AbstractModel[]> {
        let repository  = x_con.getRepository(AbstractModel);
        let list = await repository.find();
        log.info("all containers: ", list);
        return list;
    }
}