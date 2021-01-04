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
    // search config validation
    try {
        if (categories) {
            categories.forEach(item => {
                if (typeof(item) != "string" || item.length == 0)
                    throw new Error("Search config invalid: categories must be a list of none-empty string!");
            });
        }
        if (product_ids) {
            product_ids.forEach(item => {
                if (typeof(item) != "string" || item.length == 0)
                    throw new Error("Search config invalid: product_ids must be a list of none-empty string!");
            });
        }
        if (refinements) {
            refinements.forEach(item => {
                if (typeof(item.attribute_id) != "string" || item.attribute_id.length == 0)
                    throw new Error("Search config invalid: refinement attribute_id must be a none-empty string!");
                if (!Array.isArray(item.value) || item.value.length == 0)
                    throw new Error("Search config invalid: refinement value must be a none-empty list!");
                item.value.forEach(value => {
                    if (typeof(value) != "number" && typeof(value) != "string")
                        throw new Error("Search config invalid: refinement value must be a list of string or number!")
                })
            });
        }
    } catch (err) {
        throw err
    }
    // search entity_ids and rank order
    let queryCID = "";
    if (categories && categories.length > 0) {
        queryCID =
        `
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
    }

    let queryPID = ""
    if (product_ids && product_ids.length > 0) {
        queryPID =
        `
        SELECT \`pe\`.entity_id, 1000 AS \`weight\`
        FROM \`ecommerce\`.\`product_entity\` AS \`pe\`
        WHERE \`pe\`.entity_id IN (\'${product_ids.map(item => mysqlutil.escapeQuotes(item)).join("\', \'")}\')
        `;
    }

    let queryRefinement = "";
    if (refinements && refinements.length > 0) {
        let refinementComponentQueries = refinements.map(item => {
            return `(\`attribute_id\`=\'${mysqlutil.escapeQuotes(item.attribute_id)}\' AND \`value\` IN (\'${item.value.map(item => mysqlutil.escapeQuotes(item.toString())).join("\', \'")}\'))`
        }).join(" OR ");
        
        queryRefinement =
        `
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
    }

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