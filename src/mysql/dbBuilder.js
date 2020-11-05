const connection = require('./connection');

const _getSQLStatements = async (params) => {
    let statements = [];
    statements = [
        `CREATE DATABASE IF NOT EXISTS ${params.appDB};`,
        `CREATE TABLE IF NOT EXISTS ${params.appDB}.__db_versions (\`version_file\` varchar(255) DEFAULT NULL) ENGINE=InnoDB DEFAULT CHARSET=utf8`,
        `CREATE USER  IF NOT EXISTS '${params.appUsername}'@'%' IDENTIFIED BY '${params.mysqlPasword}';`,
        `GRANT ALL ON ${params.appDB}.* TO '${params.appUsername}'@'%' IDENTIFIED BY '${params.mysqlPasword}';`,
        'FLUSH PRIVILEGES'
    ];
    if (params.useSSM && !params.foundSSM) {
        statements.push(
            `UPDATE mysql.user SET authentication_string = PASSWORD('${params.destroyPassword}') WHERE User = '${params.masterUser}' AND Host = '%';`
        );
        statements.push('FLUSH PRIVILEGES');
    }
    return statements;
};

exports.build = async (params) => {
    console.log(`BUILDING DATABASE`);
    const statements = await _getSQLStatements(params);
    const query = await connection.connect(params.builderConfig);
    for (const statement of statements) {
        await query(statement);
        console.log(`BUILDER RAN: ${statement}`);
    }
    return params;
};
