module.exports = {
    jwtSecret: process.env.SECRET_KEY ?
        process.env.SECRET_KEY :
        "themagicalkeyboardcatateapotatoandshathimself"
};
