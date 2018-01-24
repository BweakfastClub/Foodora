const fs = require('fs');

module.exports.existsFile = (path) => {
    return new Promise((resolve) => {
        fs.access(path, fs.F_OK, exists => resolve(!exists));
    });
};

module.exports.sleep = (ms) => {
    return new Promise(resolve => {
        setTimeout(resolve, ms);
    });
};