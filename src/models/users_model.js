const async = require("async");
const mongoClient = require("mongodb").MongoClient;
const {env, url} = require("../../config");
const auth = require("../services/auth");

const connect = (next) => {
    mongoClient.connect(url, (err, client) => {
        console.log("Connected successfully to server");
        next(err, client, client.db(env).collection("users"));
    });
};

module.exports.connect = connect;

const selectAllUsers = (client, collection, next) => {
    collection.find({}).toArray((err, items) => {
        client.close(() => next(err, items));
    });
};

const deleteUser = (client, collection, email, callback) => {
    collection.remove({email}, callback);
};

const registerUser = (client, collection, name, email, password, callback) => {
    async.waterfall([
        (next) => auth.hashPassword(password, next),
        (hashedPassword, next) => storeUser(client, collection, name, email, hashedPassword, next)
    ], callback);
};

const storeUser = (client, collection, name, email, hashedPassword, callback) => {
    collection.insertOne({
        email,
        hashedPassword,
        name
    }, (err, result) => {
        client.close(() => callback(err, result));
    });
};

const fetchUserInfo = (client, collection, email, callback) => {
    collection.findOne({email}, (err, result) => {
        if (!result) {
            return callback({message: "user does not exist"});
        }
        callback(err, result);
    });
};

const dropUserTable = (client, collection, next) => {
    collection.drop(() => client.close(next));
};

module.exports.clean = (callback) => {
    async.waterfall([
        connect,
        dropUserTable
    ], callback);
};

module.exports.findAllUsers = (callback) => {
    async.waterfall([
        connect,
        selectAllUsers
    ], callback);
};

module.exports.registerUser = (name, email, password, callback) => {
    async.waterfall([
        connect,
        (client, collection, next) => registerUser(client, collection, name, email, password, next)
    ], callback);
};

module.exports.deleteUser = (email, password, callback) => {
    async.waterfall([
        connect,
        (client, collection, next) => fetchUserInfo(client, collection, email, next),
        (userInfo, next) => auth.authorizeLogin(email, password, userInfo, next),
        (userInfo, next) => deleteUser(userInfo, next)
    ], callback);
};

module.exports.login = (email, password, callback) => {
    async.waterfall([
        connect,
        (client, collection, next) => fetchUserInfo(client, collection, email, next),
        (userInfo, next) => auth.authorizeLogin(email, password, userInfo, next),
        (userInfo, next) => auth.issueToken(userInfo, next)
    ], callback);
};

module.exports.verifyTokenAndGetUserInfo = (token, callback) => {
    auth.verifyToken(token, callback);
};

module.exports.likesRecipe = (client, collection, email, recipeId, callback) => {
    collection.findOneAndUpdate({email}, {$push: {recipeId}}, () => client.close(callback));
};

module.exports.unlikesRecipe = (client, collection, email, recipeId, callback) => {
    collection.findOneAndUpdate({email}, {$pull: {recipeId}}, () => client.close(callback));
};
