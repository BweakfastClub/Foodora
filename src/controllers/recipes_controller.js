const { spawn } = require('child_process');
const fs = require('fs');
const recipesModel = require('../models/recipes_model');
const usersModel = require('../models/users_model');

const PYTHON_MODES = {
  PROCESS: 'PROCESS',
  RECOMMEND: 'RECOMMEND',
};

module.exports.setUp = () => {
  recipesModel.setup();
};

module.exports.selectRecipesByIds = (req, res) => {
  let { ids } = req.query;
  ids = ids ? ids.split(',') : [];
  ids = ids.map(id => parseInt(id, 10));

  recipesModel.selectRecipesByIds(ids, (err, result) => {
    res.status(err ? 500 : 200).json(err ? undefined : result);
  });
};

module.exports.searchRecipes = ({ body: { query = null } }, res) => {
  recipesModel.search(query, (err, result) => {
    res.status(err ? 500 : 200).json(err ? undefined : result);
  });
};

module.exports.getTopRecipes = (req, res) => {
  const numberOfRecipes = 8;
  usersModel.countLikedRecipes((err, recipes) => {
    if (!err && Object.keys(recipes).length >= numberOfRecipes) {
      const keysSorted = Object.keys(recipes).sort(
        (recipe1, recipe2) => recipes[recipe2] - recipes[recipe1],
      );
      let topRecipesIds = keysSorted.slice(0, numberOfRecipes);
      topRecipesIds = topRecipesIds.map(recipeId => parseInt(recipeId, 10));
      recipesModel.selectRecipesByIds(
        topRecipesIds,
        (selectRecipeErr, topRecipes) => {
          res.status(selectRecipeErr ? 500 : 200).json(selectRecipeErr ? null : topRecipes);
        },
      );
    } else {
      recipesModel.getRandomRecipes(numberOfRecipes, (getRandomRecipesErr, randomRecipes) => {
        res.status(getRandomRecipesErr ? 500 : 200)
          .json(getRandomRecipesErr ? null : randomRecipes);
      });
    }
  });
};

module.exports.callPythonScriptTest = (req, res) => {
  const pythonProcess = spawn('python', ['test_script.py']);

  pythonProcess.stdout.on('data', (data) => {
    res.status(200).json(data.toString());
  });
};

module.exports.selectRecipeById = ({ params: { recipeId = null } }, res) => {
  if (recipeId === null) {
    return res.status(400).json('Please enter the recipe Id');
  }

  return recipesModel.selectRecipeById(recipeId, (err, result) => {
    res.status(err ? 500 : 200).json(err ? undefined : result);
  });
};

module.exports.processRecipesJson = (req, res) => {
  const rawRecipeData = fs.readFileSync('data/recipes/recipes.json');
  const recipes = JSON.parse(rawRecipeData);

  const ingredientsList = recipes.map(({ id, ingredients }) => ({
    id,
    ingredients: ingredients.map(ingredient => ingredient.ingredientID),
  }));


  const pythonProcess = spawn('python', ['recommender.py', PYTHON_MODES.PROCESS]);

  pythonProcess.stdin.write(JSON.stringify(ingredientsList));
  pythonProcess.stdin.end();

  let dataString = '';

  pythonProcess.stdout.on('data', (data) => {
    dataString += data;
  });

  pythonProcess.stderr.on('data', (error) => {
    console.error(error.toString());
  });

  pythonProcess.stdout.on('end', () => {
    res.status(200).json(dataString.toString());
  });
};


module.exports.recommendRecipe = ({ params: { recipeId = null } }, res) => {
  if (recipeId === null) {
    return res.status(400).json('Please enter the recipe Id');
  }

  const pythonProcess = spawn('python', [
    'recommender.py',
    PYTHON_MODES.RECOMMEND,
    recipeId,
  ]);

  let dataString = '';

  pythonProcess.stdout.on('data', (data) => {
    dataString += data;
  });

  pythonProcess.stderr.on('data', (error) => {
    console.error(error.toString());
  });

  return pythonProcess.stdout.on('end', () => {
    res.status(200).json(JSON.parse(dataString.toString()));
  });
};
