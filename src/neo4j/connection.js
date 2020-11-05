const neo4j = require('neo4j-driver');

exports.getDriver = async (neo4jConfig) => {
    const driver = await neo4j.driver(neo4jConfig.host, neo4j.auth.basic(neo4jConfig.user, neo4jConfig.password));
    return driver;
};
