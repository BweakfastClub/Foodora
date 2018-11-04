const async = require('async');
const mongoClient = require('mongodb').MongoClient;
const { env, url } = require('../../config');
const auth = require('../services/auth');

const connect = (next) => {
  mongoClient.connect(url, (err, client) => {
    next(err, client, client.db(env).collection('users'));
  });
};

module.exports.connect = connect;

const passClientConnection = (client, collection, obj, helperFunction, next) => {
  helperFunction(obj, (err, res) => {
    next(err, res, collection, client);
  }, collection, client);
};

const selectAllUsers = (client, collection, next) => {
  collection.find({}).toArray((err, items) => {
    client.close(() => next(err, items));
  });
};

const countLikedRecipes = (client, collection, callback) => {
  selectAllUsers(client, collection, (err, users) => {
    const likedRecipesCount = users.reduce(
      (counter, { likedRecipes = [] }) => {
        likedRecipes.forEach((recipeId) => {
          if (!(recipeId in counter)) {
            counter[recipeId] = 0;
          }
          counter[recipeId] += 1;
        });
        return counter;
      },
      {},
    );
    callback(err, likedRecipesCount);
  });
};

module.exports.countLikedRecipes = (callback) => {
  async.waterfall([
    connect,
    countLikedRecipes,
  ], callback);
};

const deleteUser = ({ userInfo }, callback, collection, client) => {
  collection.remove({ email: userInfo.email }, (err, result) => {
    if (err) {
      return callback(err, null);
    }
    return client.close(() => callback(result, { userInfo }));
  });
};

const storeUser = (collection, name, email, hashedPassword, callback) => {
  collection.insertOne({
    email,
    hashedPassword,
    name,
  }, callback);
};

const registerUser = ({ name, email, password }, callback, collection) => {
  async.waterfall([
    next => auth.hashPassword(password, next),
    (hashedPassword, next) => storeUser(collection, name, email, hashedPassword, next),
  ], callback);
};

const authorizeLogin = ({ email, password, userInfo }, next) => {
  auth.authorizeLogin(
    email,
    password,
    userInfo,
    (err, loggedInUserInfo) => next(err, err ? null : { userInfo: loggedInUserInfo }),
  );
};

const getToken = ({ userInfo }, next) => {
  auth.issueToken(userInfo, (err, token) => {
    next(err, token);
  });
};

const fetchUserInfo = ({ email, password }, callback, collection) => {
  collection.findOne({ email }, (err, userInfo) => {
    if (!userInfo) {
      return callback({ message: 'username does not exist' });
    }
    const res = {
      email,
      password,
      userInfo,
    };

    return callback(err, res);
  });
};

module.exports.authorizeUser = ({ email, password }, callback) => {
  async.waterfall([
    connect,
    (client, collection, outerNext) => async.waterfall([
      next => fetchUserInfo({ email, password }, next, collection),
      (userInfo, next) => authorizeLogin(userInfo, next),
    ], err => client.close(() => outerNext(err))),
  ], err => callback(err));
};

const dropUserTable = (client, collection, next) => {
  collection.drop(() => client.close(next));
};

const createEmailUniqueIndex = (__, collection, next) => {
  collection.createIndex({ email: 1 }, { unique: true }, next);
};

module.exports.clean = (callback) => {
  async.waterfall([
    connect,
    dropUserTable,
  ], callback);
};

module.exports.findAllUsers = (callback) => {
  async.waterfall([
    connect,
    selectAllUsers,
  ], callback);
};

module.exports.registerUser = (name, email, password, callback) => {
  async.waterfall([
    connect,
    (client, collection, next) => {
      passClientConnection(client, collection, { name, email, password }, registerUser, next);
    },
    (__, client, collection, next) => {
      passClientConnection(client, collection, { userInfo: { name, email } }, getToken, next);
    },
    (token, client, __, next) => {
      client.close(next(null, token));
    },
  ], callback);
};

module.exports.deleteUser = (email, password, callback) => {
  const obj = {
    email,
    password,
  };

  async.waterfall([
    connect,
    (client, collection, next) => {
      passClientConnection(client, collection, obj, fetchUserInfo, next);
    },
    (userInfo, client, collection, next) => {
      passClientConnection(client, collection, userInfo, authorizeLogin, next);
    },
    (userInfo, client, collection, next) => {
      passClientConnection(client, collection, userInfo, deleteUser, next);
    },
  ], callback);
};

