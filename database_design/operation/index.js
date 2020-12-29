const mysqlutil = require("./utils/mysql");
const fs = require("fs-extra");

var executes = [
    'data_product_eav.txt',
    'data_product_eav_datetime.txt',
    'data_product_eav_decimal.txt',
    'data_product_eav_int.txt',
    'data_product_eav_multi_value.txt',
    'data_product_eav_text.txt',
    'data_product_eav_varchar.txt',
    'data_product_entity.txt',
    'ecommerce_tables.csv',
    'operate_1.txt',
    'schema_init.txt',
    'sql_note.txt',
    'test.html'
];

(async () => {
    let dir = await fs.readdir("../");
    for(let i = 0; i < dir.length; i++){
        let stat = await fs.stat("../" + dir[i]);
        if(!stat.isFile()){
            dir.splice(i, 1);
            i -= 1;
        };
    };
    console.log(dir);
})()