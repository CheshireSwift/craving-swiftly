const fetch = require("node-fetch");
const cheerio = require("cheerio");
const chalk = require("chalk");

async function restaurantDataForPostcode(postcode) {
  const url = `https://deliveroo.co.uk/restaurants/london/upper-holloway?postcode=${postcode}`;
  const pageHtml = await fetch(url).then(r => r.text());
  const $ = cheerio.load(pageHtml);

  const dataScriptContents = $("script:contains(__NEXT_DATA__)").html();
  const restaurantJson = dataScriptContents.match(/__NEXT_DATA__ = ({.*})/)[1];

  const scriptData = JSON.parse(restaurantJson);
  const restaurants = scriptData.props.initialState.restaurants.results.all;
  return restaurants.map(({ name, url }) => ({ name, url }));
}

async function addMenuToRestaurantData(restaurantData) {
  const r = await fetch(restaurantData.url);
  const pageHtml = await r.text();
  const $ = cheerio.load(pageHtml);

  const menuDataJson = $('[data-component-name="MenuIndexApp"]').html();
  const { menu } = JSON.parse(menuDataJson);
  return { ...restaurantData, menu };
}

async function fetchRestaurantMenus(postcode) {
  const restaurantDatas = await restaurantDataForPostcode(postcode);
  return Promise.all(restaurantDatas.map(addMenuToRestaurantData));
}

function highlightSubstring(text, substring, highlighter) {
  return text.replace(new RegExp(substring, "i"), highlighter("$&"));
}

function logMatch(name, needle, matchingItem) {
  const highlightedMatch = highlightSubstring(
    matchingItem.name,
    needle,
    chalk.red
  );

  console.log(chalk.bold(name), ":", highlightedMatch);
}

const logMatchingMenuItems = needle => restaurantDatas => {
  restaurantDatas.forEach(({ name, menu }) => {
    [...menu.categories, ...menu.items]
      .filter(item => item.name.toLowerCase().includes(needle))
      .forEach(matchingItem => logMatch(name, needle, matchingItem));
  });
};

function doSearch({ postcode, needle }) {
  const cleanPostcode = postcode.toUpperCase().replace(/\s/g, "");
  const cleanNeedle = needle.toLowerCase();
  fetchRestaurantMenus(cleanPostcode).then(logMatchingMenuItems(cleanNeedle));
}

module.exports = { doSearch };
