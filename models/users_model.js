const cassandra = require("cassandra-driver");
const async = require("async");
const client = new cassandra.Client({contactPoints: ["127.0.0.1"]});
const bcrypt = require("bcrypt");
const saltRounds = 10;

const connect = function(next) {
    client.connect(next);
};

const selectAllUsers = function(next) {
    const query = "SELECT id, name FROM development.users";

    client.execute(query, {prepare: true}, (err, result) => {
        if (err) {
            return next(err);
        }
        console.log(result);
        next();
    });
};

const hashPassword = (password, next) => {
    bcrypt.hash(password, saltRounds, (err, hashedPassword) => {
        if (err) {
            return next(err);
        }
        console.log(hashedPassword);
        next(null, hashedPassword);
    });
};

const storeUser = (query, params, hashedPassword, next) => {
    params.push(hashedPassword);
    client.execute(query, params, {prepare: true}, (err, result) => {
        if (err) {
            return next(err);
        }
    });
    next(null);
};

const registerUser = function(name, email, password, onRegistered) {
    const query = "INSERT INTO development.users (name, email, password) VALUES (?, ?, ?)";
    const params = [
        name,
        email
    ];

    async.waterfall([
        (next) => hashPassword(password, next),
        (hashedPassword, next) => storeUser(query, params, hashedPassword, next)
    ], onRegistered);

};

const fetchHashedPassword = (email, next) => {
    const query = "SELECT password FROM development.users WHERE email = ?";

    client.execute(query, [email], {prepare: true}, (err, result) => {
        if (err) {
            return next(err);
        }
        const row = result.first();

        if (!row) {
            return next({message: "username does not exist"});
        }
        const {password} = row;

        next(null, password);
    });
};

const authorizeLogin = function(email, password, hashedPassword, next) {
    bcrypt.compare(password, hashedPassword, (err, res) => {
        if (err) {
            return next(err);
        }
        if (!res) {
            return next({message: "password is wrong"});
        }

        return next(null);
    });
};

const onResultReturned = function(err) {
    if (err) {
        console.error("There was an error", err.message, err.stack);
    }
};

const onProcessedLogin = function(err) {
    if (err) {
        console.error(err.message);
    } else {
        console.log("Issue jwt token here");
        // Issue jwt token
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
        (next) => {
            registerUser(name, email, password, next);
        }
    ], onResultReturned);
};

module.exports.login = (email, password) => {
    async.waterfall([
        connect,
        (next) => fetchHashedPassword(email, next),
        (hashedPassword, next) => authorizeLogin(email, password, hashedPassword, next)
    ], onProcessedLogin);
};
