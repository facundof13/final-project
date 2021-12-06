'use strict';

const knex = require('knex')({
    client: 'pg',
    connection: {
        host: '127.0.0.1',
        port: 5432,
        database: 'test',
        // user: 'your_database_user',
        // password: 'your_database_password',
    }
});

module.exports = { knex }