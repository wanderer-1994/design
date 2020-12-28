const mysqlutil = require("./utils/mysql");
const fs = require("fs-extra");

(async () => {
    let dir = await fs.readdir("./");
    for(let i = 0; i < dir.length; i++){
        let stat = await fs.stat("./" + dir[i]);
        if(!stat.isFile()){
            dir.splice(i, 1);
            i -= 1;
        };
    };
    console.log(dir);
})()