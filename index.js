const { doSearch } = require("./searchFuncs");

if (process.argv.length < 4) {
  console.log("need postcode + search term");
  return;
}

doSearch({
  postcode: process.argv[2].toUpperCase(),
  needle: process.argv[3].toLowerCase()
});
