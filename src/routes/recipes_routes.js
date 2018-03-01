const app = require("express").Router();
const recipesController = require("../controllers/recipes_controller");

recipesController.setUp();

app.get("/", recipesController.findAllRecipes);
app.get("/python_test", recipesController.callPythonScriptTest);

module.exports = app;
