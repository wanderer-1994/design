const mysqlutil = require("./utils/mysql");
const fs = require("fs-extra");

const productSelectedFields = [
    "attribute_code",
    "product_id",
    "entity_id",
    "sku",
    "type_id",
    "attribute_id",
    "value",
    "frontend_input",
    "frontend_label"
];
const productInheritFieldsM24 = ["product_id", "type_id"];
const productEntityInheritFieldsM24 = ["product_id", "entity_id", "sku", "type_id"];
const attributeInheritFieldsM24 = ["attribute_code", "attribute_id", "value", "frontend_input", "frontend_label"];
const productInheritFields = ["product_id", "type_id"];
const productEntityInheritFields = ["product_id", "entity_id", "type_id"];
const attributeInheritFields = ["attribute_id", "value", "label", "html_type", "data_type", "validation", "is_super", "is_system", "unit"];
const multivalueAttributes = ["multiselect", "multiinput"];

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

var sqlDBConfig = {
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

function centralizeAttributeMetaData (products) {
    let data = {
        attributes: []
    };
    function extracting (product) {
        if(!product.attributes) return;
        product.attributes.forEach((attribute, index) => {
            let match = data.attributes.find(item => item.attribute_id == attribute.attribute_id);
            if(!match) {
                match = {};
                Object.assign(match, attribute);
                delete match.value;
                data.attributes.push(match);
            }
            product.attributes[index] = {
                attribute_code: attribute.attribute_code,
                value: attribute.value
            }
        })
    }
    products.forEach(product => {
        if(product.parent){
            extracting(product.parent);
        }
        if(product.self){
            extracting(product.self)
        }
        if(product.variants){
            product.variants.forEach(variant => {
                extracting(variant);
            })
        }
    });
    data.products = products;
    return data;
}

async function initEcommerceDB ()  {
    try {
        console.log("start: ", Date.now())
        const DB = await mysqlutil.generateConnection(sqlDBConfig);
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
            WHERE \`p\`.entity_id BETWEEN 1 AND 3
        UNION
            SELECT IF(\`splk\`.parent_id IS NOT NULL, \`splk\`.parent_id, \`p\`.entity_id) as product_id, \`p\`.entity_id, \`p\`.sku, \`p\`.type_id, \`text\`.attribute_id, \`text\`.value
            FROM \`catalog_product_entity\` as \`p\`
            LEFT JOIN \`catalog_product_super_link\` as \`splk\` ON \`splk\`.product_id = \`p\`.entity_id
            INNER JOIN \`catalog_product_entity_text\` as \`text\` ON \`text\`.entity_id = \`p\`.entity_id
            WHERE \`p\`.entity_id BETWEEN 1 AND 3
        UNION
            SELECT IF(\`splk\`.parent_id IS NOT NULL, \`splk\`.parent_id, \`p\`.entity_id) as product_id, \`p\`.entity_id, \`p\`.sku, \`p\`.type_id, \`int\`.attribute_id, \`int\`.value
            FROM \`catalog_product_entity\` as \`p\`
            LEFT JOIN \`catalog_product_super_link\` as \`splk\` ON \`splk\`.product_id = \`p\`.entity_id
            INNER JOIN \`catalog_product_entity_int\` as \`int\` ON \`int\`.entity_id = \`p\`.entity_id
            WHERE \`p\`.entity_id BETWEEN 1 AND 3
        UNION
            SELECT IF(\`splk\`.parent_id IS NOT NULL, \`splk\`.parent_id, \`p\`.entity_id) as product_id, \`p\`.entity_id, \`p\`.sku, \`p\`.type_id, \`decimal\`.attribute_id, \`decimal\`.value
            FROM \`catalog_product_entity\` as \`p\`
            LEFT JOIN \`catalog_product_super_link\` as \`splk\` ON \`splk\`.product_id = \`p\`.entity_id
            INNER JOIN \`catalog_product_entity_decimal\` as \`decimal\` ON \`decimal\`.entity_id = \`p\`.entity_id
            WHERE \`p\`.entity_id BETWEEN 1 AND 3
        UNION
            SELECT IF(\`splk\`.parent_id IS NOT NULL, \`splk\`.parent_id, \`p\`.entity_id) as product_id, \`p\`.entity_id, \`p\`.sku, \`p\`.type_id, \`datetime\`.attribute_id, \`datetime\`.value
            FROM \`catalog_product_entity\` as \`p\`
            LEFT JOIN \`catalog_product_super_link\` as \`splk\` ON \`splk\`.product_id = \`p\`.entity_id
            INNER JOIN \`catalog_product_entity_datetime\` as \`datetime\` ON \`datetime\`.entity_id = \`p\`.entity_id
            WHERE \`p\`.entity_id BETWEEN 1 AND 3
        ) AS \`pre\`
        INNER JOIN \`eav_attribute\` as \`eav\` ON \`pre\`.attribute_id=\`eav\`.attribute_id ORDER BY \`pre\`.entity_id ASC`;
        let start = Date.now();
        let result = await M24.promiseQuery(query);
        let end = Date.now();
        console.log("query took: ", end - start, " ms");
        // await fs.writeJSON("../test.json", result);
        M24.end();
        return result;
    } catch (error) {
        throw error;
    }
};

async function modelizeM24ProductsData () {
    try {
        let rawData = await selectM24MassiveData();
        let start = Date.now();
        let products = mysqlutil.groupByAttribute({
            rawData: rawData,
            groupBy: "product_id"
        });
        products.forEach((product, index) => {
            let self = product.__items.find(line_item => line_item.entity_id == product.product_id);
            if(!self){
                console.warn("Product ", product.product_id, " has no parent. Hence is ignored!");
                products[index] = null;
                return;
            }
            product.type_id = self.type_id;
            product.__items = mysqlutil.groupByAttribute({
                rawData: product.__items,
                groupBy: "entity_id"
            });
            switch (product.type_id) {
                case "simple": case "bundle": case "grouped": case "downloadable":
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
                if(product_entity.__items[0]){
                    productEntityInheritFieldsM24.forEach(field_item => {
                        product_entity[field_item] = product_entity.__items[0][field_item] || product_entity[field_item];
                    })
                }
                product_entity.attributes = mysqlutil.groupByAttribute({
                    rawData: product_entity.__items,
                    groupBy: "attribute_code",
                    nullExcept: [null, ""]
                });
                product_entity.attributes.forEach(attr_item => {
                    if(attr_item.__items[0]){
                        if("__items" in attr_item.__items[0]){
                            throw new Error("Invalid property name \"__item\". \"__item\" is framework preserved key.")
                        }
                        attributeInheritFieldsM24.forEach(field_item => {
                            attr_item[field_item] = attr_item.__items[0][field_item] || attr_item[field_item];
                        })
                    }
                    if(multivalueAttributes.indexOf(attr_item.frontend_input) != -1){
                        attr_item.value = [];
                        attr_item.__items.forEach(value_item => {
                            attr_item.value.push(value_item.value);
                        })
                    }
                    delete attr_item.__items;
                });
                delete product_entity.__items;
            });
            delete product.__items;
        })
        products = products.filter(product => product != null);
        let end = Date.now();
        console.log("product processing took: ", end - start, " ms");
        return products;
        // await fs.writeJSON("../test2.json", products);
    } catch (error) {
        throw error;
    }
}

