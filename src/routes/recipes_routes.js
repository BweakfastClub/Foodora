const app = require("express").Router();
const recipesController = require("../controllers/recipes_controller");
const {env} = require("../../config");

if (env !== "testing") {
    recipesController.setUp();
}

app.get("/", recipesController.findAllRecipes);
app.get("/search", recipesController.findRecipesByTitle);
app.get("/python_test", recipesController.callPythonScriptTest);

module.exports = app;
