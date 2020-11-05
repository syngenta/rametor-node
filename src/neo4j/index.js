const checker = require('./checker');
const versioner = require('./versioner');

exports.apply = async (params) => {
    console.log('==== NEO4j VERSIONER COMPLETE ====');
    await checker.check(params);
    await versioner.apply(params);
    delete params.neo4jConfig;
    console.log('==== NEO4j VERSIONER COMPLETE ====');
    return params;
};
