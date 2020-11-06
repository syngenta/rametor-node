const Importer = require('mysql-import');
const fs = require('fs');
const path = require('path');
const connection = require('./connection');
const sorter = require('../common/sorter');

const _destroyMasterUser = async (params) => {
    if (params.useSSM && !params.foundSSM) {
        console.log(`DESTROYING MASTER USER`);
        const statements = [
            `UPDATE mysql.user SET authentication_string = PASSWORD('${params.destroyPassword}') WHERE User = '${params.masterUser}' AND Host = '%';`,
            'FLUSH PRIVILEGES'
        ];
        const query = await connection.connect(params.mysqlConfig);
        for (const statement of statements) {
            await query(statement);
            console.log(`DESTROYER RAN: ${statement}`);
        }
    }
};
const _mysqlUriParser = (uri) => {
    const parts = uri.split(':');
    const user = parts[1].split('//')[1];
    const hostpass = parts[2].split('@');
    const pass = hostpass[0];
    const host = hostpass[1];
    const db = parts[3].split('/')[1];
    const params = {
        host,
        user,
        password: pass,
        database: db
    };
    return params;
};

const apply = async (params) => {
    console.log('APPLYING VERSIONS');
    const versions = await connection.connect(params.mysqlConfig);
    const results = await versions('SELECT * FROM __db_versions');
    const completed = Array.from(results, (version) => version.version_file);
    const mysql = await _mysqlUriParser(params.mysqlConfig);
    const importer = new Importer(mysql);
    const dir = path.join(process.cwd(), params.versionsDirectory);
    const files = sorter.sortFiles(await fs.readdirSync(dir), '.sql');
    for (const file of files) {
        if (completed.indexOf(file) === -1) {
            const filePath = path.join(process.cwd(), params.versionsDirectory, file);
            console.log(`VERSION APPLICATOR APPLYING: ${filePath}`);
            await importer.import(filePath);
            await versions(`INSERT INTO __db_versions SET version_file = '${file}'`);
            console.log(`VERSION APPLICATOR APPLIED: ${filePath}`);
        } else {
            console.log(`VERSION APPLICATOR SKIPPED: ${file}`);
        }
    }
    await _destroyMasterUser(params);
};

module.exports = {apply};
