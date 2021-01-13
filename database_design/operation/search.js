const mysqlutil = require("./utils/mysql");
const searchutils = require("./utils/search");

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
    // search product_entities & product_ids
    let assembledQuery = searchutils.createSearchQueryDB({ categories, product_ids, refinements, searchPhrase, searchDictionary })
    let rowData = await DB.promiseQuery(assembledQuery);
    let grouped_data = mysqlutil.groupByAttribute({
        rawData: rowData,
        groupBy: "type"
    })
    grouped_data.forEach(search_type => {
        search_type.__items = searchutils.sortProductEntitiesBySignificantWeight(search_type.__items)
    })
    let final_product_entities = searchutils.finalFilterProductEntities(grouped_data);
    // search all product data by product_ids
    let end = Date.now();
    console.log("search query took: ", end - start, " ms");
    DB.end();
    return final_product_entities;
};

async function searchM24 ({ categories, product_ids, refinements, searchPhrase, searchDictionary, page }) {
    const M24 = await mysqlutil.generateConnection(sqlM24Config);
    let start = Date.now();
    // search product_entities & product_ids
    let assembledQuery = searchutils.createSearchQueryM24({ categories, product_ids, refinements, searchPhrase, searchDictionary });
    let rowData = await M24.promiseQuery(assembledQuery);
    let grouped_data = mysqlutil.groupByAttribute({
        rawData: rowData,
        groupBy: "type"
    })
    grouped_data.forEach(search_type => {
        search_type.__items = searchutils.sortProductEntitiesBySignificantWeight(search_type.__items)
    });
    let final_product_entities = searchutils.finalFilterProductEntities(grouped_data);
    // search all product data by product_ids
    let end = Date.now();
    console.log("search query took: ", end - start, " ms");
    M24.end();
    return final_product_entities;
};

let searchConfigDB = {
    "categories": ["earbud", "charge_cable"],
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
    "searchPhrase": "Joust Duffle",
    "searchDictionary": {
        "synonyms": [["SẠC DỰ PHÒNG", "POWERBANK", "PIN DỰ PHÒNG"], ["CÁP SẠC", "DÂY SẠC"], ["IPHONE", "LIGHTNING"], ["ANDROID", "SAMSUNG"]]
    },
    "page": 2
};

let searchConfigM24 = {
    // "product_ids": ["53", "77"],
    // "categories": ["8"],
    "refinements": [{
        "attribute_id": "73",
        "value": ["Dash Digital Watch", "Bolo Sport Watch", "Didi Sport Watch"]
    },
    {
        "attribute_id": "106",
        "value": ["container2"]
    },
    {
        "attribute_id": "89",
        "value": ["/m/g/mg02-bk-0.jpg", "/w/g/wg01-bk-0.jpg", "/w/g/wg02-bk-0.jpg"]
    }],
    "searchPhrase":  "Bolo Sport Watch Dash Digital",
    "page": 2
};

(async () => {
    let data = await searchM24(searchConfigM24);
    console.log(JSON.stringify(data, null, "  "));
})()