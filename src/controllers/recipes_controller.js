const recipesModel = require("../models/recipes_model");
const {spawn} = require("child_process");

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
