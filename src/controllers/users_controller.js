const async = require('async');
const _ = require('lodash');
const usersModel = require('../models/users_model');
const recipesModel = require('../models/recipes_model');

module.exports.setup = (callback) => {
  usersModel.setup(callback);
};

module.exports.clean = (callback) => {
  usersModel.clean(callback);
};

const verifyToken = (token, res, callback) => {
  usersModel.verifyToken(token, (tokenErr, userInfo) => {
    if (tokenErr) {
      return res.status(401).json({
        error: 'Invalid or Missing Token, please include a valid token in the header',
      });
    }
    return callback(null, userInfo);
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

const buildMealDetailsFunctions = (populateDetailedLikedRecipes) => {
  return Object.keys(populateDetailedLikedRecipes.mealPlan).map((meal) => {
    return (userInfoBeingBuilt, waterfallCallback) => {
      if (meal && meal.length !== 0) {
        recipesModel.selectRecipesByIds(
          userInfoBeingBuilt.mealPlan[meal],
          (err, recipesDetails) => {
            if (!err) {
              userInfoBeingBuilt.mealPlan[meal] = recipesDetails;
            }
            waterfallCallback(err, userInfoBeingBuilt);
          },
        );
      }
    };
  });
};

module.exports.getUserInfo = ({ headers: { token } }, res) => {
  async.auto({
    verifyToken: autoCallback => verifyToken(token, res, autoCallback),
    getUserInfo: ['verifyToken', ({ verifyToken: { email } }, autoCallback) => {
      usersModel.getUserInfo(email, autoCallback);
    }],
    populateDetailedLikedRecipes: ['getUserInfo', ({ getUserInfo }, autoCallback) => {
      if (getUserInfo && getUserInfo.likedRecipes && getUserInfo.likedRecipes.length !== 0) {
        recipesModel.selectRecipesByIds(getUserInfo.likedRecipes, (err, likedRecipes) => {
          autoCallback(err, err ? getUserInfo : { ...getUserInfo, likedRecipes });
        });
      } else {
        autoCallback(null, getUserInfo);
      }
    }],
    populateDetailedMealRecipes: ['populateDetailedLikedRecipes', ({ populateDetailedLikedRecipes }, autoCallback) => {
      if (
        populateDetailedLikedRecipes
        && populateDetailedLikedRecipes.mealPlan
      ) {
        const mealDetailsFunctions = buildMealDetailsFunctions(populateDetailedLikedRecipes);
        async.waterfall([
          waterfallCallback => waterfallCallback(null, populateDetailedLikedRecipes),
          ...mealDetailsFunctions,
        ], autoCallback);
      } else {
        autoCallback(null, populateDetailedLikedRecipes);
      }
    }],
  }, (err, { populateDetailedMealRecipes }) => {
    res.status(err ? 500 : 200).json(err ? null : populateDetailedMealRecipes);
  });
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
    outerNext => verifyToken(token, res, outerNext),
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
    filterRecipeIds: callback => recipesModel.filterRecipeIds(recipeIds, callback),
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
    next => verifyToken(token, res, next),
    ({ email }, next) => usersModel.unlikesRecipes(email, recipeIds, next),
  ], err => res.status(err ? 500 : 200).json(err || undefined));
};

module.exports.addAllergies = ({ body: { allergies }, headers: { token } }, res) => {
  async.waterfall([
    next => verifyToken(token, res, next),
    ({ email }, next) => usersModel.addAllergies(email, allergies, next),
  ], err => res.status(err ? 500 : 200).json(err || undefined));
};

module.exports.removeAllergies = ({ body: { allergies }, headers: { token } }, res) => {
  async.waterfall([
    next => verifyToken(token, res, next),
    ({ email }, next) => usersModel.removeAllergies(email, allergies, next),
  ], err => res.status(err ? 500 : 200).json(err || undefined));
};

const buildAddRecipesFunctions = (email, meals) => {
  const addRecipesFunctions = {};
  Object.keys(meals).map((meal) => {
    if (meals[meal]) {
      addRecipesFunctions[meal] = waterfallCallback => async.waterfall([
        innerCallback => recipesModel.filterRecipeIds(meals[meal], innerCallback),
        (filterRecipeIds, innerCallback) => {
          usersModel.addRecipesToMealPlan(email, meal, filterRecipeIds, innerCallback);
        },
      ], waterfallCallback);
    }
  });
  return addRecipesFunctions;
};

module.exports.addRecipesToMealPlan = (
  {
    body: { breakfast, lunch, dinner },
    headers: { token },
  },
  res,
) => {
  async.auto({
    verifyToken: callback => verifyToken(token, res, callback),
    filterRecipeIds: ['verifyToken', ({ verifyToken: { email } }, callback) => {
      const addRecipesFunctions = buildAddRecipesFunctions(email, { breakfast, lunch, dinner });
      async.parallel(addRecipesFunctions, callback);
    }],
  }, err => res.status(err ? 500 : 200).json(err || undefined));
};

const buildRemoveRecipesFunctions = (email, meals) => {
  const removeRecipesFunctions = {};
  Object.keys(meals).map((meal) => {
    if (meals[meal]) {
      removeRecipesFunctions[meal] = (callback) => {
        usersModel.removeRecipesFromMealPlan(email, meal, meals[meal], callback);
      };
    }
  });
  return removeRecipesFunctions;
};

module.exports.removeRecipesFromMealPlan = (
  {
    body: { breakfast, lunch, dinner },
    headers: { token },
  },
  res,
) => {
  async.waterfall([
    next => verifyToken(token, res, next),
    ({ email }, next) => {
      const removeRecipesFunctions = buildRemoveRecipesFunctions(
        email,
        { breakfast, lunch, dinner },
      );
      async.parallel(removeRecipesFunctions, next);
    },
  ], err => res.status(err ? 500 : 200).json(err || undefined));
};

module.exports.getRecommendedRecipes = ({ query: { recipes }, headers: { token } }, res) => {
  let numberOfRecipes = 10;
  if (recipes) {
    numberOfRecipes = parseInt(recipes, 10);
  }

  async.auto({
    verifyToken: autoCallback => verifyToken(token, res, autoCallback),
    getLikedRecipes: ['verifyToken', ({ verifyToken: { email } }, autoCallback) => {
      usersModel.getLikedRecipes(email, autoCallback);
    }],
    getRecommendedRecipesByIds: ['getLikedRecipes', (results, autoCallback) => {
      recipesModel.recommendRecipes(results.getLikedRecipes, autoCallback);
    }],
    generateRandomRecommendations: ['getRecommendedRecipesByIds', ({ getRecommendedRecipesByIds }, autoCallback) => {
      let recommendedRecipes = Object.keys(getRecommendedRecipesByIds)
        .reduce((accumulator, recipe) => {
          return [...accumulator, ...getRecommendedRecipesByIds[recipe]];
        }, []);
      recommendedRecipes = [...new Set(recommendedRecipes)];
      autoCallback(
        null,
        _.sampleSize(recommendedRecipes, numberOfRecipes),
      );
    }],
    generateRecipeDetail: ['generateRandomRecommendations', ({ generateRandomRecommendations }, autoCallback) => {
      recipesModel.selectRecipesByIds(generateRandomRecommendations, autoCallback);
    }],
  }, (err, { generateRecipeDetail }) => {
    res.status(err ? 500 : 200).json(err ? null : generateRecipeDetail);
  });
};
