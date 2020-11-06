const checker = require('./checker');
const versioner = require('./versioner');

exports.apply = async (params) => {
    params.output = [];
    console.log('==== MYSQL VERSIONER STARTED ====');
    await checker.check(params);
    await versioner.apply(params);
    console.log('==== MYSQL VERSIONER COMPLETE ====');
    delete params.msyqlConfig;
    delete params.appConfig;
    return params;
};
