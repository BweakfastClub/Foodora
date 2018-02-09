const usersModel = require("../models/users_model");

module.exports.setUp = () => {
    usersModel.setup();
};

module.exports.findAllUsers = (req, res) => {
    usersModel.findAllUsers((err, users) => {
        res.status(err ? 500 : 200).json(users);
    });
};

module.exports.register = ({body: {name = null, email = null, password = null}}, res) => {
    if (!email || !password || !name) {
        return res.status(400).json("Email, name and Password must be provided");
    }
    usersModel.registerUser(name, email, password, (err, response) => {
        res.status(err ? 500 : 200).json(response);
    });
};

module.exports.deleteUser = ({body: {email = null, password = null}}, res) => {
    res.json(usersModel.deleteUser(email, password));
};

module.exports.login = ({body: {email = null, password = null}}, res) => {
    if (!email || !password) {
        return res.status(400).json("Email and Password must be provided");
    }
    usersModel.login(email, password, (err, token) => {
        res.status(err ? 500 : 200).json(token);
    });
};
