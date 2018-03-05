const cassandra = require("cassandra-driver");
const async = require("async");
const client = new cassandra.Client({contactPoints: ["127.0.0.1"]});
const auth = require("../services/auth");
const {env} = require("../../config");

const connect = function(next) {
    client.connect((err) => {
        if (err) {
            console.log(`Setup error: ${err}`);

            return next(err);
        }
        next();
    });
};

const selectAllUsers = function(next) {
    const query = `SELECT * FROM ${env}.users`;

    client.execute(query, {prepare: true}, (err) => {
        if (err) {
            return next(err);
        }
        next();
    });
};
const deleteUser = function({email}, next) {
    const query = `DELETE FROM ${env}.users WHERE email IN (?)`;
    const params = [email];

    client.execute(query, params, {prepare: true}, (err) => {
        if (err) {
            return next(err);
        }
        next();
    });
};

const storeUser = (query, params, hashedPassword, next) => {
    params.push(hashedPassword);
    client.execute(query, params, {prepare: true}, (err) => {
        if (err) {
            return next(err);
        }
        next();
    });
};

const registerUser = function(name, email, password, onRegistered) {
    const query = `INSERT INTO ${env}.users (name, email, password) VALUES (?, ?, ?)`;
    const params = [
        name,
        email
    ];

    async.waterfall([
        (next) => auth.hashPassword(password, next),
        (hashedPassword, next) => storeUser(query, params, hashedPassword, next)
    ], onRegistered);

};

const fetchUserInfo = (email, next) => {
    const query = `SELECT * FROM ${env}.users WHERE email = ?`;

    client.execute(query, [email], {prepare: true}, (err, result) => {
        if (err) {
            return next(err);
        }
        const userInfo = result.first();

        if (!userInfo) {
            return next({message: "username does not exist"});
        }

        next(null, userInfo);
    });
};

module.exports.clean = (callback) => {
    console.log("Cleaning up the database");
    async.series([
        connect,
        function dropKeyspace(next) {
            const query = `DROP KEYSPACE IF EXISTS ${env}`;

            client.execute(query, (err) => {
                if (err) {
                    console.log(`Drop keyspace error: ${err}`);

                    return next(err);
                }
                console.log("Keyspace dropped");
                next();
            });
        },
        function dropTable(next) {
            const query = `DROP TABLE IF EXISTS ${env}.users`;

            client.execute(query, (err) => {
                if (err) {
                    console.log(`Drop table error: ${err}`);

                    return next(err);
                }
                console.log("Table dropped");
                next();
            });
        }
    ], callback);
};

module.exports.setup = (callback) => {
    console.log("Setting up the database");
    async.series([
        connect,
        function createKeyspace(next) {
            const query = `CREATE KEYSPACE IF NOT EXISTS ${env} WITH replication = {'class': 'SimpleStrategy', 'replication_factor': '3' }`;

            client.execute(query, (err) => {
                if (err) {
                    console.log(`Create keyspace error: ${err}`);

                    return next(err);
                }
                console.log("Keyspace created");
                next();
            });
        },
        function createTable(next) {
            const query = `CREATE TABLE IF NOT EXISTS ${env}.users (name text, email text, password text, PRIMARY KEY(email))`;

            client.execute(query, (err) => {
                if (err) {
                    console.log(`Create table error: ${err}`);

                    return next(err);
                }
                console.log("Table created");
                next();
            });
        }
    ], callback);
};

module.exports.findAllUsers = (callback) => {
    async.series([
        connect,
        selectAllUsers
    ], callback);
};

module.exports.registerUser = (name, email, password, callback) => {
    async.series([
        connect,
        (next) => registerUser(name, email, password, next)
    ], callback);
};

module.exports.deleteUser = (email, password, callback) => {
    async.waterfall([
        connect,
        (next) => fetchUserInfo(email, next),
        (userInfo, next) => auth.authorizeLogin(email, password, userInfo, next),
        (userInfo, next) => deleteUser(userInfo, next)
    ], callback);
};

module.exports.login = (email, password, callback) => {
    async.waterfall([
        connect,
        (next) => fetchUserInfo(email, next),
        (userInfo, next) => auth.authorizeLogin(email, password, userInfo, next),
        (userInfo, next) => auth.issueToken(userInfo, next)
    ], callback);
};
