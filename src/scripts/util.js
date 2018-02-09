const fs = require("fs");

module.exports.existsFile = (path) => new Promise((resolve) => {
    fs.access(path, fs.F_OK, (exists) => resolve(!exists));
});

module.exports.sleep = (ms) => new Promise((resolve) => {
    setTimeout(resolve, ms);
});
