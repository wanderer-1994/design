const mysqlutil = require("./utils/mysql");
const fs = require("fs-extra");

var executes = [
    'schema_init.txt',
    'data_product_eav.txt',
    // 'data_product_eav_datetime.txt',
    'data_product_eav_decimal.txt',
    'data_product_eav_int.txt',
    'data_product_eav_multi_value.txt',
    'data_product_eav_text.txt',
    'data_product_eav_varchar.txt',
    'data_product_entity.txt',
];

var sqlConfig = {
    host: "localhost",
    port: "3306",
    user: "root",
    password: "tkh170294"
}

var sqlM24Config = {
    host: "localhost",
    port: "3307",
    user: "root",
};

async function initEcommerceDB ()  {
    try {
        console.log("start: ", Date.now())
        const DB = await mysqlutil.generateConnection(sqlConfig);
        let sqls = [];
        for (let i = 0; i < executes.length; i++) {
            let fileData = await fs.readFile(`../${executes[i]}`, "utf-8");
            fileData = fileData.split(/\n###.*|^###.*/);
            fileData.forEach(sql => {
                sql = sql.trim();
                if (sql.length > 0) sqls.push(sql);
            })
        }
        for (let i = 0; i < sqls.length; i++) {
            await DB.promiseQuery(sqls[i]);
        }
        DB.end();
        console.log("end: ", Date.now())
    } catch (error) {
        throw error;
    }
}

async function selectM24MassiveData () {
    try {
        const M24 = await mysqlutil.generateConnection(sqlM24Config);
        await M24.promiseQuery("USE `magento24`;");
        let query = `SELECT \`pre\`.*, \`eav\`. frontend_input, \`eav\`. attribute_code, \`eav\`. frontend_label FROM (
            SELECT IF(\`splk\`.parent_id IS NOT NULL, \`splk\`.parent_id, \`p\`.entity_id) as product_id, \`p\`.entity_id, \`p\`.sku, \`p\`.type_id, \`varchar\`.attribute_id, \`varchar\`.value
            FROM \`catalog_product_entity\` as \`p\`
            LEFT JOIN \`catalog_product_super_link\` as \`splk\` ON \`splk\`.product_id = \`p\`.entity_id
            INNER JOIN \`catalog_product_entity_varchar\` as \`varchar\` ON \`varchar\`.entity_id = \`p\`.entity_id
            WHERE \`p\`.entity_id BETWEEN 2020 AND 3000
        UNION
            SELECT IF(\`splk\`.parent_id IS NOT NULL, \`splk\`.parent_id, \`p\`.entity_id) as product_id, \`p\`.entity_id, \`p\`.sku, \`p\`.type_id, \`text\`.attribute_id, \`text\`.value
            FROM \`catalog_product_entity\` as \`p\`
            LEFT JOIN \`catalog_product_super_link\` as \`splk\` ON \`splk\`.product_id = \`p\`.entity_id
            INNER JOIN \`catalog_product_entity_text\` as \`text\` ON \`text\`.entity_id = \`p\`.entity_id
            WHERE \`p\`.entity_id BETWEEN 2020 AND 3000
        UNION
            SELECT IF(\`splk\`.parent_id IS NOT NULL, \`splk\`.parent_id, \`p\`.entity_id) as product_id, \`p\`.entity_id, \`p\`.sku, \`p\`.type_id, \`int\`.attribute_id, \`int\`.value
            FROM \`catalog_product_entity\` as \`p\`
            LEFT JOIN \`catalog_product_super_link\` as \`splk\` ON \`splk\`.product_id = \`p\`.entity_id
            INNER JOIN \`catalog_product_entity_int\` as \`int\` ON \`int\`.entity_id = \`p\`.entity_id
            WHERE \`p\`.entity_id BETWEEN 2020 AND 3000
        UNION
            SELECT IF(\`splk\`.parent_id IS NOT NULL, \`splk\`.parent_id, \`p\`.entity_id) as product_id, \`p\`.entity_id, \`p\`.sku, \`p\`.type_id, \`decimal\`.attribute_id, \`decimal\`.value
            FROM \`catalog_product_entity\` as \`p\`
            LEFT JOIN \`catalog_product_super_link\` as \`splk\` ON \`splk\`.product_id = \`p\`.entity_id
            INNER JOIN \`catalog_product_entity_decimal\` as \`decimal\` ON \`decimal\`.entity_id = \`p\`.entity_id
            WHERE \`p\`.entity_id BETWEEN 2020 AND 3000
        UNION
            SELECT IF(\`splk\`.parent_id IS NOT NULL, \`splk\`.parent_id, \`p\`.entity_id) as product_id, \`p\`.entity_id, \`p\`.sku, \`p\`.type_id, \`datetime\`.attribute_id, \`datetime\`.value
            FROM \`catalog_product_entity\` as \`p\`
            LEFT JOIN \`catalog_product_super_link\` as \`splk\` ON \`splk\`.product_id = \`p\`.entity_id
            INNER JOIN \`catalog_product_entity_datetime\` as \`datetime\` ON \`datetime\`.entity_id = \`p\`.entity_id
            WHERE \`p\`.entity_id BETWEEN 2020 AND 3000
        ) AS \`pre\`
        INNER JOIN \`eav_attribute\` as \`eav\` ON \`pre\`.attribute_id=\`eav\`.attribute_id ORDER BY \`pre\`.entity_id ASC`;
        let start = Date.now();
        let result = await M24.promiseQuery(query);
        let end = Date.now();
        // console.log("query took: ", end - start, " ms");
        // await fs.writeJSON("../test.json", result);
        M24.end();
        return result;
    } catch (error) {
        throw error;
    }
};

async function processingProductsData () {
    try {
        let rawData = await selectM24MassiveData();
        console.log(rawData.length);
        let products = mysqlutil.groupByAttribute({
            rawData: rawData,
            groupBy: "product_id"
        });
        products.forEach(product => {
            product.type_id = product.__items.find(line_item => line_item.entity_id == product.product_id).type_id;
            product.__items = mysqlutil.groupByAttribute({
                rawData: product.__items,
                groupBy: "entity_id"
            });
            switch (product.type_id) {
                case "simple":
                    product.self = product.__items.find(line_item => line_item.entity_id == product.product_id);
                    break;
                case "configurable":
                    product.parent = product.__items.find(line_item => line_item.entity_id == product.product_id);
                    product.variants = product.__items.filter(line_item => line_item.entity_id != product.product_id);
                    break;
                default:
                    break;
            };
            product.__items.forEach(product_entity => {
                product_entity.attributes = mysqlutil.groupByAttribute({
                    rawData: product_entity.__items,
                    groupBy: "attribute_code",
                    nullExcept: [null, ""]
                });
                product_entity.attributes.forEach(attr_item => {
                    if(attr_item[0]){
                        let keys = Object.keys(attr_item[0]);
                        keys
                    }
                })
            })
        })
        await fs.writeJSON("../test2.json", products);
        console.log(products.length);
    } catch (error) {
        throw error;
    }
}

processingProductsData()