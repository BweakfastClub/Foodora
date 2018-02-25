const recipesModel = require("../models/recipes_model");
const {spawn} = require("child_process");

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
