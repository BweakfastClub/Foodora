const async = require("async");
const {url} = require("../../config");
const mongoClient = require("mongodb").MongoClient;


const connect = (next) => {
    mongoClient.connect(url, (err, client) => {
        console.log("Connected successfully to server");
        next(err, client, client.db("test").collection("recipe"));
    });
};

const selectAllRecipes = (client, collection, next) => {
    collection.find({}).toArray((err, items) => {
        client.close(() => next(err, items));
    });
};

module.exports.allRecipes = (callback) => {
    async.waterfall([
        connect,
        selectAllRecipes
    ], callback);
};

const searchMongo = (client, collection, keyword, next) => {
    collection.find({
        $text: {
            $search: keyword
        }
    }).toArray((err, items) => {
        client.close(() => next(err, items));
    });
};


/* Module.exports.clean = (callback) => {
 *     Console.log("Cleaning up the recipes");
 *     Async.series([
 *         Connect,
 *         Function dropKeyspace(next) {
 *             Const query = `DROP KEYSPACE IF EXISTS ${env}`;
 *
 *             Client.execute(query, (err) => {
 *                 If (err) {
 *                     Console.log(`Drop keyspace error: ${err}`);
 *
 *                     Return next(err);
 *                 }
 *                 Console.log("Keyspace dropped");
 *                 Next();
 *             });
 *         },
 *         Function dropTable(next) {
 *             Const query = `DROP TABLE IF EXISTS ${env}.recipes`;
 *
 *             Client.execute(query, (err) => {
 *                 If (err) {
 *                     Console.log(`Drop table error: ${err}`);
 *
 *                     Return next(err);
 *                 }
 *                 Console.log("Recipes table dropped");
 *                 Next();
 *             });
 *         }
 *     ], callback);
 * };
 */

const createIndex = (client, collection, next) => {
    collection.createIndex({
        "$**": "text"
    }, next);
};

module.exports.search = (keyword, callback) => {
    async.waterfall([
        connect,
        (client, collection, next) => searchMongo(client, collection, keyword, next)
    ], callback);
};

