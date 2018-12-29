const knex = require('knex')

const pgdb = knex({
    client: 'pg',
    connection: {
        host : process.env.PG_HOST,
        user : process.env.PG_USER,
        password : process.env.PG_PASSWORD,
        database : process.env.PG_DATABASE,
        port: process.env.PG_PORT,
        // ssl: true
    }
})
module.exports.pgdb = pgdb
