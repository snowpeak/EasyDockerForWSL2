//import "reflect-metadata";
import { createConnection}  from "typeorm";
import { Container } from "./entity/Container.entity"

console.log("hello");
createConnection({
    "type": "sqlite",
    "database": "../data/database.sqlite3",
    "entities":[
        __dirname + "/entity/**/*.entity.js",
    ],    
    "synchronize": true
}).then(async con => {
    console.log("db connection established:" + __dirname)
    let meta = con.getMetadata;

    let container = new Container(
        "03", "name", "repo", "tag", "8080->8080", "メモです3", new Date().getTime());
    let p_ret = await container.save(con);
    console.log(p_ret);
    let list = Container.getAll(con);
    //console.log(list);

}).catch(error => console.log(error));

