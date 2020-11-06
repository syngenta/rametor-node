const builder = require('./builder');
const checker = require('./checker');
const versioner = require('./versioner');

exports.apply = async (params) => {
    params.output = [];
    console.log('==== MYSQL VERSIONER STARTED ====');
    await checker.check(params);
    await builder.build(params, 'application', true);
    await versioner.apply(params);
    console.log('==== MYSQL VERSIONER COMPLETE ====');
    delete params.msyqlConfig;
    delete params.appConfig;
    return params;
};
