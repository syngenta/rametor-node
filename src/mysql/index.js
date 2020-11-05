const dbBuilder = require('./dbBuilder');
const version = require('./versionChecker');
const versioner = require('./versionApplicator');

exports.apply = async (params) => {
    params.output = [];
    console.log('==== MYSQL VERSIONER STARTED ====');
    await version.check(params);
    await dbBuilder.build(params, 'application', true);
    await versioner.apply(params);
    console.log('==== MYSQL VERSIONER COMPLETE ====');
    delete params.msyqlConfig;
    return params;
};
