const async = require('async');
const usersModel = require('../models/users_model');
const recipeModel = require('../models/recipes_model');

module.exports.setUp = () => {
  usersModel.setup();
};

const verifyToken = (token, res, callback) => {
  usersModel.verifyToken(token, (tokenErr, decodedToken) => {
    if (tokenErr) {
      return res.status(401).json({
        error: 'Invalid or Missing Token, please include a valid token in the header',
      });
    }

    return callback(null, decodedToken);
  });
};

module.exports.findAllUsers = (req, res) => {
  usersModel.findAllUsers((err, users) => {
    res.status(err ? 500 : 200).json(err ? undefined : users);
  });
};

module.exports.register = ({ body: { name = null, email = null, password = null } }, res) => {
  if (!email || !password || !name) {
    res.status(400).json({
      error: 'Email, name and Password must be provided',
    });
  } else {
    usersModel.registerUser(name, email, password, (err, token) => {
      if (err && err.code === 11000) {
        res.status(409).json({ error: `${email} is already used, please use another email.` });
      } else {
        res.status(err ? 500 : 200).json(err ? undefined : { token });
      }
    });
  }
};

module.exports.deleteUser = ({ body: { email = null, password = null } }, res) => {
  if (!email || !password) {
    res.status(400).json({
      error: 'Email and Password must be provided',
    });
  } else {
    res.json(usersModel.deleteUser(email, password, (err) => {
      res.status(err ? 500 : 200).json();
    }));
  }
};

module.exports.login = ({ body: { email = null, password = null } }, res) => {
  if (!email || !password) {
    res.status(400).json({
      error: 'Email and Password must be provided',
    });
  } else {
    usersModel.login(email, password, (err, token) => {
      res.status(err ? 401 : 200).json(err ? undefined : { token });
    });
  }
};

module.exports.getUserInfo = ({ headers: { token } }, res) => {
  async.waterfall([
    next => usersModel.verifyToken(token, next),
    ({ email }, next) => usersModel.getUserInfo(email, next),
  ], (err, userInfo) => res.status(err ? 500 : 200).json(err || userInfo));
};

module.exports.changeUserInfo = (
  {
    body: { name = null, password = null, newPassword = null },
    headers: { token },
  },
  res,
) => {
  if (!password) {
    return res.status(401).json({
      error: 'Password must be provided.',
    });
  }
  if (!name && !newPassword) {
    return res.status(400).json({
      error: 'New password or new name must be provided.',
    });
  }
  return async.waterfall([
    outerNext => usersModel.verifyToken(token, outerNext),
    ({ email }, outerNext) => async.waterfall([
      next => usersModel.authorizeUser({ email, password }, next),
      next => usersModel.changeUserInfo(email, newPassword, name, next),
    ], outerNext),
  ], (err) => {
    res.status(err ? 500 : 200).json(err || undefined);
  });
};

module.exports.likesRecipes = ({ body: { recipeIds }, headers: { token } }, res) => {
  async.auto({
    verifyToken: callback => verifyToken(token, res, callback),
    filterRecipeIds: callback => recipeModel.filterRecipeIds(recipeIds, callback),
    addRecipes: [
      'verifyToken',
      'filterRecipeIds',
      ({ filterRecipeIds, verifyToken: { email } }, callback) => {
        usersModel.likesRecipes(email, filterRecipeIds, callback);
      },
    ],
  }, err => res.status(err ? 500 : 200).json(err || undefined));
};

module.exports.unlikesRecipes = ({ body: { recipeIds }, headers: { token } }, res) => {
  async.waterfall([
    next => usersModel.verifyToken(token, next),
    ({ email }, next) => usersModel.unlikesRecipes(email, recipeIds, next),
  ], err => res.status(err ? 500 : 200).json(err || undefined));
};

module.exports.addAllergies = ({ body: { allergies }, headers: { token } }, res) => {
  async.waterfall([
    next => usersModel.verifyToken(token, next),
    ({ email }, next) => usersModel.addAllergies(email, allergies, next),
  ], err => res.status(err ? 500 : 200).json(err || undefined));
};

module.exports.removeAllergies = ({ body: { allergies }, headers: { token } }, res) => {
  async.waterfall([
    next => usersModel.verifyToken(token, next),
    ({ email }, next) => usersModel.removeAllergies(email, allergies, next),
  ], err => res.status(err ? 500 : 200).json(err || undefined));
};

module.exports.addRecipesToMealPlan = ({ body: { recipeIds }, headers: { token } }, res) => {
  async.auto({
    verifyToken: callback => verifyToken(token, res, callback),
    filterRecipeIds: callback => recipeModel.filterRecipeIds(recipeIds, callback),
    addRecipes: [
      'verifyToken',
      'filterRecipeIds',
      ({ filterRecipeIds, verifyToken: { email } }, callback) => {
        usersModel.addRecipesToMealPlan(email, filterRecipeIds, callback);
      },
    ],
  }, err => res.status(err ? 500 : 200).json(err || undefined));
};

module.exports.removeRecipesToMealPlan = ({ body: { recipeIds }, headers: { token } }, res) => {
  async.waterfall([
    next => usersModel.verifyToken(token, next),
    ({ email }, next) => usersModel.removeRecipesToMealPlan(email, recipeIds, next),
  ], err => res.status(err ? 500 : 200).json(err || undefined));
};
