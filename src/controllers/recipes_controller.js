const recipesModel = require("../models/recipes_model");
const {spawn} = require("child_process");
const fs = require("fs");

module.exports.setUp = () => {
    recipesModel.setup();
};

module.exports.findAllRecipes = (req, res) => {
    recipesModel.selectAllRecipes((err, result) => {
        res.status(err ? 500 : 200).json(err ? undefined : result);
    });
};

module.exports.findRecipes = ({query: {keyword = null}}, res) => {
    recipesModel.search(keyword, (err, result) => {
        if (err) {
            console.log(err);
        }
        res.status(err ? 500 : 200).json(err ? undefined : result);
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


    const pythonProcess = spawn("python", ["tensorflow_test.py"]);

    pythonProcess.stdin.write(JSON.stringify(ingredientsList));
    pythonProcess.stdin.end();

    let dataString = "";

    pythonProcess.stdout.on("data", (data) => {
        dataString += data;
    });

    pythonProcess.stderr.on("data", (error) => {
        console.error(error.toString());
    });

    pythonProcess.stdout.on("end", () => {
        res.status(200).json(dataString.toString());
    });
};
