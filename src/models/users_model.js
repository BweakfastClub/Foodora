const async = require('async');
const mongoClient = require('mongodb').MongoClient;
const { env, url } = require('../../config');
const auth = require('../services/auth');

const connect = (next) => {
  mongoClient.connect(url, (err, client) => {
    console.log('Connected successfully to server');
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

const deleteUser = ({ userInfo }, callback, collection, client) => {
  collection.remove({ email: userInfo.email }, (err, result) => {
    if (err) {
      return callback(err, null);
    }
    return client.close(() => callback(result, { userInfo }));
  });
};

const storeUser = (client, collection, name, email, hashedPassword, callback) => {
  collection.insertOne({
    email,
    hashedPassword,
    name,
  }, (err, result) => {
    client.close(() => callback(err, result));
  });
};

const registerUser = (client, collection, name, email, password, callback) => {
  async.waterfall([
    next => auth.hashPassword(password, next),
    (hashedPassword, next) => storeUser(client, collection, name, email, hashedPassword, next),
  ], callback);
};

module.exports.authorizeUser = ({ email, password }, callback) => {
  async.waterfall([
    connect,
    (client, collection, outerNext) => async.waterfall([
      next => fetchUserInfo({ email, password }, next, collection),
      (userInfo, next) => authorizeLogin(userInfo, next)
    ], err => client.close(() => outerNext(err)))
  ], err => callback(err))
}

const authorizeLogin = ({email, password, userInfo}, next) => {
  auth.authorizeLogin(email, password, userInfo, (err, userInfo) => {
    return next(err, err ? null : { userInfo });
  });
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
      registerUser(client, collection, name, email, password, next);
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

module.exports.getUserInfo = (client, collection, email, callback) => {
  collection.findOne(
    { email },
    { projection: { hashedPassword: 0, _id: 0 } },
    (err, result) => client.close(() => callback(err, result)),
  );
};

const changeUserInfo = (client, collection, email, password, name, callback) => {
  if (password) {
    async.waterfall([
      next => auth.hashPassword(password, next),
      (hashedPassword, next) => {
        collection.findOneAndUpdate(
          { email },
          { $set: { name, hashedPassword } },
          next,
        );
      },
    ], callback);
  } else {
    collection.findOneAndUpdate(
      { email },
      { $set: { name } },
      callback,
    );
  }
};

module.exports.changeUserInfo = (email, password, name, callback) => {
  async.waterfall([
    connect,
    (client, collection, next) => {
      changeUserInfo(client, collection, email, password, name, next);
    },
  ], (err, res) => {
    callback(err, res)
  })
}

module.exports.likesRecipes = (client, collection, email, recipeIds, callback) => {
  collection.findOneAndUpdate(
    { email },
    { $push: { likedRecipes: { $each: recipeIds } } },
    () => client.close(callback),
  );
};

module.exports.unlikesRecipes = (client, collection, email, recipeIds, callback) => {
  collection.findOneAndUpdate(
    { email },
    { $pull: { likedRecipes: { $in: recipeIds } } },
    () => client.close(callback),
  );
};

module.exports.addAllergies = (client, collection, email, allergies, callback) => {
  collection.findOneAndUpdate(
    { email },
    { $push: { foodAllergies: { $each: allergies } } },
    () => client.close(callback),
  );
};

module.exports.removeAllergies = (client, collection, email, allergies, callback) => {
  collection.findOneAndUpdate(
    { email },
    { $pull: { foodAllergies: { $in: allergies } } },
    () => client.close(callback),
  );
};

module.exports.addRecipesToMealPlan = (email, recipeIds, callback) => {
  async.waterfall([
    connect,
    (client, collection, next) => {
      collection.findOneAndUpdate(
        { email },
        { $push: { mealPlan: { $each: recipeIds } } },
        () => client.close(next),
      );
    },
  ], callback);
};

module.exports.removeRecipesToMealPlan = (client, collection, email, recipeIds, callback) => {
  collection.findOneAndUpdate(
    { email },
    { $pull: { mealPlan: { $in: recipeIds } } },
    () => client.close(callback),
  );
};

module.exports.setup = (callback) => {
  console.log('setting up recipes');
  async.waterfall([
    connect, 
    createEmailUniqueIndex,
  ],
  callback);
};
