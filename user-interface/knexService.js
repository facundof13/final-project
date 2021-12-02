'use strict';

const knex = require('knex')({
    client: 'pg',
    connection: {
        host: '127.0.0.1',
        port: 5432,
        // user: 'your_database_user',
        // password: 'your_database_password',
        database: 'final-project'
    }
});

module.exports = { knex }