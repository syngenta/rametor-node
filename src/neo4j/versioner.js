const fs = require('fs');
const path = require('path');
const connection = require('./connection');
const sorter = require('../common/sorter');

const _recordVersion = async (params, session) => {
    await session.run('MATCH (v:__db_versions) DETACH DELETE (v)');
    await session.run(`CREATE(:__db_versions $placeholder)`, {placeholder: {versions: params.versions}});
    console.log(`VERSION APPLICATOR SAVED VERSION CHANGELOG`);
};

const _runQueries = async (params, queries, session) => {
    for (const query of queries) {
        try {
            await session.run(query);
            console.log(`VERSION APPLICATOR RAN: ${query}`);
        } catch (error) {
            console.log(`VERSION APPLICATOR ERROR: ${query} MESSAGE: ${JSON.stringify(error)}`);
        }
    }
};

const _getQueriesFromFiles = async (params, dir, files) => {
    const queries = [];
    for (const file of files) {
        if (!params.versions.includes(file)) {
            const content = await fs.readFileSync(path.join(dir, file), 'utf8');
            const lines = content.split('\n');
            params.versions.push(file);
            for (const line of lines) {
                if (line) {
                    queries.push(line);
                }
            }
            console.log(`VERSION APPLICATOR APPLYING: ${file}`);
        } else {
            console.log(`VERSION APPLICATOR SKIPPED: ${file}`);
        }
    }
    return queries;
};

exports.apply = async (params) => {
    console.log('APPLYING VERSIONS');
    const driver = await connection.getDriver(params.neo4jConfig);
    const session = await driver.session();
    const dir = path.join(process.cwd(), params.versionsDirectory);
    const files = sorter.sortFiles(await fs.readdirSync(dir), '.txt');
    const queries = await _getQueriesFromFiles(params, dir, files);
    await _runQueries(params, queries, session);
    await _recordVersion(params, session);
    await session.close();
};
