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

module.exports = {
    generateConnection,
    separateSQL
}