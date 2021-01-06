const mysqlutil = require("./utils/mysql");
const fulltextSearch = require("./utils/fulltextSearch");
const fulltextSearchM24 = require("./utils/fulltextSearchM24");

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

async function searchDB ({ categories, product_ids, refinements, searchPhrase, searchDictionary, page }) {
    const DB = await mysqlutil.generateConnection(sqlDBConfig);
    let start = Date.now();
    // SEARCH CONFIG VALIDATION
    try {
        if (categories && Array.isArray(categories)) {
            categories.forEach(item => {
                if (typeof(item) != "string" || item.length == 0)
                    throw new Error("Search config invalid: categories must be a list of none-empty string!");
            });
        } else {
            categories = null;
        }
        if (product_ids && Array.isArray(product_ids)) {
            product_ids.forEach(item => {
                if (typeof(item) != "string" || item.length == 0)
                    throw new Error("Search config invalid: product_ids must be a list of none-empty string!");
            });
        } else {
            product_ids = null;
        }
        if (refinements && Array.isArray(refinements)) {
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
        } else {
            refinements = null;
        }
        if (
            (searchPhrase != null && typeof(searchPhrase) != "string") ||
            (typeof(searchPhrase) == "string" && searchPhrase.trim().length == 0)
        ) {
            throw new Error("Search config invalid: searchPhrase must be none-empty string!")
        }
    } catch (err) {
        throw err
    }
    // SEARCH entity_ids ORDERED BY RANKING
    // ## search by category_id
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
        WHERE \`pca\`.category_id IN(SELECT DISTINCT entity_id FROM \`cte\`)
        `;
    }
    // ## search by product_id
    let queryPID = ""
    if (product_ids && product_ids.length > 0) {
        queryPID =
        `
        SELECT \`pe\`.entity_id, 1000 AS \`weight\`
        FROM \`ecommerce\`.\`product_entity\` AS \`pe\`
        WHERE \`pe\`.entity_id IN (\'${product_ids.map(item => mysqlutil.escapeQuotes(item)).join("\', \'")}\')
        `;
    }
    // ## search by attribute refinements
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
    // ## search by search phrase
    let querySearchPhrase = "";
    if (searchPhrase) {
        querySearchPhrase = fulltextSearch.generateFulltextSqlSearchProductEntity({ searchPhrase, searchDictionary });
    }
    // ## final assembled search query
    let assembledQuery = [queryCID, queryPID, queryRefinement, querySearchPhrase]
    .filter(item => (item != null && item != ""))
    .join(" UNION ALL ");
    
    if (assembledQuery.length == 0) {
        assembledQuery = `SELECT entity_id, 1 AS \`weight\` FROM \`ecommerce\`.product_entity`;
    }

    console.log(assembledQuery);
    let result = await DB.promiseQuery(assembledQuery)
    // search product_ids
    // search all product data by product_ids
    let end = Date.now();
    console.log("search query took: ", end - start, " ms");
    console.log(result);
    DB.end();
};

