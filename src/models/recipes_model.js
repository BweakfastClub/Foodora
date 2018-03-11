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

const searchByTitle = (title, next) => {
    const params = [`%${title}%`];
    const query = `SELECT * FROM ${env}.recipes WHERE title LIKE ?`;

    client.execute(query, params, {prepare: true}, (err, res) => {
        if (err) {
            return next(err);
        }
        next(null, res.rows);
    });
};

const searchByIngredients = (ingredient, next) => {
    const params = [ingredient];
    const query = `SELECT * FROM ${env}.recipes WHERE ingredients CONTAINS ? ALLOW FILTERING`;

    client.execute(query, params, {prepare: true}, (err, res) => {
        if (err) {
            console.log(err);

            return next(err);
        }
        next(null, res.rows);
    });
};

module.exports.search = (keyword, next) => {
    let results = [];

    searchByIngredients(keyword, (err, res) => {
        if (err) {
            return next(err);
        }
        results = results.concat(res);
        searchByTitle(keyword, (err2, res2) => {
            if (err2) {
                return next(err2);
            }
            results = results.concat(res2);
            next(null, results);
        });
    });
};

module.exports.clean = (callback) => {
    console.log("Cleaning up the recipes");
    async.series([
        connect,
        function dropKeyspace(next) {
            const query = `DROP KEYSPACE IF EXISTS ${env}`;

            client.execute(query, (err) => {
                if (err) {
                    console.log(`Drop keyspace error: ${err}`);

                    return next(err);
                }
                console.log("Keyspace dropped");
                next();
            });
        },
        function dropTable(next) {
            const query = `DROP TABLE IF EXISTS ${env}.recipes`;

            client.execute(query, (err) => {
                if (err) {
                    console.log(`Drop table error: ${err}`);

                    return next(err);
                }
                console.log("Recipes table dropped");
                next();
            });
        }
    ], callback);
};

module.exports.setup = (callback) => {
    console.log("Setting up the recipes");
    async.series([
        connect,
        function createKeyspace(next) {
            const query = `CREATE KEYSPACE IF NOT EXISTS ${env} WITH replication = {'class': 'SimpleStrategy', 'replication_factor': '3' }`;

            client.execute(query, (err) => {
                if (err) {
                    console.log(`Create keyspace error: ${err}`);

                    return next(err);
                }
                console.log("Keyspace created");
                next();
            });
        },
        function createTable(next) {
            const query =
                `CREATE TABLE IF NOT EXISTS ${env}.recipes (` +
                    "ingredients frozen<map<int, text>>," +
                    "title text," +
                    "id uuid," +
                    "nutrition map<text, text>," +
                    "servings int," +
                    "PRIMARY KEY (id, title, ingredients)" +
                ")";

            client.execute(query, (err) => {
                if (err) {
                    console.log(`Create recipes table error: ${err}`);

                    return next(err);
                }
                console.log("Recipes table created");
                next();
            });
        },
        function createTitleIndex(next) {
            const query =
                `CREATE CUSTOM INDEX title_index ON ${env}.recipes(title) ` +
                "USING 'org.apache.cassandra.index.sasi.SASIIndex'" +
                "WITH OPTIONS = { " +
                    "'mode': 'CONTAINS'," +
                    "'analyzer_class': 'org.apache.cassandra.index.sasi.analyzer.NonTokenizingAnalyzer'," +
                    "'case_sensitive': 'false'" +
                "}";

            client.execute(query, (err) => {
                if (err) {
                    console.log(`Create custom index error: ${err}`);

                    return next(err);
                }
                console.log("Recipes title custom index created");
                next();
            });
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
                    " 'sweet recipe'," +
                    " {'brotein': '420g', 'carbs': '0g'}," +
                    " 2, 94488880-15c0-11e8-b642-0ed5f89f718b" +
                ")";

            client.execute(
                insertRecipe1,
                client.execute(insertRecipe2, next)
            );
        }
    ], callback);
};
