const mysql = require('./mysql');
const neo4j = require('./neo4j');

exports.apply = async (params = {}) => {
    const supported = ['mysql', 'neo4j'];
    let results;
    if (!params.engine) {
        throw new Error(`Please provide an engine type: ${supported.join(' | ')}`);
    } else if (!supported.includes(params.engine)) {
        throw new Error(`${params.engine} is not supported. supported: ${supported.join(' | ')}`);
    } else if (params.engine === 'mysql') {
        results = await mysql.apply(params);
    } else if (params.engine === 'neo4j') {
        results = await neo4j.apply(params);
    }
    return results;
};
