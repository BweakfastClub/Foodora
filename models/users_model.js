const cassandra = require('cassandra-driver')
const async = require('async')
const assert = require('assert')
const client = new cassandra.Client({contactPoints: ['127.0.0.1']})

module.exports.setup = () => {
    console.log('Setting up the database')
    const id = cassandra.types.Uuid.random()
    async.series([
        connect,
        function createKeyspace(next) {
            const query = "CREATE KEYSPACE IF NOT EXISTS development WITH replication = {'class': 'SimpleStrategy', 'replication_factor': '3' }"
            client.execute(query, next)
        },
        function createTable(next) {
            const query = 'CREATE TABLE IF NOT EXISTS development.users (id uuid, name text, PRIMARY KEY(id))'
            client.execute(query, next)
        }
    ], onResultReturned)
};

module.exports.findAllUsers = () => {
    async.series([
        connect,
        selectAllUsers
    ], onResultReturned)
};

function connect(next) {
    client.connect(next)
}

function selectAllUsers(next) {
    const query = 'SELECT id, name FROM development.users'
    client.execute(query, {prepare: true}, function (err, result) {
        if (err) return next(err)
        console.log(result)
        next()
    })
}

function onResultReturned(err) {
    if (err) {
        console.error('There was an error', err.message, err.stack)
    }
}