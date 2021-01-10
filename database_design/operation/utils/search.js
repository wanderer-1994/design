const mysqlutil = require("./mysql");
const fulltextSearch = require("./fulltextSearch");
const fulltextSearchM24 = require("./fulltextSearchM24");

function createSearchQueryDB ({ categories, product_ids, refinements, searchPhrase, searchDictionary }) {
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
        SELECT \`pca\`.product_id AS \`entity_id\`,
        IF(\`pca\`.position IS NOT NULL, 100 + \`pca\`.position, 100) AS \`weight\`, \'category\' AS \`type\`
        FROM \`ecommerce\`.product_category_assignment AS \`pca\`
        INNER JOIN \`ecommerce\`.product_entity AS \`pe\` ON \`pe\`.entity_id = \`pca\`.product_id
        WHERE \`pca\`.category_id IN(SELECT DISTINCT entity_id FROM \`cte\`)
        `;
    }
    // ## search by product_id
    let queryPID = ""
    if (product_ids && product_ids.length > 0) {
        queryPID =
        `
        SELECT \`pe\`.entity_id, 1000 AS \`weight\`, \'entity_id\' AS \`type\`
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
        SELECT entity_id, 10*${refinements.length} AS \`weight\`, \'attribute\' AS \`type\` FROM
        (   SELECT entity_id, GROUP_CONCAT(attribute_id) AS attribute_ids FROM
            (   SELECT \`eav\`.entity_id, \`eav\`.attribute_id
                FROM \`ecommerce\`.\`product_eav_varchar\` AS \`eav\`
                WHERE ${refinementComponentQueries}
            UNION ALL
                SELECT \`eav\`.entity_id, \`eav\`.attribute_id
                FROM \`ecommerce\`.\`product_eav_text\` AS \`eav\`
                WHERE ${refinementComponentQueries}
            UNION ALL
                SELECT \`eav\`.entity_id, \`eav\`.attribute_id
                FROM \`ecommerce\`.\`product_eav_int\` AS \`eav\`
                WHERE ${refinementComponentQueries}
            UNION ALL
                SELECT \`eav\`.entity_id, \`eav\`.attribute_id
                FROM \`ecommerce\`.\`product_eav_decimal\` AS \`eav\`
                WHERE ${refinementComponentQueries}
            UNION ALL
                SELECT \`eav\`.entity_id, \`eav\`.attribute_id
                FROM \`ecommerce\`.\`product_eav_datetime\` AS \`eav\`
                WHERE ${refinementComponentQueries}
            UNION ALL
                SELECT \`eav\`.entity_id, \`eav\`.attribute_id
                FROM \`ecommerce\`.\`product_eav_multi_value\` AS \`eav\`
                WHERE ${refinementComponentQueries}
            ) AS \`alias\` GROUP BY entity_id
        ) AS \`alias2\`
        WHERE (${refinements.map(item => `FIND_IN_SET(\'${mysqlutil.escapeQuotes(item.attribute_id)}\', \`alias2\`.attribute_ids)`).join(" AND ")})
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

    return assembledQuery;
};

function createSearchQueryM24 ({ categories, product_ids, refinements, searchPhrase, searchDictionary }) {
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
        SELECT \`pca\`.product_id AS \`entity_id\`,
        IF(\`pca\`.position IS NOT NULL, 100 + \`pca\`.position, 100) AS \`weight\`, \'category\' AS \`type\`
        FROM \`magento24\`.catalog_category_product AS \`pca\`
        INNER JOIN \`magento24\`.catalog_product_entity AS \`pe\` ON \`pe\`.entity_id = \`pca\`.product_id
        WHERE \`pca\`.category_id IN(SELECT DISTINCT entity_id FROM \`cte\`)
        `;
    }
    // ## search by product_id
    let queryPID = ""
    if (product_ids && product_ids.length > 0) {
        queryPID =
        `
        SELECT \`pe\`.entity_id, 1000 AS \`weight\`, \'entity_id\' AS \`type\`
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
        SELECT entity_id, 10*${refinements.length} AS \`weight\`, \'attribute\' AS \`type\` FROM
        (   SELECT entity_id, GROUP_CONCAT(attribute_id) AS attribute_ids FROM
            (   SELECT \`eav\`.entity_id, \`eav\`.attribute_id
                FROM \`magento24\`.\`catalog_product_entity_varchar\` AS \`eav\`
                WHERE ${refinementComponentQueries}
            UNION ALL
                SELECT \`eav\`.entity_id, \`eav\`.attribute_id
                FROM \`magento24\`.\`catalog_product_entity_text\` AS \`eav\`
                WHERE ${refinementComponentQueries}
            UNION ALL
                SELECT \`eav\`.entity_id, \`eav\`.attribute_id
                FROM \`magento24\`.\`catalog_product_entity_int\` AS \`eav\`
                WHERE ${refinementComponentQueries}
            UNION ALL
                SELECT \`eav\`.entity_id, \`eav\`.attribute_id
                FROM \`magento24\`.\`catalog_product_entity_decimal\` AS \`eav\`
                WHERE ${refinementComponentQueries}
            UNION ALL
                SELECT \`eav\`.entity_id, \`eav\`.attribute_id
                FROM \`magento24\`.\`catalog_product_entity_datetime\` AS \`eav\`
                WHERE ${refinementComponentQueries}
            ) AS \`alias\` GROUP BY entity_id
        ) AS \`alias2\`
        WHERE (${refinements.map(item => `FIND_IN_SET(\'${mysqlutil.escapeQuotes(item.attribute_id)}\', \`alias2\`.attribute_ids)`).join(" AND ")})
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
        assembledQuery = `SELECT entity_id, 1 AS \`weight\`, \'all\' AS \`type\` FROM \`magento24\`.catalog_product_entity`;
    }

    return assembledQuery;
};

function sortProductEntitiesBySignificantWeight (rowData) {
    let found_entities = [];
    rowData.forEach(row => {
        let found_match = found_entities.find(item => item.entity_id == row.entity_id);
        if(!found_match){
            found_entities.push({
                entity_id: row.entity_id,
                weight: row.weight
            })
        }else{
            found_match.weight += row.weight;
        }
    })
    found_entities.sort((a, b) => {
        return b.weight - a.weight;
    });
    return found_entities;
};

function finalFilterProductEntities (grouped_data) {
    let by_all = grouped_data.find(group => group.type == "all");
    let by_entity_id = grouped_data.find(group => group.type == "entity_id");
    let by_category = grouped_data.find(group => group.type == "category");
    let by_name = grouped_data.find(group => group.type == "name");
    let by_attribute = grouped_data.find(group => group.type == "attribute");
    let result = [];
    // concat all records first
    if (by_all && by_all.__items) {
        console.log("yes ", 1)
        result = result.concat(by_all.__items);
    };
    if (by_entity_id && by_entity_id.__items) {
        console.log("yes ", 2)
        result = result.concat(by_entity_id.__items);
    };
    if (by_category && by_category.__items) {
        console.log("yes ", 3)
        result = result.concat(by_category.__items);
    };
    if (by_name && by_name.__items) {
        console.log("yes ", 4)
        result = result.concat(by_name.__items);
    };
    if (by_attribute && by_attribute.__items) {
        console.log("yes ", 5)
        result = result.concat(by_attribute.__items);
    };
    // filter out all records that match neither entity_id nor category nor name nor refinements
    if (by_entity_id && by_entity_id.__items) {
        result = result.filter(item => by_entity_id.__items.find(m_item => m_item.entity_id == item.entity_id));
    };
    if (by_category && by_category.__items) {
        result = result.filter(item => by_category.__items.find(m_item => m_item.entity_id == item.entity_id));
    };
    if (by_name && by_name.__items) {
        result = result.filter(item => by_name.__items.find(m_item => m_item.entity_id == item.entity_id));
    };
    if (by_attribute && by_attribute.__items) {
        result = result.filter(item => by_attribute.__items.find(m_item => m_item.entity_id == item.entity_id));
    };
    result = sortProductEntitiesBySignificantWeight(result);
    return result;
}

module.exports = {
    createSearchQueryDB,
    createSearchQueryM24,
    sortProductEntitiesBySignificantWeight,
    finalFilterProductEntities
}