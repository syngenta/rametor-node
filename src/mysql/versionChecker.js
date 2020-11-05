const connection = require('./connection');
const ssmInterface = require('../common/ssmInterface');

const _getUploadParams = (params) => {
    return [
        {
            Name: `/${params.stack}/mysql-config`,
            Value: params.mysqlConfig,
            Type: 'SecureString',
            Overwrite: true
        }
    ];
};

const _randomString = () => {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

const _generateSecureConnection = async (params) => {
    params.mysqlPasword = _randomString();
    params.destroyPassword = _randomString();
    params.mysqlConfig = `mysql://${params.appUsername}:${params.mysqlPasword}@${params.host}:3306/${params.appDB}`;
    params.builderConfig = `mysql://${params.masterUser}:${params.masterPassword}@${params.host}:3306/${params.appDB}`;
};

const _getLocalConnection = async (params) => {
    params.mysqlConfig = `mysql://${params.masterUser}:${params.masterPassword}@${params.host}:3306/${params.appDB}`;
    params.builderConfig = params.mysqlConfig;
};

const _getSSMConnection = async (params) => {
    params.mysqlConfig = await ssmInterface.download(`/${params.stack}/mysql-config`);
    params.builderConfig = params.mysqlConfig;
    params.foundSSM = true;
    console.log('FOUND CONFIG IN SSM');
};

const _getUris = async (params) => {
    if (params.useSSM) {
        await _getSSMConnection(params);
    } else {
        await _getLocalConnection(params);
    }
};

exports.check = async (params) => {
    console.log('CHECKING VERSION');
    try {
        await _getUris(params);
        const query = await connection.connect(params.mysqlConfig);
        const results = await query('SELECT * FROM __db_versions');
        console.log('CURRENT VERSION: ', results.length ? results.join(',') : 0);
    } catch (error) {
        console.log('CURRENT VERSION: INITIAL DEPLOYMENT');
        if (params.useSSM && !params.foundSSM) {
            console.log('BUILDING CONFIG IN SSM');
            await _generateSecureConnection(params);
            const ssmParams = _getUploadParams(params);
            await ssmInterface.upload(params, ssmParams);
        }
    }
};
