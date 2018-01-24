const fs = require('fs');
const path = require('path');
const {promisify} = require('util');
const recipeScraper = require('./recipe_scraper');
const {existsFile} = require('./util');

const mkDirPromise = promisify(fs.mkdir);

const categories = [{'id': 76, 'name': 'Appetizer'}, {'id': 78, 'name': 'Breakfast & Brunch'},
    {'id': 201, 'name': 'Chicken'}, {'id': 79, 'name': 'Dessert'}, {'id': 84, 'name': 'Healthy'},
    {'id': 85, 'name': 'Holidays and Events'}, {'id': 17235, 'name': 'Magazine Favourites'},
    {'id': 80, 'name': 'Main Dish'}, {'id': 1947, 'name': 'Quick & Easy'},
    {'id': 253, 'name': 'Slow Cooker'}, {'id': 87, 'name': 'Vegetarian'}];

async function createFolder(folderPath) {
    if (!await existsFile(folderPath)) {
        try {
            await mkDirPromise(folderPath);
        } catch (e) {
            if (e.code === 'ENOENT') {
                await createFolder(path.dirname(folderPath));
                await createFolder(folderPath);
            } else {
                throw e;
            }
        }
    }
}

async function createFolders() {
    await createFolder('./data/recipes');
    await createFolder('./data/reviews');
}

createFolders().then(() => {
    categories.forEach(async (category) => {
        await recipeScraper.scrape(category);
    });
});