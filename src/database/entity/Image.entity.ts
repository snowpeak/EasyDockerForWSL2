import { Connection, Entity, Column, PrimaryColumn } from 'typeorm';

@Entity()
export class Image {
    @PrimaryColumn( {length: 100})
    id: string

    @Column("text")
    info_json: string

    constructor(x_id:string, x_info_json:string){
        this.id = x_id;
        this.info_json = x_info_json;
    }

    public async save(x_con: Connection): Promise<Image>{
        let repository  = x_con.getRepository(Image);
        let p_ret = await repository.save(this);
        console.log("image saved: " + p_ret);
        return p_ret;
    }

    public static async getAll(x_con: Connection) : Promise<{[key:string]: Image}> {
        let repository  = x_con.getRepository(Image);
        let p_list = await repository.find();

        let p_ret:{[key:string]: Image} = {};
        for(let p_obj of p_list){
            p_ret[p_obj.id] = p_obj;
        }
        console.log("all images: num=" + Object.keys(p_ret).length);
        return p_ret;
    }

    public static async getOne(x_con: Connection, x_id:string) : Promise<Image|undefined> {
        let repository  = x_con.getRepository(Image);
        let p_obj = await repository.findOne({id:x_id});
        console.log("get one image:", p_obj);
        return p_obj;
    }

    public static async delete(x_con: Connection, x_id:string) : Promise<boolean> {
        let repository  = x_con.getRepository(Image);
        let p_target = new Image(x_id, "");
        let p_obj = await repository.remove(p_target);
        console.log("delete image: ", x_id);
        return true;
    }
}