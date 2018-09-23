const { doSearch } = require("./search");

if (process.argv.length < 4) {
  console.log("need postcode + search term");
  return;
}

doSearch({
  postcode: process.argv[2],
  needle: process.argv[3]
});
