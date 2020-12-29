const mysql = require("mysql");

async function generateConnection (config) {
    return new Promise((resolve, reject) => {
        let connection = mysql.createConnection(config);
        connection.promiseQuery = (query) => {
            return new Promise(async (resolve, reject) => {
                connection.query(query, (err, result) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(result);
                    }
                })
            })
        };
        connection.connect((err) => {
            if(err) {
                reject(err);
            }else{
                resolve(connection);
            }
        })
    })
}

function separateSQL (text) {
    if(!text || typeof(text) !== 'string') return [];
    let sqls = text.split(/^#+.*\n$/);
    sqls.forEach((statement, index) => {
        sqls[index] = statement.trim();
    });
    return sqls;
}

function groupByAttribute ({rawData, groupBy, nullExcept}) {
    if(!rawData || !groupBy || !Array.isArray(rawData) || typeof(groupBy) != "string" || (nullExcept && !Array.isArray(nullExcept))){
        throw new Error("Raw data could not be grouped because of invalid input!")
    }
    let result = [];
    rawData.forEach((item, index) => {
        if(!(groupBy in item)){
            throw new Error("Input data invalid, item " + JSON.stringify(item) + " does not have attribute " + groupBy);
        }else if (!nullExcept || nullExcept.indexOf(item[groupBy]) != -1) {
            let match = result.find(m_item => (m_item[groupBy] == item[groupBy]));
            if (!match) {
                match = {
                    [groupBy]: item[groupBy],
                    items: []
                };
                result.push(match);
            }
            match.items.push(item);
        };
    });
    return result;
}

module.exports = {
    generateConnection,
    separateSQL,
    groupByAttribute
}