async function searchM24 ({ categories, product_ids, refinements, searchPhrase, searchDictionary, page }) {
    const M24 = await mysqlutil.generateConnection(sqlM24Config);
    let start = Date.now();
    // SEARCH CONFIG VALIDATION
    try {
        if (categories && Array.isArray(categories)) {
            categories.forEach(item => {
                if (typeof(item) != "string" || item.length == 0)
                    throw new Error("Search config invalid: categories must be a list of none-empty string!");
            });
        } else {
            categories = null;
        }
        if (product_ids && Array.isArray(product_ids)) {
            product_ids.forEach(item => {
                if (typeof(item) != "string" || item.length == 0)
                    throw new Error("Search config invalid: product_ids must be a list of none-empty string!");
            });
        } else {
            product_ids = null;
        }
        if (refinements && Array.isArray(refinements)) {
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
        } else {
            refinements = null;
        }
        if (
            (searchPhrase != null && typeof(searchPhrase) != "string") ||
            (typeof(searchPhrase) == "string" && searchPhrase.trim().length == 0)
        ) {
            throw new Error("Search config invalid: searchPhrase must be none-empty string!")
        }
    } catch (err) {
        throw err
    }
    // SEARCH entity_ids ORDERED BY RANKING
    // ## search by category_id
    let queryCID = "";
    if (categories && categories.length > 0) {
        queryCID =
        `
        WITH RECURSIVE \`cte\` (entity_id) AS (
            SELECT entity_id
            FROM \`magento24\`.catalog_category_entity
            WHERE entity_id IN (\'${categories.map(item => mysqlutil.escapeQuotes(item)).join("\', \'")}\')
            UNION ALL
            SELECT p.entity_id
            FROM \`magento24\`.catalog_category_entity AS \`p\`
            INNER JOIN cte ON \`p\`.parent_id = \`cte\`.entity_id
        )
        SELECT \`pca\`.product_id AS \`entity_id\`, 100 AS \`weight\` FROM \`magento24\`.catalog_category_product AS \`pca\`
        INNER JOIN \`magento24\`.catalog_product_entity AS \`pe\` ON \`pe\`.entity_id = \`pca\`.product_id
        WHERE \`pca\`.category_id IN(SELECT DISTINCT entity_id FROM \`cte\`)
        `;
    }
    // ## search by product_id
    let queryPID = ""
    if (product_ids && product_ids.length > 0) {
        queryPID =
        `
        SELECT \`pe\`.entity_id, 1000 AS \`weight\`
        FROM \`magento24\`.\`catalog_product_entity\` AS \`pe\`
        WHERE \`pe\`.entity_id IN (\'${product_ids.map(item => mysqlutil.escapeQuotes(item)).join("\', \'")}\')
        `;
    }
    // ## search by attribute refinements
    let queryRefinement = "";
    if (refinements && refinements.length > 0) {
        let refinementComponentQueries = refinements.map(item => {
            return `(\`attribute_id\`=\'${mysqlutil.escapeQuotes(item.attribute_id)}\' AND \`value\` IN (\'${item.value.map(item => mysqlutil.escapeQuotes(item.toString())).join("\', \'")}\'))`
        }).join(" OR ");
        
        queryRefinement =
        `
        SELECT DISTINCT entity_id, 10 AS \`weight\` FROM
        (   SELECT \`eav\`.entity_id
            FROM \`magento24\`.\`catalog_product_entity_varchar\` AS \`eav\`
            WHERE ${refinementComponentQueries}
        UNION ALL
            SELECT \`eav\`.entity_id
            FROM \`magento24\`.\`catalog_product_entity_text\` AS \`eav\`
            WHERE ${refinementComponentQueries}
        UNION ALL
            SELECT \`eav\`.entity_id
            FROM \`magento24\`.\`catalog_product_entity_int\` AS \`eav\`
            WHERE ${refinementComponentQueries}
        UNION ALL
            SELECT \`eav\`.entity_id
            FROM \`magento24\`.\`catalog_product_entity_decimal\` AS \`eav\`
            WHERE ${refinementComponentQueries}
        UNION ALL
            SELECT \`eav\`.entity_id
            FROM \`magento24\`.\`catalog_product_entity_datetime\` AS \`eav\`
            WHERE ${refinementComponentQueries}
        ) AS \`alias\`
        `;
    }
    // ## search by search phrase
    let querySearchPhrase = "";
    if (searchPhrase) {
        querySearchPhrase = fulltextSearchM24.generateFulltextSqlSearchProductEntity({ searchPhrase, searchDictionary });
    }
    // ## final assembled search query
    let assembledQuery = [queryCID, queryPID, queryRefinement, querySearchPhrase]
    .filter(item => (item != null && item != ""))
    .join(" UNION ALL ");
    
    if (assembledQuery.length == 0) {
        assembledQuery = `SELECT entity_id, 1 AS \`weight\` FROM \`magento24\`.catalog_product_entity`;
    }

    console.log(assembledQuery);
    let result = await M24.promiseQuery(assembledQuery)
    // search product_ids
    // search all product data by product_ids
    let end = Date.now();
    console.log("search query took: ", end - start, " ms");
    console.log(result);
    M24.end();
};

let searchConfig = {
    "categories": ["3", "8"],
    "product_ids": ["PR001", "PR003"],
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
    "searchPhrase": "Joust Duffle Bag",
    "searchDictionary": {
        "synonyms": [["SẠC DỰ PHÒNG", "POWERBANK", "PIN DỰ PHÒNG"], ["CÁP SẠC", "DÂY SẠC"], ["IPHONE", "LIGHTNING"], ["ANDROID", "SAMSUNG"]]
    },
    "page": 2
}

searchM24(searchConfig)