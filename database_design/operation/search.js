const mysqlutil = require("./utils/mysql");

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
}

async function searchM24 ({category, product_id, searchPhrase, refinement, page}) {
    const M24 = await mysqlutil.generateConnection(sqlM24Config);
    let start = Date.now();
    // search entity_ids and rank order
    let queryPID =
    `SELECT \`cpe\`.entity_id
    FROM \`magento24\`.\`catalog_product_entity\` AS \`cpe\`
    WHERE \`cpe\`.entity_id=${product_id}
    `;
    let queryRefinement =
    `SELECT \`eav\`.entity_id
    FROM \`magento24\`.\`catalog_product_entity_int\` AS \`eav\`
    WHERE (\`eav\`.attribute_id=${key} AND \`eav\`.value=${value})
    `;
    let querySearchPhrase =
    `SELECT \`eav\`.entity_id
    FROM \`magento24\`.\`catalog_product_entity_varchar\` AS \`eav\`
    
    `
    // search product_ids
    // search all product data by product_ids
    let end = Date.now();
    console.log("search query took: ", end - start, " ms");
    // await fs.writeJSON("../test.json", result);
    M24.end();
}