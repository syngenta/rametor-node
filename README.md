# dbv-node
Database versioner to be used to version MySQL &amp; Neo4j

## Features

  * Able to run db migrations in a single command
  * Manages current version of the database
  * Able to randomize password and store in AWS SSM
  * Useful for CICD deployments
  * Better than sharing mysql exports

## Installation

This is a [Node.js](https://nodejs.org/en/) module available through the
[npm registry](https://www.npmjs.com/).

Before installing, [download and install Node.js](https://nodejs.org/en/download/).
Node.js 0.10 or higher is required.

If this is a brand new project, make sure to create a `package.json` first with
the [`npm init`](https://docs.npmjs.com/creating-a-package-json-file) command.

Installation is done using the
[`npm install`](https://docs.npmjs.com/getting-started/installing-npm-packages-locally) command:

```bash
$ npm install @syngenta-digital/dbv
```

## Basic Usage

### MySQL
```javascript
const versioner = require('syngenta-database-versioner');

await versioner.apply({
    engine: 'mysql',
    host: process.env.DB_HOST,
    masterUser: process.env.DB_MASTER_USER,
    masterPassword: process.env.DB_MASTER_PASSWORD,
    appDB: process.env.DB_NAME,
    appUsername: process.env.DB_APP_USER,
    stack: process.env.STACK,
    region: process.env.REGION,
    versionsDirectory: 'application/v1/models/versions',
    useSSM: process.env.STAGE !== 'local' // this will rewrite the password for the master user and therefore make it unusable
});
```

### Neo4j
```javascript
const versioner = require('syngenta-database-versioner');

versioner.apply({
    engine: 'neo4j',
    host: process.env.DB_HOST,
    masterUser: process.env.DB_MASTER_USER,
    masterPassword: process.env.DB_MASTER_PASSWORD,
    encrypted: process.env.DB_ENCRYPTED,
    stack: process.env.STACK,
    region: process.env.REGION,
    versionsDirectory: 'application/v1/models/versions',
    useSSM: process.env.STAGE !== 'local' // this will rewrite the password for the master user and therefore make it unusable
});
```
*NOTE: File names must be unique and only contain numbers (i.e. 1.sql, 2.sql, etc), this is how the package knows what order to run the files in*

*NEO4j NOTE: use .txt files (UTF-8 encoding) and each query must be on its own line (i.e. only 1 query per line); this tool splits on line breaks*