module.exports.login = (email, password, callback) => {
  const obj = {
    email,
    password,
  };

  async.waterfall([
    connect,
    (client, collection, next) => {
      passClientConnection(client, collection, obj, fetchUserInfo, next);
    },
    (userInfo, client, collection, next) => {
      passClientConnection(client, collection, userInfo, authorizeLogin, next);
    },
    (userInfo, client, collection, next) => {
      passClientConnection(client, collection, userInfo, getToken, next);
    },
  ], callback);
};

module.exports.verifyToken = (token, callback) => {
  auth.verifyToken(token, callback);
};

const getUserInfo = (client, collection, email, callback) => {
  collection.findOne(
    { email },
    { projection: { hashedPassword: 0, _id: 0 } },
    (err, result) => client.close(() => callback(err, result)),
  );
};

module.exports.getUserInfo = (email, callback) => {
  async.waterfall([
    connect,
    (client, collection, next) => getUserInfo(client, collection, email, next),
  ], callback);
};

const changeUserInfo = async (client, collection, email, password, name, callback) => {
  let changeContent = {};
  if (name) {
    changeContent = { ...changeContent, name };
  }

  auth.hashPassword(password, (err, hashedPassword) => {
    if (hashedPassword) {
      changeContent = { ...changeContent, hashedPassword };
    }
    collection.findOneAndUpdate(
      { email },
      { $set: changeContent },
      callback,
    );
  });
};

module.exports.changeUserInfo = (email, password, name, callback) => {
  async.waterfall([
    connect,
    (client, collection, next) => {
      changeUserInfo(client, collection, email, password, name, next);
    },
  ], (err, res) => {
    callback(err, res);
  });
};

const likesRecipes = (client, collection, email, recipeIds, callback) => {
  collection.findOneAndUpdate(
    { email },
    { $push: { likedRecipes: { $each: recipeIds } } },
    () => client.close(callback),
  );
};

module.exports.likesRecipes = (email, recipeIds, callback) => {
  async.waterfall([
    connect,
    (client, collection, next) => likesRecipes(client, collection, email, recipeIds, next),
  ], callback);
};

const unlikesRecipes = (client, collection, email, recipeIds, callback) => {
  collection.findOneAndUpdate(
    { email },
    { $pull: { likedRecipes: { $in: recipeIds } } },
    () => client.close(callback),
  );
};

module.exports.unlikesRecipes = (email, recipeIds, callback) => {
  async.waterfall([
    connect,
    (client, collection, next) => unlikesRecipes(client, collection, email, recipeIds, next),
  ], callback);
};

const addAllergies = (client, collection, email, allergies, callback) => {
  collection.findOneAndUpdate(
    { email },
    { $push: { foodAllergies: { $each: allergies } } },
    () => client.close(callback),
  );
};

module.exports.addAllergies = (email, allergies, callback) => {
  async.waterfall([
    connect,
    (client, collection, next) => addAllergies(client, collection, email, allergies, next),
  ], callback);
};

const removeAllergies = (client, collection, email, allergies, callback) => {
  collection.findOneAndUpdate(
    { email },
    { $pull: { foodAllergies: { $in: allergies } } },
    () => client.close(callback),
  );
};

module.exports.removeAllergies = (email, allergies, callback) => {
  async.waterfall([
    connect,
    (client, collection, next) => removeAllergies(client, collection, email, allergies, next),
  ], callback);
};

const addRecipesToMealPlan = (client, collection, email, recipeIds, callback) => {
  collection.findOneAndUpdate(
    { email },
    { $push: { mealPlan: { $each: recipeIds } } },
    () => client.close(callback),
  );
};

module.exports.addRecipesToMealPlan = (email, recipeIds, callback) => {
  async.waterfall([
    connect,
    (client, collection, next) => addRecipesToMealPlan(client, collection, email, recipeIds, next),
  ], callback);
};

const removeRecipesToMealPlan = (client, collection, email, recipeIds, callback) => {
  collection.findOneAndUpdate(
    { email },
    { $pull: { mealPlan: { $in: recipeIds } } },
    () => client.close(callback),
  );
};

module.exports.removeRecipesToMealPlan = (email, recipeIds, callback) => {
  async.waterfall([
    connect,
    (client, collection, next) => {
      removeRecipesToMealPlan(client, collection, email, recipeIds, next);
    },
  ], callback);
};

module.exports.setup = (callback) => {
  async.waterfall([
    connect,
    createEmailUniqueIndex,
  ],
  callback);
};
