const async = require('async');
const mongoClient = require('mongodb').MongoClient;
const { env, url } = require('../../config');
const auth = require('../services/auth');

const connect = (callback) => {
  mongoClient.connect(url, (err, client) => {
    callback(err, client, client.db(env).collection('users'));
  });
};

module.exports.connect = connect;

const selectAllUsers = (collection, callback) => {
  collection.find({}).toArray(callback);
};

const countLikedRecipes = (collection, callback) => {
  selectAllUsers(collection, (err, users) => {
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
  async.auto({
    connect,
    countLikedRecipes: ['connect', (results, autoCallback) => {
      const collection = results.connect[1];
      countLikedRecipes(collection, autoCallback);
    }],
  }, (err, results) => callback(err, results.countLikedRecipes));
};

const deleteUser = (collection, userInfo, callback) => {
  collection.remove({ email: userInfo.email }, (err) => {
    if (err) {
      return callback(err, null);
    }
    return callback(err, { userInfo });
  });
};

const storeUser = (collection, name, email, hashedPassword, callback) => {
  collection.insertOne({
    email,
    hashedPassword,
    name,
  }, callback);
};

const registerUser = (collection, name, email, password, callback) => {
  async.waterfall([
    next => auth.hashPassword(password, next),
    (hashedPassword, next) => storeUser(collection, name, email, hashedPassword, next),
  ], callback);
};

const authorizeLogin = (password, userInfo, callback) => {
  auth.authorizeLogin(
    password,
    userInfo,
    (err, loggedInUserInfo) => callback(err, err ? null : { userInfo: loggedInUserInfo }),
  );
};

const getToken = (name, email, callback) => {
  auth.issueToken(name, email, callback);
};

const fetchUserInfo = (collection, email, callback) => {
  collection.findOne({ email }, (err, userInfo) => {
    if (!userInfo) {
      return callback({ message: 'username does not exist' });
    }
    return callback(err, userInfo);
  });
};

module.exports.authorizeUser = ({ email, password }, callback) => {
  async.auto({
    connect,
    fetchUserInfo: ['connect', (results, autoCallback) => {
      const collection = results.connect[1];
      fetchUserInfo(collection, email, autoCallback);
    }],
    authorizeLogin: ['fetchUserInfo', (results, autoCallback) => {
      authorizeLogin(password, results.fetchUserInfo, autoCallback);
    }],
    closeClient: ['connect', 'authorizeLogin', (results, autoCallback) => {
      const client = results.connect[0];
      client.close(autoCallback);
    }],
  }, err => callback(err));
};

const dropUserTable = (collection, callback) => {
  collection.drop(callback);
};

const createEmailUniqueIndex = (__, collection, callback) => {
  collection.createIndex({ email: 1 }, { unique: true }, callback);
};

module.exports.clean = (callback) => {
  async.auto({
    connect,
    dropUserTable: ['connect', (results, autoCallback) => {
      const collection = results.connect[1];
      dropUserTable(collection, autoCallback);
    }],
    closeClient: ['connect', 'dropUserTable', (results, autoCallback) => {
      const client = results.connect[0];
      client.close(autoCallback);
    }],
  }, (err, results) => callback(err, results.dropUserTable));
};

module.exports.findAllUsers = (callback) => {
  async.auto({
    connect,
    selectAllUsers: ['connect', (results, autoCallback) => {
      const collection = results.connect[1];
      selectAllUsers(collection, autoCallback);
    }],
    closeClient: ['connect', 'selectAllUsers', (results, autoCallback) => {
      const client = results.connect[0];
      client.close(autoCallback);
    }],
  }, (err, results) => callback(err, results.selectAllUsers));
};

module.exports.registerUser = (name, email, password, callback) => {
  async.auto({
    connect,
    registerUser: ['connect', (results, autoCallback) => {
      const collection = results.connect[1];
      registerUser(collection, name, email, password, autoCallback);
    }],
    getToken: ['registerUser', (_, autoCallback) => {
      getToken(name, email, autoCallback);
    }],
    closeClient: ['connect', 'getToken', (results, autoCallback) => {
      const client = results.connect[0];
      client.close(autoCallback);
    }],
  }, (err, results) => {
    callback(err, results.getToken);
  });
};

module.exports.deleteUser = (email, password, callback) => {
  async.auto({
    connect,
    fetchUserInfo: ['connect', (results, autoCallback) => {
      const collection = results.connect[1];
      fetchUserInfo(collection, email, autoCallback);
    }],
    authorizeLogin: ['fetchUserInfo', (results, autoCallback) => {
      authorizeLogin(password, results.fetchUserInfo, autoCallback);
    }],
    deleteUser: ['connect', 'fetchUserInfo', 'authorizeLogin', (results, autoCallback) => {
      const collection = results.connect[1];
      deleteUser(collection, results.fetchUserInfo, autoCallback);
    }],
    closeClient: ['connect', 'deleteUser', (results, autoCallback) => {
      const client = results.connect[0];
      client.close(autoCallback);
    }],
  }, callback);
};

module.exports.login = (email, password, callback) => {
  async.auto({
    connect,
    fetchUserInfo: ['connect', (results, autoCallback) => {
      const collection = results.connect[1];
      fetchUserInfo(collection, email, autoCallback);
    }],
    authorizeLogin: ['fetchUserInfo', (results, autoCallback) => {
      authorizeLogin(password, results.fetchUserInfo, autoCallback);
    }],
    getToken: ['authorizeLogin', (results, autoCallback) => {
      getToken(results.fetchUserInfo.name, email, autoCallback);
    }],
    closeClient: ['connect', 'getToken', (results, autoCallback) => {
      const client = results.connect[0];
      client.close(autoCallback);
    }],
  }, (err, results) => {
    callback(err, results.getToken);
  });
};

module.exports.verifyToken = (token, callback) => {
  auth.verifyToken(token, callback);
};

const getUserInfo = (collection, email, callback) => {
  collection.findOne(
    { email },
    { projection: { hashedPassword: 0, _id: 0 } },
    callback,
  );
};

module.exports.getUserInfo = (email, callback) => {
  async.auto({
    connect,
    getUserInfo: ['connect', (results, autoCallback) => {
      const collection = results.connect[1];
      getUserInfo(collection, email, autoCallback);
    }],
    closeClient: ['connect', 'getUserInfo', (results, autoCallback) => {
      const client = results.connect[0];
      client.close(autoCallback);
    }],
  }, (err, results) => {
    callback(err, results.getUserInfo);
  });
};

const changeUserInfo = async (collection, email, password, name, callback) => {
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
  async.auto({
    connect,
    changeUserInfo: ['connect', (results, autoCallback) => {
      const collection = results.connect[1];
      changeUserInfo(collection, email, password, name, autoCallback);
    }],
    closeClient: ['connect', 'changeUserInfo', (results, autoCallback) => {
      const client = results.connect[0];
      client.close(autoCallback);
    }],
  }, (err, results) => {
    callback(err, results.changeUserInfo);
  });
};

const likesRecipes = (collection, email, recipeIds, callback) => {
  collection.findOneAndUpdate(
    { email },
    { $addToSet: { likedRecipes: { $each: recipeIds } } },
    callback,
  );
};

module.exports.likesRecipes = (email, recipeIds, callback) => {
  async.auto({
    connect,
    likesRecipes: ['connect', (results, autoCallback) => {
      const collection = results.connect[1];
      likesRecipes(collection, email, recipeIds, autoCallback);
    }],
    closeClient: ['connect', 'likesRecipes', (results, autoCallback) => {
      const client = results.connect[0];
      client.close(autoCallback);
    }],
  }, callback);
};

const unlikesRecipes = (collection, email, recipeIds, callback) => {
  collection.findOneAndUpdate(
    { email },
    { $pull: { likedRecipes: { $in: recipeIds } } },
    callback,
  );
};

module.exports.unlikesRecipes = (email, recipeIds, callback) => {
  async.auto({
    connect,
    unlikesRecipes: ['connect', (results, autoCallback) => {
      const collection = results.connect[1];
      unlikesRecipes(collection, email, recipeIds, autoCallback);
    }],
    closeClient: ['connect', 'unlikesRecipes', (results, autoCallback) => {
      const client = results.connect[0];
      client.close(autoCallback);
    }],
  }, callback);
};

const addAllergies = (collection, email, allergies, callback) => {
  collection.findOneAndUpdate(
    { email },
    { $addToSet: { foodAllergies: { $each: allergies } } },
    callback,
  );
};

module.exports.addAllergies = (email, allergies, callback) => {
  async.auto({
    connect,
    addAllergies: ['connect', (results, autoCallback) => {
      const collection = results.connect[1];
      addAllergies(collection, email, allergies, autoCallback);
    }],
    closeClient: ['connect', 'addAllergies', (results, autoCallback) => {
      const client = results.connect[0];
      client.close(autoCallback);
    }],
  }, callback);
};

const removeAllergies = (collection, email, allergies, callback) => {
  collection.findOneAndUpdate(
    { email },
    { $pull: { foodAllergies: { $in: allergies } } },
    callback,
  );
};

module.exports.removeAllergies = (email, allergies, callback) => {
  async.auto({
    connect,
    removeAllergies: ['connect', (results, autoCallback) => {
      const collection = results.connect[1];
      removeAllergies(collection, email, allergies, autoCallback);
    }],
    closeClient: ['connect', 'removeAllergies', (results, autoCallback) => {
      const client = results.connect[0];
      client.close(autoCallback);
    }],
  }, callback);
};

const addRecipesToMealPlan = (collection, email, mealName, recipeIds, callback) => {
  collection.findOneAndUpdate(
    { email },
    { $addToSet: { [`mealPlan.${mealName}`]: { $each: recipeIds } } },
    callback,
  );
};

const removeRecipesFromMealPlan = (collection, email, mealName, recipeIds, callback) => {
  collection.findOneAndUpdate(
    { email },
    { $pull: { [`mealPlan.${mealName}`]: { $in: recipeIds } } },
    callback,
  );
};

module.exports.addRecipesToMealPlan = (email, mealName, recipeIds, callback) => {
  async.auto({
    connect,
    addRecipesToMealPlan: ['connect', (results, autoCallback) => {
      const collection = results.connect[1];
      addRecipesToMealPlan(collection, email, mealName, recipeIds, autoCallback);
    }],
    closeClient: ['connect', 'addRecipesToMealPlan', (results, autoCallback) => {
      const client = results.connect[0];
      client.close(autoCallback);
    }],
  }, callback);
};

module.exports.removeRecipesFromMealPlan = (email, mealName, recipeIds, callback) => {
  async.auto({
    connect,
    removeRecipesFromMealPlan: ['connect', (results, autoCallback) => {
      const collection = results.connect[1];
      removeRecipesFromMealPlan(collection, email, mealName, recipeIds, autoCallback);
    }],
    closeClient: ['connect', 'removeRecipesFromMealPlan', (results, autoCallback) => {
      const client = results.connect[0];
      client.close(autoCallback);
    }],
  }, callback);
};

module.exports.setup = (callback) => {
  async.waterfall([
    connect,
    createEmailUniqueIndex,
  ],
  callback);
};
