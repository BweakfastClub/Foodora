/* eslint-disable no-await-in-loop */
const fs = require("fs");
const axios = require("axios");
const {promisify} = require("util");
const {apiKey} = require("./config");
const reviewsScraper = require("./reviews_scraper");
const {sleep} = require("./util");

const writeFilePromise = promisify(fs.writeFile);

module.exports.scrape = async(category) => {
    let pageNumber = 0;
    let recipes = null;

    do {
        const fileName = `./data/recipes/${parseName(category.name)}_${pageNumber}.json`;

        recipes = (await getRecipes(category.id, pageNumber)).data.cards;
        const promises = recipes.map(async(recipe) => {
            let recipeID = null;

            if (Reflect.apply(recipe.hasOwnProperty, recipe, "associatedRecipeCook")) {
                recipeID = recipe.associatedRecipeCook.id;
            } else {
                recipeID = recipe.id;
            }

            try {
                return retrieveRecipePromise(recipeID);
            } catch (error) {
                if (error.code === "ETIMEDOUT") {
                    console.log("Waiting 30 seconds to make sure not to overload server more");
                    await sleep(30 * 1000);
                } else if (Reflect.apply(error.hasOwnProperty, error, "response") && error.response.status === 404) {
                    console.log(`Unable to find recipe ID ${recipeID}`);
                } else {
                    throw error;
                }
            }
        });

        recipes = await Promise.all(promises);
        await writeFilePromise(fileName, JSON.stringify(recipes));
        console.log(`Saved to ${fileName}`);
        pageNumber += 1;
        console.log(`Recipes length: ${recipes.length}`);
    } while (recipes.length > 0);
};

function getRecipes(id, pageNumber) {
    return axios.get(
        `https://apps.allrecipes.com/v1/assets/hub-feed?id=${id}&pageNumber=${pageNumber}&isSponsored=false&sortType=p`,
        {
            headers: {
                "Authorization": `Bearer ${apiKey}`
            }
        }
    );
}

function getRecipe(recipeID) {
    return axios.get(
        `https://apps.allrecipes.com/v1/recipes/${recipeID}?isMetric=false`,
        {
            headers: {
                "Authorization": `Bearer ${apiKey}`
            }
        }
    );
}

function retrieveRecipePromise(recipeID) {
    return new Promise(async(resolve, reject) => {
        try {
            const {title: name, nutrition, servings, prepMinutes, cookMinutes, readyInMinutes, similarRecipes} = (await getRecipe(recipeID)).data;
            const {reviews, ratings} = await reviewsScraper.scrape(recipeID, 100);

            resolve({
                cookMinutes,
                name,
                nutrition,
                prepMinutes,
                ratings,
                readyInMinutes,
                reviews,
                servings,
                similarRecipes
            });
        } catch (error) {
            reject(error);
        }
    });
}

function parseName(name) {
    return name.toLowerCase().replace(" ", "_").
        replace("&", "and");
}