/* eslint-disable sort-keys */
module.exports.setup = (callback) => {
    console.log("setting up recipes");
    async.waterfall([
        connect,
        function tempInsert(client, collection, next) {
            collection.insertMany([
                {"id": 14556,
                    "ingredients": [
                        {"ingredientID": 1525,
                            "displayValue": "3 tablespoons brown sugar",
                            "grams": 40.704845,
                            "displayType": "Normal"},
                        {"ingredientID": 16404,
                            "displayValue": "1 1/2 tablespoons paprika",
                            "grams": 10.26375,
                            "displayType": "Normal"},
                        {"ingredientID": 16421,
                            "displayValue": "1 1/2 tablespoons salt",
                            "grams": 27.0,
                            "displayType": "Normal"},
                        {"ingredientID": 16406,
                            "displayValue": "1 1/2 tablespoons ground black pepper",
                            "grams": 9.6,
                            "displayType": "Normal"},
                        {"ingredientID": 16396,
                            "displayValue": "1 teaspoon garlic powder",
                            "grams": 2.7766666,
                            "displayType": "Normal"}
                    ],
                    "title": "Dry Rub for Ribs",
                    "nutrition": {
                        "calories": {"name": "Calories",
                            "amount": 27.2549,
                            "unit": "kcal",
                            "displayValue": "27",
                            "percentDailyValue": "1",
                            "hasCompleteData": true},
                        "fat": {"name": "Fat",
                            "amount": 0.2079023,
                            "unit": "g",
                            "displayValue": "0.2",
                            "percentDailyValue": "\u003c 1",
                            "hasCompleteData": true},
                        "cholesterol": {"name": "Cholesterol",
                            "amount": 0.0,
                            "unit": "mg",
                            "displayValue": "0",
                            "percentDailyValue": "0",
                            "hasCompleteData": true},
                        "sodium": {"name": "Sodium",
                            "amount": 1310.562,
                            "unit": "mg",
                            "displayValue": "1311",
                            "percentDailyValue": "52",
                            "hasCompleteData": true},
                        "carbohydrates": {"name": "Carbohydrates",
                            "amount": 6.736134,
                            "unit": "g",
                            "displayValue": "6.7",
                            "percentDailyValue": "2",
                            "hasCompleteData": true},
                        "protein": {"name": "Protein",
                            "amount": 0.3851819,
                            "unit": "g",
                            "displayValue": "0.4",
                            "percentDailyValue": "\u003c 1",
                            "hasCompleteData": true},
                        "folate": {"name": "Folate",
                            "amount": 1.537769,
                            "unit": "mcg",
                            "displayValue": "2",
                            "percentDailyValue": "\u003c 1",
                            "hasCompleteData": true},
                        "magnesium": {"name": "Magnesium",
                            "amount": 5.39448,
                            "unit": "mg",
                            "displayValue": "5",
                            "percentDailyValue": "2",
                            "hasCompleteData": true},
                        "vitaminB6": {"name": "Vitamin B6",
                            "amount": 0.06794572,
                            "unit": "mg",
                            "displayValue": "\u003c 1",
                            "percentDailyValue": "4",
                            "hasCompleteData": true},
                        "niacin": {"name": "Niacin Equivalents",
                            "amount": 0.2306907,
                            "unit": "mg",
                            "displayValue": "\u003c 1",
                            "percentDailyValue": "2",
                            "hasCompleteData": true},
                        "thiamin": {"name": "Thiamin",
                            "amount": 0.01160761,
                            "unit": "mg",
                            "displayValue": "\u003c 1",
                            "percentDailyValue": "1",
                            "hasCompleteData": true},
                        "iron": {"name": "Iron",
                            "amount": 0.7057801,
                            "unit": "mg",
                            "displayValue": "\u003c 1",
                            "percentDailyValue": "7",
                            "hasCompleteData": true},
                        "calcium": {"name": "Calcium",
                            "amount": 12.82565,
                            "unit": "mg",
                            "displayValue": "13",
                            "percentDailyValue": "2",
                            "hasCompleteData": true},
                        "vitaminC": {"name": "Vitamin C",
                            "amount": 1.226666,
                            "unit": "mg",
                            "displayValue": "1",
                            "percentDailyValue": "2",
                            "hasCompleteData": true},
                        "vitaminA": {"name": "Vitamin A - IU",
                            "amount": 680.1616,
                            "unit": "IU",
                            "displayValue": "680",
                            "percentDailyValue": "14",
                            "hasCompleteData": true},
                        "sugars": {"name": "Sugars",
                            "amount": 5.16116,
                            "unit": "g",
                            "displayValue": "5.2",
                            "percentDailyValue": "0",
                            "hasCompleteData": true},
                        "potassium": {"name": "Potassium",
                            "amount": 56.03936,
                            "unit": "mg",
                            "displayValue": "56",
                            "percentDailyValue": "2",
                            "hasCompleteData": true},
                        "saturatedFat": {"name": "Saturated Fat",
                            "amount": 0.03917091,
                            "unit": "g",
                            "displayValue": "0",
                            "percentDailyValue": "\u003c 1",
                            "hasCompleteData": true},
                        "caloriesFromFat": {"name": "Calories from Fat",
                            "amount": 1.871121,
                            "unit": "kcal",
                            "displayValue": "2",
                            "percentDailyValue": "-",
                            "hasCompleteData": true},
                        "fiber": {"name": "Dietary Fiber",
                            "amount": 0.8321916,
                            "unit": "g",
                            "displayValue": "0.8",
                            "percentDailyValue": "3",
                            "hasCompleteData": true}},
                    "servings": 8,
                    "prepMinutes": 10,
                    "cookMinutes": 0,
                    "readyMinutes": 0},
                {"id": 23600,
                    "ingredients": [
                        {"ingredientID": 5838,
                            "displayValue": "1 pound sweet Italian sausage",
                            "grams": 454.0,
                            "displayType": "Normal"},
                        {"ingredientID": 4147,
                            "displayValue": "3/4 pound lean ground beef",
                            "grams": 340.5,
                            "displayType": "Normal"},
                        {"ingredientID": 4397,
                            "displayValue": "1/2 cup minced onion",
                            "grams": 80.0,
                            "displayType": "Normal"},
                        {"ingredientID": 4342,
                            "displayValue": "2 cloves garlic, crushed",
                            "grams": 6.0,
                            "displayType": "Normal"},
                        {"ingredientID": 4664,
                            "displayValue": "1 (28 ounce) can crushed tomatoes",
                            "grams": 784.0,
                            "displayType": "Normal"},
                        {"ingredientID": 3640,
                            "displayValue": "2 (6 ounce) cans tomato paste",
                            "grams": 340.0,
                            "displayType": "Normal"},
                        {"ingredientID": 4582,
                            "displayValue": "2 (6.5 ounce) cans canned tomato sauce",
                            "grams": 369.2,
                            "displayType": "Normal"},
                        {"ingredientID": 2496,
                            "displayValue": "1/2 cup water",
                            "grams": 118.5,
                            "displayType": "Normal"},
                        {"ingredientID": 1526,
                            "displayValue": "2 tablespoons white sugar",
                            "grams": 25.0,
                            "displayType": "Normal"},
                        {"ingredientID": 18681,
                            "displayValue": "1 1/2 teaspoons dried basil leaves",
                            "grams": 1.325,
                            "displayType": "Normal"},
                        {"ingredientID": 16394,
                            "displayValue": "1/2 teaspoon fennel seeds",
                            "grams": 1.0,
                            "displayType": "Normal"},
                        {"ingredientID": 20245,
                            "displayValue": "1 teaspoon Italian seasoning",
                            "grams": 1.5,
                            "displayType": "Normal"},
                        {"ingredientID": 16421,
                            "displayValue": "1 tablespoon salt",
                            "grams": 18.0,
                            "displayType": "Normal"},
                        {"ingredientID": 16406,
                            "displayValue": "1/4 teaspoon ground black pepper",
                            "grams": 0.525,
                            "displayType": "Normal"},
                        {"ingredientID": 4409,
                            "displayValue": "4 tablespoons chopped fresh parsley",
                            "grams": 15.0,
                            "displayType": "Normal"},
                        {"ingredientID": 17660,
                            "displayValue": "12 lasagna noodles",
                            "grams": 288.0,
                            "displayType": "Normal"},
                        {"ingredientID": 16243,
                            "displayValue": "16 ounces ricotta cheese",
                            "grams": 453.6,
                            "displayType": "Normal"},
                        {"ingredientID": 16317,
                            "displayValue": "1 egg",
                            "grams": 50.0,
                            "displayType": "Normal"},
                        {"ingredientID": 16421,
                            "displayValue": "1/2 teaspoon salt",
                            "grams": 3.0,
                            "displayType": "Normal"},
                        {"ingredientID": 16234,
                            "displayValue": "3/4 pound mozzarella cheese, sliced",
                            "grams": 340.5,
                            "displayType": "Normal"},
                        {"ingredientID": 16238,
                            "displayValue": "3/4 cup grated Parmesan cheese",
                            "grams": 60.0,
                            "displayType": "Normal"}
                    ],
                    "title": "World\u0027s Best Lasagna",
                    "nutrition": {
                        "calories": {"name": "Calories",
                            "amount": 448.2073,
                            "unit": "kcal",
                            "displayValue": "448",
                            "percentDailyValue": "22",
                            "hasCompleteData": true},
                        "fat": {"name": "Fat",
                            "amount": 21.34134,
                            "unit": "g",
                            "displayValue": "21.3",
                            "percentDailyValue": "33",
                            "hasCompleteData": true},
                        "cholesterol": {"name": "Cholesterol",
                            "amount": 81.7955,
                            "unit": "mg",
                            "displayValue": "82",
                            "percentDailyValue": "27",
                            "hasCompleteData": true},
                        "sodium": {
                            "name": "Sodium",
                            "amount": 1788.018,
                            "unit": "mg",
                            "displayValue": "1788",
                            "percentDailyValue": "72",
                            "hasCompleteData": true},
                        "carbohydrates": {"name": "Carbohydrates",
                            "amount": 36.47945,
                            "unit": "g",
                            "displayValue": "36.5",
                            "percentDailyValue": "12",
                            "hasCompleteData": true},
                        "protein": {"name": "Protein",
                            "amount": 29.66517,
                            "unit": "g",
                            "displayValue": "29.7",
                            "percentDailyValue": "59",
                            "hasCompleteData": true},
                        "folate": {"name": "Folate",
                            "amount": 79.50155,
                            "unit": "mcg",
                            "displayValue": "80",
                            "percentDailyValue": "44",
                            "hasCompleteData": false},
                        "magnesium": {"name": "Magnesium",
                            "amount": 66.82005,
                            "unit": "mg",
                            "displayValue": "67",
                            "percentDailyValue": "24",
                            "hasCompleteData": false},
                        "vitaminB6": {"name": "Vitamin B6",
                            "amount": 0.4144346,
                            "unit": "mg",
                            "displayValue": "\u003c 1",
                            "percentDailyValue": "26",
                            "hasCompleteData": false},
                        "niacin": {"name": "Niacin Equivalents",
                            "amount": 10.18928,
                            "unit": "mg",
                            "displayValue": "10",
                            "percentDailyValue": "78",
                            "hasCompleteData": true},
                        "thiamin": {"name": "Thiamin",
                            "amount": 0.3090717,
                            "unit": "mg",
                            "displayValue": "\u003c 1",
                            "percentDailyValue": "31",
                            "hasCompleteData": false},
                        "iron": {"name": "Iron",
                            "amount": 4.10893,
                            "unit": "mg",
                            "displayValue": "4",
                            "percentDailyValue": "41",
                            "hasCompleteData": true},
                        "calcium": {"name": "Calcium",
                            "amount": 442.0542,
                            "unit": "mg",
                            "displayValue": "442",
                            "percentDailyValue": "55",
                            "hasCompleteData": true},
                        "vitaminC": {"name": "Vitamin C",
                            "amount": 16.79865,
                            "unit": "mg",
                            "displayValue": "17",
                            "percentDailyValue": "28",
                            "hasCompleteData": true},
                        "vitaminA": {"name": "Vitamin A - IU",
                            "amount": 1453.851,
                            "unit": "IU",
                            "displayValue": "1454",
                            "percentDailyValue": "29",
                            "hasCompleteData": true},
                        "sugars": {"name": "Sugars",
                            "amount": 8.601563,
                            "unit": "g",
                            "displayValue": "8.6",
                            "percentDailyValue": "0",
                            "hasCompleteData": false},
                        "potassium": {"name": "Potassium",
                            "amount": 875.7963,
                            "unit": "mg",
                            "displayValue": "876",
                            "percentDailyValue": "25",
                            "hasCompleteData": true},
                        "saturatedFat": {"name": "Saturated Fat",
                            "amount": 9.929752,
                            "unit": "g",
                            "displayValue": "9.9",
                            "percentDailyValue": "50",
                            "hasCompleteData": false},
                        "caloriesFromFat": {"name": "Calories from Fat",
                            "amount": 192.0721,
                            "unit": "kcal",
                            "displayValue": "192",
                            "percentDailyValue": "-",
                            "hasCompleteData": true},
                        "fiber": {"name": "Dietary Fiber",
                            "amount": 3.978328,
                            "unit": "g",
                            "displayValue": "4",
                            "percentDailyValue": "16",
                            "hasCompleteData": true}},
                    "servings": 12,
                    "prepMinutes": 30,
                    "cookMinutes": 150,
                    "readyMinutes": 0}
            ], (err) => {
                client.close(() => next(err));
            });
        },
        connect,
        createIndex
    ], callback);
};


