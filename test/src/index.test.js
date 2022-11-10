const {assert} = require('chai');
const versioner = require('../../src/index');
const connection = require('../../src/mysql/connection');

describe('Test index.js', () => {
    before(async () => {
        console.log('\n\n==== STARTING INDEX.JS UNIT TESTS ====\n\n');
        const pre = await connection.connect(params.mysqlConfig);
        await pre(`CREATE DATABASE IF NOT EXISTS unittest;`);
    });
    it('throws error when empty arguments', async () => {
        try {
            await versioner.apply();
            assert.equal(false, true);
        } catch (error) {
            assert.equal(true, true);
        }
    });
    it('throws error when not supported engine provided', async () => {
        try {
            await versioner.apply({engine: 'not-supported'});
            assert.equal(false, true);
        } catch (error) {
            assert.equal(true, true);
        }
    });
    it('succeeds with basic neo4j settings', async (done) => {
        try {
            await versioner.apply({
                engine: 'neo4j',
                host: 'bolt://localhost:7687',
                masterUser: 'neo4j',
                masterPassword: 'password',
                encrypted: 'ENCRYPTION_OFF',
                stack: 'dbv-test',
                region: 'us-east-2',
                versionsDirectory: 'test/db_versions/neo4j',
                useSSM: false
            });
            assert.equal(true, true);
            done();
        } catch (error) {
            console.error(error);
            assert.equal(false, true);
        }
    });
    it('succeeds with basic mysql settings', async (done) => {
        try {
            await versioner.apply({
                engine: 'mysql',
                host: 'localhost',
                masterUser: 'root',
                masterPassword: 'password',
                appDB: 'unittest',
                appUsername: 'app',
                stack: 'dbv-test',
                region: 'us-east-2',
                versionsDirectory: 'test/db_versions/mysql',
                useSSM: false
            });
            await connection.disconnect(`mysql://root:password@localhost:3306/unittest`);
            assert.equal(true, true);
        } catch (error) {
            console.error(error);
            assert.equal(false, true);
        }
    });
});
