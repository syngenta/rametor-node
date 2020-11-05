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
        params.neo4jConfig = JSON.parse(results);
        params.foundSSM = true;
        console.log('FOUND CONFIG IN SSM');
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

const _getNeo4jConfig = async (params) => {
    if (params.useSSM) {
        await _getSSMConnection(params);
    } else {
        _getLocalConnection(params);
    }
};

exports.check = async (params) => {
    console.log('CHECKING VERSION');
    try {
        await _getNeo4jConfig(params);
        const driver = await connection.getDriver(params.neo4jConfig);
        const session = await driver.session();
        const versions = await session.run('MATCH (v:__db_versions) RETURN v');
        params.versions = _getVersions(versions);
        session.close();
        driver.close();
        if (!params.versions.length) {
            throw new Error('initial version');
        }
        console.log(`CURRENT VERSIONS: ${params.versions.join(', ')}`);
    } catch (error) {
        console.log('CURRENT VERSION: INITIAL DEPLOYMENT');
        params.versions = [];
        if (params.useSSM && !params.foundSSM) {
            console.log('BUILDING CONFIG IN SSM');
            _getLocalConnection(params);
            const driver2 = await connection.getDriver(params.neo4jConfig);
            const session2 = await driver2.session();
            _randomizePassword(params);
            console.log('RANDOMIZED PASSOWORD');
            await _uploadNeo4jConfigToSSM(params);
            console.log('UPLOADED PASSWORD SSM');
            await session2.run(`CALL dbms.security.changePassword('${params.neo4jConfig.password}')`);
            console.log('CHANGED NEO4J PASSWORD');
            session2.close();
            driver2.close();
        }
    }
};
