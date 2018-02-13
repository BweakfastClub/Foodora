/* eslint-disable id-length,no-await-in-loop */
const fs = require("fs");
const axios = require("axios");
const {promisify} = require("util");
const {apiKey} = require("./config");
const {existsFile, sleep} = require("./util");

const readFilePromise = promisify(fs.readFile);
const writeFilePromise = promisify(fs.writeFile);
const deleteFilePromise = promisify(fs.unlink);

module.exports.scrape = async(recipeID, pageSize = 10) => {
    let pageNumber = 0;
    let reviews = null;
    const idRatings = {
        ratings: {},
        reviews: []
    };

    for (let i = 5; i > 0; i -= 1) {
        idRatings.ratings[`${i}-star`] = 0;
    }

    do {
        try {
            const fileName = getPath(recipeID, pageNumber);

            // eslint-disable-next-line prefer-destructuring
            reviews = (await getReviews(recipeID, pageNumber, pageSize)).data.reviews;
            for (let i = 0; i < reviews.length; i += 1) {
                const review = reviews[i];

                idRatings.reviews.push(review.reviewID);
                idRatings.ratings[`${review.rating}-star`] += 1;
            }

            await writeFilePromise(fileName, JSON.stringify(reviews));
            console.log(`Saved to ${fileName}`);
            pageNumber += 1;
        } catch (error) {
            if (error.code === "ETIMEDOUT") {
                console.log("Waiting 30 seconds to make sure not to overload server more");
                await sleep(30 * 1000);
            } else if (Reflect.apply(error.hasOwnProperty, error, "response") && error.response.status === 404) {
                console.log(`Unable to find reviews for ${recipeID}`);
            } else {
                throw error;
            }
        }
    } while (reviews.length > 0);

    return idRatings;
};

async function getReviews(recipeID, pageNumber, pageSize) {
    const path = getPath(recipeID, pageNumber);

    if (await existsFile(path)) {
        try {
            const reviews = JSON.parse(await readFilePromise(path, "utf-8"));

            return {data: {reviews}};
        } catch (e) {
            const deletedFiles = [];
            const deletePromises = [];
            let deletePage = pageNumber;
            let condition = true;

            do {
                const deletePath = getPath(recipeID, deletePage);

                if (!await existsFile(deletePath)) {
                    condition = false;
                    break;
                }
                deletePromises.push(deleteFilePromise(deletePath));
                deletedFiles.push(deletePath);
                deletePage += 1;
            } while (condition);

            await Promise.all(deletePromises);
            console.log(`Deleted ${deletedFiles} due to load failure`);
        }
    }

    return axios.get(
        `https://apps.allrecipes.com/v1/recipes/${recipeID}/reviews/?page=${pageNumber}&pagesize=${pageSize}&sorttype=HelpfulCountDescending`,
        {
            headers: {
                "Authorization": `Bearer ${apiKey}`
            }
        }
    );
}

function getPath(recipeID, pageNumber) {
    return `./data/reviews/reviews_${recipeID}_${pageNumber}.json`;
}
