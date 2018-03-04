require("dotenv/config");

const config = {};

config.env = process.env.NODE_ENV || "production";

module.exports = config;
