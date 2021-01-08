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
    // search product_entities
    let assembledQuery = searchutils.createSearchQueryDB({ categories, product_ids, refinements, searchPhrase, searchDictionary })
    let rowData = await DB.promiseQuery(assembledQuery);
    let grouped_data = mysqlutil.groupByAttribute({
        rawData: rowData,
        groupBy: "type"
    })
    grouped_data.forEach(search_type => {
        search_type.__items = searchutils.sortProductEntitiesBySignificantWeight(search_type.__items)
    })
    // search product_ids
    // search all product data by product_ids
    let end = Date.now();
    console.log("search query took: ", end - start, " ms");
    DB.end();
    return grouped_data;
};

async function searchM24 ({ categories, product_ids, refinements, searchPhrase, searchDictionary, page }) {
    const M24 = await mysqlutil.generateConnection(sqlM24Config);
    let start = Date.now();
    // search product_entities
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
    // search product_ids
    // search all product data by product_ids
    let end = Date.now();
    console.log("search query took: ", end - start, " ms");
    M24.end();
    return grouped_data;
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
    "categories": ["6"],
    "refinements": [{
        "attribute_id": "73",
        "value": ["Strive Shoulder Pack", "Sprite Foam Roller"]
    },
    {
        "attribute_id": "106",
        "value": ["container2"]
    },
    {
        "attribute_id": "89",
        "value": ["/m/b/mb04-black-0.jpg", "/w/b/wb03-purple-0.jpg", "/l/u/luma-foam-roller.jpg"]
    }],
    "searchPhrase":  "Driven Backpack",
    "page": 2
};

(async () => {
    let data = await searchM24(searchConfigM24);
    console.log(JSON.stringify(data, null, "  "));
})()