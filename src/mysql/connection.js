const mysql = require('mysql');
const util = require('util');

const connect = async (uri) => {
    const connection = await mysql.createConnection(uri);
    const query = await util.promisify(connection.query).bind(connection);
    return query;
};

const disconnect = async (uri) => {
    const connection = await mysql.createConnection(uri);
    connection.destroy();
};

module.exports = {connect, disconnect};
