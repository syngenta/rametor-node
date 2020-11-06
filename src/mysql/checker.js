const builder = require('./builder');
const connection = require('./connection');
const ssmInterface = require('../common/ssmInterface');

const _getUploadParams = (params) => {
    return [
        {
            Name: params.paramName,
            Value: params.appConfig,
            Type: 'SecureString',
            Overwrite: true
        }
    ];
};

const _randomString = () => {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

const _generateAppConfig = (params) => {
    params.mysqlPasword = _randomString();
    params.destroyPassword = _randomString();
    params.appConfig = `mysql://${params.appUsername}:${params.mysqlPasword}@${params.host}:3306/${params.appDB}`;
};

const _getConnectonConfig = async (params) => {
    if (params.useSSM) {
        params.mysqlConfig = await ssmInterface.download(params.paramName);
        params.foundSSM = true;
    }
    if (!params.mysqlConfig) {
        params.mysqlConfig = `mysql://${params.masterUser}:${params.masterPassword}@${params.host}:3306/${params.appDB}`;
        params.foundSSM = false;
    }
};

exports.check = async (params) => {
    console.log('CHECKING VERSION');
    await _getConnectonConfig(params);
    console.log(params.mysqlConfig);
    const query = await connection.connect(params.mysqlConfig);
    try {
        const results = await query('SELECT * FROM __db_versions');
        if (!results.length) {
            throw new Error('NO VERSIONS FOUND');
        }
        console.log('CURRENT VERSION: ', results.length ? results.join(',') : 0);
    } catch (error) {
        console.log('CURRENT VERSION: INITIAL DEPLOYMENT');
        _generateAppConfig(params);
        await builder.build(params);
        if (params.useSSM && !params.foundSSM) {
            const ssmParams = _getUploadParams(params);
            await ssmInterface.upload(params, ssmParams);
        }
    }
};
