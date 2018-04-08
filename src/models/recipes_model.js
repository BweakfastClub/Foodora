/* eslint-disable max-lines */
const async = require("async");
const mongoClient = require("mongodb").MongoClient;
const {env, url} = require("../../config");

const connect = (next) => {
    mongoClient.connect(url, (err, client) => {
        console.log("Connected successfully to server");
        next(err, client, client.db(env).collection("recipes"));
    });
};

const selectAllRecipes = (client, collection, next) => {
    collection.find({}).toArray((err, items) => {
        client.close(() => next(err, items));
    });
};

const selectRecipeById = (client, collection, id, next) => {
    collection.findOne({id}, (err, item) => {
        client.close(() => next(err, item));
    });
};

module.exports.allRecipes = (callback) => {
    async.waterfall([
        connect,
        selectAllRecipes
    ], callback);
};

module.exports.selectRecipeById = (id, callback) => {
    async.waterfall([
        connect,
        (client, collection, next) => selectRecipeById(client, collection, parseInt(id, 10), next)
    ], callback);
};

const searchRecipesCollection = (client, collection, keyword, next) => {
    collection.find({
        $text: {
            $search: keyword
        }
    }).toArray((err, items) => {
        client.close(() => next(err, items));
    });
};

const dropRecipeTable = (client, collection, next) => {
    collection.drop(() => client.close(next));
}

module.exports.clean = (callback) => {
    async.waterfall([
        connect,
        dropRecipeTable
    ], callback);
};

const createIndex = (client, collection, next) => {
    collection.createIndex({
        "$**": "text"
    }, next);
};

module.exports.search = (keyword, callback) => {
    async.waterfall([
        connect,
        (client, collection, next) => searchRecipesCollection(client, collection, keyword, next)
    ], callback);
};

/* eslint-disable sort-keys */
module.exports.setup = (callback) => {
    console.log("setting up recipes");
    async.waterfall([
        connect,
        createIndex
    ]
    , callback);
};
