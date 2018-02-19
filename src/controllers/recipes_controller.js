const recipesModel = require("../models/recipes_model");

module.exports.setUp = () => {
    recipesModel.setup();
};

module.exports.findAllRecipes = (req, res) => {
    recipesModel.selectAllRecipes((err, result) => {
        console.log(err)
        res.status(200).json(result);
    });
};
