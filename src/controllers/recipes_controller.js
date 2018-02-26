const recipesModel = require("../models/recipes_model");
const {spawn} = require("child_process");
const fs = require("fs");

module.exports.setUp = () => {
    recipesModel.setup();
};

module.exports.findAllRecipes = (req, res) => {
    recipesModel.selectAllRecipes((err, result) => {
        console.log(err);
        res.status(200).json(result);
    });
};

module.exports.callPythonScriptTest = (req, res) => {
    const pythonProcess = spawn("python", ["test_script.py"]);

    pythonProcess.stdout.on("data", (data) => {
        res.status(200).json(data.toString());
    });
};

module.exports.processRecipesJson = (req, res) => {
    const rawRecipeData = fs.readFileSync("data/recipes/magazine_favourites.json");
    const recipes = JSON.parse(rawRecipeData);

    const ingredientsList = recipes.map(({id, ingredients}) => ({
        id,
        ingredients: ingredients.map((ingredient) => ingredient.ingredientID)
    }));

    res.status(200).json(ingredientsList);
};
