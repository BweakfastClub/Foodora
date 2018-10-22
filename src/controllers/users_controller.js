const async = require('async');
const usersModel = require('../models/users_model');
const recipeModel = require('../models/recipes_model');

module.exports.setUp = () => {
  usersModel.setup();
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
    usersModel.registerUser(name, email, password, (err) => {
      if (err && err.code === 11000) {
        res.status(409).json({ error: `${email} is already used, please use another email.` });
      } else {
        res.status(err ? 500 : 200).json();
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
    ({ email }, next) => {
      usersModel.connect((err, client, collection) => {
        next(err, email, client, collection);
      });
    },
    (email, client, collection, next) => usersModel.getUserInfo(client, collection, email, next),
  ], (err, userInfo) => res.status(err ? 500 : 200).json(err || userInfo));
};

module.exports.likesRecipe = ({ body: { recipeId }, headers: { token } }, res) => {
  async.waterfall([
    next => usersModel.verifyToken(token, next),
    ({ email }, next) => {
      usersModel.connect((err, client, collection) => {
        next(err, email, client, collection);
      });
    },
    (email, client, collection, next) => {
      usersModel.likesRecipe(client, collection, email, recipeId, next);
    },
  ], err => res.status(err ? 500 : 200).json(err || undefined));
};

module.exports.unlikesRecipe = ({ body: { recipeId }, headers: { token } }, res) => {
  async.waterfall([
    next => usersModel.verifyToken(token, next),
    ({ email }, next) => {
      usersModel.connect((err, client, collection) => {
        next(err, email, client, collection);
      });
    },
    (email, client, collection, next) => {
      usersModel.unlikesRecipe(client, collection, email, recipeId, next);
    },
  ], err => res.status(err ? 500 : 200).json(err || undefined));
};

module.exports.addAllergy = ({ body: { allergy }, headers: { token } }, res) => {
  async.waterfall([
    next => usersModel.verifyToken(token, next),
    ({ email }, next) => {
      usersModel.connect((err, client, collection) => {
        next(err, email, client, collection);
      });
    },
    (email, client, collection, next) => {
      usersModel.addAllergy(client, collection, email, allergy, next);
    },
  ], err => res.status(err ? 500 : 200).json(err || undefined));
};

module.exports.removeAllergy = ({ body: { allergy }, headers: { token } }, res) => {
  async.waterfall([
    next => usersModel.verifyToken(token, next),
    ({ email }, next) => {
      usersModel.connect((err, client, collection) => {
        next(err, email, client, collection);
      });
    },
    (email, client, collection, next) => {
      usersModel.removeAllergy(client, collection, email, allergy, next);
    },
  ], err => res.status(err ? 500 : 200).json(err || undefined));
};

module.exports.addRecipesToMealPlan = ({ body: { recipeIds }, headers: { token } }, res) => {
  usersModel.verifyToken(token, (tokenErr, decodedToken) => {
    if (tokenErr) {
      return res.status(401).json('Incorrect Token');
    }

    const { email } = decodedToken;
    return async.waterfall([
      next => recipeModel.filterRecipeIds(recipeIds, next),
      (validRecipeIds, next) => {
        usersModel.addRecipesToMealPlan(email, validRecipeIds, next);
      },
    ], err => res.status(err ? 500 : 200).json(err || undefined));
  });
};

module.exports.removeRecipesToMealPlan = ({ body: { recipeIds }, headers: { token } }, res) => {
  async.waterfall([
    next => usersModel.verifyToken(token, next),
    ({ email }, next) => {
      usersModel.connect((err, client, collection) => {
        next(err, email, client, collection);
      });
    },
    (email, client, collection, next) => {
      usersModel.removeRecipesToMealPlan(client, collection, email, recipeIds, next);
    },
  ], err => res.status(err ? 500 : 200).json(err || undefined));
};
