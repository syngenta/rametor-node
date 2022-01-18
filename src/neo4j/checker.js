const connection = require('./connection');
const ssmInterface = require('../common/ssmInterface');

const _randomString = () => {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

const _randomizePassword = (params) => {
    params.neo4jConfig = {
        host: params.host,
        user: params.masterUser,
        password: _randomString(),
        encrypted: params.encrypted
    };
    console.log('RANDOMIZED PASSOWORD');
};

const _uploadNeo4jConfigToSSM = async (params) => {
    const ssmParams = [
        {
            Name: `/${params.stack}/neo4j-config`,
            Value: JSON.stringify(params.neo4jConfig),
            Type: 'SecureString',
            Overwrite: true
        }
    ];
    await ssmInterface.upload(params, ssmParams);
    console.log('UPLOADED PASSWORD SSM');
};

const _getLocalConnection = (params) => {
    params.neo4jConfig = {
        host: params.host,
        user: params.masterUser,
        password: params.masterPassword,
        encrypted: params.encrypted
    };
};

const _getSSMConnection = async (params) => {
    const results = await ssmInterface.download(`/${params.stack}/neo4j-config`);
    if (results) {
        console.log(`SSM PARAM FOUND: /${params.stack}/neo4j-config`);
        params.neo4jConfig = JSON.parse(results);
        params.foundSSM = true;
    } else {
        console.log(`SSM PARAM NOT FOUND: /${params.stack}/neo4j-config`);
        params.foundSSM = false;
    }
};

const _getVersions = (results) => {
    try {
        const records = JSON.parse(JSON.stringify(results));
        return records.records[0]._fields[0].properties.versions;
    } catch (error) {
        return [];
    }
};

const _changePassword = async (params, session) => {
    await session.run(`CALL dbms.security.changePassword('${params.neo4jConfig.password}')`);
    console.log('CHANGED NEO4J PASSWORD');
};

const _checkVersions = async (params, session) => {
    const versions = await session.run('MATCH (v:__db_versions) RETURN v');
    params.versions = _getVersions(versions);
    if (!params.versions.length) {
        console.log('CURRENT VERSION: INITIAL DEPLOYMENT');
        throw new Error('CURRENT VERSION: INITIAL DEPLOYMENT');
    }
    console.log(`CURRENT VERSIONS: ${params.versions.join(', ')}`);
};

const _getNeo4jConfig = async (params) => {
    if (params.useSSM) {
        console.log('USING SSM CONFIG');
        await _getSSMConnection(params);
    }
    if (!params.foundSSM) {
        console.log('USING LOCAL CONFIG');
        _getLocalConnection(params);
    }
};

exports.check = async (params) => {
    console.log('CHECKING VERSION');
    await _getNeo4jConfig(params);
    const driver = await connection.getDriver(params.neo4jConfig);
    const session = await driver.session();
    try {
        await _checkVersions(params, session);
    } catch (error) {
        console.error('CHECK VERSION ERROR:', error);
        params.versions = [];
        if (params.useSSM && !params.foundSSM) {
            _randomizePassword(params);
            await _uploadNeo4jConfigToSSM(params);
            await _changePassword(params, session);
        }
    } finally {
        await session.close();
        await driver.close();
    }
};
