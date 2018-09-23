const fetch = require("node-fetch");
const cheerio = require("cheerio");
const chalk = require("chalk");

async function restaurantDataForPostcode(postcode) {
  const url = `https://consumer-ow-api.deliveroo.com/orderapp/v2/restaurants?country_iso_code=GB&page=scheduled&postcode=${postcode}&reduced_supported=true`;
  const r = await fetch(url);
  const { data } = await r.json();
  return data
    .filter(d => d.type === "restaurant")
    .map(d => ({ name: d.attributes.name, url: d.links.web }));
}

async function addMenuToRestaurantData(restaurantData) {
  const r = await fetch(restaurantData.url);
  const pageHtml = await r.text();
  const $ = cheerio.load(pageHtml);
  const menuDataJson = $('[data-component-name="MenuIndexApp"]').html();
  return {
    ...restaurantData,
    menu: JSON.parse(menuDataJson).menu
  };
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
    menu.items
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
