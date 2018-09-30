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

const passClientConnection = (client, collection, obj, helperFunction, next) => {
    helperFunction(obj, (err, res) => {
        if (err) {
            return next(err, null);
        }
        next(null, res, collection, client);
    }, collection, client);
};

const selectAllUsers = (client, collection, next) => {
    collection.find({}).toArray((err, items) => {
        client.close(() => next(err, items));
    });
};

const deleteUser = ({userInfo}, callback, collection, client) => {
    collection.remove({"email": userInfo.email}, (err, result) => {
        if (err) {
            return callback(err, null);
        }
        client.close();
        callback(result, {userInfo});
    });
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

const authorizeUser = (obj, next) => {
    auth.authorizeLogin(obj.email, obj.password, obj.userInfo, (err, userInfo) => {
        if (err) {
            return next(err, null);
        }

        const res = {userInfo};

        next(null, res);
    });
};

const getToken = (obj, next) => {
    auth.issueToken(obj.userInfo, (err, token) => {
        next(err, token);
    });
};

const fetchUserInfo = ({email, password}, callback, collection) => {
    collection.findOne({email}, (err, userInfo) => {
        if (!userInfo) {
            return callback({message: "username does not exist"});
        }
        const res = {
            email,
            password,
            userInfo
        };

        callback(err, res);
    });
};

const dropUserTable = (client, collection, next) => {
    collection.drop(() => client.close(next));
};

const createEmailUniqueIndex = (__, collection, next) => {
    collection.createIndex({"email" : 1}, {unique : true}, next);
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
    const obj = {
        email,
        password
    };

    async.waterfall([
        connect,
        (client, collection, next) => passClientConnection(client, collection, obj, fetchUserInfo, next),
        (userInfo, client, collection, next) => passClientConnection(client, collection, userInfo, authorizeUser, next),
        (userInfo, client, collection, next) => passClientConnection(client, collection, userInfo, deleteUser, next)
    ], callback);
};

module.exports.login = (email, password, callback) => {
    const obj = {
        email,
        password
    };

    async.waterfall([
        connect,
        (client, collection, next) => passClientConnection(client, collection, obj, fetchUserInfo, next),
        (userInfo, client, collection, next) => passClientConnection(client, collection, userInfo, authorizeUser, next),
        (userInfo, client, collection, next) => passClientConnection(client, collection, userInfo, getToken, next)
    ], callback);
};

module.exports.verifyToken = (token, callback) => {
    auth.verifyToken(token, callback);
};

module.exports.getUserInfo = (client, collection, email, callback) => {
    collection.findOne({email}, {"projection": {"hashedPassword": 0, "_id": 0}}, (err, result) => client.close(() => callback(err, result)))
}

module.exports.likesRecipe = (client, collection, email, recipeId, callback) => {
    collection.findOneAndUpdate({email}, {$push: {likedRecipes: recipeId}}, () => client.close(callback));
};

module.exports.unlikesRecipe = (client, collection, email, recipeId, callback) => {
    collection.findOneAndUpdate({email}, {$pull: {likedRecipes: recipeId}}, () => client.close(callback));
};

module.exports.setup = (callback) => {
    console.log("setting up recipes");
    async.waterfall([
        connect,
        createEmailUniqueIndex
    ],
    callback);
};