async function selectProductsData () {
    try {
        const DB = await mysqlutil.generateConnection(sqlDBConfig);
        await DB.promiseQuery("USE `ecommerce`;");
        let query = `SELECT \`pe\`.entity_id, \`pe\`.product_id, \`pe\`.type_id, \`pe\`.value, \`attributes\`.*  FROM (
            SELECT
                \`pe\`.entity_id, IF((\`pe\`.parent is not null and \`pe\`.parent != \'\'), \`pe\`.parent, \`pe\`.entity_id) as product_id,
                \`pe\`.type_id, \`eav\`.attribute_id, \`eav\`.value
            FROM \`ecommerce\`.product_entity as \`pe\`
            LEFT JOIN \`ecommerce\`.product_eav_int as \`eav\` ON \`eav\`.entity_id = \`pe\`.entity_id
            WHERE \`pe\`.entity_id in (\'PR001\', \'PR002\') or \`pe\`.parent in (\'PR001\', \'PR002\')
            UNION
            SELECT
                \`pe\`.entity_id, IF((\`pe\`.parent is not null and \`pe\`.parent != \'\'), \`pe\`.parent, \`pe\`.entity_id) as product_id,
                \`pe\`.type_id, \`eav\`.attribute_id, \`eav\`.value
            FROM \`ecommerce\`.product_entity as \`pe\`
            LEFT JOIN \`ecommerce\`.product_eav_decimal as \`eav\` ON \`eav\`.entity_id = \`pe\`.entity_id
            WHERE \`pe\`.entity_id in (\'PR001\', \'PR002\') or \`pe\`.parent in (\'PR001\', \'PR002\')
            UNION
            SELECT
                \`pe\`.entity_id, IF((\`pe\`.parent is not null and \`pe\`.parent != \'\'), \`pe\`.parent, \`pe\`.entity_id) as product_id,
                \`pe\`.type_id, \`eav\`.attribute_id, \`eav\`.value
            FROM \`ecommerce\`.product_entity as \`pe\`
            LEFT JOIN \`ecommerce\`.product_eav_varchar as \`eav\` ON \`eav\`.entity_id = \`pe\`.entity_id
            WHERE \`pe\`.entity_id in (\'PR001\', \'PR002\') or \`pe\`.parent in (\'PR001\', \'PR002\')
            UNION
            SELECT
                \`pe\`.entity_id, IF((\`pe\`.parent is not null and \`pe\`.parent != \'\'), \`pe\`.parent, \`pe\`.entity_id) as product_id,
                \`pe\`.type_id, \`eav\`.attribute_id, \`eav\`.value
            FROM \`ecommerce\`.product_entity as \`pe\`
            LEFT JOIN \`ecommerce\`.product_eav_text as \`eav\` ON \`eav\`.entity_id = \`pe\`.entity_id
            WHERE \`pe\`.entity_id in (\'PR001\', \'PR002\') or \`pe\`.parent in (\'PR001\', \'PR002\')
            UNION
            SELECT
                \`pe\`.entity_id, IF((\`pe\`.parent is not null and \`pe\`.parent != \'\'), \`pe\`.parent, \`pe\`.entity_id) as product_id,
                \`pe\`.type_id, \`eav\`.attribute_id, \`eav\`.value
            FROM \`ecommerce\`.product_entity as \`pe\`
            LEFT JOIN \`ecommerce\`.product_eav_datetime as \`eav\` ON \`eav\`.entity_id = \`pe\`.entity_id
            WHERE \`pe\`.entity_id in (\'PR001\', \'PR002\') or \`pe\`.parent in (\'PR001\', \'PR002\')
            UNION
            SELECT
                \`pe\`.entity_id, IF((\`pe\`.parent is not null and \`pe\`.parent != \'\'), \`pe\`.parent, \`pe\`.entity_id) as product_id,
                \`pe\`.type_id, \`eav\`.attribute_id, \`eav\`.value
            FROM \`ecommerce\`.product_entity as \`pe\`
            LEFT JOIN \`ecommerce\`.product_eav_multi_value as \`eav\` ON \`eav\`.entity_id = \`pe\`.entity_id
            WHERE \`pe\`.entity_id in (\'PR001\', \'PR002\') or \`pe\`.parent in (\'PR001\', \'PR002\')
        ) as \`pe\`
        LEFT JOIN \`ecommerce\`.product_eav as \`attributes\` ON \`attributes\`.attribute_id = \`pe\`.attribute_id
        ORDER BY \`pe\`.product_id, \`pe\`.entity_id`;
        let start = Date.now();
        let result = await DB.promiseQuery(query);
        let end = Date.now();
        console.log("query took: ", end - start, " ms");
        // await fs.writeJSON("../test.json", result);
        DB.end();
        return result;
    } catch (error) {
        throw error;
    }
}

