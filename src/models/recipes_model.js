/* eslint-disable max-lines */
const async = require('async');
const mongoClient = require('mongodb').MongoClient;
const { env, url } = require('../../config');
const data = require('../../data/recipes/recipes.json');

const connect = (next) => {
  mongoClient.connect(url, (err, client) => {
    next(err, client, client.db(env).collection('recipes'));
  });
};

const selectRecipeById = (client, collection, id, next) => {
  collection.findOne({ id }, (err, item) => {
    client.close(() => next(err, item));
  });
};


module.exports.selectRecipeById = (id, callback) => {
  async.waterfall([
    connect,
    (client, collection, next) => selectRecipeById(client, collection, parseInt(id, 10), next),
  ], callback);
};

const selectAllRecipes = (client, collection, next) => {
  collection.find({}).toArray((err, items) => {
    client.close(() => next(err, items));
  });
};

const selectRecipesByIds = (client, collection, ids, next) => {
  collection.find({ id: { $in: ids } }).toArray((err, item) => {
    client.close(() => next(err, item));
  });
};

module.exports.selectRecipesByIds = (ids, callback) => {
  async.waterfall([
    connect,
    ids.length === 0
      ? selectAllRecipes
      : (client, collection, next) => selectRecipesByIds(client, collection, ids, next),
  ], callback);
};

const filterRecipeIds = (client, collection, ids, next) => {
  collection.find(
    { id: { $in: ids } },
    { projection: { id: 1, _id: 0 } },
  ).toArray(
    (err, items) => client.close(() => next(err, items.map(item => item.id))),
  );
};

module.exports.filterRecipeIds = (ids, callback) => {
  async.waterfall([
    connect,
    (client, collection, next) => filterRecipeIds(client, collection, ids, next),
  ], callback);
};

const searchRecipesCollection = (client, collection, query, next) => {
  collection.find(query).toArray((err, items) => {
    client.close(() => next(err, items));
  });
};

module.exports.search = (query, callback) => {
  async.waterfall([
    connect,
    (client, collection, next) => searchRecipesCollection(client, collection, query, next),
  ], callback);
};

const dropRecipeTable = (client, collection, next) => {
  collection.drop(() => client.close(next));
};

module.exports.clean = (callback) => {
  async.waterfall([
    connect,
    dropRecipeTable,
  ], callback);
};

const createSearchIndex = (collection, callback) => {
  collection.createIndex({
    '$**': 'text',
  }, callback);
};

const createUniqueIndex = (collection, callback) => {
  collection.createIndex(
    { id: 1 },
    { unique: true },
    callback,
  );
};

module.exports.setup = (callback) => {
  async.auto({
    connect: autoCallback => connect(autoCallback),
    createUniqueIndex: ['connect', (results, autoCallback) => {
      const collection = results.connect[1];
      createUniqueIndex(collection, autoCallback);
    }],
    insertData: ['connect', 'createUniqueIndex', (results, autoCallback) => {
      const collection = results.connect[1];
      collection.insertMany(data, () => autoCallback(null));
    }],
    createSearchIndex: ['connect', (results, autoCallback) => {
      const collection = results.connect[1];
      createSearchIndex(collection, autoCallback);
    }],
    closeClient: ['connect', 'insertData', 'createSearchIndex', (results, autoCallback) => {
      const client = results.connect[0];
      client.close(autoCallback);
    }],
  }, callback);
};
