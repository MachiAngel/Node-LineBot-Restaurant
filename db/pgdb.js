const knex = require('knex')

console.log(process.env.PG_HOST)
console.log(process.env.PG_USER)
console.log(process.env.PG_PASSWORD)
console.log(process.env.PG_DATABASE)
const pgdb = knex({
    client: 'pg',
    connection: {
        host : process.env.PG_HOST,
        user : process.env.PG_USER,
        password : process.env.PG_PASSWORD,
        database : process.env.PG_DATABASE,
        ssl: true
    }
})
module.exports.pgdb = pgdb