function modelizeProductsData (rawData) {
    try {
        console.log(rawData.length);
        let start = Date.now();
        let products = mysqlutil.groupByAttribute({
            rawData: rawData,
            groupBy: "product_id"
        });
        products.forEach((product, index) => {
            let self = product.__items.find(line_item => line_item.entity_id == product.product_id);
            if(!self){
                console.warn("Product ", product.product_id, " has no parent. Hence is ignored!");
                products[index] = null;
                return;
            }
            product.type_id = self.type_id;
            product.__items = mysqlutil.groupByAttribute({
                rawData: product.__items,
                groupBy: "entity_id"
            });
            switch (product.type_id) {
                case "simple": case "bundle": case "grouped": case "downloadable":
                    product.self = product.__items.find(line_item => line_item.entity_id == product.product_id);
                    break;
                case "master":
                    product.parent = product.__items.find(line_item => line_item.entity_id == product.product_id);
                    product.variants = product.__items.filter(line_item => line_item.entity_id != product.product_id);
                    break;
                default:
                    products[index] = null;
                    return;
            };
            product.__items.forEach(product_entity => {
                if(product_entity.__items[0]){
                    productEntityInheritFields.forEach(field_item => {
                        product_entity[field_item] = product_entity.__items[0][field_item] || product_entity[field_item];
                    })
                }
                product_entity.attributes = mysqlutil.groupByAttribute({
                    rawData: product_entity.__items,
                    groupBy: "attribute_id",
                    nullExcept: [null, ""]
                });
                product_entity.attributes.forEach(attr_item => {
                    if(attr_item.__items[0]){
                        if("__items" in attr_item.__items[0]){
                            throw new Error("Invalid property name \"__item\". \"__item\" is framework preserved key.")
                        }
                        attributeInheritFields.forEach(field_item => {
                            attr_item[field_item] = attr_item.__items[0][field_item] || attr_item[field_item];
                        })
                    }
                    if(multivalueAttributes.indexOf(attr_item.html_type) != -1){
                        attr_item.value = [];
                        attr_item.__items.forEach(value_item => {
                            attr_item.value.push(value_item.value);
                        })
                    }
                    delete attr_item.__items;
                });
                delete product_entity.__items;
            });
            delete product.__items;
        })
        products = products.filter(product => product != null);
        let end = Date.now();
        console.log("product processing took: ", end - start, " ms");
        return products;
    } catch (error) {
        throw error;
    }
}

async function getProductsDB () {
    let rawData = await selectProductsData();
    let products = modelizeProductsData(rawData);
    // await fs.writeJSON("../DBproducts.json", products);
}

async function test () {
    let products = await modelizeM24ProductsData();
    let start = Date.now();
    let data = centralizeAttributeMetaData(products);
    let end = Date.now();
    console.log("centralize took ", end - start, " ms");
    // await fs.writeJSON("../testCentralizeAttrs.json", data);
}

async function getProductsCache () {
    let start = Date.now();
    let products = await fs.readFile("../test2.json", "utf8");
    products = JSON.parse(products);
    let end = Date.now();
    console.log("get products cache took ", end - start, " ms");
    console.log(products.length);
    fs.re
};

(() => {
    console.log(require("module").builtinModules);
})()

// modelizeM24ProductsData()
// getProductsCache()

