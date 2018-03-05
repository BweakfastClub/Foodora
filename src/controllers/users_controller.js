const usersModel = require("../models/users_model");

module.exports.setUp = () => {
    usersModel.setup();
};

module.exports.findAllUsers = (req, res) => {
    usersModel.findAllUsers((err, users) => {
        res.status(err ? 500 : 200).json(err ? undefined : users);
    });
};

module.exports.register = ({body: {name = null, email = null, password = null}}, res) => {
    if (!email || !password || !name) {
        return res.status(400).json({
            error: "Email, name and Password must be provided"
        });
    }
    usersModel.registerUser(name, email, password, (err) => {
        res.status(err ? 500 : 200).json();
    });
};

module.exports.deleteUser = ({body: {email = null, password = null}}, res) => {
    res.json(usersModel.deleteUser(email, password, (err) => {
        res.status(err ? 500 : 200).json();
    }));
};

module.exports.login = ({body: {email = null, password = null}}, res) => {
    if (!email || !password) {
        return res.status(400).json({
            error: "Email, name and Password must be provided"
        });
    }
    usersModel.login(email, password, (err, token) => {
        res.status(err ? 401 : 200).json(err ? undefined : {token});
    });
};
