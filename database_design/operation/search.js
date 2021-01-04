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

async function searchDB ({categories, product_ids, searchPhrase, refinements, page}) {
    const DB = await mysqlutil.generateConnection(sqlDBConfig);
    let start = Date.now();
    // search entity_ids and rank order
    let queryCID =`
    WITH RECURSIVE \`cte\` (entity_id) AS (
        SELECT entity_id
        FROM \`ecommerce\`.category_entity
        WHERE entity_id IN (\'${categories.map(item => mysqlutil.escapeQuotes(item)).join("\', \'")}\')
        UNION ALL
        SELECT p.entity_id
        FROM \`ecommerce\`.category_entity AS \`p\`
        INNER JOIN cte ON \`p\`.parent = \`cte\`.entity_id
    )
    SELECT \`pca\`.product_id AS \`entity_id\`, 100 AS \`weight\` FROM \`ecommerce\`.product_category_assignment AS \`pca\`
    INNER JOIN \`ecommerce\`.product_entity AS \`pe\` ON \`pe\`.entity_id = \`pca\`.product_id
    WHERE category_id IN(SELECT DISTINCT entity_id FROM \`cte\`)
    `;

    let queryPID =`
    SELECT \`pe\`.entity_id, 1000 AS \`weight\`
    FROM \`ecommerce\`.\`product_entity\` AS \`pe\`
    WHERE \`pe\`.entity_id IN (\'${product_ids.map(item => mysqlutil.escapeQuotes(item)).join("\', \'")}\')
    `;

    let refinementComponentQueries = refinements.map(item => {
        return `(\`attribute_id\`=\'${mysqlutil.escapeQuotes(item.attribute_id)}\' AND \`value\` IN (\'${item.value.map(item => mysqlutil.escapeQuotes(item.toString())).join("\', \'")}\'))`
    }).join(" OR ")

    let queryRefinement =`
    SELECT DISTINCT entity_id, 10 AS \`weight\` FROM
    (   SELECT \`eav\`.entity_id
        FROM \`ecommerce\`.\`product_eav_varchar\` AS \`eav\`
        WHERE ${refinementComponentQueries}
    UNION ALL
        SELECT \`eav\`.entity_id
        FROM \`ecommerce\`.\`product_eav_text\` AS \`eav\`
        WHERE ${refinementComponentQueries}
    UNION ALL
        SELECT \`eav\`.entity_id
        FROM \`ecommerce\`.\`product_eav_int\` AS \`eav\`
        WHERE ${refinementComponentQueries}
    UNION ALL
        SELECT \`eav\`.entity_id
        FROM \`ecommerce\`.\`product_eav_decimal\` AS \`eav\`
        WHERE ${refinementComponentQueries}
    UNION ALL
        SELECT \`eav\`.entity_id
        FROM \`ecommerce\`.\`product_eav_datetime\` AS \`eav\`
        WHERE ${refinementComponentQueries}
    UNION ALL
        SELECT \`eav\`.entity_id
        FROM \`ecommerce\`.\`product_eav_multi_value\` AS \`eav\`
        WHERE ${refinementComponentQueries}
    ) AS \`alias\`
    `;

    let querySearchPhrase = "";
    
    let assembledQuery = [queryCID, queryPID, queryRefinement, querySearchPhrase]
    .filter(item => (item != null && item != ""))
    .join(" UNION ALL ");

    console.log(assembledQuery);
    let result = await DB.promiseQuery(assembledQuery)
    // search product_ids
    // search all product data by product_ids
    let end = Date.now();
    console.log("search query took: ", end - start, " ms");
    console.log(result);
    DB.end();
};

let searchConfig = {
    "categories": ["earbud", "charge_cable"],
    "product_ids": ["PR001", "PR003"],
    "searchPhrase": "Tai nghe bluetooth",
    "refinements": [{
        "attribute_id": "length",
        "value": [1.2]
    },
    {
        "attribute_id": "color",
        "value": ["Đỏ_#eb3458", "Lam_#eb3458"]
    },
    {
        "attribute_id": "impedance",
        "value": [32, 17.5]
    }],
    "page": 2
}


searchDB(searchConfig);