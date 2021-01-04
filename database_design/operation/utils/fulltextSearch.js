const utils = require("./utils");
const mysql = require("./mysql");

function removeArrayDuplicate (array) {
    for(let i = 0; i < array.length; i++){
        for(let j = i + 1; j < array.length; j++){
            if(array[j] == array[i]){
                array.splice(j, 1);
                j -= 1;
            }
        }
    }
    return array;
}

function decomposeSearchPhrase (std_search_phrase) {
    this.generateKeywords = (phrase) => {
        let single_keys = phrase.split(/\s+/);
        let compound_keys = [];
        if(single_keys.length >= 2){
            for(let i = 0; i <= single_keys.length - 2; i++){
                let two_word_key = single_keys.slice(i, i + 2).join(" ");
                compound_keys.push(two_word_key);
            }
        };
        return {
            single_keys: removeArrayDuplicate(single_keys),
            compound_keys: removeArrayDuplicate(compound_keys)
        };
    }
    let unsigned_search = removeVnCharacter(std_search_phrase);
    let strict_keys = this.generateKeywords(std_search_phrase);
    let ease_keys = this.generateKeywords(unsigned_search);
    let searchDecompsed = {
        strict_match_compound_words: strict_keys.compound_keys.filter(keyword => keyword != utils.removeVnCharacter(keyword)),
        strict_match_single_words: strict_keys.single_keys.filter(keyword => keyword != utils.removeVnCharacter(keyword)),
        ease_match_compound_words: ease_keys.compound_keys,
        ease_match_single_words: ease_keys.single_keys
    }
    return searchDecompsed;
}

function generateFulltextSqlSearchProductEntity ({categories, product_id, searchPhrase, refinement}) {
    this.generateSql = (search_config) => {
        let {keywords, compare_mode, weight, prefix, postfix, table} = {...search_config};
        if(!compare_mode || !table || !keywords || keywords.length < 1) return null;
        let sql = [];
        keywords.forEach(key => {
            sql.push(`SELECT entity_id, ${weight} AS \`weight\` 
            FROM \`magento24\`.\`${table}\` 
            WHERE attribute_id=73 AND UPPER(value) ${compare_mode} "${prefix}${mysql.escapeQuotes(key)}${postfix}" 
            GROUP BY \`weight\``);
        });
        sql = sql.join(" UNION ALL ");
        // there possibly null or empty sql returned, we will filter those out later
        return sql;
    }

    if (product_id && product_id.trim().length > 0) {
        return `SELECT entity_id AS entity_ids, 100 AS \`weight\`
        FROM \`magento24\`.catalog_product_entity
        WHERE entity_id="${mysql.escapeQuotes(product_id)}"
        LIMIT 1;`
    }
    let sqlArr = [];
    if (searchPhrase && searchPhrase.trim().length > 0) {
        let std_search_phrase = searchPhrase.replace(/\(+|\)+|-+|\/+|\\+|\,+|\++/g, " ")
        .replace(/^\s+|\s+$/g, "").toUpperCase();
        let searchDecompsed = decomposeSearchPhrase(std_search_phrase);
        let sql_1_weight = this.generateSql({
            keywords: searchDecompsed.ease_match_single_words,
            compare_mode: "LIKE",
            weight: 1,
            prefix: "%",
            postfix: "%",
            table: "catalog_product_entity_varchar"
        });
        let sql_2_weight = this.generateSql({
            keywords: searchDecompsed.ease_match_compound_words,
            compare_mode: "LIKE",
            weight: 2,
            prefix: "%",
            postfix: "%",
            table: "catalog_product_entity_varchar"
        });
        let sql_3_weight = this.generateSql({
            keywords: searchDecompsed.strict_match_single_words,
            compare_mode: "LIKE BINARY",
            weight: 3,
            prefix: "%",
            postfix: "%",
            table: "catalog_product_entity_varchar"
        });
        let sql_4_weight = this.generateSql({
            keywords: searchDecompsed.strict_match_compound_words,
            compare_mode: "LIKE BINARY",
            weight: 4,
            prefix: "%",
            postfix: "%",
            table: "catalog_product_entity_varchar"
        });
        sqlArr.push(sql_1_weight, sql_2_weight, sql_3_weight, sql_4_weight);
    }
    if (refinement && refinement.length > 0) {
        refinement.forEach(attribute => {
            attribute.values.forEach((value, index) => {
                attribute.values[index] = mysql.escapeQuotes(value.toUpperCase());
            })
            sqlArr.push(`SELECT entity_id, 100 AS \`weight\`
            FROM \`magento24\`.\`${attribute.table}\`
            WHERE attribute_id="${mysql.escapeQuotes(attribute.attribute_id)}" AND UPPER(value) IN("${attribute.values.join("\", \"")}")`)
        })
    }
    if (categories && categories.length > 0) {
        // allow filter by many categories
        categories.forEach((category, index) => {
            categories[index] = mysql.escapeQuotes(category);
        })
        sqlArr.push(`SELECT product_id AS entity_id, 100 AS \`weight\`
        FROM \`magento24\`.\`catalog_category_product\`
        WHERE category_id IN("${categories.join("\", \"")}")`);
    }
    sqlArr = sqlArr.filter(item => (item != null && item.length > 0));
    if(sqlArr.length < 1) return null;
    sqlArr = sqlArr.join(" UNION ALL ");
    sqlArr = `SELECT GROUP_CONCAT(entity_id) as entity_ids, \`weight\` 
    FROM (${sqlArr}) AS \`summary\` GROUP BY \`weight\`;`;
    return sqlArr;
}

function sortProductEntitiesBySignificantWeight (rowData) {
    let found_prods = [];
    for(let i = 4; i > 0; i--){
        let row_data = rowData.find(row => {
            return row.weight == i;
        });
        if(row_data && row_data.prod_ids != null && row_data.prod_ids.length > 0){
            let prod_ids = row_data.prod_ids.split(/,\s*/);
            prod_ids.forEach(prod_id_item => {
                let found_match = found_prods.find(found_item => {
                    return found_item.prod_id == prod_id_item;
                });
                if(!found_match){
                    found_prods.push({
                        prod_id: prod_id_item,
                        weight: i,
                        position: i*10
                    })
                }else{
                    found_match.position += i*10;
                }
            })
        }
    }
    found_prods.sort((a, b) => {
        return b.position - a.position;
    });
    let sorted_prod_ids = [];
    found_prods.forEach(prod => {
        sorted_prod_ids.push(prod.prod_id);
    });
}

module.exports = {
    generateFulltextSqlSearchProductEntity,
    sortProductEntitiesBySignificantWeight,
}