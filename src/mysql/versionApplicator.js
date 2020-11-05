const Importer = require('mysql-import');
const fs = require('fs');
const path = require('path');
const connection = require('./connection');
const sorter = require('../common/sorter');

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

const _getAppConnection = async (params) => {
    const mysql = await _mysqlUriParser(params.mysqlConfig);
    const importer = new Importer(mysql);
    return importer;
};

const apply = async (params) => {
    console.log('APPLYING VERSIONS');
    const versions = await connection.connect(params.mysqlConfig);
    const results = await versions('SELECT * FROM __db_versions');
    const completed = Array.from(results, (version) => version.version_file);
    const importer = await _getAppConnection(params);
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
};

module.exports = {apply};
