const cassandra = require("cassandra-driver");
const async = require("async");
const client = new cassandra.Client({contactPoints: ["127.0.0.1"]});
const auth = require("../services/auth");

const connect = function(next) {
    client.connect(next);
};

const selectAllUsers = function(next) {
    const query = "SELECT * FROM development.users";

    client.execute(query, {prepare: true}, (err) => {
        if (err) {
            return next(err);
        }
        next();
    });
};
const deleteUser = function({email}, next) {
    const query = "DELETE FROM development.users WHERE email IN (?)";
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
    const query = "INSERT INTO development.users (name, email, password) VALUES (?, ?, ?)";
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
    const query = "SELECT * FROM development.users WHERE email = ?";

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

const onResultReturned = function(err) {
    if (err) {
        console.error("There was an error", err.message, err.stack);
    }
};

module.exports.setup = () => {
    console.log("Setting up the database");
    async.series([
        connect,
        function createKeyspace(next) {
            const query = "CREATE KEYSPACE IF NOT EXISTS development WITH replication = {'class': 'SimpleStrategy', 'replication_factor': '3' }";

            client.execute(query, next);
        },
        function createTable(next) {
            const query = "CREATE TABLE IF NOT EXISTS development.users (name text, email text, password text, PRIMARY KEY(email))";

            client.execute(query, next);
        }
    ], onResultReturned);
};

module.exports.findAllUsers = () => {
    async.series([
        connect,
        selectAllUsers
    ], onResultReturned);
};

module.exports.registerUser = (name, email, password) => {
    async.series([
        connect,
        (next) => registerUser(name, email, password, next)
    ], onResultReturned);
};

module.exports.deleteUser = (email, password) => {
    async.waterfall([
        connect,
        (next) => fetchUserInfo(email, next),
        (userInfo, next) => auth.authorizeLogin(email, password, userInfo, next),
        (userInfo, next) => deleteUser(userInfo, next)
    ], onResultReturned);
};

module.exports.login = (email, password, callback) => {
    async.waterfall([
        connect,
        (next) => fetchUserInfo(email, next),
        (userInfo, next) => auth.authorizeLogin(email, password, userInfo, next),
        (userInfo, next) => auth.issueToken(userInfo, next)
    ], callback);
};
