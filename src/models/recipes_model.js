const cassandra = require("cassandra-driver");
const async = require("async");
const client = new cassandra.Client({contactPoints: ["127.0.0.1"]});
const {env} = require("../../config");

const connect = function(next) {
    client.connect(next);
};

module.exports.selectAllRecipes = (next) => {
    const query = `SELECT * FROM ${env}.recipes`;

    client.execute(query, {prepare: true}, (err, res) => {
        if (err) {
            return next(err);
        }
        next(null, res);
    });
};

module.exports.setup = () => {
    console.log("Setting up the recipes");
    async.series([
        connect,
        function createKeyspace(next) {
            const query = `CREATE KEYSPACE IF NOT EXISTS ${env} WITH replication = {'class': 'SimpleStrategy', 'replication_factor': '3' }`;

            client.execute(query, next);
        },
        function createTable(next) {
            const query =
                `CREATE TABLE ${env}.recipes (` +
                    "ingredients frozen<map<int, text>>," +
                    "title text," +
                    "id uuid," +
                    "nutrition map<text, text>," +
                    "servings int," +
                    "PRIMARY KEY (ingredients, title, id)" +
                ")";

            client.execute(query, next);
        },
        function temporaryDataInsert(next) {
            const insertRecipe1 =
                `INSERT into ${env}.recipes` +
                "(ingredients, title, nutrition, servings, id) " +
                "VALUES (" +
                    "{12: 'gredient 2', 56: 'ingredient 3'}," +
                    " 'spicy recipe'," +
                    " {'brotein': '420g', 'carbs': '0g'}," +
                    " 2, 6ae690ae-15c0-11e8-b642-0ed5f89f718b\n" +
                ")";

            const insertRecipe2 =
                `INSERT into ${env}.recipes` +
                "(ingredients, title, nutrition, servings, id) " +
                "VALUES (" +
                    "{23: 'ingredient 1', 12: 'ingredient 2'}," +
                    " 'spicy recipe'," +
                    " {'brotein': '420g', 'carbs': '0g'}," +
                    " 2, 94488880-15c0-11e8-b642-0ed5f89f718b" +
                ")";

            client.execute(
                insertRecipe1,
                client.execute(insertRecipe2, next)
            );
        }
    ]);
};
