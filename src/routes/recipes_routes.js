const app = require("express").Router();
const recipesController = require("../controllers/recipes_controller");

recipesController.setUp();

app.get("/", recipesController.findAllRecipes);
app.get("/python_test", recipesController.callPythonScriptTest);
app.get("/process_json", recipesController.processRecipesJson);

module.exports = app;
