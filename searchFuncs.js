const fetch = require("node-fetch");
const cheerio = require("cheerio");
const chalk = require("chalk");

async function postcodeResponseToRestaurantData(r) {
  const { data } = await r.json();
  return data
    .filter(d => d.type === "restaurant")
    .map(d => ({ name: d.attributes.name, url: d.links.web }));
}

async function addMenuToRestaurantData(restaurantData) {
  const r = await fetch(restaurantData.url);
  const pageHtml = await r.text();
  const $ = cheerio.load(pageHtml);
  return {
    ...restaurantData,
    menu: JSON.parse($('[data-component-name="MenuIndexApp"]').html()).menu
  };
}

async function fetchRestaurantMenus(postcode) {
  const url = `https://consumer-ow-api.deliveroo.com/orderapp/v2/restaurants?country_iso_code=GB&page=scheduled&postcode=${postcode}&reduced_supported=true`;
  const restaurantDatas = await fetch(url).then(
    postcodeResponseToRestaurantData
  );

  return Promise.all(restaurantDatas.map(addMenuToRestaurantData));
}

const logMatchingMenuItems = needle => restaurantDatas => {
  restaurantDatas.forEach(({ name, menu }) => {
    menu.items
      .filter(item => item.name.toLowerCase().includes(needle))
      .forEach(matchingItem => logMatch(name, needle, matchingItem));
  });
};

function logMatch(name, needle, matchingItem) {
  const highlightedMatch = highlightSubstring(
    matchingItem.name,
    needle,
    chalk.red
  );

  console.log(chalk.bold(name), ":", highlightedMatch);
}

function highlightSubstring(text, substring, highlighter) {
  return text.replace(new RegExp(substring, "i"), highlighter("$&"));
}

function doSearch({ postcode, needle }) {
  fetchRestaurantMenus(postcode.toUpperCase()).then(
    logMatchingMenuItems(needle.toLowerCase())
  );
}

module.exports = { doSearch };
